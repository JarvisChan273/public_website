import { createServer, type IncomingMessage } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { ContentApi } from "@platform/contracts";
import { submitInquiry, MemoryInquiryRepository } from "@platform/inquiry";
import { handleRequest } from "../services/gateway/src/http";

const root = fileURLToPath(new URL("../../", import.meta.url));
const repo = new MemoryInquiryRepository();

const content: ContentApi = {
  async ping() {
    return { ok: true };
  },
  async listPublished() {
    return [];
  },
  async getBySlug() {
    return null;
  },
};

const inquiry = {
  async ping() {
    return { ok: true as const };
  },
  submit: (
    input: Parameters<typeof submitInquiry>[0],
    meta: Parameters<typeof submitInquiry>[1],
  ) =>
    submitInquiry(input, meta, {
      repo,
      queue: { async send() {} },
      ids: () => crypto.randomUUID(),
      clock: () => new Date().toISOString(),
    }),
};

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function staticPath(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const full = normalize(join(root, relative));
  const rootPrefix = root.endsWith(sep) ? root : root + sep;
  if (full !== root && !full.startsWith(rootPrefix)) return null;
  return full;
}

const port = Number(process.env.PORT ?? 4173);
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname.startsWith("/api/")) {
    const body = await readBody(req);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(", "));
    }
    const request = new Request(url, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });
    const response = await handleRequest(request, { content, inquiry });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }

  const file = staticPath(url.pathname);
  if (!file) {
    res.writeHead(404).end("Not found");
    return;
  }
  try {
    const bytes = await readFile(file);
    res.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`preview http://127.0.0.1:${port}`);
});
