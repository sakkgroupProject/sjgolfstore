import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, listSessions } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/sessions", label: "Security" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  const activeSessions = await listSessions(user.id);

  return (
    <div className="wrap grid gap-10 py-12 lg:grid-cols-[15rem_1fr] lg:py-16">
      <aside>
        <div className="border-b border-line pb-5">
          <p className="eyebrow">My Account</p>
          <p className="mt-2 text-lg font-semibold">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-ink-soft">{user.email}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            {activeSessions.length} active session{activeSessions.length === 1 ? "" : "s"}
          </p>
        </div>
        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm lg:flex-col lg:gap-0">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="py-2 transition hover:text-forest">
              {item.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button className="py-2 text-left text-ink-soft transition hover:text-ink">Log out</button>
          </form>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
