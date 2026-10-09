import { describe, expect, it } from "vitest";
import type { PublishedPage } from "@platform/contracts";
import { getPublishedPage, listPublished, publishPage } from "./app";
import { MemoryPageCache, MemoryPageStore } from "./memory";

const home: PublishedPage = {
  slug: "home",
  title: "Entrance",
  summary: "The static page is the source of truth.",
};

const draft: PublishedPage = {
  slug: "notes",
  title: "Notes",
  summary: "Unpublished draft.",
};

describe("content application", () => {
  it("lists published pages only", async () => {
    const store = new MemoryPageStore([home]);
    await store.upsert(draft, false);
    const pages = await listPublished(store);
    expect(pages.map((page) => page.slug)).toEqual(["home"]);
  });

  it("fills the cache on a miss and trusts it afterwards", async () => {
    const store = new MemoryPageStore([home]);
    const cache = new MemoryPageCache();
    let reads = 0;
    const counting = {
      listPublished: () => store.listPublished(),
      getBySlug: async (slug: string) => {
        reads += 1;
        return store.getBySlug(slug);
      },
      upsert: (page: PublishedPage, published: boolean) =>
        store.upsert(page, published),
    };

    expect(await getPublishedPage("home", counting, cache)).toEqual(home);
    expect(await getPublishedPage("home", counting, cache)).toEqual(home);
    expect(reads).toBe(1);
  });

  it("writes through the cache when a page is published", async () => {
    const store = new MemoryPageStore();
    const cache = new MemoryPageCache();
    const next: PublishedPage = {
      slug: "home",
      title: "Entrance",
      summary: "Updated summary for the entrance.",
    };
    await publishPage(next, store, cache);
    let reads = 0;
    const page = await getPublishedPage(
      "home",
      {
        listPublished: () => store.listPublished(),
        getBySlug: async (slug) => {
          reads += 1;
          return store.getBySlug(slug);
        },
        upsert: (page, published) => store.upsert(page, published),
      },
      cache,
    );
    expect(page?.summary).toBe(next.summary);
    expect(reads).toBe(0);
  });
});
