import { WorkerEntrypoint } from "cloudflare:workers";
import { getPublishedPage, listPublished } from "./app";
import { D1PageStore } from "./d1";
import { KvPageCache } from "./kv";

interface ContentEnv {
  DB: D1Database;
  PAGES: KVNamespace;
}

export class ContentService extends WorkerEntrypoint<ContentEnv> {
  async ping(): Promise<{ ok: true }> {
    return { ok: true };
  }

  async listPublished() {
    return listPublished(new D1PageStore(this.env.DB));
  }

  async getBySlug(slug: string) {
    return getPublishedPage(
      slug,
      new D1PageStore(this.env.DB),
      new KvPageCache(this.env.PAGES),
    );
  }
}

export default ContentService;
