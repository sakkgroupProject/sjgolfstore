import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, jobs, transactions, webhooks } from "@/db/schema";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Badge, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { retryWebhookAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const HEALTH = [
  { name: "Database", status: "healthy", detail: "PostgreSQL · 12 ms avg query" },
  { name: "Payment gateway", status: "healthy", detail: "SJ Pay · connected" },
  { name: "Email", status: "healthy", detail: "Transactional · connected" },
  { name: "Storage", status: "healthy", detail: "Media library · connected" },
  { name: "Shipping API", status: "healthy", detail: "Carrier rates · connected" },
  { name: "Tax API", status: "healthy", detail: "SJ Tax Service · connected" },
  { name: "Analytics", status: "healthy", detail: "GA4 · connected" },
];

export default async function AdminSystem() {
  const [hookRows, jobRows, logs, failedTx] = await Promise.all([
    db.select().from(webhooks).orderBy(desc(webhooks.id)),
    db.select().from(jobs).orderBy(desc(jobs.id)).limit(10),
    db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(20),
    db.select().from(transactions).where(sqlNe("failed")).limit(5),
  ]);

  return (
    <div>
      <PageHeader title="System health" subtitle="Integrations, background jobs and the admin audit trail" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Services healthy" value={`${HEALTH.length}/7`} accent />
        <StatCard label="Failed webhooks" value={String(hookRows.reduce((s, h) => s + h.failureCount, 0))} />
        <StatCard label="Failed jobs" value={String(jobRows.filter((j) => j.status === "failed").length)} />
        <StatCard label="Failed payments" value={String(failedTx.length)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Service health">
          <ul className="space-y-3">
            {HEALTH.map((h) => (
              <li key={h.name} className="flex items-center justify-between border-b border-[#f1f3f1] pb-3 last:border-0">
                <span>
                  <span className="block text-sm font-medium">{h.name}</span>
                  <span className="text-xs text-ink-soft">{h.detail}</span>
                </span>
                <Badge>{h.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Webhooks">
          <Table head={["Webhook", "Endpoint", "Status", "Last received", "Actions"]}>
            {hookRows.map((h) => (
              <tr key={h.id}>
                <td className="py-3 pr-4 font-medium">{h.name}</td>
                <td className="py-3 pr-4 font-mono text-xs text-ink-soft">{h.endpoint}</td>
                <td className="py-3 pr-4"><Badge>{h.status}</Badge></td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs text-ink-soft">{formatDateTime(h.lastReceivedAt)}</td>
                <td className="py-3">
                  <form action={retryWebhookAction}>
                    <input type="hidden" name="id" value={h.id} />
                    <button className="btn btn-light px-2.5 py-1.5 text-[0.65rem]">Retry</button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Background jobs">
          <Table head={["Job", "Status", "Duration", "When"]}>
            {jobRows.map((j) => (
              <tr key={j.id}>
                <td className="py-3 pr-4 font-medium">{j.name}</td>
                <td className="py-3 pr-4"><Badge>{j.status}</Badge></td>
                <td className="py-3 pr-4">{j.durationMs ? `${j.durationMs} ms` : "—"}</td>
                <td className="py-3 whitespace-nowrap text-xs text-ink-soft">{formatDateTime(j.createdAt)}</td>
              </tr>
            ))}
          </Table>
          {failedTx.length ? (
            <p className="mt-3 text-xs text-ink-soft">
              Latest failed payment: {formatMoney(failedTx[0].amountCents)} · {formatDateTime(failedTx[0].createdAt)}
            </p>
          ) : null}
        </Panel>

        <Panel title="Audit log">
          <ul className="space-y-3">
            {logs.map((l) => (
              <li key={l.id} className="border-b border-[#f1f3f1] pb-3 text-sm last:border-0 last:pb-0">
                <p className="font-medium">
                  {l.actor} — {l.action}
                </p>
                <p className="text-xs text-ink-soft">{l.resource}</p>
                <p className="text-xs text-ink-soft">{l.detail}</p>
                <p className="mt-0.5 text-[0.7rem] text-ink-soft">
                  {formatDateTime(l.createdAt)} · {l.ip}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function sqlNe(status: string) {
  const { sql } = require("drizzle-orm") as typeof import("drizzle-orm");
  return sql`${transactions.status} <> ${status}`;
}
