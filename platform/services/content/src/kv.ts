import type { PublishedPage } from "@platform/contracts";
import type { PageCache } from "./app";

export class KvPageCache implements PageCache {
  constructor(private readonly kv: KVNamespace) {}

  async get(slug: string): Promise<PublishedPage | null> {
    return this.kv.get<PublishedPage>(`page:${slug}`, "json");
  }

  async set(page: PublishedPage): Promise<void> {
    await this.kv.put(`page:${page.slug}`, JSON.stringify(page));
  }
}
