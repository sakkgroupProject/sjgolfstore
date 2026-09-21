import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { discounts, newsletterSubscribers, settings } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { Badge, Field, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { saveSettingsAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminMarketing() {
  const [subs, tracking, discountRows] = await Promise.all([
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.id)).limit(40),
    db.select().from(settings).where(eq(settings.group, "analytics")),
    db.select().from(discounts).orderBy(desc(discounts.id)).limit(6),
  ]);

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle="Newsletter list, campaigns and tracking integrations"
        actions={<a href="/api/admin/export?type=newsletter" className="btn btn-light px-4 py-2.5">Export subscribers</a>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Subscribers" value={String(subs.length)} accent />
        <StatCard label="Active discounts" value={String(discountRows.filter((d) => d.status === "active").length)} />
        <StatCard label="GA4" value={tracking.find((t) => t.key === "ga4_id")?.value || "Not set"} />
        <StatCard label="Meta Pixel" value={tracking.find((t) => t.key === "meta_pixel_id")?.value || "Not set"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Newsletter subscribers">
          <Table head={["Email", "Status", "Source", "Subscribed"]}>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="py-3 pr-4 font-medium">{s.email}</td>
                <td className="py-3 pr-4"><Badge>{s.status}</Badge></td>
                <td className="py-3 pr-4 text-ink-soft">{s.source}</td>
                <td className="py-3 whitespace-nowrap text-xs text-ink-soft">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-4 text-xs text-ink-soft">
            Subscribers are synced to the email marketing provider nightly. Unsubscribes are honoured immediately.
          </p>
        </Panel>

        <div className="space-y-6">
          <Panel title="Tracking integrations">
            <form action={saveSettingsAction} className="grid gap-4">
              <Field label="GA4 measurement ID">
                <input name="setting__ga4_id" defaultValue={tracking.find((t) => t.key === "ga4_id")?.value ?? ""} className="field" />
              </Field>
              <Field label="Meta Pixel ID (optional)">
                <input name="setting__meta_pixel_id" defaultValue={tracking.find((t) => t.key === "meta_pixel_id")?.value ?? ""} className="field" />
              </Field>
              <button className="btn btn-dark">Save tracking</button>
            </form>
            <div className="mt-4 border-t border-[#eef1ee] pt-4 text-xs leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">Events tracked</p>
              <p className="mt-1">
                page_view · view_item · view_item_list · search · add_to_cart · remove_from_cart · view_cart ·
                begin_checkout · add_payment_info · purchase
              </p>
            </div>
          </Panel>

          <Panel title="Campaign discounts">
            <ul className="space-y-2.5 text-sm">
              {discountRows.map((d) => (
                <li key={d.id} className="flex items-center justify-between border-b border-[#f1f3f1] pb-2 last:border-0">
                  <span>
                    <span className="block font-semibold">{d.code}</span>
                    <span className="text-xs text-ink-soft">{d.description}</span>
                  </span>
                  <Badge>{d.status}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function sqlGroup(group: string) {
  const { eq } = require("drizzle-orm") as typeof import("drizzle-orm");
  return eq(settings.group, group);
}
