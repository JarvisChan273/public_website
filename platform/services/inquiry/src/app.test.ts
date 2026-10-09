import { describe, expect, it } from "vitest";
import type { CallMeta, QueueMessage, SubmitInquiry } from "@platform/contracts";
import type { LogEvent } from "@platform/observability";
import { consumeInquiry, submitInquiry, sweepOutbox, type InquiryDeps } from "./app";
import { InvalidRequest } from "./errors";
import { MemoryInquiryRepository } from "./memory";

const input: SubmitInquiry = {
  subject: "A note about the site",
  email: "ada@example.com",
  message: "Please keep this message out of the logs.",
};

const meta: CallMeta = {
  correlationId: "33333333-3333-4333-8333-333333333333",
  idempotencyKey: "idem-key-001",
};

function harness(queueFails = false) {
  const repo = new MemoryInquiryRepository();
  const sent: QueueMessage[] = [];
  const logs: LogEvent[] = [];
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  let cursor = 0;
  const deps: InquiryDeps = {
    repo,
    queue: {
      async send(message) {
        if (queueFails && sent.length === 0) throw new Error("queue down");
        sent.push(message);
      },
    },
    ids: () => {
      const id = ids[cursor];
      cursor += 1;
      if (!id) throw new Error("ids exhausted");
      return id;
    },
    clock: () => "2026-10-09T00:00:00.000Z",
    log: (entry) => logs.push(entry),
  };
  return { repo, sent, logs, deps };
}

describe("submitInquiry", () => {
  it("accepts an inquiry and publishes an id-only queue message", async () => {
    const { repo, sent, logs, deps } = harness();
    const accepted = await submitInquiry(input, meta, deps);
    expect(accepted).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      status: "accepted",
    });
    expect(sent).toEqual([
      {
        outboxId: "22222222-2222-4222-8222-222222222222",
        inquiryId: accepted.id,
        correlationId: meta.correlationId,
      },
    ]);
    expect(repo.outbox[0]?.published).toBe(true);
    expect(JSON.stringify(logs)).not.toContain(input.email);
    expect(JSON.stringify(logs)).not.toContain(input.message);
    expect(JSON.stringify(logs)).not.toContain(input.subject);
  });

  it("returns the original id when the same key is repeated", async () => {
    const { repo, deps } = harness();
    const first = await submitInquiry(input, meta, deps);
    const second = await submitInquiry(input, meta, deps);
    expect(second.id).toBe(first.id);
    expect(repo.inquiries).toHaveLength(1);
  });

  it("keeps the outbox unpublished when the queue send fails", async () => {
    const { repo, deps } = harness(true);
    const accepted = await submitInquiry(input, meta, deps);
    expect(accepted.status).toBe("accepted");
    expect(repo.outbox[0]?.published).toBe(false);
  });

  it("rejects an invalid inquiry before writing", async () => {
    const { repo, deps } = harness();
    await expect(
      submitInquiry({ ...input, message: "short" }, meta, deps),
    ).rejects.toBeInstanceOf(InvalidRequest);
    expect(repo.inquiries).toHaveLength(0);
  });
});

describe("sweep and consume", () => {
  it("publishes a row left behind by a failed send", async () => {
    const { repo, sent, deps } = harness(true);
    await submitInquiry(input, meta, deps);
    deps.queue = {
      async send(message) {
        sent.push(message);
      },
    };
    expect(await sweepOutbox(deps)).toBe(1);
    expect(repo.outbox[0]?.published).toBe(true);
    expect(sent).toHaveLength(1);
  });

  it("processes a message once", async () => {
    const { repo, deps } = harness();
    const accepted = await submitInquiry(input, meta, deps);
    const message = {
      outboxId: "22222222-2222-4222-8222-222222222222",
      inquiryId: accepted.id,
      correlationId: meta.correlationId,
    };
    const logs: string[] = [];
    await consumeInquiry(message, repo, (entry) => logs.push(entry.event));
    await consumeInquiry(message, repo, (entry) => logs.push(entry.event));
    expect(logs).toEqual(["inquiry.consumed", "inquiry.consumed"]);
    expect(repo.inquiries[0]?.status).toBe("processed");
  });
});
