"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Image from "next/image";
import { removeCartItemAction, updateCartItemAction } from "@/app/actions/cart";
import { formatMoney } from "@/lib/format";

export type DrawerLine = {
  id: number;
  title: string;
  variantTitle: string;
  slug: string;
  imageUrl: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type DrawerTotals = {
  subtotalCents: number;
  discountCents: number;
  itemCount: number;
  discountCode: string;
  discountLabel: string;
};

type Ctx = { open: (options?: { message?: string }) => void };
const CartDrawerContext = createContext<Ctx>({ open: () => {} });

export function useCartDrawer() {
  return useContext(CartDrawerContext);
}

export function CartProvider({
  children,
  lines,
  totals,
}: {
  children: ReactNode;
  lines: DrawerLine[];
  totals: DrawerTotals;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const freeShippingBar = Math.max(0, 10000 - totals.subtotalCents);

  const open = useCallback((options?: { message?: string }) => {
    if (options?.message) setMessage(options.message);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const value = useMemo(() => ({ open }), [open]);

  const update = (id: number, quantity: number) => {
    startTransition(async () => {
      await updateCartItemAction(id, quantity);
    });
  };

  const remove = (id: number) => {
    startTransition(async () => {
      await removeCartItemAction(id);
    });
  };

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button
            aria-label="Close cart"
            className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-full max-w-[27rem] animate-slide-in flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="eyebrow">Your Cart</p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-line text-ink transition hover:border-ink"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </header>

            {message ? (
              <div className="border-b border-line bg-paper px-6 py-3 text-xs tracking-wide text-forest">{message}</div>
            ) : null}

            {totals.subtotalCents < 10000 ? (
              <div className="border-b border-line px-6 py-4">
                <p className="text-xs text-ink-soft">
                  {freeShippingBar > 0
                    ? `You are ${formatMoney(freeShippingBar)} away from free U.S. shipping`
                    : "You've unlocked free U.S. shipping"}
                </p>
                <div className="mt-2 h-[3px] w-full bg-paper-warm">
                  <div
                    className="h-full bg-forest transition-all"
                    style={{ width: `${Math.min(100, (totals.subtotalCents / 10000) * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto px-6">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="grid size-16 place-items-center rounded-full bg-paper text-forest"><FlagIcon /></div>
                  <p className="text-lg font-semibold">Your cart is empty</p>
                  <p className="max-w-[16rem] text-sm text-ink-soft">
                    Add clubs, balls or apparel and it will show up right here.
                  </p>
                  <Link href="/shop" onClick={() => setIsOpen(false)} className="btn btn-primary mt-2">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-4 py-5">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="relative size-20 shrink-0 overflow-hidden bg-paper-warm"
                      >
                        {line.imageUrl ? (
                          <Image src={line.imageUrl} alt={line.title} fill sizes="80px" className="object-cover" />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <Link
                            href={`/products/${line.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="truncate text-sm font-semibold hover:text-forest"
                          >
                            {line.title}
                          </Link>
                          <span className="whitespace-nowrap text-sm font-semibold">
                            {formatMoney(line.lineTotalCents)}
                          </span>
                        </div>
                        {line.variantTitle ? (
                          <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-soft">{line.variantTitle}</p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center border border-line">
                            <button
                              onClick={() => update(line.id, line.quantity - 1)}
                              disabled={pending}
                              className="px-2.5 py-1.5 text-sm transition hover:bg-paper"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                            <button
                              onClick={() => update(line.id, line.quantity + 1)}
                              disabled={pending}
                              className="px-2.5 py-1.5 text-sm transition hover:bg-paper"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => remove(line.id)}
                            disabled={pending}
                            className="text-[0.7rem] uppercase tracking-widest text-ink-soft underline decoration-line underline-offset-4 transition hover:text-ink"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 ? (
              <footer className="border-t border-line px-6 py-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">Subtotal</span>
                  <span className="text-base font-semibold">{formatMoney(totals.subtotalCents)}</span>
                </div>
                {totals.discountCents > 0 ? (
                  <div className="mt-1 flex items-center justify-between text-sm text-forest">
                    <span>
                      {totals.discountCode} · {totals.discountLabel}
                    </span>
                    <span>−{formatMoney(totals.discountCents)}</span>
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-ink-soft">Shipping and tax calculated at checkout.</p>
                <Link href="/checkout" onClick={() => setIsOpen(false)} className="btn btn-primary mt-4 w-full">
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 block py-2 text-center text-[0.7rem] uppercase tracking-[0.18em] text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
                >
                  View Cart
                </Link>
              </footer>
            ) : null}
          </aside>
        </div>
      ) : null}
    </CartDrawerContext.Provider>
  );
}

function CloseIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function FlagIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M6 21V4M6 5c4-3 7 3 12 0v9c-5 3-8-3-12 0" /><path d="M3 21h6" /></svg>;
}
