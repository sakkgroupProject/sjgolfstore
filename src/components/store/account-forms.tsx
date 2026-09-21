"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  saveAddressAction,
  signOutEverywhereAction,
  updateProfileAction,
  type FormState,
} from "@/app/actions/auth";
import { STATES } from "@/lib/format";

const IDLE: FormState = { ok: false, message: "" };

function Notice({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={`px-3 py-2 text-sm ${state.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700"}`}
    >
      {state.message}
    </p>
  );
}

function Err({ state, name }: { state: FormState; name: string }) {
  const message = state.errors?.[name];
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export function ProfileForm({
  user,
}: {
  user: { firstName: string; lastName: string; phone: string; email: string; acceptsMarketing: boolean };
}) {
  const [state, action, pending] = useActionState(updateProfileAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-2 block">First name</label>
          <input name="firstName" defaultValue={user.firstName} autoComplete="given-name" className="field" />
        </div>
        <div>
          <label className="label mb-2 block">Last name</label>
          <input name="lastName" defaultValue={user.lastName} autoComplete="family-name" className="field" />
        </div>
      </div>
      <div>
        <label className="label mb-2 block">Email</label>
        <input defaultValue={user.email} disabled className="field bg-paper text-ink-soft" />
        <p className="mt-1 text-xs text-ink-soft">Contact support to change the email on your account.</p>
      </div>
      <div>
        <label className="label mb-2 block">Phone</label>
        <input name="phone" defaultValue={user.phone} autoComplete="tel" className="field" />
        <Err state={state} name="phone" />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" name="acceptsMarketing" defaultChecked={user.acceptsMarketing} className="mt-0.5 size-4 accent-[#14392c]" />
        Send me new gear, offers and store news
      </label>
      <Notice state={state} />
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label mb-2 block">Current password</label>
        <input name="current" type="password" autoComplete="current-password" className="field" required />
        <Err state={state} name="current" />
      </div>
      <div>
        <label className="label mb-2 block">New password</label>
        <input name="next" type="password" autoComplete="new-password" className="field" required minLength={8} />
        <Err state={state} name="next" />
      </div>
      <p className="text-xs text-ink-soft">
        Changing your password signs out every other device for your security.
      </p>
      <Notice state={state} />
      <button disabled={pending} className="btn btn-outline">
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}

export function AddressForm() {
  const [state, action, pending] = useActionState(saveAddressAction, IDLE);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label mb-2 block">Label</label>
        <input name="label" defaultValue="Home" className="field" maxLength={40} />
      </div>
      <div>
        <label className="label mb-2 block">Phone</label>
        <input name="phone" autoComplete="tel" className="field" />
      </div>
      <div>
        <label className="label mb-2 block">First name</label>
        <input name="firstName" autoComplete="given-name" className="field" required />
        <Err state={state} name="firstName" />
      </div>
      <div>
        <label className="label mb-2 block">Last name</label>
        <input name="lastName" autoComplete="family-name" className="field" required />
        <Err state={state} name="lastName" />
      </div>
      <div className="sm:col-span-2">
        <label className="label mb-2 block">Street address</label>
        <input name="address1" autoComplete="address-line1" className="field" required />
        <Err state={state} name="address1" />
      </div>
      <div className="sm:col-span-2">
        <label className="label mb-2 block">Apartment, suite (optional)</label>
        <input name="address2" autoComplete="address-line2" className="field" />
      </div>
      <div>
        <label className="label mb-2 block">City</label>
        <input name="city" autoComplete="address-level2" className="field" required />
        <Err state={state} name="city" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-2 block">State</label>
          <select name="state" className="field" defaultValue="FL">
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Err state={state} name="state" />
        </div>
        <div>
          <label className="label mb-2 block">ZIP</label>
          <input name="postalCode" autoComplete="postal-code" className="field" required />
          <Err state={state} name="postalCode" />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="label mb-2 block">Country</label>
        <select name="country" className="field">
          {["United States", "Canada", "United Kingdom", "Australia"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink-soft sm:col-span-2">
        <input type="checkbox" name="isDefault" className="size-4 accent-[#14392c]" /> Set as default address
      </label>
      <div className="sm:col-span-2">
        <Notice state={state} />
      </div>
      <button disabled={pending} className="btn btn-primary sm:col-span-2">
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}

export function TrackOrderForm({ defaults }: { defaults?: { number?: string; email?: string } }) {
  return (
    <form action="/track-order" className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label mb-2 block">Order number</label>
        <input name="number" defaultValue={defaults?.number ?? ""} className="field" placeholder="SJ10255" required />
      </div>
      <div>
        <label className="label mb-2 block">Email</label>
        <input name="email" type="email" autoComplete="email" defaultValue={defaults?.email ?? ""} className="field" placeholder="you@example.com" required />
      </div>
      <button className="btn btn-primary sm:col-span-2 sm:w-auto sm:px-10">Track Order</button>
    </form>
  );
}

export function SignOutEverywhereButton() {
  return (
    <form action="/account/sessions" method="get">
      <button
        formAction={async () => {
          const { signOutEverywhereAction } = await import("@/app/actions/auth");
          await signOutEverywhereAction();
        }}
        className="btn btn-outline"
      >
        Sign out of all devices
      </button>
    </form>
  );
}
