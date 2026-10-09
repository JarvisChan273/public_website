import type { PublishedPage } from "@platform/contracts";
import type { PageCache, PageStore } from "./app";

interface StoredPage {
  page: PublishedPage;
  published: boolean;
}

export class MemoryPageStore implements PageStore {
  private readonly pages = new Map<string, StoredPage>();

  constructor(seed: PublishedPage[] = []) {
    for (const page of seed) {
      this.pages.set(page.slug, { page: { ...page }, published: true });
    }
  }

  async listPublished(): Promise<PublishedPage[]> {
    return [...this.pages.values()]
      .filter((entry) => entry.published)
      .map((entry) => ({ ...entry.page }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }

  async getBySlug(slug: string): Promise<PublishedPage | null> {
    const entry = this.pages.get(slug);
    if (!entry?.published) return null;
    return { ...entry.page };
  }

  async upsert(page: PublishedPage, published: boolean): Promise<void> {
    this.pages.set(page.slug, { page: { ...page }, published });
  }
}

export class MemoryPageCache implements PageCache {
  readonly values = new Map<string, PublishedPage>();

  async get(slug: string): Promise<PublishedPage | null> {
    const page = this.values.get(slug);
    return page ? { ...page } : null;
  }

  async set(page: PublishedPage): Promise<void> {
    this.values.set(page.slug, { ...page });
  }
}
