"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { useCartDrawer } from "./cart-provider";
import { formatMoney } from "@/lib/format";

export type GalleryImage = { url: string; alt: string };
export type OptionDef = { name: string; values: string[] };
export type VariantData = {
  id: number;
  title: string;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  options: Record<string, string>;
  inventoryQty: number;
  imageUrl: string;
};

/* ------------------------------------------------------------------ *
 * Gallery
 * ------------------------------------------------------------------ */
export function ProductGallery({
  images,
  videoUrl,
  title,
}: {
  images: GalleryImage[];
  videoUrl?: string;
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = (i: number) => {
    setActive(i);
    const node = trackRef.current?.children[i] as HTMLElement | undefined;
    node?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className="lg:flex lg:flex-row-reverse lg:gap-6">
      <div
        className="relative aspect-square w-full overflow-hidden bg-paper-warm lg:flex-1"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
      >
        {images[active] ? (
          <Image
            src={images[active].url}
            alt={images[active].alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className={`object-cover transition-transform duration-700 ${zoom ? "scale-[1.35]" : "scale-100"}`}
          />
        ) : null}
        {videoUrl ? (
          <span className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
            ▶ Video available
          </span>
        ) : null}
        <span className="absolute right-4 top-4 bg-white/85 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-ink-soft">
          {active + 1} / {images.length}
        </span>
      </div>

      <div className="mt-3 lg:mt-0 lg:w-24 lg:shrink-0">
        <div ref={trackRef} className="hide-scrollbar flex snap-x gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => scrollTo(i)}
              className={`relative aspect-square w-20 shrink-0 snap-center overflow-hidden border transition lg:w-full ${
                i === active ? "border-forest" : "border-line hover:border-ink"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Purchase panel
 * ------------------------------------------------------------------ */
function pickVariant(variants: VariantData[], selected: Record<string, string>): VariantData | null {
  const exact = variants.find((v) => Object.entries(selected).every(([k, val]) => v.options[k] === val));
  if (exact) return exact;
  return null;
}

export function ProductPurchase({
  productId,
  title,
  options,
  variants,
  basePriceCents,
  baseCompareAtCents,
}: {
  productId: number;
  title: string;
  options: OptionDef[];
  variants: VariantData[];
  basePriceCents: number;
  baseCompareAtCents: number | null;
}) {
  const router = useRouter();
  const { open } = useCartDrawer();
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const firstAvailable = variants.find((v) => v.inventoryQty > 0) ?? variants[0];
    return { ...(firstAvailable?.options ?? {}) };
  });
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState("");

  const variant = useMemo(() => pickVariant(variants, selected), [variants, selected]);
  const price = variant?.priceCents ?? basePriceCents;
  const compare = variant?.compareAtCents ?? baseCompareAtCents;
  const inStock = variant ? variant.inventoryQty > 0 : variants.some((v) => v.inventoryQty > 0);
  const maxQty = variant?.inventoryQty ?? 10;

  useEffect(() => {
    setError("");
  }, [selected]);

  const select = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    const match = pickVariant(variants, next);
    if (!match) {
      // choose the first variant that keeps the new value but is in stock
      const fallback = variants.find((v) => v.options[name] === value && v.inventoryQty > 0) ?? variants.find((v) => v.options[name] === value);
      if (fallback) setSelected({ ...fallback.options });
      return;
    }
    setSelected(next);
  };

  const add = async (mode: "cart" | "buy") => {
    if (!variant || !inStock) return;
    setPending(mode);
    setError("");
    await addToCartAction(productId, variant.id, quantity);
    router.refresh();
    if (mode === "cart") {
      open({ message: `${title} added to your cart` });
      setPending(null);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-light tracking-wide">{formatMoney(price)}</span>
        {compare && compare > price ? (
          <>
            <span className="text-lg text-ink-soft line-through decoration-line">{formatMoney(compare)}</span>
            <span className="bg-forest px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white">
              Save {formatMoney(compare - price)}
            </span>
          </>
        ) : null}
      </div>

      <p className="mt-4 flex items-center gap-2 text-sm">
        <span className={`size-2 rounded-full ${inStock ? "bg-forest" : "bg-ink/30"}`} />
        <span className={inStock ? "font-medium text-forest" : "text-ink-soft"}>
          {inStock ? "In Stock — ships within 1 business day" : "Out of Stock"}
        </span>
        {variant && inStock && variant.inventoryQty <= 5 ? (
          <span className="text-xs text-sand">Only {variant.inventoryQty} left</span>
        ) : null}
      </p>

      <div className="mt-8 space-y-7">
        {options.map((opt) => {
          const many = opt.values.length > 6;
          return (
            <div key={opt.name}>
              <div className="mb-3 flex items-baseline justify-between">
                <span className="label">{opt.name}</span>
                <span className="text-xs text-ink-soft">{selected[opt.name] ?? "Select"}</span>
              </div>
              {many ? (
                <select
                  value={selected[opt.name] ?? ""}
                  onChange={(e) => select(opt.name, e.target.value)}
                  className="field py-3"
                >
                  {opt.values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v) => {
                    const isHand = opt.name.toLowerCase() === "hand";
                    const isActive = selected[opt.name] === v;
                    return (
                      <button
                        key={v}
                        onClick={() => select(opt.name, v)}
                        className={`min-w-[3.4rem] border px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "border-forest bg-forest text-white"
                            : "border-line bg-white text-ink hover:border-ink"
                        } ${isHand ? "rounded-full px-5" : "rounded-[2px]"}`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="label">Quantity</span>
          <span className="text-xs text-ink-soft">{variant?.sku}</span>
        </div>
        <div className="inline-flex items-center border border-line">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-3 transition hover:bg-paper"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 text-center text-sm tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQty || 10, q + 1))}
            className="px-4 py-3 transition hover:bg-paper"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 space-y-3">
        <button
          onClick={() => add("cart")}
          disabled={!inStock || pending !== null}
          className="btn btn-primary w-full py-4"
        >
          {pending === "cart" ? "Adding…" : inStock ? "Add to Cart" : "Out of Stock"}
        </button>
        <button
          onClick={() => add("buy")}
          disabled={!inStock || pending !== null}
          className="btn btn-dark w-full py-4"
        >
          {pending === "buy" ? "Redirecting…" : "Buy Now"}
        </button>
      </div>

      {/* sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-soft">{Object.values(selected).join(" / ") || title}</p>
          <p className="text-sm font-semibold">{formatMoney(price * quantity)}</p>
        </div>
        <button onClick={() => add("cart")} disabled={!inStock || pending !== null} className="btn btn-primary px-6 py-3.5">
          {inStock ? "Add to Cart" : "Sold Out"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Accordion
 * ------------------------------------------------------------------ */
export function Accordion({ items }: { items: { title: string; content: React.ReactNode }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <div key={item.title}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-[0.1em]"
            aria-expanded={openIndex === i}
          >
            {item.title}
            <span className="text-moss">{openIndex === i ? "−" : "+"}</span>
          </button>
          {openIndex === i ? <div className="pb-5 text-sm leading-relaxed text-ink-soft">{item.content}</div> : null}
        </div>
      ))}
    </div>
  );
}
