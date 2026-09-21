import { NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/catalog";
import { ensureSeeded } from "@/db/seed";

export async function GET(request: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchSuggestions(q);
  return NextResponse.json({
    products: results.products.map((p) => ({
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
    })),
    categories: results.categories.map((c) => ({ slug: c.slug, name: c.name })),
  });
}
