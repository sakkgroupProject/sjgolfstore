import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingRates, shippingZones } from "@/db/schema";
import { centsToInput } from "@/lib/format";
import { Badge, Field, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { deleteShippingRateAction, saveShippingRateAction, saveZoneAction, toggleShippingRateAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminShipping() {
  const zones = await db.select().from(shippingZones).orderBy(asc(shippingZones.id));
  const rates = await db.select().from(shippingRates).orderBy(asc(shippingRates.priceCents));

  return (
    <div>
      <PageHeader title="Shipping" subtitle="Zones, rates, weight and price-based rules" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Zones" value={String(zones.length)} accent />
        <StatCard label="Rates" value={String(rates.length)} />
        <StatCard label="Free shipping over" value={`$${centsToInput(10000)}`} />
        <StatCard label="Origin" value="Orlando, FL" hint="United States" />
      </div>

      <div className="mt-6 space-y-6">
        {zones.map((zone) => {
          const zoneRates = rates.filter((r) => r.zoneId === zone.id);
          return (
            <Panel key={zone.id} title={zone.name} action={<span className="text-xs text-ink-soft">{zone.countries.join(", ")}</span>}>
              <Table head={["Rate name", "Type", "Price", "Free over", "Transit", "Status", "Actions"]}>
                {zoneRates.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{r.name}</span>
                      <span className="block text-xs text-ink-soft">{r.description}</span>
                    </td>
                    <td className="py-3 pr-4 capitalize">{r.type}</td>
                    <td className="py-3 pr-4 font-semibold">{r.priceCents ? `$${centsToInput(r.priceCents)}` : "Free"}</td>
                    <td className="py-3 pr-4">{r.freeOverCents ? `$${centsToInput(r.freeOverCents)}` : "—"}</td>
                    <td className="py-3 pr-4 text-xs text-ink-soft">{r.transitDays}</td>
                    <td className="py-3 pr-4"><Badge>{r.isActive ? "active" : "disabled"}</Badge></td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        <form action={toggleShippingRateAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="next" value={r.isActive ? "0" : "1"} />
                          <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">{r.isActive ? "Disable" : "Enable"}</button>
                        </form>
                        <form action={deleteShippingRateAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem] text-red-600">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {!zoneRates.length ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-sm text-ink-soft">No rates in this zone yet.</td>
                  </tr>
                ) : null}
              </Table>
            </Panel>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Add shipping rate">
          <form action={saveShippingRateAction} className="grid gap-4">
            <Field label="Zone">
              <select name="zoneId" className="field">
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Rate name">
              <input name="name" required className="field" placeholder="Standard Shipping" />
            </Field>
            <Field label="Description">
              <input name="description" className="field" placeholder="Ground, 3-7 business days" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select name="type" className="field">
                  <option value="flat">Flat rate</option>
                  <option value="weight">Weight based</option>
                  <option value="price">Price based</option>
                </select>
              </Field>
              <Field label="Price ($)">
                <input name="price" className="field" inputMode="decimal" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Free over ($)">
                <input name="freeOver" className="field" inputMode="decimal" />
              </Field>
              <Field label="Transit time">
                <input name="transitDays" className="field" defaultValue="3-7 business days" />
              </Field>
            </div>
            <button className="btn btn-dark">Add rate</button>
          </form>
        </Panel>

        <Panel title="Add shipping zone">
          <form action={saveZoneAction} className="grid gap-4">
            <Field label="Zone name">
              <input name="name" required className="field" placeholder="Europe" />
            </Field>
            <Field label="Countries" hint="Comma separated country names">
              <input name="countries" className="field" placeholder="Germany, France, Spain" />
            </Field>
            <button className="btn btn-dark">Add zone</button>
          </form>
          <div className="mt-6 border-t border-[#eef1ee] pt-4 text-xs leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">Carrier &amp; international support</p>
            <p className="mt-1">
              Carrier-calculated rates, customs documentation and local delivery/pickup options are configured per zone.
              International orders display duties as collected at checkout.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
