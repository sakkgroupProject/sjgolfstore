import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, pages, products, settings } from "@/db/schema";
import { Field, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { saveSettingsAction, savePageAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSeo() {
  const [seoSettings, productRows, categoryRows, pageRows] = await Promise.all([
    db.select().from(settings).where(eq(settings.group, "seo")),
    db.select({ id: products.id, title: products.title, seoTitle: products.seoTitle, seoDescription: products.seoDescription, slug: products.slug }).from(products).limit(60),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(pages).orderBy(asc(pages.slug)),
  ]);

  const missingDescription = productRows.filter((p) => !p.seoDescription).length;

  return (
    <div>
      <PageHeader title="SEO" subtitle="Global metadata, sitemap and per-entity optimisation" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Default title" value={seoSettings.find((s) => s.key === "seo_default_title")?.value.slice(0, 18) ?? "—"} accent />
        <StatCard label="Robots" value={seoSettings.find((s) => s.key === "seo_robots")?.value ?? "index, follow"} />
        <StatCard label="Products indexed" value={String(productRows.length)} />
        <StatCard label="Missing descriptions" value={String(missingDescription)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Global metadata">
          <form action={saveSettingsAction} className="grid gap-4">
            <Field label="Homepage title">
              <input name="setting__seo_default_title" defaultValue={seoSettings.find((s) => s.key === "seo_default_title")?.value ?? ""} className="field" />
            </Field>
            <Field label="Default meta description">
              <textarea name="setting__seo_default_description" defaultValue={seoSettings.find((s) => s.key === "seo_default_description")?.value ?? ""} rows={3} className="field" />
            </Field>
            <Field label="Robots directive">
              <input name="setting__seo_robots" defaultValue={seoSettings.find((s) => s.key === "seo_robots")?.value ?? "index, follow"} className="field" />
            </Field>
            <button className="btn btn-dark">Save SEO defaults</button>
          </form>
          <ul className="mt-5 space-y-1.5 border-t border-[#eef1ee] pt-4 text-xs text-ink-soft">
            <li>✓ Canonical URLs on every product and collection</li>
            <li>✓ robots.txt with admin, account and checkout disallowed</li>
            <li>✓ Dynamic sitemap.xml at /sitemap.xml</li>
            <li>✓ Open Graph and Twitter card metadata</li>
            <li>✓ Product, breadcrumb and organization structured data</li>
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Collection metadata">
            <Table head={["Collection", "Handle", "SEO title", "Meta description"]}>
              {categoryRows.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">/{c.slug}</td>
                  <td className="py-2.5 pr-4 text-xs">{c.seoTitle || c.name}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{(c.seoDescription || "").slice(0, 70)}…</td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Page metadata">
            <div className="grid gap-4 sm:grid-cols-2">
              {pageRows.map((p) => (
                <form key={p.id} action={savePageAction} className="grid gap-3 rounded-sm border border-[#eef1ee] p-3">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="title" value={p.title} />
                  <input type="hidden" name="body" value={p.body} />
                  <Field label={`/${p.slug}`}>
                    <input name="seoTitle" defaultValue={p.seoTitle} className="field text-xs" />
                  </Field>
                  <textarea name="seoDescription" defaultValue={p.seoDescription} rows={2} className="field text-xs" />
                  <button className="btn btn-light text-[0.65rem]">Save</button>
                </form>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function eqGroup(group: string) {
  const { eq } = require("drizzle-orm") as typeof import("drizzle-orm");
  return eq(settings.group, group);
}
