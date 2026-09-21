"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveProductAction } from "@/app/actions/admin";
import { MediaUploadField } from "./media-upload-field";
import { Field } from "./ui";

type Category = { id: number; name: string };
type VariantRow = { title: string; sku: string; price: string; stock: number };

export type ProductFormValues = {
  id?: number;
  title: string;
  slug: string;
  brand: string;
  shortDescription: string;
  description: string;
  categoryId: number;
  productType: string;
  price: string;
  compareAt: string;
  cost: string;
  sku: string;
  barcode: string;
  tags: string;
  images: string;
  videoUrl: string;
  specs: string;
  gender: string;
  clubType: string;
  shaft: string;
  loft: string;
  weightGrams: number;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  options: { name: string; values: string }[];
  variants: VariantRow[];
};

function combosOf(options: { name: string; values: string }[]): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (acc, opt) =>
      acc.flatMap((prev) =>
        opt.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .map((value) => ({ ...prev, [opt.name]: value })),
      ),
    [{}],
  );
}

export function ProductForm({ categories, values }: { categories: Category[]; values: ProductFormValues }) {
  const [options, setOptions] = useState(values.options.length ? values.options : []);
  const [variantEdits, setVariantEdits] = useState<Record<number, { sku?: string; price?: string; stock?: string }>>({});

  const combos = useMemo(() => combosOf(options), [options]);

  return (
    <form action={saveProductAction} className="space-y-6">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Basic information</h2>
            <div className="grid gap-4">
              <Field label="Product title">
                <input name="title" defaultValue={values.title} required className="field" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="URL handle" hint="Leave blank to auto-generate">
                  <input name="slug" defaultValue={values.slug} className="field" />
                </Field>
                <Field label="Vendor / brand">
                  <input name="brand" defaultValue={values.brand} className="field" />
                </Field>
              </div>
              <Field label="Short description" hint="Shown on product cards and meta descriptions">
                <textarea name="shortDescription" defaultValue={values.shortDescription} rows={2} className="field" />
              </Field>
              <Field label="Full description">
                <textarea name="description" defaultValue={values.description} rows={6} className="field" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Category">
                  <select name="categoryId" defaultValue={String(values.categoryId)} className="field">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Product type">
                  <input name="productType" defaultValue={values.productType} className="field" placeholder="Drivers" />
                </Field>
                <Field label="Tags" hint="Comma separated">
                  <input name="tags" defaultValue={values.tags} className="field" placeholder="golf-clubs, drivers" />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Media</h2>
            <Field label="Product images" hint="Upload images and remove any you do not want.">
              <MediaUploadField name="images" initialUrls={(values.images || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean)} multiple folder="/products" buttonLabel="Upload product images" />
            </Field>
            <div className="mt-4">
              <Field label="Video URL (optional)">
                <input name="videoUrl" defaultValue={values.videoUrl} className="field" placeholder="https://…/swing.mp4" />
              </Field>
            </div>
          </section>

          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (USD)">
                <input name="price" defaultValue={values.price} required className="field" inputMode="decimal" />
              </Field>
              <Field label="Compare-at price">
                <input name="compareAt" defaultValue={values.compareAt} className="field" inputMode="decimal" />
              </Field>
              <Field label="Cost per item">
                <input name="cost" defaultValue={values.cost} className="field" inputMode="decimal" />
              </Field>
            </div>
          </section>

          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Options &amp; variants</h2>
              <button
                type="button"
                onClick={() => setOptions((o) => [...o, { name: "", values: "" }])}
                className="btn btn-light px-3 py-1.5 text-[0.65rem]"
              >
                + Add option
              </button>
            </div>

            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1.6fr_auto]">
                  <input
                    name="optionName"
                    defaultValue={opt.name}
                    onChange={(e) => setOptions((o) => o.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Option name (Hand)"
                    className="field"
                  />
                  <input
                    name="optionValues"
                    defaultValue={opt.values}
                    onChange={(e) => setOptions((o) => o.map((x, xi) => (xi === i ? { ...x, values: e.target.value } : x)))}
                    placeholder="Comma separated values (Right, Left)"
                    className="field"
                  />
                  <button
                    type="button"
                    onClick={() => setOptions((o) => o.filter((_, xi) => xi !== i))}
                    className="btn btn-light px-3 py-2 text-[0.65rem]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!options.length ? (
                <p className="text-sm text-ink-soft">
                  No options yet. Add Hand, Flex or Size to generate configurable variants.
                </p>
              ) : null}
            </div>

            {combos.length > 1 || (combos[0] && Object.keys(combos[0]).length) ? (
              <div className="mt-5 overflow-x-auto border-t border-[#eef1ee] pt-4">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="text-left text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">
                      <th className="py-2 pr-3">Variant</th>
                      <th className="py-2 pr-3">SKU</th>
                      <th className="py-2 pr-3">Price</th>
                      <th className="py-2 pr-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f3f1]">
                    {combos.map((combo, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-3 font-medium">{Object.values(combo).join(" / ") || "Default"}</td>
                        <td className="py-2 pr-3">
                          <input
                            name="variantSku"
                            defaultValue={variantEdits[i]?.sku ?? values.variants[i]?.sku ?? (values.sku ? `${values.sku}-${i + 1}` : "")}
                            onChange={(e) => setVariantEdits((v) => ({ ...v, [i]: { ...v[i], sku: e.target.value } }))}
                            className="field py-1.5 text-xs"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            name="variantPrice"
                            defaultValue={variantEdits[i]?.price ?? values.variants[i]?.price ?? values.price}
                            onChange={(e) => setVariantEdits((v) => ({ ...v, [i]: { ...v[i], price: e.target.value } }))}
                            className="field py-1.5 text-xs"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            name="variantStock"
                            defaultValue={variantEdits[i]?.stock ?? String(values.variants[i]?.stock ?? 10)}
                            onChange={(e) => setVariantEdits((v) => ({ ...v, [i]: { ...v[i], stock: e.target.value } }))}
                            className="field w-20 py-1.5 text-xs"
                            inputMode="numeric"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Search engine listing</h2>
            <div className="grid gap-4">
              <Field label="SEO title">
                <input name="seoTitle" defaultValue={values.seoTitle} className="field" />
              </Field>
              <Field label="Meta description">
                <textarea name="seoDescription" defaultValue={values.seoDescription} rows={2} className="field" />
              </Field>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Publishing</h2>
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="size-4 accent-[#14392c]" /> Active (visible in store)
            </label>
            <label className="mt-3 flex items-center gap-2.5 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="size-4 accent-[#14392c]" /> Featured on homepage
            </label>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn btn-dark flex-1">Save product</button>
              <Link href="/admin/products" className="btn btn-light">Cancel</Link>
            </div>
          </section>

          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Inventory &amp; shipping</h2>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SKU">
                  <div className="field flex items-center justify-between bg-paper text-ink-soft">
                    <span>{values.sku || "Generated when saved"}</span>
                    {!values.sku ? <span className="text-[0.65rem] uppercase tracking-[0.1em] text-forest">Automatic</span> : null}
                  </div>
                </Field>
                <Field label="Barcode">
                  <div className="field flex items-center justify-between bg-paper text-ink-soft">
                    <span>{values.barcode || "Generated when saved"}</span>
                    {!values.barcode ? <span className="text-[0.65rem] uppercase tracking-[0.1em] text-forest">Automatic</span> : null}
                  </div>
                </Field>
              </div>
              <Field label="Weight (grams)">
                <input name="weightGrams" defaultValue={values.weightGrams} className="field" inputMode="numeric" />
              </Field>
            </div>
          </section>

          <section className="rounded-sm border border-[#e2e6e2] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Golf attributes</h2>
            <div className="grid gap-4">
              <Field label="Gender">
                <select name="gender" defaultValue={values.gender} className="field">
                  {["Unisex", "Men", "Women", "Junior"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field label="Club type">
                <input name="clubType" defaultValue={values.clubType} className="field" placeholder="Driver, Iron, Putter" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Shaft">
                  <input name="shaft" defaultValue={values.shaft} className="field" />
                </Field>
                <Field label="Loft">
                  <input name="loft" defaultValue={values.loft} className="field" />
                </Field>
              </div>
              <Field label="Specifications" hint="One per line, format: Label | Value">
                <textarea name="specs" defaultValue={values.specs} rows={5} className="field font-mono text-xs" />
              </Field>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
