import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getFacets, listProducts, type ProductFilters } from "@/lib/catalog";
import { ProductCard } from "./product-card";
import { Filters, SortBar, SortMenu } from "./filters";

export type ShopSearchParams = Record<string, string | string[] | undefined>;

function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseFilters(params: ShopSearchParams): ProductFilters {
  const priceMin = params.priceMin ? Number(params.priceMin) * 100 : undefined;
  const priceMax = params.priceMax ? Number(params.priceMax) * 100 : undefined;
  return {
    brands: toList(params.brand),
    hands: toList(params.hand),
    flexes: toList(params.flex),
    sizes: toList(params.size),
    tags: toList(params.tag),
    priceMin: Number.isFinite(priceMin as number) ? priceMin : undefined,
    priceMax: Number.isFinite(priceMax as number) ? priceMax : undefined,
    inStock: params.stock === "1",
    onSale: params.sale === "1",
    q: typeof params.q === "string" ? params.q : undefined,
    sort: typeof params.sort === "string" ? params.sort : "featured",
    page: params.page ? Number(params.page) : 1,
    perPage: 12,
  };
}

export function buildQuery(params: ShopSearchParams, overrides: Record<string, string | null>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") sp.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => sp.append(key, v));
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) sp.delete(key);
    else sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function ShopView({
  basePath,
  eyebrow,
  title,
  description,
  heroImage,
  categorySlug,
  params,
}: {
  basePath: string;
  eyebrow?: string;
  title: string;
  description?: string;
  heroImage?: string;
  categorySlug?: string;
  params: ShopSearchParams;
}) {
  const filters = parseFilters(params);
  const [{ items, total, page, perPage }, facets] = await Promise.all([
    listProducts({ ...filters, category: categorySlug }),
    getFacets(categorySlug),
  ]);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") current.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => current.append(k, x));
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-forest-dark text-white">
        <div className="absolute inset-0">
          {heroImage ? <Image src={heroImage} alt={title} fill priority sizes="100vw" className="object-cover opacity-45" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/70 to-forest-dark/40" />
        </div>
        <div className="wrap relative py-14 md:py-20">
          <nav className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-white/55">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white">{title}</span>
          </nav>
          {eyebrow ? <p className="eyebrow mt-5 text-sand">{eyebrow}</p> : null}
          <h1 className="mt-3 text-4xl md:text-6xl">{title}</h1>
          {description ? <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-white/75">{description}</p> : null}
        </div>
      </section>

      <div className="wrap py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
          <Suspense fallback={<div className="text-sm text-ink-soft">Loading filters…</div>}>
            <div className="order-2 lg:order-1">
              <Filters
                basePath={basePath}
                facets={{
                  brands: facets.brands,
                  tags: facets.tags,
                  hands: facets.hands,
                  flexes: facets.flexes,
                  sizes: facets.sizes,
                  maxPrice: facets.maxPrice,
                }}
              />
            </div>
          </Suspense>

          <div className="order-1 lg:order-2">
            <div className="flex items-center justify-between gap-4 pb-6">
              <p className="text-sm text-ink-soft">
                Showing <span className="font-semibold text-ink">{items.length}</span> of {total} products
              </p>
              <div className="hidden lg:block">
                <SortMenu basePath={basePath} query={current.toString()} />
              </div>
            </div>

            {items.length === 0 ? (
              <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
                <p className="text-lg font-semibold">No products match those filters</p>
                <p className="max-w-sm text-sm text-ink-soft">
                  Try widening your price range or clearing a filter to see more of the catalogue.
                </p>
                <Link href={basePath} className="btn btn-primary">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 4} />
                ))}
              </div>
            )}

            {pages > 1 ? (
              <nav className="mt-14 flex items-center justify-center gap-2 border-t border-line pt-8">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
                  const next = new URLSearchParams(current.toString());
                  if (n === 1) next.delete("page");
                  else next.set("page", String(n));
                  const qs = next.toString();
                  return (
                    <Link
                      key={n}
                      href={qs ? `${basePath}?${qs}` : basePath}
                      className={`grid size-10 place-items-center border text-sm transition ${
                        n === page ? "border-forest bg-forest text-white" : "border-line hover:border-ink"
                      }`}
                    >
                      {n}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export { SortBar };
