import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[2px] align-middle" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <path
            d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.65l5.9-.85L10 1.5z"
            fill={rating >= i - 0.4 ? "#14392c" : "#dedcd4"}
          />
        </svg>
      ))}
    </span>
  );
}

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const onSale = Boolean(product.compareAtCents && product.compareAtCents > product.priceCents);
  return (
    <article className="group relative flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-paper-warm">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        {product.hoverImageUrl ? (
          <Image
            src={product.hoverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}

        <div className="absolute left-0 top-3 flex flex-col gap-1">
          {onSale ? (
            <span className="bg-forest px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white">
              Sale
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="bg-ink px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white">
              Sold Out
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-moss">{product.brand}</p>
        <h3 className="mt-1.5 text-[0.95rem] font-normal leading-snug">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-forest">
            {product.title}
          </Link>
        </h3>
        {product.reviewCount > 0 ? (
          <div className="mt-2 flex items-center gap-1.5">
            <Stars rating={product.rating} />
            <span className="text-[0.7rem] text-ink-soft">({product.reviewCount})</span>
          </div>
        ) : (
          <div className="mt-2 h-[12px]" />
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[1.05rem] font-light tracking-wide">{formatMoney(product.priceCents)}</span>
          {onSale ? (
            <span className="text-sm font-light text-ink-soft line-through decoration-line">{formatMoney(product.compareAtCents!)}</span>
          ) : null}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.12em]">
          <span className={`size-1.5 rounded-full ${product.inStock ? "bg-forest" : "bg-ink/30"}`} />
          <span className={product.inStock ? "text-forest" : "text-ink-soft"}>{product.inStock ? "In stock" : "Out of stock"}</span>
          {product.variantSummary ? <span className="text-moss">· {product.variantSummary}</span> : null}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="btn btn-outline mt-4 w-full py-3 text-[0.68rem] opacity-90 transition group-hover:opacity-100"
        >
          View Product
        </Link>
      </div>
    </article>
  );
}
