"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export function AdminLogin({ signedIn, email }: { signedIn: boolean; email?: string }) {
  const [state, action, pending] = useActionState(loginAction, { ok: false, message: "" });

  return (
    <div className="grid min-h-screen place-items-center bg-forest-dark px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 text-white">
          <span className="grid size-9 place-items-center rounded-sm bg-white text-[0.8rem] font-bold text-forest">SJ</span>
          <span className="leading-none">
            <span className="block text-[0.85rem] font-bold uppercase tracking-[0.18em]">SJ Golf Store</span>
            <span className="mt-0.5 block text-[0.6rem] uppercase tracking-[0.3em] text-sand">Admin Console</span>
          </span>
        </div>

        <div className="mt-8 rounded-sm border border-white/15 bg-white p-6">
          <h1 className="text-lg font-bold">Restricted access</h1>
          <p className="mt-1 text-xs text-ink-soft">
            This area requires a store administrator account. All actions are recorded in the audit log.
          </p>

          {signedIn ? (
            <div className="mt-5 border border-[#b45309]/25 bg-[#b45309]/10 px-3 py-2.5 text-xs text-[#92400e]">
              You are signed in as <strong>{email}</strong>, which does not have admin permissions.
            </div>
          ) : null}

          <form action={action} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Email</label>
              <input name="email" type="email" required defaultValue="admin@sjgolfstore.com" className="field" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Password</label>
              <input name="password" type="password" required defaultValue="admin123" className="field" />
            </div>
            {state && !state.ok ? <p className="bg-red-50 px-3 py-2 text-xs text-red-700">{state.message}</p> : null}
            <button disabled={pending} className="btn btn-primary w-full">
              {pending ? "Verifying…" : "Sign in to admin"}
            </button>
          </form>

          <div className="mt-5 border-t border-[#eef1ee] pt-4 text-[0.7rem] leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">Demo credentials</p>
            <p className="mt-1">admin@sjgolfstore.com · admin123 (Super Admin)</p>
            <p>john.smith@example.com · password123 (customer — blocked)</p>
            <p className="mt-3">
              <Link href="/" className="underline decoration-line underline-offset-4">
                ← Return to storefront
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
