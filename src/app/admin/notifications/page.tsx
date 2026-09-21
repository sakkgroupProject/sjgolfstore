import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { markNotificationsReadAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminNotifications() {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.id)).limit(40);
  const unread = rows.filter((r) => !r.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Operational alerts across orders, inventory, payments and customers"
        actions={
          <form action={markNotificationsReadAction}>
            <button className="btn btn-light px-4 py-2.5">Mark all as read</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Unread" value={String(unread)} accent />
        <StatCard label="Order alerts" value={String(rows.filter((r) => r.type === "order").length)} />
        <StatCard label="Inventory alerts" value={String(rows.filter((r) => r.type === "inventory").length)} />
        <StatCard label="Payment alerts" value={String(rows.filter((r) => r.type === "payment").length)} />
      </div>

      <div className="mt-6">
        <Panel title="Alert feed">
          {rows.length ? (
            <ul className="divide-y divide-[#f1f3f1]">
              {rows.map((n) => (
                <li key={n.id} className="flex items-start gap-4 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-[#f6f7f6] text-base">
                    <NotificationIcon type={n.type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      {!n.isRead ? <Badge>new</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-soft">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {n.href ? (
                    <Link href={n.href} className="btn btn-light px-3 py-1.5 text-[0.65rem]">Open</Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No notifications" body="You are all caught up." />
          )}
        </Panel>
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true } as const;
  if (type === "payment") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></svg>;
  if (type === "customer") return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.5 3.5-5.2 7-5.2s5.8 1.7 7 5.2" /></svg>;
  if (type === "contact") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (type === "system") return <svg {...common}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="4" /></svg>;
  if (type === "refund") return <svg {...common}><path d="M7 7H4v3M4 10a8 8 0 1 0 2-5" /><path d="M4 7h4" /></svg>;
  if (type === "inventory") return <svg {...common}><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></svg>;
  return <svg {...common}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h8V4M8 13h8M8 17h5" /></svg>;
}
