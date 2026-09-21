import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/catalog";
import { ShopView, type ShopSearchParams } from "@/components/store/shop-view";
import { StaticPageView } from "@/components/store/static-page";

type Params = { params: Promise<{ category: string }>; searchParams: Promise<ShopSearchParams> };

async function resolve(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (category) return { kind: "category" as const, category };
  const pageRows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  if (pageRows[0]) return { kind: "page" as const, page: pageRows[0] };
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: slug } = await params;
  const found = await resolve(slug);
  if (!found) return { title: "Page not found" };
  if (found.kind === "category") {
    const c = found.category;
    return {
      title: c.seoTitle || c.name,
      description: c.seoDescription || c.description,
      alternates: { canonical: `/${c.slug}` },
      openGraph: { title: c.name, description: c.description, images: [c.imageUrl] },
    };
  }
  return {
    title: found.page.seoTitle || found.page.title,
    description: found.page.seoDescription,
    alternates: { canonical: `/${found.page.slug}` },
  };
}

export default async function CollectionPage({ params, searchParams }: Params) {
  const [{ category: slug }, sp] = await Promise.all([params, searchParams]);
  const found = await resolve(slug);

  if (!found) notFound();

  if (found.kind === "page") {
    return <StaticPageView slug={slug} />;
  }

  const category = found.category;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sjgolfstore.com" },
      { "@type": "ListItem", position: 2, name: category.name, item: `https://sjgolfstore.com/${category.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ShopView
        basePath={`/${category.slug}`}
        eyebrow={category.tagline}
        title={category.name}
        description={category.description}
        heroImage={category.imageUrl}
        categorySlug={category.slug}
        params={sp}
      />
    </>
  );
}
