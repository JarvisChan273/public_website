# Validated architecture

Traditional Chinese summary: 公開網站維持三個靜態頁。企業架構練習放在 `platform/`，用 Cloudflare Workers、service binding、D1、KV 與 Queues 模擬邊界、契約、冪等與 outbox。兩層不要合成一個框架網站。

## Verdict

The public site and the enterprise exercise are two layers.

| Layer | What it is | Where it lives |
| --- | --- | --- |
| Public site | One entrance, Background, Current learning | Repository root, static files, GitHub Pages |
| Enterprise exercise | Gateway, content, and inquiry services | `platform/` |

This split is the result of checking the earlier Cloudflare sketch against `PLAN.md` and against how Cloudflare actually bills and delivers these products.

`PLAN.md` already fixes the public information architecture: static HTML, no framework, no build step, no third page, and no stored messages until a public contact line is chosen. Replacing that with Astro, Cloudflare Pages, and a contact form would throw away a decision that is already merged.

The enterprise exercise is still worth building. It is the hands-on version of the simulator and the Cloudflare tutorial: real boundaries, real contracts, and tests that run without a Cloudflare account.

## What changed in review

| Earlier sketch | Validation | Decision |
| --- | --- | --- |
| Astro on Cloudflare Pages | Conflicts with the static, no-build site plan | Keep hand-written HTML |
| Host the biography on Workers | The static pages are the source of truth | Content service stores summaries only |
| Public contact form in this revision | A form would store visitor email before a public contact line exists | Inquiry service exists, and the HTML does not call it |
| D1 write and Queue send as one step | They are not one transaction | Transactional outbox in D1, then publish |
| Full inquiry body on the queue | Free-tier retention is 24 hours, and retries would copy personal data | Queue message carries ids only |
| KV as the content database | KV is eventually consistent | D1 is the source of truth; KV is a write-through cache |
| Correlation id via HTTP headers between Workers | RPC does not forward headers | Pass `correlationId` in the call arguments |
| In-memory idempotency | A second isolate would forget the key | Unique `idempotency_key` in D1 |
| R2 and Cloudflare Access now | No upload flow and no admin UI yet | Leave them out of the bindings |
| Three public Workers because a personal site needs them | The site does not need them | Three Workers because the exercise is the boundary, and service-binding calls add no extra request fee |

## Runtime shape

```text
Visitor
  └── static pages (GitHub Pages)
        index.html · background.html · learning.html

API client (not linked from the pages yet)
  └── studio-gateway          the only public Worker
        ├── studio-content    service binding, not a public URL
        │     ├── D1 pages
        │     └── KV cache
        └── studio-inquiry    service binding, not a public URL
              ├── D1 inquiries + outbox
              └── Queue studio-inquiry
                    └── same Worker consumes it, then a 15-minute cron sweeps unpublished rows
```

Local development of the three Workers:

```bash
pnpm --dir platform exec wrangler dev \
  -c services/gateway/wrangler.jsonc \
  -c services/content/wrangler.jsonc \
  -c services/inquiry/wrangler.jsonc
```

The first config is the HTTP process. The other two are reachable through service bindings. Deploy the content and inquiry Workers before the gateway, because the gateway binds to them.

`database_id` and the KV id in the Wrangler files are placeholders. Create the resources and replace the ids before a real deploy. Do not add a public route until the zone exists.

## Request rules

`GET /api/health` answers liveness and does not call the other services.

`GET /api/ready` answers readiness. A failed ping on either service returns 503.

`GET /api/pages` and `GET /api/pages/:slug` read published content. The gateway rejects a slug that is not `a-z`, `0-9`, or `-`.

`POST /api/inquiries` requires `Content-Type: application/json` and `Idempotency-Key`. The body is validated in the gateway before the service call, and validated again inside the service. The response is `202` with `{ id, status: "accepted" }`. It does not echo the email or the message. Logs record the inquiry id and the correlation id.

A failed queue send still returns `202`. The outbox row stays unpublished, and the scheduled sweep retries it. The consumer treats a second delivery as success when the row is already `processed`. One queue has one consumer. A dead-letter queue is named for messages that exhaust retries.

## Coding rules

- Cross-service data uses `@platform/contracts`. Services do not share tables.
- The gateway does not contain SQL.
- Domain functions take ports (`PageStore`, `InquiryRepository`, `MessageQueue`) so tests run in Node.
- D1 and KV adapters are the Cloudflare edge of those ports.
- Personal fields are refused by the logger.

## Later, on Cloudflare

1. Turn on GitHub Pages for the repository root.
2. Put the domain on Cloudflare DNS when a custom domain is wanted. Point the site at GitHub Pages. Use Full SSL. A Worker route such as `example.com/api/*` is more specific than the site and is the place the gateway attaches.
3. Create the two D1 databases, the KV namespace, and both queues. Replace the placeholder ids. Apply the migrations. Deploy content, inquiry, then gateway.
4. Add a contact form on the entrance only after the public email or profile is chosen. It posts to the gateway. It is not a new page.
5. Email Routing can forward a notification to a verified mailbox. Arbitrary outbound mail is a paid Workers feature.
6. R2 fits when a page actually has an uploaded file. Cloudflare Access fits when an admin writer exists.

## Map to production concerns

The same ten concerns used for a production system show up here, at personal-site size.

| Concern | In this repository |
| --- | --- |
| Runtime | Static files on GitHub Pages; Workers only for the exercise |
| Config | Wrangler files per service; no secrets in git |
| Secrets | None yet. Bindings replace keys for D1, KV, and Queues |
| State | D1 per service. Unique key for idempotency. Append the inquiry, then advance its status |
| Network | One public Worker. Other services have no public URL |
| Scheduling | Queue consumer plus a 15-minute outbox sweep |
| Observability | Structured logs, `x-correlation-id`, health versus ready |
| Testing | Vitest on the ports. Static-site check for the public copy |
| Delivery | GitHub Actions runs tests, typecheck, and the site check |
| Recovery | D1 is the durable record. Queue retention on the free plan is 24 hours, so the outbox has to live in D1 |

## Sources

- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Queues pricing, including the free plan](https://developers.cloudflare.com/queues/platform/pricing/)
- [Workers pricing for service bindings](https://developers.cloudflare.com/workers/platform/pricing/)
