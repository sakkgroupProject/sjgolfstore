import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/store/auth-forms";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SJ Golf Store account to track orders and check out faster.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; signedout?: string; locked?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/account";

  return (
    <div className="wrap max-w-md py-16 md:py-24">
      <p className="eyebrow">Customer Account</p>
      <h1 className="mt-3 text-4xl">Sign in</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Track orders, manage addresses and check out faster. Your session is protected with an encrypted, HTTP-only cookie.
      </p>

      {params.reset ? (
        <p className="mt-6 border border-forest/20 bg-forest/10 px-4 py-3 text-sm text-forest">
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}
      {params.signedout ? (
        <p className="mt-6 border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
          You have been signed out of all devices.
        </p>
      ) : null}

      <div className="mt-8">
        <LoginForm redirectTo={next} />
      </div>

      <div className="mt-8 grid gap-2 border-t border-line pt-5 text-xs leading-relaxed text-ink-soft">
        <p className="font-semibold text-ink">Demo credentials</p>
        <p>Customer — john.smith@example.com · password123</p>
        <p>Store admin — admin@sjgolfstore.com · admin123</p>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Looking for the store admin?{" "}
        <Link href="/admin" className="underline decoration-line underline-offset-4">
          Go to admin console
        </Link>
      </p>
    </div>
  );
}
