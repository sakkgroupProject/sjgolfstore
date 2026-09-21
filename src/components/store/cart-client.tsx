"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyDiscountAction, removeCartItemAction, updateCartItemAction } from "@/app/actions/cart";
import { formatMoney } from "@/lib/format";

export type CartRow = {
  id: number;
  title: string;
  variantTitle: string;
  slug: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  inventoryQty: number;
};

export function CartClient({
  rows,
  totals,
  initialCode,
}: {
  rows: CartRow[];
  totals: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
  };
  initialCode: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(initialCode);
  const [msg, setMsg] = useState("");

  if (!rows.length) {
    return (
      <div className="wrap flex flex-col items-center gap-5 py-24 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-paper-warm text-2xl">⛳</div>
        <h1 className="text-3xl">Your cart is empty</h1>
        <p className="max-w-md text-sm text-ink-soft">
          Browse clubs, balls, bags and apparel — free U.S. shipping on orders over $100.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">Continue shopping</Link>
          <Link href="/golf-clubs" className="btn btn-outline">Shop golf clubs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr] lg:py-16">
      <div>
        <div className="hidden border-b border-line pb-3 lg:grid lg:grid-cols-[1fr_8rem_7rem_5rem] lg:gap-4">
          <span className="label">Product</span>
          <span className="label text-center">Quantity</span>
          <span className="label text-right">Total</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-4 py-6 lg:grid-cols-[1fr_8rem_7rem_5rem] lg:items-center">
              <div className="flex gap-4">
                <Link href={`/products/${r.slug}`} className="relative size-24 shrink-0 bg-paper-warm">
                  {r.imageUrl ? <Image src={r.imageUrl} alt={r.title} fill sizes="96px" className="object-cover" /> : null}
                </Link>
                <div className="min-w-0">
                  <Link href={`/products/${r.slug}`} className="text-sm font-semibold hover:text-forest">{r.title}</Link>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ink-soft">{r.variantTitle}</p>
                  <p className="mt-1 text-xs text-moss">SKU {r.sku}</p>
                  <p className="mt-1.5 text-xs">
                    {r.inventoryQty > 0 ? (
                      <span className="text-forest">● In stock</span>
                    ) : (
                      <span className="text-ink-soft">○ Backordered</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm lg:hidden">{formatMoney(r.lineTotalCents)}</p>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await removeCartItemAction(r.id);
                        router.refresh();
                      })
                    }
                    disabled={pending}
                    className="mt-2 text-[0.7rem] uppercase tracking-widest text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="flex lg:justify-center">
                <div className="inline-flex items-center border border-line">
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await updateCartItemAction(r.id, r.quantity - 1);
                        router.refresh();
                      })
                    }
                    className="px-3 py-2 transition hover:bg-paper"
                  >−</button>
                  <span className="w-9 text-center text-sm tabular-nums">{r.quantity}</span>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await updateCartItemAction(r.id, r.quantity + 1);
                        router.refresh();
                      })
                    }
                    className="px-3 py-2 transition hover:bg-paper"
                  >+</button>
                </div>
              </div>
              <span className="hidden text-right text-sm font-semibold lg:block">{formatMoney(r.lineTotalCents)}</span>
              <span className="hidden text-right text-xs text-ink-soft lg:block">{formatMoney(r.unitPriceCents)} ea</span>
            </li>
          ))}
        </ul>
        <Link href="/shop" className="mt-8 inline-block text-xs uppercase tracking-[0.16em] text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Order summary</h2>
          <div className="mt-5 flex gap-2">
            <input className="field py-2.5 text-sm" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <button
              onClick={async () => {
                const res = await applyDiscountAction(code);
                setMsg(res.ok ? `${res.code} applied to your order` : res.error);
                router.refresh();
              }}
              className="btn btn-outline shrink-0 px-4 py-2.5"
            >
              Apply
            </button>
          </div>
          {msg ? <p className="mt-2 text-xs text-forest">{msg}</p> : null}

          <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(totals.subtotalCents)}</dd></div>
            {totals.discountCents > 0 ? (
              <div className="flex justify-between text-forest"><dt>Discount</dt><dd>−{formatMoney(totals.discountCents)}</dd></div>
            ) : null}
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Estimated tax</dt><dd>{formatMoney(totals.taxCents)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-base font-semibold">Total</dt>
              <dd className="text-xl font-semibold">{formatMoney(totals.totalCents)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="btn btn-primary mt-6 w-full py-4">Proceed to checkout</Link>
          <p className="mt-3 text-center text-xs text-ink-soft">Free U.S. shipping over $100 · 30-day returns</p>
        </div>
      </aside>
    </div>
  );
}
