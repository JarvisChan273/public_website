import { z } from "zod";

export const correlationIdSchema = z.string().uuid();

export const slugSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);

export const publishedPageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(280),
});

export type PublishedPage = z.infer<typeof publishedPageSchema>;

export const submitInquirySchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(120),
  message: z.string().min(10).max(2000),
});

export type SubmitInquiry = z.infer<typeof submitInquirySchema>;

export const inquiryAcceptedSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("accepted"),
});

export type InquiryAccepted = z.infer<typeof inquiryAcceptedSchema>;

export const callMetaSchema = z.object({
  correlationId: correlationIdSchema,
  idempotencyKey: z.string().min(8).max(200),
});

export type CallMeta = z.infer<typeof callMetaSchema>;

export const queueMessageSchema = z.object({
  outboxId: z.string().uuid(),
  inquiryId: z.string().uuid(),
  correlationId: correlationIdSchema,
});

export type QueueMessage = z.infer<typeof queueMessageSchema>;

export interface ContentApi {
  ping(): Promise<{ ok: true }>;
  listPublished(): Promise<PublishedPage[]>;
  getBySlug(slug: string): Promise<PublishedPage | null>;
}

export interface InquiryApi {
  ping(): Promise<{ ok: true }>;
  submit(input: SubmitInquiry, meta: CallMeta): Promise<InquiryAccepted>;
}

export function normalizeInquiryInput(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const record = input as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name.trim() : record.name,
    email: typeof record.email === "string" ? record.email.trim() : record.email,
    message: typeof record.message === "string" ? record.message.trim() : record.message,
  };
}
