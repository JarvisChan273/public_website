import {
  publishedPageSchema,
  type PublishedPage,
} from "@platform/contracts";

export interface PageStore {
  listPublished(): Promise<PublishedPage[]>;
  getBySlug(slug: string): Promise<PublishedPage | null>;
  upsert(page: PublishedPage, published: boolean): Promise<void>;
}

export interface PageCache {
  get(slug: string): Promise<PublishedPage | null>;
  set(page: PublishedPage): Promise<void>;
}

export async function listPublished(store: PageStore): Promise<PublishedPage[]> {
  return store.listPublished();
}

export async function getPublishedPage(
  slug: string,
  store: PageStore,
  cache: PageCache,
): Promise<PublishedPage | null> {
  const cached = await cache.get(slug);
  if (cached) return cached;
  const page = await store.getBySlug(slug);
  if (page) await cache.set(page);
  return page;
}

export async function publishPage(
  page: PublishedPage,
  store: PageStore,
  cache: PageCache,
): Promise<void> {
  const parsed = publishedPageSchema.parse(page);
  await store.upsert(parsed, true);
  await cache.set(parsed);
}
