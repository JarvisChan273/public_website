import { describe, expect, it } from "vitest";
import { createCorrelationId, logEvent } from "./index";

describe("logEvent", () => {
  it("writes a structured line without personal fields", () => {
    const lines: string[] = [];
    const correlationId = createCorrelationId();
    logEvent(
      {
        event: "inquiry.accepted",
        correlationId,
        fields: { inquiryId: "11111111-1111-4111-8111-111111111111" },
      },
      (line) => lines.push(line),
    );
    const parsed = JSON.parse(lines[0] ?? "{}") as { event: string };
    expect(parsed.event).toBe("inquiry.accepted");
  });

  it("refuses to log an email address", () => {
    expect(() =>
      logEvent({
        event: "inquiry.accepted",
        correlationId: createCorrelationId(),
        fields: { email: "ada@example.com" },
      }),
    ).toThrow(/email/);
  });
});
