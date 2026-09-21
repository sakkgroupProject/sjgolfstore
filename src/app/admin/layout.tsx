import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminLogin } from "@/components/admin/admin-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | SJ Golf Store",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureSeeded();
  const user = await getCurrentUser();

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return <AdminLogin signedIn={Boolean(user)} email={user?.email} />;
  }

  const unread = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.isRead, false));

  return (
    <AdminShell
      user={{
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        role: user.role === "admin" ? "Super Admin" : "Staff",
      }}
      unreadCount={Number(unread[0]?.count ?? 0)}
    >
      {children}
    </AdminShell>
  );
}


