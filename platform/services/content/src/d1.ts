import type { PublishedPage } from "@platform/contracts";
import type { PageStore } from "./app";

interface PageRow {
  slug: string;
  title: string;
  summary: string;
}

function toPage(row: PageRow): PublishedPage {
  return { slug: row.slug, title: row.title, summary: row.summary };
}

export class D1PageStore implements PageStore {
  constructor(private readonly db: D1Database) {}

  async listPublished(): Promise<PublishedPage[]> {
    const { results } = await this.db
      .prepare(
        "SELECT slug, title, summary FROM pages WHERE published = 1 ORDER BY slug",
      )
      .all<PageRow>();
    return results.map(toPage);
  }

  async getBySlug(slug: string): Promise<PublishedPage | null> {
    const row = await this.db
      .prepare(
        "SELECT slug, title, summary FROM pages WHERE slug = ? AND published = 1",
      )
      .bind(slug)
      .first<PageRow>();
    return row ? toPage(row) : null;
  }

  async upsert(page: PublishedPage, published: boolean): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO pages (slug, title, summary, published, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title,
           summary = excluded.summary,
           published = excluded.published,
           updated_at = excluded.updated_at`,
      )
      .bind(
        page.slug,
        page.title,
        page.summary,
        published ? 1 : 0,
        new Date().toISOString(),
      )
      .run();
  }
}
