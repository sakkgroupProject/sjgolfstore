"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, RotateCcw } from "lucide-react";
import { placeOrderAction, type CheckoutPayload } from "@/app/actions/checkout";
import { applyDiscountAction, removeDiscountAction } from "@/app/actions/cart";
import { formatMoney, STATES } from "@/lib/format";

export type CheckoutLine = {
  id: number;
  title: string;
  variantTitle: string;
  slug: string;
  imageUrl: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type Rate = { id: number; name: string; description: string; priceCents: number; transitDays: string };

export function CheckoutClient({
  lines,
  rates,
  initialTotals,
  user,
  addresses,
  initialDiscount,
}: {
  lines: CheckoutLine[];
  rates: Rate[];
  initialTotals: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    itemCount: number;
  };
  user: { email: string; firstName: string; lastName: string } | null;
  addresses: { id: number; label: string; firstName: string; lastName: string; address1: string; city: string; state: string; postalCode: string; phone: string }[];
  initialDiscount: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [rateId, setRateId] = useState(rates[0]?.id ?? 0);
  const [discountCode, setDiscountCode] = useState(initialDiscount);
  const [discountMsg, setDiscountMsg] = useState("");
  const [form, setForm] = useState({
    email: user?.email ?? "",
    phone: "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    address1: addresses[0]?.address1 ?? "",
    address2: "",
    city: addresses[0]?.city ?? "",
    state: addresses[0]?.state ?? "FL",
    postalCode: addresses[0]?.postalCode ?? "",
    country: "United States",
    cardName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    notes: "",
    createAccount: !user,
  });

  const selectedRate = rates.find((r) => r.id === rateId) ?? rates[0];
  const shipping = selectedRate
    ? initialTotals.subtotalCents >= 10000 && selectedRate.priceCents <= 999
      ? 0
      : selectedRate.priceCents
    : initialTotals.shippingCents;
  const discount = initialTotals.discountCents;
  const tax = Math.round((initialTotals.subtotalCents - discount) * 0.07);
  const total = Math.max(initialTotals.subtotalCents - discount + shipping + tax, 0);

  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim());
  const validPhone = /^\+?[0-9().\s-]+$/.test(form.phone.trim()) && form.phone.replace(/\D/g, "").length >= 7 && form.phone.replace(/\D/g, "").length <= 15;

  const stepValid = (n: number) => {
    if (n === 1) {
      return (
        validEmail &&
        validPhone &&
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.address1.trim() &&
        form.city.trim() &&
        form.state.trim() &&
        form.postalCode.trim()
      );
    }
    if (n === 2) return Boolean(rateId);
    return form.cardName.trim() && form.cardNumber.replace(/\D/g, "").length >= 15 && /^\d{2}\s?\/\s?\d{2}$/.test(form.cardExpiry) && /^\d{3,4}$/.test(form.cardCvc);
  };

  const submit = async () => {
    setPending(true);
    setError("");
    const payload: CheckoutPayload = { ...form, shippingRateId: rateId };
    const res = await placeOrderAction(payload);
    setPending(false);
    if (res.ok && res.orderNumber) {
      router.push(`/checkout/confirmation?number=${res.orderNumber}`);
      return;
    }
    setError(res.error ?? "We could not complete your order. Please review your details.");
  };

  if (!lines.length) {
    return (
      <div className="wrap flex flex-col items-center gap-4 py-24 text-center">
        <p className="eyebrow">Checkout</p>
        <h1 className="text-3xl">Your cart is empty</h1>
        <p className="max-w-sm text-sm text-ink-soft">Add equipment to your cart to continue to checkout.</p>
        <Link href="/shop" className="btn btn-primary mt-2">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="wrap grid gap-12 py-10 lg:grid-cols-[1.35fr_1fr] lg:py-16">
      <div>
        <ol className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] uppercase tracking-[0.16em]">
          {["Customer information", "Shipping method", "Payment"].map((label, i) => {
            const n = i + 1;
            return (
              <li key={label} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(n)}
                  className={`flex items-center gap-2 transition ${step === n ? "text-ink" : step > n ? "text-forest" : "text-ink-soft"}`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full border text-[0.65rem] ${
                      step === n ? "border-forest bg-forest text-white" : step > n ? "border-forest text-forest" : "border-line"
                    }`}
                  >
                    {step > n ? "✓" : n}
                  </span>
                  {label}
                </button>
                {n < 3 ? <span className="text-line">—</span> : null}
              </li>
            );
          })}
        </ol>

        {step === 1 ? (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl">Contact</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <input className="field" placeholder="Email" type="email" required aria-invalid={form.email.length > 0 && !validEmail} value={form.email} onChange={(e) => set("email", e.target.value)} />
                  {form.email.length > 0 && !validEmail ? <p className="mt-1 text-xs text-red-700">Enter a valid email address.</p> : null}
                </div>
                <div>
                  <input className="field" placeholder="Phone" type="tel" inputMode="tel" required aria-invalid={form.phone.length > 0 && !validPhone} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  {form.phone.length > 0 && !validPhone ? <p className="mt-1 text-xs text-red-700">Enter a valid phone number.</p> : null}
                </div>
              </div>
              {!user ? (
                <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={form.createAccount} onChange={(e) => set("createAccount", e.target.checked)} className="size-4 accent-[#14392c]" />
                  Email me order updates and create an account for faster checkout
                </label>
              ) : null}
            </div>

            <div>
              <h2 className="text-xl">Shipping address</h2>
              {addresses.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() =>
                        setForm((f) => ({ ...f, firstName: a.firstName, lastName: a.lastName, address1: a.address1, city: a.city, state: a.state, postalCode: a.postalCode, phone: a.phone }))
                      }
                      className="chip hover:border-forest"
                    >
                      {a.label}: {a.city}, {a.state}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
                <input className="field" placeholder="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
                <input className="field sm:col-span-2" placeholder="Street address" value={form.address1} onChange={(e) => set("address1", e.target.value)} />
                <input className="field sm:col-span-2" placeholder="Apartment, suite (optional)" value={form.address2} onChange={(e) => set("address2", e.target.value)} />
                <input className="field" placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="field" value={form.state} onChange={(e) => set("state", e.target.value)}>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input className="field" placeholder="ZIP" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
                </div>
                <select className="field sm:col-span-2" value={form.country} onChange={(e) => set("country", e.target.value)}>
                  {["United States", "Canada", "United Kingdom", "Australia"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Link href="/cart" className="text-xs uppercase tracking-[0.16em] text-ink-soft underline decoration-line underline-offset-4">
                ← Return to cart
              </Link>
              <button onClick={() => stepValid(1) && setStep(2)} disabled={!stepValid(1)} className="btn btn-primary">
                Continue to shipping
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl">Shipping method</h2>
              <div className="mt-4 space-y-3">
                {rates.map((r) => {
                  const free = r.priceCents <= 999 && initialTotals.subtotalCents >= 10000;
                  return (
                    <label
                      key={r.id}
                      className={`flex cursor-pointer items-start justify-between gap-4 border p-4 transition ${
                        rateId === r.id ? "border-forest bg-paper" : "border-line hover:border-ink"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <input type="radio" name="rate" checked={rateId === r.id} onChange={() => setRateId(r.id)} className="mt-1 accent-[#14392c]" />
                        <span>
                          <span className="block text-sm font-semibold">{r.name}</span>
                          <span className="block text-xs text-ink-soft">{r.description} · {r.transitDays}</span>
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold">{free ? "Free" : formatMoney(r.priceCents)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <textarea
              className="field"
              rows={3}
              placeholder="Delivery notes (optional)"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
            <div className="flex items-center justify-between gap-4">
              <button onClick={() => setStep(1)} className="text-xs uppercase tracking-[0.16em] text-ink-soft underline decoration-line underline-offset-4">
                ← Back to information
              </button>
              <button onClick={() => setStep(3)} className="btn btn-primary">Continue to payment</button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl">Payment</h2>
              <p className="mt-1 text-xs text-ink-soft">
                All transactions are encrypted. This demo gateway accepts any test card ending in 4242.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input className="field sm:col-span-2" placeholder="Name on card" value={form.cardName} onChange={(e) => set("cardName", e.target.value)} />
                <input className="field sm:col-span-2" placeholder="Card number" inputMode="numeric" value={form.cardNumber} onChange={(e) => set("cardNumber", e.target.value)} />
                <input className="field" placeholder="MM/YY" value={form.cardExpiry} onChange={(e) => set("cardExpiry", e.target.value)} />
                <input className="field" placeholder="Security code" inputMode="numeric" value={form.cardCvc} onChange={(e) => set("cardCvc", e.target.value)} />
              </div>
            </div>

            {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <div className="flex items-center justify-between gap-4">
              <button onClick={() => setStep(2)} className="text-xs uppercase tracking-[0.16em] text-ink-soft underline decoration-line underline-offset-4">
                ← Back to shipping
              </button>
              <button onClick={submit} disabled={pending} className="btn btn-primary px-8">
                {pending ? "Processing…" : `Pay ${formatMoney(total)}`}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {/* ---------- order summary ---------- */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Order summary</h2>
          <ul className="mt-5 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.id} className="flex gap-4 py-4">
                <span className="relative size-16 shrink-0 bg-paper-warm">
                  {l.imageUrl ? <Image src={l.imageUrl} alt={l.title} fill sizes="64px" className="object-cover" /> : null}
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-[0.6rem] font-semibold text-white">
                    {l.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{l.title}</span>
                  <span className="block text-xs uppercase tracking-wider text-ink-soft">{l.variantTitle}</span>
                </span>
                <span className="text-sm font-semibold">{formatMoney(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            {initialDiscount ? (
              <div className="flex items-center justify-between gap-3">
                <span className="chip border-forest text-forest">{discountCode}</span>
                <button
                  onClick={async () => {
                    await removeDiscountAction();
                    setDiscountCode("");
                    setDiscountMsg("");
                    router.refresh();
                  }}
                  className="text-[0.7rem] uppercase tracking-widest text-ink-soft underline decoration-line underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="field py-2.5 text-sm"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={async () => {
                    const res = await applyDiscountAction(discountCode);
                    setDiscountMsg(res.ok ? `${res.code} applied` : res.error);
                    router.refresh();
                  }}
                  className="btn btn-outline shrink-0 px-4 py-2.5"
                >
                  Apply
                </button>
              </div>
            )}
            {discountMsg ? <p className="mt-2 text-xs text-forest">{discountMsg}</p> : null}
            <p className="mt-2 text-[0.7rem] text-ink-soft">Try WELCOME20, GOLF50 or FREESHIP</p>
          </div>

          <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <Row label="Subtotal" value={formatMoney(initialTotals.subtotalCents)} />
            {discount > 0 ? <Row label="Discount" value={`−${formatMoney(discount)}`} accent /> : null}
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatMoney(shipping)} />
            <Row label="Estimated tax" value={formatMoney(tax)} />
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-base font-semibold">Total</dt>
              <dd className="text-xl font-semibold">{formatMoney(total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 space-y-2 border border-line bg-paper p-5 text-xs text-ink-soft">
          <p className="flex items-center gap-2"><LockKeyhole size={16} strokeWidth={1.7} aria-hidden="true" /> Secure 256-bit SSL checkout</p>
          <p className="flex items-center gap-2"><ShippingIcon /> Free U.S. shipping on orders over $100</p>
          <p className="flex items-center gap-2"><RotateCcw size={16} strokeWidth={1.7} aria-hidden="true" /> 30-day returns on unused equipment</p>
        </div>
      </aside>
    </div>
  );
}

function ShippingIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></svg>;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={accent ? "text-forest" : ""}>{value}</dd>
    </div>
  );
}
