import { describe, expect, it } from "vitest";
import {
  normalizeInquiryInput,
  queueMessageSchema,
  submitInquirySchema,
} from "./index";

const validInquiry = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, this is a real note.",
};

describe("inquiry contract", () => {
  it("accepts a trimmed inquiry", () => {
    const parsed = submitInquirySchema.parse(
      normalizeInquiryInput({
        name: "  Ada Lovelace  ",
        email: " ada@example.com ",
        message: "  Hello, this is a real note.  ",
      }),
    );
    expect(parsed).toEqual(validInquiry);
  });

  it("rejects a message that is too short", () => {
    const result = submitInquirySchema.safeParse({
      ...validInquiry,
      message: "too short",
    });
    expect(result.success).toBe(false);
  });
});

describe("queue contract", () => {
  it("carries ids only", () => {
    const parsed = queueMessageSchema.parse({
      outboxId: "22222222-2222-4222-8222-222222222222",
      inquiryId: "11111111-1111-4111-8111-111111111111",
      correlationId: "33333333-3333-4333-8333-333333333333",
    });
    expect(parsed).not.toHaveProperty("email");
    expect(parsed).not.toHaveProperty("message");
  });
});
