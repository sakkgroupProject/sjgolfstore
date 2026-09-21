"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type FormState,
} from "@/app/actions/auth";

const IDLE: FormState = { ok: false, message: "" };

function Alert({ state }: { state: FormState }) {
  if (!state.message) return null;
  const tone = state.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700";
  return (
    <p className={`border px-3 py-2.5 text-sm ${state.ok ? "border-forest/20" : "border-red-200"} ${tone}`} role="status">
      {state.message}
    </p>
  );
}

function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state.errors?.[name];
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function LoginForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(loginAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label className="label mb-2 block" htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label" htmlFor="login-password">Password</label>
          <Link href="/account/forgot-password" className="text-[0.7rem] text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required className="field" placeholder="••••••••" />
        <FieldError state={state} name="password" />
      </div>
      <Alert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full py-4">
        {pending ? "Signing in…" : "Sign in securely"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        New to SJ Golf?{" "}
        <Link href="/account/register" className="font-semibold text-forest underline decoration-line underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-2 block">First name</label>
          <input name="firstName" autoComplete="given-name" required className="field" />
          <FieldError state={state} name="firstName" />
        </div>
        <div>
          <label className="label mb-2 block">Last name</label>
          <input name="lastName" autoComplete="family-name" required className="field" />
          <FieldError state={state} name="lastName" />
        </div>
      </div>
      <div>
        <label className="label mb-2 block">Email</label>
        <input name="email" type="email" autoComplete="email" required className="field" />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label className="label mb-2 block">Password</label>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className="field" placeholder="At least 8 characters" />
        <FieldError state={state} name="password" />
        <PasswordMeter />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" name="acceptsMarketing" className="mt-0.5 size-4 accent-[#14392c]" />
        Email me new gear, offers and store news
      </label>
      <Alert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full py-4">
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-xs leading-relaxed text-ink-soft">
        By creating an account you agree to our{" "}
        <Link href="/terms-of-service" className="underline decoration-line underline-offset-4">Terms of Service</Link> and{" "}
        <Link href="/privacy-policy" className="underline decoration-line underline-offset-4">Privacy Policy</Link>.
      </p>
      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/account/login" className="font-semibold text-forest underline decoration-line underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function PasswordMeter() {
  return (
    <p className="mt-2 text-[0.7rem] text-ink-soft">
      Must be 8+ characters with at least one letter and one number. We hash passwords with scrypt and never store them in
      plain text.
    </p>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label mb-2 block">Email</label>
        <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
      </div>
      <Alert state={state} />
      {state.ok && state.message.includes("/account/reset-password?token=") ? (
        <Link href={state.message.split("Open ")[1]?.split(" within")[0] ?? "#"} className="btn btn-outline w-full">
          Open reset link
        </Link>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full py-4">
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        <Link href="/account/login" className="font-semibold text-forest underline decoration-line underline-offset-4">
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label mb-2 block">New password</label>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className="field" />
        <FieldError state={state} name="password" />
      </div>
      <Alert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full py-4">
        {pending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

