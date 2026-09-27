"use client";

import { useActionState } from "react";
import { contactAction } from "@/app/actions/marketing";

export function QuotationForm() {
  const [state, action, pending] = useActionState(contactAction, null);
  const fieldError = (name: string) => state?.errors?.[name];
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label mb-2 block">Name</label>
        <input name="name" className="field" autoComplete="name" required maxLength={80} />
        {fieldError("name") ? <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p> : null}
      </div>
      <div>
        <label className="label mb-2 block">Email</label>
        <input name="email" type="email" className="field" autoComplete="email" required />
        {fieldError("email") ? <p className="mt-1 text-xs text-red-600">{fieldError("email")}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <label className="label mb-2 block">Product Type (Minimum 10 Sets)</label>
        <select name="subject" className="field">
          {["Custom Iron Covers", "Custom Head Covers", "Custom Putter Covers", "Custom Caps", "Other"].map((s) => (
            <option key={s} value={`Quotation: ${s}`}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label mb-2 block">Request Details (Quantity, Model, Color, Logos)</label>
        <textarea name="message" rows={5} className="field" required placeholder="Describe your custom order..." />
      </div>
      {state ? (
        <p className={`sm:col-span-2 px-3 py-2 text-sm ${state.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
      <button disabled={pending} className="btn btn-primary sm:col-span-2 sm:w-auto sm:px-10">
        {pending ? "Sending..." : "Request Quotation"}
      </button>
    </form>
  );
}
