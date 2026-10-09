# Platform

企業架構練習。公開網站的三個 HTML 頁不從這裡讀資料。

This folder is the enterprise exercise: a gateway Worker, a content service, and an inquiry service. The public biography stays in the static files at the repository root. See `docs/architecture.md` for the review that produced this split.

## Run the tests

```bash
pnpm install
pnpm test
pnpm typecheck
```

Run these from `platform/`. They use in-memory ports and do not need a Cloudflare account.

## Local Workers

From `platform/`, after `pnpm install`:

```bash
pnpm exec wrangler dev \
  -c services/gateway/wrangler.jsonc \
  -c services/content/wrangler.jsonc \
  -c services/inquiry/wrangler.jsonc
```

Wrangler is not a dependency of the tests. Install it with `pnpm add -D wrangler` in this folder when you are ready to boot the Workers. The ids in the Wrangler files are placeholders.

Apply the local migrations once Wrangler is installed:

```bash
pnpm exec wrangler d1 migrations apply studio-content --local -c services/content/wrangler.jsonc
pnpm exec wrangler d1 migrations apply studio-inquiry --local -c services/inquiry/wrangler.jsonc
```

## HTTP shape

- `GET /api/health`
- `GET /api/ready`
- `GET /api/pages`
- `GET /api/pages/:slug`
- `POST /api/inquiries` with JSON or a form body, plus `Idempotency-Key`. Fields are `subject`, `email`, and `message`.

The Contact page posts to that route. From this folder, `pnpm preview` serves the static site and the gateway together on `http://127.0.0.1:4173`. Notes stay in memory for that process. A deployed gateway on the same domain is what stores them.
