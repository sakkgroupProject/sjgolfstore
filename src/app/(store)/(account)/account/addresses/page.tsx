import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { deleteAddressAction } from "@/app/actions/auth";
import { AddressForm } from "@/components/store/account-forms";

export const metadata: Metadata = { title: "Addresses", robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db.select().from(addresses).where(eq(addresses.userId, user.id));

  return (
    <div>
      <h1 className="text-3xl">Addresses</h1>
      <p className="mt-2 text-sm text-ink-soft">Save shipping addresses to speed up checkout.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{a.label}</p>
              {a.isDefault ? <span className="chip border-forest text-forest">Default</span> : null}
            </div>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
              {a.firstName} {a.lastName}
              <br />
              {a.address1}
              {a.address2 ? <><br />{a.address2}</> : null}
              <br />
              {a.city}, {a.state} {a.postalCode}
              <br />
              {a.country}
            </address>
            <form action={deleteAddressAction.bind(null, a.id)} className="mt-4">
              <button className="text-[0.7rem] uppercase tracking-widest text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
                Remove
              </button>
            </form>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-ink-soft">No saved addresses yet.</p> : null}
      </div>

      <div className="mt-12 border-t border-line pt-8">
        <h2 className="text-xl">Add a new address</h2>
        <div className="mt-6 max-w-2xl">
          <AddressForm />
        </div>
      </div>
    </div>
  );
}
