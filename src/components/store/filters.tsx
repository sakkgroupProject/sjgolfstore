"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/sort-options";

export type Facets = {
  brands: string[];
  tags: string[];
  hands: string[];
  flexes: string[];
  sizes: string[];
  maxPrice: number;
};

const MULTI_KEYS: { key: string; label: string; options: (f: Facets) => string[] }[] = [
  { key: "brand", label: "Brand", options: (f) => f.brands },
  { key: "hand", label: "Hand", options: (f) => f.hands },
  { key: "flex", label: "Flex", options: (f) => f.flexes },
  { key: "size", label: "Size", options: (f) => f.sizes },
  { key: "tag", label: "Product type", options: (f) => f.tags },
];

export function Filters({ facets, basePath }: { facets: Facets; basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = useMemo(() => new URLSearchParams(params.toString()), [params]);
  const activeCount = MULTI_KEYS.reduce((n, { key }) => n + (current.getAll(key).length ? 1 : 0), 0) + (current.get("stock") || current.get("priceMax") ? 1 : 0);

  const apply = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  };

  const toggleMulti = (key: string, value: string) => {
    const next = new URLSearchParams(current.toString());
    const values = next.getAll(key);
    next.delete(key);
    const updated = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
    updated.forEach((v) => next.append(key, v));
    apply(next);
    setOpen(false);
  };

  const toggleSingle = (key: string, value: string) => {
    const next = new URLSearchParams(current.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    apply(next);
    setOpen(false);
  };

  const setRange = (min: string, max: string) => {
    const next = new URLSearchParams(current.toString());
    if (min) next.set("priceMin", min);
    else next.delete("priceMin");
    if (max) next.set("priceMax", max);
    else next.delete("priceMax");
    apply(next);
    setOpen(false);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const sort = current.get("sort");
    if (sort) next.set("sort", sort);
    apply(next);
    setOpen(false);
  };

  const priceMin = current.get("priceMin") ?? "";
  const priceMax = current.get("priceMax") ?? "";

  const body = (
    <div className={`space-y-8 ${pending ? "opacity-60" : ""}`}>
      <Section title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="$ Min"
            defaultValue={priceMin}
            onKeyDown={(e) => {
              if (e.key === "Enter") setRange(e.currentTarget.value, priceMax);
            }}
            onBlur={(e) => setRange(e.currentTarget.value, priceMax)}
            className="field py-2 text-sm"
          />
          <span className="text-moss">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={`$ Max`}
            defaultValue={priceMax}
            onKeyDown={(e) => {
              if (e.key === "Enter") setRange(priceMin, e.currentTarget.value);
            }}
            onBlur={(e) => setRange(priceMin, e.currentTarget.value)}
            className="field py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[["0", "100"], ["100", "300"], ["300", "600"], ["600", String(facets.maxPrice)]].map(([lo, hi]) => (
            <button
              key={lo}
              onClick={() => setRange(lo, hi)}
              className={`chip ${current.get("priceMin") === lo ? "border-forest bg-paper" : "hover:border-ink"}`}
            >
              ${lo}–${hi}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Availability">
        <Check
          label="In stock only"
          checked={current.get("stock") === "1"}
          onChange={() => toggleSingle("stock", "1")}
        />
        <Check label="On sale" checked={current.get("sale") === "1"} onChange={() => toggleSingle("sale", "1")} />
      </Section>

      {MULTI_KEYS.filter((group) => group.options(facets).length > 0).map((group) => (
        <Section key={group.key} title={group.label}>
          <div className="space-y-2">
            {group.options(facets).map((value) => (
              <Check
                key={value}
                label={value}
                checked={current.getAll(group.key).includes(value)}
                onChange={() => toggleMulti(group.key, value)}
              />
            ))}
          </div>
        </Section>
      ))}

      <button onClick={clearAll} className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hidden lg:block">{body}</aside>

      {/* mobile triggers */}
      <div className="flex gap-2 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn btn-outline flex-1 py-3">
          Filter {activeCount ? `(${activeCount})` : ""}
        </button>
        <SortMenu basePath={basePath} query={current.toString()} />
      </div>

      {open ? (
        <div className="fixed inset-0 z-[75] flex lg:hidden">
          <button aria-label="Close filters" className="absolute inset-0 animate-fade-in bg-ink/45" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-sm animate-slide-in flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold">Filter</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center text-ink-soft transition hover:text-ink"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{body}</div>
            <div className="border-t border-line p-4">
              <button onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CloseIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export function SortMenu({ basePath, query }: { basePath: string; query: string }) {
  const router = useRouter();
  const current = new URLSearchParams(query);
  const sortValue = current.get("sort") ?? "featured";
  return (
    <select
      value={sortValue}
      onChange={(e) => {
        const next = new URLSearchParams(current.toString());
        next.set("sort", e.target.value);
        next.delete("page");
        const qs = next.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      }}
      className="field w-full py-3 text-sm uppercase tracking-[0.1em] lg:w-56"
      aria-label="Sort by"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          Sort: {o.label}
        </option>
      ))}
    </select>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-7">
      <h3 className="label mb-3.5">{title}</h3>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft transition hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-[#14392c]" />
      {label}
    </label>
  );
}

/** Desktop sort bar used above the grid. */
export function SortBar({ children }: { children: React.ReactNode }) {
  return <div className="hidden items-center justify-between gap-4 lg:flex">{children}</div>;
}

export function FilterStateSync() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    router.prefetch(window.location.pathname + window.location.search);
  }, [params, router]);
  return null;
}
