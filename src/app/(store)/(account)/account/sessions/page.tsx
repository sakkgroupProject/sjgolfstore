import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getCurrentUser, listSessions } from "@/lib/auth";
import { LOCKOUT_THRESHOLD } from "@/lib/auth-policy";
import { revokeSessionAction, signOutEverywhereAction } from "@/app/actions/auth";
import { formatDateTime } from "@/lib/format";
import { SignOutEverywhereButton } from "@/components/store/account-forms";

export const metadata: Metadata = { title: "Security", robots: { index: false, follow: false } };

function deviceLabel(userAgent: string): string {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iPhone / iPad";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows PC";
  if (/Linux/i.test(userAgent)) return "Linux device";
  return "Unknown device";
}

function browserLabel(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  return "Browser";
}

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [activeSessions, activity] = await Promise.all([
    listSessions(user.id),
    db.select().from(auditLogs).where(eq(auditLogs.actor, user.email)).limit(12),
  ]);

  const strength = [
    "Password hashed with scrypt (N=16384) and a unique salt",
    "Sessions validated against the database on every request",
    "Automatic lockout after failed sign-in attempts",
    "Signed out of all devices on password change",
  ];

  return (
    <div>
      <h1 className="text-3xl">Security</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Review the devices signed into your account and revoke access you do not recognise.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card divide-y divide-line">
          {activeSessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-semibold">
                  {deviceLabel(s.userAgent)} · {browserLabel(s.userAgent)}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {s.ip || "IP hidden"} · last active {formatDateTime(s.lastSeenAt)}
                </p>
                <p className="text-xs text-ink-soft">Expires {formatDateTime(s.expiresAt)}</p>
              </div>
              {s.id === activeSessions[0]?.id ? (
                <span className="chip border-forest text-forest">This device</span>
              ) : (
                <form action={revokeSessionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="btn btn-light px-3 py-1.5 text-[0.65rem]">Revoke</button>
                </form>
              )}
            </div>
          ))}
          {!activeSessions.length ? <p className="p-5 text-sm text-ink-soft">No active sessions.</p> : null}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Account protection</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              {strength.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-forest" />
                  {s}
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-forest" />
                Locks for {LOCKOUT_THRESHOLD} failed attempts in a row
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Sign out</h2>
            <p className="mt-2 text-xs text-ink-soft">
              Revoke every session immediately — useful if you lose a device.
            </p>
            <div className="mt-4">
              <SignOutEverywhereButton />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl">Recent account activity</h2>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {activity.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm">
              <span>
                <span className="block font-medium">{a.action}</span>
                <span className="block text-xs text-ink-soft">{a.detail}</span>
              </span>
              <span className="text-xs text-ink-soft">{formatDateTime(a.createdAt)}</span>
            </li>
          ))}
          {!activity.length ? <li className="py-4 text-sm text-ink-soft">No activity recorded yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
