import {
  callMetaSchema,
  queueMessageSchema,
  submitInquirySchema,
  type CallMeta,
  type InquiryAccepted,
  type QueueMessage,
  type SubmitInquiry,
} from "@platform/contracts";
import { logEvent, type LogEvent } from "@platform/observability";
import { InvalidRequest, UniqueConflict } from "./errors";

export type InquiryStatus = "accepted" | "processed";

export interface InquiryRecord {
  id: string;
  idempotencyKey: string;
  subject: string;
  email: string;
  message: string;
  status: InquiryStatus;
  correlationId: string;
  createdAt: string;
}

export interface OutboxRecord {
  id: string;
  inquiryId: string;
  correlationId: string;
  published: boolean;
  createdAt: string;
}

export interface InquiryRepository {
  findByIdempotencyKey(key: string): Promise<InquiryRecord | null>;
  insertWithOutbox(inquiry: InquiryRecord, outbox: OutboxRecord): Promise<void>;
  listUnpublished(): Promise<OutboxRecord[]>;
  markPublished(outboxId: string): Promise<void>;
  markProcessed(inquiryId: string): Promise<"updated" | "already">;
}

export interface MessageQueue {
  send(message: QueueMessage): Promise<void>;
}

export interface InquiryDeps {
  repo: InquiryRepository;
  queue: MessageQueue;
  ids: () => string;
  clock: () => string;
  log?: (entry: LogEvent) => void;
}

function parseInquiry(input: SubmitInquiry, meta: CallMeta): {
  body: SubmitInquiry;
  call: CallMeta;
} {
  const body = submitInquirySchema.safeParse(input);
  const call = callMetaSchema.safeParse(meta);
  if (!body.success || !call.success) throw new InvalidRequest();
  return { body: body.data, call: call.data };
}

async function tryPublish(outbox: OutboxRecord, deps: InquiryDeps): Promise<void> {
  try {
    await deps.queue.send({
      outboxId: outbox.id,
      inquiryId: outbox.inquiryId,
      correlationId: outbox.correlationId,
    });
    await deps.repo.markPublished(outbox.id);
  } catch {
    // The row stays unpublished. The sweep retries within queue retention.
  }
}

export async function submitInquiry(
  input: SubmitInquiry,
  meta: CallMeta,
  deps: InquiryDeps,
): Promise<InquiryAccepted> {
  const { body, call } = parseInquiry(input, meta);
  const log = deps.log ?? logEvent;
  const existing = await deps.repo.findByIdempotencyKey(call.idempotencyKey);
  if (existing) {
    log({
      event: "inquiry.replayed",
      correlationId: call.correlationId,
      fields: { inquiryId: existing.id },
    });
    return { id: existing.id, status: "accepted" };
  }

  const createdAt = deps.clock();
  const inquiry: InquiryRecord = {
    id: deps.ids(),
    idempotencyKey: call.idempotencyKey,
    subject: body.subject,
    email: body.email,
    message: body.message,
    status: "accepted",
    correlationId: call.correlationId,
    createdAt,
  };
  const outbox: OutboxRecord = {
    id: deps.ids(),
    inquiryId: inquiry.id,
    correlationId: call.correlationId,
    published: false,
    createdAt,
  };

  try {
    await deps.repo.insertWithOutbox(inquiry, outbox);
  } catch (error) {
    if (error instanceof UniqueConflict) {
      const raced = await deps.repo.findByIdempotencyKey(call.idempotencyKey);
      if (raced) return { id: raced.id, status: "accepted" };
    }
    throw error;
  }

  log({
    event: "inquiry.accepted",
    correlationId: call.correlationId,
    fields: { inquiryId: inquiry.id },
  });
  await tryPublish(outbox, deps);
  return { id: inquiry.id, status: "accepted" };
}

export async function sweepOutbox(deps: InquiryDeps): Promise<number> {
  const pending = await deps.repo.listUnpublished();
  let published = 0;
  for (const row of pending) {
    await deps.queue.send({
      outboxId: row.id,
      inquiryId: row.inquiryId,
      correlationId: row.correlationId,
    });
    await deps.repo.markPublished(row.id);
    published += 1;
  }
  return published;
}

export async function consumeInquiry(
  message: unknown,
  repo: InquiryRepository,
  log: (entry: LogEvent) => void = logEvent,
): Promise<void> {
  const parsed = queueMessageSchema.parse(message);
  const result = await repo.markProcessed(parsed.inquiryId);
  log({
    event: "inquiry.consumed",
    correlationId: parsed.correlationId,
    fields: { inquiryId: parsed.inquiryId, result },
  });
}
