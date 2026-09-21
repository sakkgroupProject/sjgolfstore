import { asc, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, settings, taxRegions } from "@/db/schema";
import { formatMoney } from "@/lib/format";
import { Badge, Field, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { saveSettingsAction, saveTaxRegionAction, toggleTaxRegionAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminTax() {
  const [regions, taxConfig, byState] = await Promise.all([
    db.select().from(taxRegions).orderBy(asc(taxRegions.region)),
    db.select().from(settings).where(eqGroup("tax")),
    db
      .select({
        state: orders.state,
        collected: sql<number>`sum(${orders.taxCents})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.state)
      .orderBy(desc(sql`sum(${orders.taxCents})`))
      .limit(10),
  ]);

  const totalCollected = byState.reduce((s, r) => s + Number(r.collected), 0);
  const provider = taxConfig.find((c) => c.key === "tax_provider")?.value ?? "SJ Tax Service";

  return (
    <div>
      <PageHeader title="Taxes" subtitle="Tax regions, nexus states and provider configuration" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Provider" value={provider} accent />
        <StatCard label="Active regions" value={String(regions.filter((r) => r.isActive).length)} />
        <StatCard label="Tax collected" value={formatMoney(totalCollected)} />
        <StatCard label="Nexus states" value={taxConfig.find((c) => c.key === "tax_nexus_states")?.value ?? "—"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Tax regions">
          <Table head={["Region", "Label", "Rate", "Status", "Actions"]}>
            {regions.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4 font-semibold">{r.region}</td>
                <td className="py-3 pr-4">{r.label}</td>
                <td className="py-3 pr-4">{(r.rateBps / 100).toFixed(2)}%</td>
                <td className="py-3 pr-4"><Badge>{r.isActive ? "active" : "disabled"}</Badge></td>
                <td className="py-3">
                  <form action={toggleTaxRegionAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="next" value={r.isActive ? "0" : "1"} />
                    <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">{r.isActive ? "Disable" : "Enable"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>

          <form action={saveTaxRegionAction} className="mt-6 grid gap-4 border-t border-[#eef1ee] pt-5 sm:grid-cols-3">
            <Field label="State code">
              <input name="region" className="field" placeholder="TX" maxLength={2} required />
            </Field>
            <Field label="Label">
              <input name="label" className="field" placeholder="Texas" />
            </Field>
            <Field label="Rate (%)">
              <input name="rate" className="field" inputMode="decimal" placeholder="8.25" required />
            </Field>
            <button className="btn btn-dark sm:col-span-3">Add tax region</button>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="Configuration">
            <form action={saveSettingsAction} className="grid gap-4">
              {[
                { key: "tax_provider", label: "Tax provider" },
                { key: "tax_nexus_states", label: "Nexus states" },
              ].map((f) => (
                <Field key={f.key} label={f.label}>
                  <input name={`setting__${f.key}`} defaultValue={taxConfig.find((c) => c.key === f.key)?.value ?? ""} className="field" />
                </Field>
              ))}
              <button className="btn btn-dark">Save configuration</button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              Rates are never hard-coded in the storefront. Checkout calls the tax service with the destination address and
              applies the returned jurisdictional rate.
            </p>
          </Panel>

          <Panel title="Tax collected by state">
            <ul className="space-y-2.5 text-sm">
              {byState.map((s) => (
                <li key={s.state} className="flex items-center justify-between border-b border-[#f1f3f1] pb-2 last:border-0">
                  <span>{s.state || "—"}</span>
                  <span className="font-semibold">{formatMoney(Number(s.collected))}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function eqGroup(group: string) {
  return sql`${settings.group} = ${group}`;
}
