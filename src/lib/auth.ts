import "server-only";

import { createHmac, randomBytes, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits, sessions, users, type UserRow } from "@/db/schema";
import { SCRYPT_PARAMS, hashPassword, passwordStrength, verifyPassword } from "@/lib/password";
import { LOCKOUT_MINUTES, LOCKOUT_THRESHOLD, MAX_SESSIONS_PER_USER, SESSION_TTL_DAYS } from "@/lib/auth-policy";

export { hashPassword, verifyPassword, passwordStrength, SCRYPT_PARAMS, LOCKOUT_MINUTES, LOCKOUT_THRESHOLD };

const SECRET = process.env.SESSION_SECRET ?? "sj-golf-store-dev-secret-change-me";

export const SESSION_COOKIE = "sj_session";
export const CART_COOKIE = "sj_cart";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * SESSION_TTL_DAYS;

/* ------------------------------------------------------------------ *
 * Password hashing (versioned scrypt, constant-time verify)
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Token helpers
 * ------------------------------------------------------------------ */

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sign(userId: number, tokenId: string): string {
  return createHmac("sha256", SECRET).update(`${userId}.${tokenId}`).digest("hex").slice(0, 32);
}

export function hashToken(token: string): string {
  return sha256(`${SECRET}:${token}`);
}

/* ------------------------------------------------------------------ *
 * Sessions — opaque token in an HttpOnly cookie, hash stored in Postgres
 * ------------------------------------------------------------------ */

export type SessionContext = { user: UserRow; sessionId: number };

export async function createSession(userId: number): Promise<void> {
  const tokenId = randomBytes(32).toString("base64url");
  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 64);
  const userAgent = (hdrs.get("user-agent") ?? "").slice(0, 250);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(tokenId),
    ip,
    userAgent,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });

  // Opportunistic cleanup of expired sessions for this user + enforce a cap.
  const active = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .orderBy(sessions.id);
  if (active.length > MAX_SESSIONS_PER_USER) {
    const stale = active.slice(0, active.length - MAX_SESSIONS_PER_USER).map((s) => s.id);
    await db.update(sessions).set({ revokedAt: new Date() }).where(or(...stale.map((id) => eq(sessions.id, id))));
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, `${userId}.${tokenId}.${sign(userId, tokenId)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
}

function parseCookie(value: string | undefined): { userId: number; tokenId: string } | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const userId = Number.parseInt(parts[0], 10);
  if (!Number.isFinite(userId)) return null;
  if (sign(userId, parts[1]) !== parts[2]) return null;
  return { userId, tokenId: parts[1] };
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const parsed = parseCookie(store.get(SESSION_COOKIE)?.value);
  if (!parsed) return null;

  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(parsed.tokenId)),
        eq(sessions.userId, parsed.userId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.user.status === "disabled") return null;

  // touch lastSeenAt at most once a minute to avoid write amplification
  if (Date.now() - new Date(row.session.lastSeenAt).getTime() > 60_000) {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, row.session.id));
  }
  return row.user;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const parsed = parseCookie(store.get(SESSION_COOKIE)?.value);
  if (parsed) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(parsed.tokenId)));
  }
  store.delete(SESSION_COOKIE);
}

export async function revokeSession(userId: number, sessionId: number): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
}

export async function revokeAllSessions(userId: number): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function listSessions(userId: number) {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .orderBy(sessions.lastSeenAt);
}

/* ------------------------------------------------------------------ *
 * Account lockout
 * ------------------------------------------------------------------ */


export function isLocked(user: UserRow): boolean {
  return Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());
}

export async function registerFailedLogin(user: UserRow): Promise<void> {
  const count = user.failedLoginCount + 1;
  const locked = count >= LOCKOUT_THRESHOLD;
  await db
    .update(users)
    .set({
      failedLoginCount: count,
      lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : user.lockedUntil,
    })
    .where(eq(users.id, user.id));
}

export async function clearFailedLogins(userId: number): Promise<void> {
  await db
    .update(users)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

/* ------------------------------------------------------------------ *
 * Persistent rate limiting (safe across instances)
 * ------------------------------------------------------------------ */

export type RateResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, windowStart));
    const rows = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
    const row = rows[0];

    if (row?.blockedUntil && new Date(row.blockedUntil) > now) {
      return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((new Date(row.blockedUntil).getTime() - now.getTime()) / 1000) };
    }
    if (!row || new Date(row.windowStart) < windowStart) {
      if (row) {
        await db.update(rateLimits).set({ count: 1, windowStart: now, blockedUntil: null }).where(eq(rateLimits.id, row.id));
      } else {
        await db.insert(rateLimits).values({ key, count: 1, windowStart: now }).onConflictDoNothing();
      }
      return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }
    if (row.count >= limit) {
      return { ok: false, remaining: 0, retryAfterSeconds: windowSeconds };
    }
    await db.update(rateLimits).set({ count: row.count + 1 }).where(eq(rateLimits.id, row.id));
    return { ok: true, remaining: limit - row.count - 1, retryAfterSeconds: 0 };
  } catch {
    // never block a request because the limiter itself failed
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/* ------------------------------------------------------------------ *
 * Cart cookie
 * ------------------------------------------------------------------ */

export async function getCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function setCartToken(token: string) {
  const store = await cookies();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

/* ------------------------------------------------------------------ *
 * RBAC
 * ------------------------------------------------------------------ */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  staff: ["orders.view", "orders.edit", "products.view", "inventory.view", "customers.view", "content.view"],
  customer: [],
};

export function can(user: UserRow | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const granted = ROLE_PERMISSIONS[user.role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export async function requireStaff(): Promise<UserRow | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.role === "admin" || user.role === "staff" ? user : null;
}
