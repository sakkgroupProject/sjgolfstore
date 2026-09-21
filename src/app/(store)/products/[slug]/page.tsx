import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { Accordion, ProductGallery, ProductPurchase } from "@/components/store/product-detail";
import { ProductCard, Stars } from "@/components/store/product-card";
import { formatMoney } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };
  const image = data.product.images?.[0]?.url;
  return {
    title: data.product.seoTitle || data.product.title,
    description: data.product.seoDescription || data.product.shortDescription,
    alternates: { canonical: `/products/${data.product.slug}` },
    openGraph: {
      title: data.product.title,
      description: data.product.shortDescription,
      images: image ? [image] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();
  const { product, category, options, variants } = data;
  const related = await getRelatedProducts(product.categoryId, product.id, 4);
  await db
    .update(products)
    .set({ views: sql`${products.views} + 1` })
    .where(eq(products.id, product.id));

  const rating = product.reviewCount ? Math.round((product.ratingSum / product.reviewCount) * 10) / 10 : 0;
  const onSale = Boolean(product.compareAtCents && product.compareAtCents > product.priceCents);
  const totalStock = variants.reduce((s, v) => s + v.inventoryQty, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((i) => i.url),
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://sjgolfstore.com/products/${product.slug}`,
    },
    ...(product.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sjgolfstore.com" },
      { "@type": "ListItem", position: 2, name: category?.name ?? "Shop", item: `https://sjgolfstore.com/${category?.slug ?? "shop"}` },
      { "@type": "ListItem", position: 3, name: product.title, item: `https://sjgolfstore.com/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="wrap pt-6">
        <nav className="flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="text-moss">/</span>
          <Link href={`/${category?.slug ?? "shop"}`} className="hover:text-ink">{category?.name ?? "Shop"}</Link>
          {product.productType ? (
            <>
              <span className="text-moss">/</span>
              <span>{product.productType}</span>
            </>
          ) : null}
          <span className="text-moss">/</span>
          <span className="text-ink">{product.title}</span>
        </nav>
      </div>

      <div className="wrap grid gap-10 pb-20 pt-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <ProductGallery images={product.images ?? []} videoUrl={product.videoUrl} title={product.title} />
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-moss">{product.brand}</p>
          <h1 className="mt-2 text-3xl leading-tight md:text-[2.5rem]">{product.title}</h1>
          {product.reviewCount ? (
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={rating} size={14} />
              <span className="text-xs text-ink-soft">
                {rating} · {product.reviewCount} reviews
              </span>
            </div>
          ) : null}
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{product.shortDescription}</p>

          <div className="mt-7 border-t border-line pt-7">
            <ProductPurchase
              productId={product.id}
              title={product.title}
              options={options.map((o) => ({ name: o.name, values: o.values }))}
              variants={variants.map((v) => ({
                id: v.id,
                title: v.title,
                sku: v.sku,
                priceCents: v.priceCents,
                compareAtCents: v.compareAtCents,
                options: v.options ?? {},
                inventoryQty: v.inventoryQty,
                imageUrl: v.imageUrl,
              }))}
              basePriceCents={product.priceCents}
              baseCompareAtCents={product.compareAtCents}
            />
          </div>

          <div className="mt-8 grid gap-3 border-t border-line pt-6 text-xs text-ink-soft sm:grid-cols-2">
            <p className="flex items-center gap-2"><ShippingIcon /> Free U.S. shipping over $100</p>
            <p>↩ 30-day returns on unused gear</p>
            <p>🛡 Authorized dealer warranty</p>
            <p>🔧 Free expert fitting advice</p>
          </div>
        </div>
      </div>

      <section className="border-t border-line bg-paper py-14">
        <div className="wrap grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl">Product details</h2>
            <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft">{product.description}</p>

            {product.specs?.length ? (
              <div className="mt-8">
                <h3 className="label mb-3">Specifications</h3>
                <dl className="divide-y divide-line border-y border-line">
                  {product.specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-6 py-3 text-sm">
                      <dt className="text-ink-soft">{s.label}</dt>
                      <dd className="text-right font-medium">{s.value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-6 py-3 text-sm">
                    <dt className="text-ink-soft">SKU</dt>
                    <dd className="text-right font-medium">{product.sku}</dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3 text-sm">
                    <dt className="text-ink-soft">Weight</dt>
                    <dd className="text-right font-medium">{(product.weightGrams / 1000).toFixed(2)} kg</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>

          <div>
            <h2 className="text-2xl">Shipping &amp; returns</h2>
            <div className="mt-5">
              <Accordion
                items={[
                  {
                    title: "Shipping information",
                    content: (
                      <div className="space-y-2">
                        <p>Standard shipping $9.99 — free on orders over $100. Delivered in 3–7 business days.</p>
                        <p>Express shipping $24.99 (2 business days). Overnight available at checkout.</p>
                        <p>Oversized items such as bags, nets and travel covers may ship in a separate carton.</p>
                      </div>
                    ),
                  },
                  {
                    title: "Returns information",
                    content: (
                      <div className="space-y-2">
                        <p>Return unused equipment within 30 days for a full refund.</p>
                        <p>Custom-built or fitted clubs are final sale unless defective.</p>
                        <p>Email support@sjgolfstore.com with your order number to start a return.</p>
                      </div>
                    ),
                  },
                  {
                    title: "Warranty",
                    content: (
                      <p>
                        Every product is sourced through authorized channels and carries the full manufacturer warranty.
                        We handle warranty claims on your behalf.
                      </p>
                    ),
                  },
                ]}
              />
            </div>

            {onSale ? (
              <div className="mt-8 border border-forest/25 bg-white p-5">
                <p className="label">Current offer</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Now {formatMoney(product.priceCents)} — down from {formatMoney(product.compareAtCents!)}. Limited to
                  stock on hand.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="wrap py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl md:text-3xl">You may also like</h2>
            <Link href={`/${category?.slug ?? "shop"}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
              View collection →
            </Link>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ShippingIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></svg>;
}
