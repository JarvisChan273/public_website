import {
  callMetaSchema,
  correlationIdSchema,
  inquiryAcceptedSchema,
  normalizeInquiryInput,
  slugSchema,
  submitInquirySchema,
  type ContentApi,
  type InquiryApi,
} from "@platform/contracts";

export interface GatewayDeps {
  content: ContentApi;
  inquiry: InquiryApi;
}

function json(status: number, body: unknown, correlationId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-correlation-id": correlationId,
    },
  });
}

async function readInquiryPayload(
  request: Request,
): Promise<unknown | "unsupported" | "invalid-json"> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return "invalid-json";
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await request.text());
    return {
      subject: params.get("subject") ?? "",
      email: params.get("email") ?? "",
      message: params.get("message") ?? "",
    };
  }
  return "unsupported";
}

function correlationOf(request: Request): string {
  const header = request.headers.get("x-correlation-id");
  const parsed = correlationIdSchema.safeParse(header);
  return parsed.success ? parsed.data : crypto.randomUUID();
}

export async function handleRequest(
  request: Request,
  deps: GatewayDeps,
): Promise<Response> {
  const url = new URL(request.url);
  const correlationId = correlationOf(request);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json(200, { status: "ok" }, correlationId);
    }

    if (request.method === "GET" && url.pathname === "/api/ready") {
      const checks = { content: false, inquiry: false };
      try {
        checks.content = (await deps.content.ping()).ok;
      } catch {
        checks.content = false;
      }
      try {
        checks.inquiry = (await deps.inquiry.ping()).ok;
      } catch {
        checks.inquiry = false;
      }
      const ready = checks.content && checks.inquiry;
      return json(ready ? 200 : 503, { ready, checks }, correlationId);
    }

    if (request.method === "GET" && url.pathname === "/api/pages") {
      return json(200, { pages: await deps.content.listPublished() }, correlationId);
    }

    const slug = url.pathname.startsWith("/api/pages/")
      ? url.pathname.slice("/api/pages/".length)
      : null;
    if (request.method === "GET" && slug !== null) {
      if (!slugSchema.safeParse(slug).success) {
        return json(404, { error: "NOT_FOUND", correlationId }, correlationId);
      }
      const page = await deps.content.getBySlug(slug);
      if (!page) {
        return json(404, { error: "PAGE_NOT_FOUND", correlationId }, correlationId);
      }
      return json(200, page, correlationId);
    }

    if (request.method === "POST" && url.pathname === "/api/inquiries") {
      const idempotencyKey = request.headers.get("idempotency-key");
      if (!idempotencyKey) {
        return json(400, { error: "IDEMPOTENCY_KEY_REQUIRED", correlationId }, correlationId);
      }
      const payload = await readInquiryPayload(request);
      if (payload === "unsupported") {
        return json(415, { error: "UNSUPPORTED_MEDIA_TYPE", correlationId }, correlationId);
      }
      if (payload === "invalid-json") {
        return json(400, { error: "INVALID_JSON", correlationId }, correlationId);
      }
      const body = submitInquirySchema.safeParse(normalizeInquiryInput(payload));
      const meta = callMetaSchema.safeParse({ correlationId, idempotencyKey });
      if (!body.success || !meta.success) {
        return json(400, { error: "INQUIRY_INVALID", correlationId }, correlationId);
      }
      const accepted = inquiryAcceptedSchema.parse(
        await deps.inquiry.submit(body.data, meta.data),
      );
      return json(202, accepted, correlationId);
    }

    return json(404, { error: "NOT_FOUND", correlationId }, correlationId);
  } catch {
    return json(500, { error: "INTERNAL", correlationId }, correlationId);
  }
}
