import Link from "next/link";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses, orders, users } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { updateCustomerStatusAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = q ? `%${q}%` : null;
  const rows = await db
    .select({
      user: users,
      orderCount: sql<number>`(select count(*) from ${orders} where ${orders.userId} = ${users.id})::int`,
      spent: sql<number>`(select coalesce(sum(${orders.totalCents}),0) from ${orders} where ${orders.userId} = ${users.id})::int`,
      lastOrder: sql<Date | null>`(select max(${orders.createdAt}) from ${orders} where ${orders.userId} = ${users.id})`,
      addressCount: sql<number>`(select count(*) from ${addresses} where ${addresses.userId} = ${users.id})::int`,
    })
    .from(users)
    .where(term ? or(ilike(users.email, term), ilike(users.firstName, term), ilike(users.lastName, term)) : undefined)
    .orderBy(desc(users.id))
    .limit(50);

  const stats = await db
    .select({
      total: sql<number>`count(*) filter (where ${users.role} = 'customer')::int`,
      marketing: sql<number>`count(*) filter (where ${users.acceptsMarketing})::int`,
      disabled: sql<number>`count(*) filter (where ${users.status} = 'disabled')::int`,
      lifetime: sql<number>`coalesce(sum(${orders.totalCents}),0)::int`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id));

  const top = await db
    .select({
      email: orders.email,
      name: sql<string>`${orders.firstName} || ' ' || ${orders.lastName}`,
      spent: sql<number>`sum(${orders.totalCents})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .groupBy(orders.email, orders.firstName, orders.lastName)
    .orderBy(desc(sql`sum(${orders.totalCents})`))
    .limit(5);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Registered accounts, lifetime value and account status"
        actions={
          <form className="flex gap-2" action="/admin/customers">
            <input name="q" defaultValue={q ?? ""} placeholder="Search name or email" className="field py-2 text-sm" />
            <button className="btn btn-light px-4 py-2.5">Search</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Customers" value={String(stats[0]?.total ?? 0)} accent />
        <StatCard label="Lifetime revenue" value={formatMoney(Number(stats[0]?.lifetime ?? 0))} />
        <StatCard label="Marketing consent" value={String(stats[0]?.marketing ?? 0)} />
        <StatCard label="Disabled accounts" value={String(stats[0]?.disabled ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="All customers">
          {rows.length ? (
            <Table head={["Customer", "Email", "Orders", "Total spent", "Joined", "Status", "Actions"]}>
              {rows.map((r) => (
                <tr key={r.user.id}>
                  <td className="py-3 pr-4 font-medium">
                    {r.user.firstName} {r.user.lastName}
                    <span className="block text-xs text-ink-soft">{r.addressCount} saved address{r.addressCount === 1 ? "" : "es"}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{r.user.email}</td>
                  <td className="py-3 pr-4">{r.orderCount}</td>
                  <td className="py-3 pr-4 font-semibold">{formatMoney(r.spent)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs text-ink-soft">{formatDate(r.user.createdAt)}</td>
                  <td className="py-3 pr-4"><Badge>{r.user.status}</Badge></td>
                  <td className="py-3">
                    <form action={updateCustomerStatusAction}>
                      <input type="hidden" name="id" value={r.user.id} />
                      <input type="hidden" name="next" value={r.user.status === "active" ? "disabled" : "active"} />
                      <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">
                        {r.user.status === "active" ? "Disable" : "Reactivate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No customers found" body="Try a different search term." />
          )}
        </Panel>

        <Panel title="Top customers by spend">
          <ul className="space-y-3">
            {top.map((t) => (
              <li key={t.email} className="flex items-start justify-between gap-4 border-b border-[#f1f3f1] pb-3 last:border-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t.name || t.email}</span>
                  <span className="text-xs text-ink-soft">{t.count} orders</span>
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">{formatMoney(t.spent)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/reports" className="mt-4 inline-block text-xs font-semibold text-forest">
            Download customer report →
          </Link>
        </Panel>
      </div>
    </div>
  );
}
