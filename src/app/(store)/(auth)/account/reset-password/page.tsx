import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/store/auth-forms";

export const metadata: Metadata = {
  title: "Set New Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="wrap max-w-md py-20">
        <p className="eyebrow">Account Security</p>
        <h1 className="mt-3 text-3xl">This reset link is incomplete</h1>
        <p className="mt-3 text-sm text-ink-soft">Request a fresh link and try again.</p>
        <Link href="/account/forgot-password" className="btn btn-primary mt-6">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap max-w-md py-16 md:py-24">
      <p className="eyebrow">Account Security</p>
      <h1 className="mt-3 text-4xl">Set a new password</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Choose a strong password you have not used elsewhere. All other sessions will be signed out.
      </p>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
