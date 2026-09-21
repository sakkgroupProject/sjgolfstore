import { asc } from "drizzle-orm";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { Badge, Field, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { saveStaffAction, updateStaffStatusAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const ROLES = [
  { name: "Super Admin", scopes: "Everything" },
  { name: "Store Manager", scopes: "Products, collections, inventory, orders, customers, discounts, content" },
  { name: "Order Manager", scopes: "Orders, customers, fulfillment, tracking, refund requests" },
  { name: "Product Manager", scopes: "Products, collections, inventory" },
  { name: "Content Manager", scopes: "Homepage, CMS, media, SEO" },
  { name: "Marketing Manager", scopes: "Discounts, newsletter, marketing analytics" },
  { name: "Finance Manager", scopes: "Payments, refunds, tax, reports" },
];

const PERMISSIONS = [
  "products.view", "products.create", "products.edit", "products.delete", "products.publish",
  "orders.view", "orders.edit", "orders.refund",
  "customers.view", "customers.edit",
  "inventory.edit", "content.edit", "seo.edit", "media.view",
  "payments.view", "refunds.process", "tax.view", "reports.view",
];

export default async function AdminStaff() {
  const rows = await db.select().from(staffUsers).orderBy(asc(staffUsers.id));

  return (
    <div>
      <PageHeader title="Staff &amp; permissions" subtitle="Role-based access control for the admin console" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Admin users" value={String(rows.length)} accent />
        <StatCard label="2FA enabled" value={String(rows.filter((r) => r.twoFactorEnabled).length)} />
        <StatCard label="Active" value={String(rows.filter((r) => r.status === "active").length)} />
        <StatCard label="Roles defined" value={String(ROLES.length)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Admin users">
            <Table head={["Name", "Email", "Role", "Permissions", "2FA", "Last login", "Status", "Actions"]}>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="py-3 pr-4 text-ink-soft">{r.email}</td>
                  <td className="py-3 pr-4">{r.role}</td>
                  <td className="py-3 pr-4 text-xs text-ink-soft">
                    {r.permissions.includes("*") ? "All permissions" : `${r.permissions.length} granted`}
                  </td>
                  <td className="py-3 pr-4">{r.twoFactorEnabled ? "✓" : "—"}</td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs text-ink-soft">{formatDateTime(r.lastLoginAt)}</td>
                  <td className="py-3 pr-4"><Badge>{r.status}</Badge></td>
                  <td className="py-3">
                    <form action={updateStaffStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="next" value={r.status === "active" ? "disabled" : "active"} />
                      <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">
                        {r.status === "active" ? "Disable" : "Reactivate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Roles">
            <Table head={["Role", "Scope"]}>
              {ROLES.map((r) => (
                <tr key={r.name}>
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="py-3 text-ink-soft">{r.scopes}</td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Add admin user">
            <form action={saveStaffAction} className="grid gap-4">
              <Field label="Name">
                <input name="name" required className="field" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required className="field" />
              </Field>
              <Field label="Role">
                <select name="role" className="field">
                  {ROLES.map((r) => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Granular permissions">
                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-sm border border-[#eef1ee] p-3">
                  {PERMISSIONS.map((p) => (
                    <label key={p} className="flex items-center gap-2.5 text-xs text-ink-soft">
                      <input type="checkbox" name="permissions" value={p} className="size-3.5 accent-[#14392c]" /> {p}
                    </label>
                  ))}
                </div>
              </Field>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" name="twoFactorEnabled" className="size-4 accent-[#14392c]" /> Require two-factor authentication
              </label>
              <button className="btn btn-dark">Create user</button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              Admin passwords are never visible to other users. Sessions are signed HTTP-only cookies and permission checks
              run server-side on every request.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
