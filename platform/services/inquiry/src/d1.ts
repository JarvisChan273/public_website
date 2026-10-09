import type { QueueMessage } from "@platform/contracts";
import type { InquiryRecord, InquiryRepository, MessageQueue, OutboxRecord } from "./app";
import { UniqueConflict } from "./errors";

interface InquiryRow {
  id: string;
  idempotency_key: string;
  name: string;
  email: string;
  message: string;
  status: "accepted" | "processed";
  correlation_id: string;
  created_at: string;
}

interface OutboxRow {
  id: string;
  inquiry_id: string;
  correlation_id: string;
  published: number;
  created_at: string;
}

function toInquiry(row: InquiryRow): InquiryRecord {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
  };
}

function toOutbox(row: OutboxRow): OutboxRecord {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    correlationId: row.correlation_id,
    published: row.published === 1,
    createdAt: row.created_at,
  };
}

export class D1InquiryRepository implements InquiryRepository {
  constructor(private readonly db: D1Database) {}

  async findByIdempotencyKey(key: string): Promise<InquiryRecord | null> {
    const row = await this.db
      .prepare("SELECT * FROM inquiries WHERE idempotency_key = ?")
      .bind(key)
      .first<InquiryRow>();
    return row ? toInquiry(row) : null;
  }

  async insertWithOutbox(inquiry: InquiryRecord, outbox: OutboxRecord): Promise<void> {
    try {
      await this.db.batch([
        this.db
          .prepare(
            `INSERT INTO inquiries
              (id, idempotency_key, name, email, message, status, correlation_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            inquiry.id,
            inquiry.idempotencyKey,
            inquiry.name,
            inquiry.email,
            inquiry.message,
            inquiry.status,
            inquiry.correlationId,
            inquiry.createdAt,
          ),
        this.db
          .prepare(
            `INSERT INTO outbox
              (id, inquiry_id, correlation_id, published, created_at)
             VALUES (?, ?, ?, 0, ?)`,
          )
          .bind(outbox.id, outbox.inquiryId, outbox.correlationId, outbox.createdAt),
      ]);
    } catch (error) {
      if (error instanceof Error && /unique/i.test(error.message)) {
        throw new UniqueConflict();
      }
      throw error;
    }
  }

  async listUnpublished(): Promise<OutboxRecord[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM outbox WHERE published = 0 ORDER BY created_at")
      .all<OutboxRow>();
    return results.map(toOutbox);
  }

  async markPublished(outboxId: string): Promise<void> {
    await this.db
      .prepare("UPDATE outbox SET published = 1 WHERE id = ?")
      .bind(outboxId)
      .run();
  }

  async markProcessed(inquiryId: string): Promise<"updated" | "already"> {
    const result = await this.db
      .prepare(
        "UPDATE inquiries SET status = 'processed' WHERE id = ? AND status = 'accepted'",
      )
      .bind(inquiryId)
      .run();
    if ((result.meta.changes ?? 0) > 0) return "updated";
    const row = await this.db
      .prepare("SELECT status FROM inquiries WHERE id = ?")
      .bind(inquiryId)
      .first<{ status: string }>();
    if (row?.status === "processed") return "already";
    throw new Error("inquiry missing");
  }
}

export class QueueBinding implements MessageQueue {
  constructor(private readonly queue: Queue<QueueMessage>) {}

  async send(message: QueueMessage): Promise<void> {
    await this.queue.send(message);
  }
}
