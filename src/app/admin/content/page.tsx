import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentBlocks, pages } from "@/db/schema";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { Field, PageHeader, Panel } from "@/components/admin/ui";
import { saveContentAction, savePageAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  const [blocks, pageRows] = await Promise.all([
    db.select().from(contentBlocks).where(eqSection("home")),
    db.select().from(pages).orderBy(asc(pages.slug)),
  ]);

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Homepage sections and store pages — no developer required"
        breadcrumb={[{ href: "/admin/dashboard", label: "Admin" }, { label: "Content" }]}
      />

      <div className="space-y-6">
        {blocks.map((block) => (
          <Panel key={block.id} title={`Homepage · ${block.key}`}>
            <form action={saveContentAction} className="grid gap-4">
              <input type="hidden" name="key" value={block.key} />
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Eyebrow">
                  <input name="eyebrow" defaultValue={block.eyebrow} className="field" />
                </Field>
                <Field label="Title">
                  <input name="title" defaultValue={block.title} className="field" />
                </Field>
              </div>
              <Field label="Subtitle">
                <input name="subtitle" defaultValue={block.subtitle} className="field" />
              </Field>
              <Field label="Body">
                <textarea name="body" defaultValue={block.body} rows={3} className="field" />
              </Field>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Field label="Homepage image" hint="Upload or remove the image preview.">
                    <MediaUploadField name="imageUrl" initialUrls={block.imageUrl ? [block.imageUrl] : []} folder="/content" buttonLabel="Upload homepage image" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CTA label">
                    <input name="ctaLabel" defaultValue={block.ctaLabel} className="field" />
                  </Field>
                  <Field label="CTA link">
                    <input name="ctaHref" defaultValue={block.ctaHref} className="field" />
                  </Field>
                </div>
              </div>
              {block.key === "hero" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Secondary CTA label">
                    <input name="secondaryLabel" defaultValue={block.data.secondaryLabel ?? ""} className="field" />
                  </Field>
                  <Field label="Secondary CTA link">
                    <input name="secondaryHref" defaultValue={block.data.secondaryHref ?? ""} className="field" />
                  </Field>
                </div>
              ) : null}
              {block.key === "value_prop" ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="grid gap-3">
                      <Field label={`Item ${n} title`}>
                        <input name={`item${n}Title`} defaultValue={block.data[`item${n}Title`] ?? ""} className="field" />
                      </Field>
                      <Field label={`Item ${n} body`}>
                        <textarea name={`item${n}Body`} defaultValue={block.data[`item${n}Body`] ?? ""} rows={2} className="field" />
                      </Field>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" name="isPublished" defaultChecked={block.isPublished} className="size-4 accent-[#14392c]" /> Published
                </label>
                <button className="btn btn-dark">Save draft</button>
                <button className="btn btn-primary">Publish</button>
              </div>
            </form>
          </Panel>
        ))}
      </div>

      <div className="mt-8">
        <Panel title="Store pages">
          <div className="grid gap-4 lg:grid-cols-2">
            {pageRows.map((page) => (
              <form key={page.id} action={savePageAction} className="grid gap-3 rounded-sm border border-[#eef1ee] p-4">
                <input type="hidden" name="id" value={page.id} />
                <Field label={`/${page.slug}`}>
                  <input name="title" defaultValue={page.title} className="field" />
                </Field>
                <Field label="Body">
                  <textarea name="body" defaultValue={page.body} rows={6} className="field text-xs" />
                </Field>
                <Field label="SEO title">
                  <input name="seoTitle" defaultValue={page.seoTitle} className="field" />
                </Field>
                <Field label="Meta description">
                  <textarea name="seoDescription" defaultValue={page.seoDescription} rows={2} className="field text-xs" />
                </Field>
                <button className="btn btn-dark">Save page</button>
              </form>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function eqSection(section: string) {
  return sqlEq(section);
}

function sqlEq(section: string) {
  // small helper to avoid importing eq in multiple places
  const { eq } = require("drizzle-orm") as typeof import("drizzle-orm");
  return eq(contentBlocks.section, section);
}
