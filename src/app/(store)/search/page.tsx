import type { Metadata } from "next";
import Link from "next/link";
import { ShopView, type ShopSearchParams } from "@/components/store/shop-view";
import { listProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search golf clubs, balls, bags, gloves, apparel and accessories at SJ Golf Store.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  if (!q.trim()) {
    return (
      <div className="wrap py-24 text-center">
        <p className="eyebrow">Search</p>
        <h1 className="mt-3 text-4xl">What are you looking for?</h1>
        <form action="/search" className="mx-auto mt-8 flex max-w-xl gap-2">
          <input name="q" autoFocus placeholder="Try “driver”, “tour balls”, “stand bag”…" className="field py-3.5" />
          <button className="btn btn-primary px-6">Search</button>
        </form>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {["golf-clubs", "golf-balls", "golf-bags", "golf-gloves", "golf-apparel", "golf-technology"].map((slug) => (
            <Link key={slug} href={`/${slug}`} className="chip hover:border-forest">
              {slug.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const preview = await listProducts({ q, perPage: 4 });

  return (
    <ShopView
      basePath="/search"
      eyebrow="Search Results"
      title={`“${q}”`}
      description={
        preview.total
          ? `${preview.total} products match your search. Refine with the filters below.`
          : undefined
      }
      params={params}
    />
  );
}
