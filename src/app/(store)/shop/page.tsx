import type { Metadata } from "next";
import { ShopView, type ShopSearchParams } from "@/components/store/shop-view";

export const metadata: Metadata = {
  title: "Shop All Golf Equipment",
  description:
    "Browse the complete SJ Golf Store catalogue — golf clubs, balls, gloves, bags, apparel, accessories, training aids and technology.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams;
  return (
    <ShopView
      basePath="/shop"
      eyebrow="The Full Catalogue"
      title="Shop All"
      description="Every product we stock, filterable by price, availability, brand, hand, flex and size."
      heroImage="/images/1325706.jpg"
      params={params}
    />
  );
}
