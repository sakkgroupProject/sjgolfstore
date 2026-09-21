import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/store/auth-forms";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="wrap max-w-md py-16 md:py-24">
      <p className="eyebrow">Account Security</p>
      <h1 className="mt-3 text-4xl">Reset your password</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Enter the email on your account and we will generate a one-time reset link. Reset links expire after one hour and
        can only be used once.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <div className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-ink-soft">
        <p className="font-semibold text-ink">How we protect your account</p>
        <ul className="mt-2 space-y-1.5">
          <li>· Reset tokens are stored as SHA-256 hashes, never in plain text</li>
          <li>· Every reset revokes all existing sessions</li>
          <li>· Requests are rate limited to 4 per 15 minutes per IP</li>
          <li>· We never reveal whether an email address has an account</li>
        </ul>
      </div>
    </div>
  );
}
