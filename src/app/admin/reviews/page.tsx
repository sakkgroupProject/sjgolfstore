import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { Badge, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { updateReviewAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const rows = await db
    .select({ review: reviews, product: products })
    .from(reviews)
    .leftJoin(products, eq(products.id, reviews.productId))
    .orderBy(desc(reviews.id))
    .limit(60);

  const pending = rows.filter((r) => r.review.status === "pending").length;
  const approved = rows.filter((r) => r.review.status === "approved").length;
  const avg = rows.length ? (rows.reduce((s, r) => s + r.review.rating, 0) / rows.length).toFixed(1) : "0.0";

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews before they appear on product pages" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total reviews" value={String(rows.length)} accent />
        <StatCard label="Pending moderation" value={String(pending)} />
        <StatCard label="Approved" value={String(approved)} />
        <StatCard label="Average rating" value={`${avg} / 5`} />
      </div>

      <div className="mt-6">
        <Panel title="All reviews">
          <Table head={["Product", "Customer", "Rating", "Review", "Date", "Status", "Moderate"]}>
            {rows.map(({ review, product }) => (
              <tr key={review.id}>
                <td className="py-3 pr-4">
                  {product ? (
                    <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-forest">
                      {product.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4">{review.customerName}</td>
                <td className="py-3 pr-4">{"★".repeat(review.rating)}</td>
                <td className="py-3 pr-4 max-w-sm">
                  <span className="block font-medium">{review.title}</span>
                  <span className="block text-xs text-ink-soft">{review.body}</span>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs text-ink-soft">{formatDate(review.createdAt)}</td>
                <td className="py-3 pr-4"><Badge>{review.status}</Badge></td>
                <td className="py-3">
                  <div className="flex gap-1.5">
                    {["approved", "rejected", "flagged"].map((s) => (
                      <form key={s} action={updateReviewAction}>
                        <input type="hidden" name="id" value={review.id} />
                        <input type="hidden" name="status" value={s} />
                        <button className="btn btn-light px-2 py-1.5 text-[0.6rem] capitalize">{s}</button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </div>
  );
}
