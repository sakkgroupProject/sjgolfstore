import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/store/auth-forms";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your SJ Golf Store account for faster checkout and order tracking.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  return (
    <div className="wrap max-w-md py-16 md:py-24">
      <p className="eyebrow">Customer Account</p>
      <h1 className="mt-3 text-4xl">Create account</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Save your details for faster checkout and keep every order in one place.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
