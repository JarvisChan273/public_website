import { describe, expect, it } from "vitest";
import type { ContentApi, InquiryApi, PublishedPage } from "@platform/contracts";
import { handleRequest } from "./http";

const page: PublishedPage = {
  slug: "home",
  title: "Entrance",
  summary: "The static page is the source of truth.",
};

function content(overrides: Partial<ContentApi> = {}): ContentApi {
  return {
    async ping() {
      return { ok: true };
    },
    async listPublished() {
      return [page];
    },
    async getBySlug(slug) {
      return slug === page.slug ? page : null;
    },
    ...overrides,
  };
}

function inquiry(overrides: Partial<InquiryApi> = {}): InquiryApi {
  return {
    async ping() {
      return { ok: true };
    },
    async submit() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        status: "accepted",
      };
    },
    ...overrides,
  };
}

function request(path: string, init?: RequestInit): Request {
  return new Request(`https://example.com${path}`, init);
}

describe("gateway", () => {
  it("reports liveness without calling the services", async () => {
    const response = await handleRequest(request("/api/health"), {
      content: content({
        ping() {
          throw new Error("down");
        },
      }),
      inquiry: inquiry(),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("reports not ready when a dependency ping fails", async () => {
    const response = await handleRequest(request("/api/ready"), {
      content: content(),
      inquiry: inquiry({
        ping() {
          throw new Error("down");
        },
      }),
    });
    expect(response.status).toBe(503);
    const body = (await response.json()) as { ready: boolean };
    expect(body.ready).toBe(false);
  });

  it("rejects a slug that is not a safe identifier", async () => {
    let calls = 0;
    const response = await handleRequest(request("/api/pages/Home"), {
      content: content({
        async getBySlug(slug) {
          calls += 1;
          return slug === page.slug ? page : null;
        },
      }),
      inquiry: inquiry(),
    });
    expect(response.status).toBe(404);
    expect(calls).toBe(0);
  });

  it("requires an idempotency key and does not echo the message", async () => {
    let calls = 0;
    const missing = await handleRequest(
      request("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Ada",
          email: "ada@example.com",
          message: "This message must stay out of the response.",
        }),
      }),
      { content: content(), inquiry: inquiry() },
    );
    expect(missing.status).toBe(400);

    const accepted = await handleRequest(
      request("/api/inquiries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "idem-key-001",
          "x-correlation-id": "33333333-3333-4333-8333-333333333333",
        },
        body: JSON.stringify({
          name: "Ada",
          email: "ada@example.com",
          message: "This message must stay out of the response.",
        }),
      }),
      {
        content: content(),
        inquiry: inquiry({
          async submit() {
            calls += 1;
            return {
              id: "11111111-1111-4111-8111-111111111111",
              status: "accepted",
            };
          },
        }),
      },
    );
    expect(accepted.status).toBe(202);
    expect(accepted.headers.get("x-correlation-id")).toBe(
      "33333333-3333-4333-8333-333333333333",
    );
    const text = await accepted.text();
    expect(text).not.toContain("ada@example.com");
    expect(text).not.toContain("stay out of the response");
    expect(calls).toBe(1);
  });

  it("hides internal failures", async () => {
    const response = await handleRequest(request("/api/pages"), {
      content: content({
        async listPublished() {
          throw new Error("database password=secret");
        },
      }),
      inquiry: inquiry(),
    });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("password");
  });
});
