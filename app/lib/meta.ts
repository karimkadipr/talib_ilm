import type { MetaDescriptor } from "react-router";

/** A page's title and description in the page language, built by its loader with `seo()`. */
export type PageMeta = { title: string; description: string; siteName: string };

/**
 * The tab title, description and link-preview tags for a page. A route's meta replaces its
 * parents', so each one returns the full set.
 */
export function pageMeta(meta: PageMeta | undefined): MetaDescriptor[] {
  if (!meta) return [];
  return [
    { title: meta.title },
    { name: "description", content: meta.description },
    { property: "og:title", content: meta.title },
    { property: "og:description", content: meta.description },
    { property: "og:site_name", content: meta.siteName },
    { property: "og:type", content: "website" },
  ];
}
