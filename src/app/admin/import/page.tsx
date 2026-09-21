import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const SAMPLE = `title,sku,price,compare_at,collection,vendor,tags,hand,flex,stock,image_url
SJ Tour Apex Driver,SJ-1000,499.00,599.00,golf-clubs,SJ Golf,"golf-clubs,drivers",Right|Left,Regular|Stiff|X-Stiff,12,https://…
SJ Tour U Golf Balls,SJ-1013,44.99,49.99,golf-balls,SJ Golf,"golf-balls,tour",,1 Dozen|3 Dozen,80,https://…`;

export default function AdminImport() {
  return (
    <div>
      <PageHeader
        title="Import &amp; export"
        subtitle="Bulk manage the catalogue with CSV — the same column set as the product editor"
        actions={
          <>
            <Link href="/api/admin/export?type=products" className="btn btn-light px-4 py-2.5">Export products</Link>
            <Link href="/api/admin/export?type=orders" className="btn btn-light px-4 py-2.5">Export orders</Link>
            <Link href="/api/admin/export?type=inventory" className="btn btn-light px-4 py-2.5">Export inventory</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Product import">
          <form className="grid gap-4" action="/api/admin/import" method="post" encType="multipart/form-data">
            <label className="block cursor-pointer rounded-sm border border-dashed border-[#c9cec9] bg-[#fafbfa] px-6 py-10 text-center">
              <input name="file" type="file" accept=".csv" className="mx-auto block text-sm" />
              <span className="mt-3 block text-xs text-ink-soft">CSV up to 10 MB. Rows are validated before import.</span>
            </label>
            <button className="btn btn-dark">Preview &amp; validate</button>
          </form>

          <div className="mt-6 border-t border-[#eef1ee] pt-4 text-sm">
            <p className="font-semibold">Validation performed on every row</p>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
              {[
                "Missing required fields (title, price, collection)",
                "Duplicate SKU inside the file or in the catalogue",
                "Invalid price or compare-at price",
                "Invalid image URL",
                "Invalid variant combination",
                "Unknown collection handle",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-forest" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-soft">
              After import you receive a summary: rows processed, imported, updated and failed, plus a downloadable error
              report.
            </p>
          </div>
        </Panel>

        <Panel title="Expected CSV format">
          <pre className="overflow-x-auto rounded-sm bg-[#f6f7f6] p-4 text-[0.7rem] leading-relaxed">{SAMPLE}</pre>
          <div className="mt-4 space-y-2 text-xs text-ink-soft">
            <p>
              <strong className="text-ink">Variants</strong> — pipe-separated values inside a cell create every combination.
              Each generated variant gets its own SKU suffix and stock level.
            </p>
            <p>
              <strong className="text-ink">Collections</strong> — must use the exact handle (for example
              <code className="mx-1 bg-[#f0f2f0] px-1">golf-clubs</code>). Unknown handles are reported as row errors.
            </p>
            <p>
              <strong className="text-ink">Tags</strong> — comma separated. Collection automation matches tags exactly.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
