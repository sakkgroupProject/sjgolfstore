import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactEnquiries } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomOrders() {
  const rows = await db
    .select()
    .from(contactEnquiries)
    .orderBy(desc(contactEnquiries.createdAt))
    .limit(50);

  // Filter only those that look like custom orders
  const customOrders = rows.filter(r => r.subject.startsWith("Quotation:"));

  return (
    <div>
      <PageHeader
        title="Custom Orders (B2B)"
        subtitle="Manage bulk wholesale and custom logo gear requests"
      />

      <div className="mt-6">
        <Panel title="Recent Quotation Requests">
          {customOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e6e2] text-[0.65rem] uppercase tracking-[0.1em] text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Details</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f1]">
                  {customOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fafbfa]">
                      <td className="px-4 py-4 whitespace-nowrap text-ink-soft">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-ink">{order.name}</p>
                        <p className="text-xs text-ink-soft">{order.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-ink">
                          {order.subject.replace("Quotation:", "").trim()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge>{order.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <a href={`/admin/custom-orders/${order.id}`} className="btn btn-outline text-xs px-3 py-1.5">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No custom orders" body="When customers request custom quotes, they will appear here." />
          )}
        </Panel>
      </div>
    </div>
  );
}
