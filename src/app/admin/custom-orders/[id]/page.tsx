import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactEnquiries } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function CustomOrderDetail({ params }: Params) {
  const { id } = await params;
  const enquiryId = Number(id);
  if (isNaN(enquiryId)) notFound();

  const [order] = await db
    .select()
    .from(contactEnquiries)
    .where(eq(contactEnquiries.id, enquiryId));

  if (!order) notFound();

  const parts = order.message.split("\n");
  const getField = (prefix: string) => 
    parts.find(p => p.startsWith(prefix))?.replace(prefix, "").trim() || "N/A";
  
  const quantity = getField("Quantity:");
  const model = getField("Model:");
  const color = getField("Color:");
  const logoUrl = getField("Logo URL:");
  const notes = getField("Additional Notes:");

  return (
    <div>
      <PageHeader
        title={`Custom Order #${order.id}`}
        subtitle={formatDateTime(order.createdAt)}
        breadcrumb={[{ href: "/admin/custom-orders", label: "Custom Orders" }, { label: `Order #${order.id}` }]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Request Details">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft mb-1">Product Type</p>
                <p className="font-medium text-ink">{order.subject.replace("Quotation:", "").trim()}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft mb-1">Quantity</p>
                <p className="font-medium text-ink">{quantity}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft mb-1">Model / Style</p>
                <p className="font-medium text-ink">{model}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft mb-1">Color</p>
                <p className="font-medium text-ink">{color}</p>
              </div>
            </div>

            {notes !== "N/A" && notes !== "" && (
              <div className="mt-6 border-t border-[#e2e6e2] pt-6">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft mb-2">Additional Notes</p>
                <div className="bg-[#f6f7f6] p-4 text-sm text-ink-soft rounded-sm whitespace-pre-wrap">
                  {notes}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Logo Asset">
            {logoUrl !== "N/A" && logoUrl !== "No logo uploaded" ? (
              <div className="flex flex-col items-start gap-4">
                <div className="relative h-40 w-full rounded border border-[#e2e6e2] bg-[#f8faf8] flex items-center justify-center p-4">
                  <img src={logoUrl} alt="Uploaded Logo" className="max-h-full max-w-full object-contain" />
                </div>
                <a href={logoUrl} target="_blank" rel="noreferrer" className="btn btn-primary px-4 py-2 text-sm">
                  Download Logo File
                </a>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No logo was uploaded for this request.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-semibold text-ink">{order.name}</p>
            <a href={`mailto:${order.email}`} className="text-sm text-forest hover:underline break-all mt-1 inline-block">
              {order.email}
            </a>
          </Panel>

          <Panel title="Status">
            <div className="mb-4">
              <Badge>{order.status}</Badge>
            </div>
            <p className="text-xs text-ink-soft">
              This request was submitted on {formatDateTime(order.createdAt)}. Reply directly to the customer's email to proceed with pricing and proofs.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
