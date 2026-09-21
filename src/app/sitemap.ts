import type { MetadataRoute } from "next";
import { db } from "@/db";
import { pages, products } from "@/db/schema";
import { getCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sjgolfstore.com";
  const staticRoutes = ["", "/shop", "/track-order", "/contact", "/faq", "/cart"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [cats, productRows, pageRows] = await Promise.all([
      getCategories(),
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products),
      db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages),
    ]);

    return [
      ...staticRoutes,
      ...cats.map((c) => ({
        url: `${base}/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...productRows.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...pageRows.map((p) => ({
        url: `${base}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "yearly" as const,
        priority: 0.4,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
