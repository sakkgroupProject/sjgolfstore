import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PasswordForm, ProfileForm } from "@/components/store/account-forms";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div>
      <h1 className="text-3xl">Profile</h1>
      <p className="mt-2 text-sm text-ink-soft">Update your contact details and password.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg">Account details</h2>
          <div className="mt-5">
            <ProfileForm
              user={{
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
                acceptsMarketing: user.acceptsMarketing,
              }}
            />
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg">Password</h2>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
