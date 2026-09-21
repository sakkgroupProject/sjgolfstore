import { asc } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { Field, PageHeader, Panel } from "@/components/admin/ui";
import { saveSettingsAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const GROUPS: { key: string; title: string; description: string }[] = [
  { key: "store", title: "Store", description: "Name, contact details, currency and units" },
  { key: "checkout", title: "Checkout", description: "Guest checkout and customer account behaviour" },
  { key: "payments", title: "Payments", description: "Gateway, mode and capture settings" },
  { key: "shipping", title: "Shipping", description: "Origin address and free shipping threshold" },
  { key: "tax", title: "Taxes", description: "Provider and nexus configuration" },
  { key: "email", title: "Email", description: "Transactional email sender identity" },
  { key: "analytics", title: "Analytics", description: "GA4 and Meta Pixel identifiers" },
  { key: "security", title: "Security", description: "Password policy and 2FA enforcement" },
];

export default async function AdminSettings() {
  const rows = await db.select().from(settings).orderBy(asc(settings.group), asc(settings.id));

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store configuration — changes apply immediately across the storefront" />

      <form action={saveSettingsAction} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {GROUPS.map((group) => {
            const groupRows = rows.filter((r) => r.group === group.key);
            return (
              <Panel key={group.key} title={group.title}>
                <p className="mb-4 text-xs text-ink-soft">{group.description}</p>
                <div className="grid gap-4">
                  {groupRows.map((row) => (
                    <Field key={row.key} label={row.label || row.key}>
                      <input name={`setting__${row.key}`} defaultValue={row.value} className="field" />
                    </Field>
                  ))}
                  {!groupRows.length ? <p className="text-xs text-ink-soft">No settings in this group.</p> : null}
                </div>
              </Panel>
            );
          })}
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <button className="btn btn-dark px-6 shadow-lg">Save all settings</button>
        </div>
      </form>
    </div>
  );
}
