import { desc } from "drizzle-orm";
import { db } from "@/db";
import { discounts } from "@/db/schema";
import { centsToInput, formatDate } from "@/lib/format";
import { Badge, Field, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { deleteDiscountAction, saveDiscountAction, toggleDiscountAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const TYPES = [
  { value: "percentage", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "free_shipping", label: "Free shipping" },
  { value: "bxgy", label: "Buy X get Y" },
];

export default async function AdminDiscounts() {
  const rows = await db.select().from(discounts).orderBy(desc(discounts.id));
  const active = rows.filter((r) => r.status === "active").length;
  const redemptions = rows.reduce((s, r) => s + r.usageCount, 0);

  return (
    <div>
      <PageHeader title="Discounts" subtitle="Coupon codes and automatic promotions" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active discounts" value={String(active)} accent />
        <StatCard label="Total discounts" value={String(rows.length)} />
        <StatCard label="Redemptions" value={String(redemptions)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="All discounts">
          <Table head={["Code", "Type", "Value", "Conditions", "Used", "Status", "Actions"]}>
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="py-3 pr-4">
                  <span className="font-semibold">{d.code}</span>
                  <span className="block text-xs text-ink-soft">{d.description}</span>
                </td>
                <td className="py-3 pr-4 capitalize">{d.type.replace(/_/g, " ")}</td>
                <td className="py-3 pr-4">
                  {d.type === "percentage" ? `${d.value}%` : d.type === "fixed" ? `$${centsToInput(d.value)}` : "—"}
                </td>
                <td className="py-3 pr-4 text-xs text-ink-soft">
                  {d.minSubtotalCents ? `Min $${centsToInput(d.minSubtotalCents)}` : "No minimum"}
                  {d.usageLimit ? ` · Limit ${d.usageLimit}` : ""}
                  {d.endsAt ? ` · Ends ${formatDate(d.endsAt)}` : ""}
                </td>
                <td className="py-3 pr-4">{d.usageCount}</td>
                <td className="py-3 pr-4"><Badge>{d.status}</Badge></td>
                <td className="py-3">
                  <div className="flex gap-1.5">
                    <form action={toggleDiscountAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="next" value={d.status === "active" ? "disabled" : "active"} />
                      <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">{d.status === "active" ? "Disable" : "Enable"}</button>
                    </form>
                    <form action={deleteDiscountAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem] text-red-600">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Create discount">
          <form action={saveDiscountAction} className="grid gap-4">
            <Field label="Code">
              <input name="code" required className="field uppercase" placeholder="SUMMER25" />
            </Field>
            <Field label="Description">
              <input name="description" className="field" placeholder="25% off sitewide" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select name="type" className="field">
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Value" hint="% for percentage, $ for fixed">
                <input name="value" className="field" inputMode="decimal" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Minimum order ($)">
                <input name="minSubtotal" className="field" inputMode="decimal" />
              </Field>
              <Field label="Usage limit" hint="0 = unlimited">
                <input name="usageLimit" className="field" inputMode="numeric" defaultValue="0" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Buy quantity (BXGY)">
                <input name="buyQuantity" className="field" inputMode="numeric" />
              </Field>
              <Field label="Get free (BXGY)">
                <input name="getQuantity" className="field" inputMode="numeric" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date">
                <input name="startsAt" type="date" className="field" />
              </Field>
              <Field label="End date">
                <input name="endsAt" type="date" className="field" />
              </Field>
            </div>
            <Field label="Applies to">
              <select name="appliesTo" className="field">
                <option value="all">All products</option>
                <option value="products">Specific products</option>
                <option value="collections">Specific collections</option>
              </select>
            </Field>
            <Field label="Status">
              <select name="status" className="field">
                {["active", "scheduled", "disabled"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <button className="btn btn-dark">Create discount</button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
