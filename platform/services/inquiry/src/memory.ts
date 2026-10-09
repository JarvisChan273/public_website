import { UniqueConflict } from "./errors";
import type { InquiryRecord, InquiryRepository, OutboxRecord } from "./app";

export class MemoryInquiryRepository implements InquiryRepository {
  readonly inquiries: InquiryRecord[] = [];
  readonly outbox: OutboxRecord[] = [];

  async findByIdempotencyKey(key: string): Promise<InquiryRecord | null> {
    return this.inquiries.find((row) => row.idempotencyKey === key) ?? null;
  }

  async insertWithOutbox(inquiry: InquiryRecord, outbox: OutboxRecord): Promise<void> {
    if (this.inquiries.some((row) => row.idempotencyKey === inquiry.idempotencyKey)) {
      throw new UniqueConflict();
    }
    this.inquiries.push({ ...inquiry });
    this.outbox.push({ ...outbox });
  }

  async listUnpublished(): Promise<OutboxRecord[]> {
    return this.outbox.filter((row) => !row.published).map((row) => ({ ...row }));
  }

  async markPublished(outboxId: string): Promise<void> {
    const row = this.outbox.find((item) => item.id === outboxId);
    if (!row) throw new Error("outbox missing");
    row.published = true;
  }

  async markProcessed(inquiryId: string): Promise<"updated" | "already"> {
    const row = this.inquiries.find((item) => item.id === inquiryId);
    if (!row) throw new Error("inquiry missing");
    if (row.status === "processed") return "already";
    row.status = "processed";
    return "updated";
  }
}
