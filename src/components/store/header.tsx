"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { useCartDrawer } from "./cart-provider";

type NavCategory = { slug: string; name: string; tagline: string };
type Suggestion = {
  products: { slug: string; title: string; brand: string; priceCents: number; imageUrl: string }[];
  categories: { slug: string; name: string }[];
};

const PRIMARY = ["golf-clubs", "golf-balls", "golf-bags", "golf-apparel", "golf-accessories"];

export function Header({
  categories,
  cartCount,
  isLoggedIn,
  firstName,
}: {
  categories: NavCategory[];
  cartCount: number;
  isLoggedIn: boolean;
  firstName: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const { open: openCart } = useCartDrawer();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
    setResults(null);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen]);

  useEffect(() => {
    if (!term.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        setResults(await res.json());
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navItems = categories.filter((c) => PRIMARY.includes(c.slug));

  return (
    <>
      <div className="hidden bg-forest text-white md:block">
        <div className="wrap flex h-9 items-center justify-between text-[0.7rem] tracking-[0.14em] uppercase">
          <p>Free U.S. shipping over $100 · 30-day returns</p>
          <div className="flex items-center gap-6">
            <Link href="/track-order" className="hover:text-sand">
              Track Order
            </Link>
            <Link href="/contact" className="hover:text-sand">
              Contact
            </Link>
            <span className="text-white/60">Call (407) 555-0100</span>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled ? "border-line bg-white/95 shadow-[0_1px_20px_rgba(16,19,17,0.06)] backdrop-blur" : "border-transparent bg-white"
        }`}
      >
        <div className="wrap flex h-16 items-center gap-4 md:h-20">
          <button
            className="grid size-9 place-items-center lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <span className="space-y-[5px]">
              <span className="block h-[1.5px] w-5 bg-ink" />
              <span className="block h-[1.5px] w-5 bg-ink" />
              <span className="block h-[1.5px] w-3.5 bg-ink" />
            </span>
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-sm bg-forest text-[0.8rem] font-semibold text-white">
              SJ
            </span>
            <span className="leading-none">
              <span className="block text-[0.95rem] font-normal uppercase tracking-[0.24em]">SJ Golf</span>
              <span className="mt-0.5 block text-[0.58rem] uppercase tracking-[0.42em] text-moss">Store</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-7 lg:flex">
            <div className="group relative">
              <Link href="/shop" className="flex items-center gap-1 py-2 text-[0.8rem] font-medium uppercase tracking-[0.12em]">
                Shop
              </Link>
              <div className="invisible absolute left-0 top-full w-[34rem] translate-y-2 border border-line bg-white p-6 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/${c.slug}`} className="group/item">
                      <p className="text-sm font-semibold group-hover/item:text-forest">{c.name}</p>
                      <p className="text-xs text-ink-soft">{c.tagline}</p>
                    </Link>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-xs text-ink-soft">Shop the full catalogue</span>
                  <Link href="/shop" className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                    Shop All →
                  </Link>
                </div>
              </div>
            </div>
            {navItems.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="py-2 text-[0.8rem] font-medium uppercase tracking-[0.12em] transition hover:text-forest"
              >
                {c.name.replace(/^Golf /, "")}
              </Link>
            ))}
            <Link
              href="/golf-gloves"
              className="py-2 text-[0.8rem] font-medium uppercase tracking-[0.12em] transition hover:text-forest"
            >
              Gloves
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <button
              className="hidden items-center gap-2 border border-line px-3 py-2 text-sm text-ink-soft transition hover:border-ink md:flex lg:w-56"
              onClick={() => {
                setSearchOpen((s) => !s);
                setTimeout(() => searchRef.current?.focus(), 50);
              }}
            >
              <SearchIcon />
              <span className="truncate text-[0.8rem]">Search golf clubs, balls…</span>
            </button>
            <button className="grid size-9 place-items-center md:hidden" aria-label="Search" onClick={() => setSearchOpen((s) => !s)}>
              <SearchIcon />
            </button>

            {isLoggedIn ? (
              <div ref={profileRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-ink transition hover:border-forest hover:text-forest"
                  aria-expanded={profileOpen}
                  aria-label="Account menu"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-forest/10 text-[0.62rem] font-semibold text-forest">
                    {(firstName || "A").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">{firstName || "Account"}</span>
                  <ChevronDownIcon />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-[0_20px_45px_rgba(18,24,19,0.12)]">
                    <div className="border-b border-line bg-paper px-4 py-3">
                      <p className="text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">My account</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{firstName || "Account"}</p>
                    </div>

                    <div className="p-2">
                      <Link href="/account" className="flex rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-paper hover:text-ink">
                        Dashboard
                      </Link>
                      <Link href="/account/orders" className="flex rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-paper hover:text-ink">
                        Orders
                      </Link>
                      <Link href="/account/profile" className="flex rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-paper hover:text-ink">
                        Profile
                      </Link>

                      <form action={logoutAction} className="mt-2 border-t border-line pt-2">
                        <button
                          type="submit"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Log out
                          <span aria-hidden>→</span>
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/account/login"
                className="hidden items-center gap-2 px-2 py-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] transition hover:text-forest sm:flex"
              >
                <AccountIcon />
                <span className="hidden lg:inline">Account</span>
              </Link>
            )}

            <button
              onClick={() => openCart()}
              className="relative grid size-9 place-items-center transition hover:text-forest"
              aria-label="Open cart"
            >
              <CartIcon />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 top-0 grid size-4 place-items-center rounded-full bg-forest text-[0.6rem] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-line bg-white">
            <div className="wrap relative py-4">
              <form action="/search" className="flex items-center gap-3">
                <SearchIcon />
                <input
                  ref={searchRef}
                  name="q"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search golf clubs, balls, bags, brands…"
                  className="w-full border-0 py-2 text-lg outline-none placeholder:text-moss"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary px-5 py-2.5">
                  Search
                </button>
              </form>
              {results && (results.products.length || results.categories.length) ? (
                <div className="absolute inset-x-4 top-full z-50 max-h-[26rem] overflow-y-auto border border-line bg-white p-5 shadow-2xl">
                  {results.categories.length ? (
                    <div className="mb-4">
                      <p className="eyebrow mb-2">Collections</p>
                      <div className="flex flex-wrap gap-2">
                        {results.categories.map((c) => (
                          <Link key={c.slug} href={`/${c.slug}`} className="chip hover:border-forest">
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="eyebrow mb-2">Products</p>
                  <ul className="space-y-1">
                    {results.products.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/products/${p.slug}`} className="flex items-center gap-3 p-2 transition hover:bg-paper">
                          <span className="relative size-11 shrink-0 bg-paper-warm">
                            {p.imageUrl ? <Image src={p.imageUrl} alt={p.title} fill sizes="44px" className="object-cover" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{p.title}</span>
                            <span className="block text-xs text-ink-soft">{p.brand}</span>
                          </span>
                          <span className="text-sm font-semibold">${(p.priceCents / 100).toFixed(2)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="mt-3 block border-t border-line pt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-forest"
                  >
                    View all results
                  </Link>
                </div>
              ) : null}
              {!loading && term && results && !results.products.length && !results.categories.length ? (
                <p className="absolute inset-x-4 top-full border border-line bg-white p-5 text-sm text-ink-soft shadow-2xl">
                  No matches for “{term}”. Try “driver”, “tour balls” or “stand bag”.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-white lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <span className="text-sm font-bold uppercase tracking-[0.16em]">SJ Golf Store</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-xl">
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <p className="eyebrow mb-3">Shop</p>
            <ul className="divide-y divide-line border-y border-line">
              <li>
                <Link href="/shop" className="flex items-center justify-between py-3.5 text-lg font-semibold">
                  Shop All <span className="text-moss">→</span>
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}`} className="flex items-center justify-between py-3.5">
                    <span className="text-lg font-medium">{c.name}</span>
                    <span className="text-xs text-moss">{c.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mb-3 mt-8">Help</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/track-order">Track Order</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href={isLoggedIn ? "/account" : "/account/login"}>{isLoggedIn ? "My Account" : "Sign In / Register"}</Link></li>
              <li><Link href="/cart">Cart</Link></li>
            </ul>
          </div>
          <div className="border-t border-line px-5 py-4 text-xs text-ink-soft">
            Free U.S. shipping over $100 · 30-day returns
          </div>
        </div>
      ) : null}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.1-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9.2 8V6.6a2.8 2.8 0 0 1 5.6 0V8" />
    </svg>
  );
}
function ChevronDownIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="m6 9 6 6 6-6" /></svg>;
}
function CloseIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
