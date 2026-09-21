"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, auditLogs, passwordResetTokens, users } from "@/db/schema";
import {
  clearFailedLogins,
  createSession,
  destroyCurrentSession,
  getCurrentUser,
  hashPassword,
  hashToken,
  isLocked,
  listSessions,
  passwordStrength,
  rateLimit,
  registerFailedLogin,
  revokeAllSessions,
  revokeSession,
  verifyPassword,
} from "@/lib/auth";
import { LOCKOUT_MINUTES, LOCKOUT_THRESHOLD } from "@/lib/auth-policy";
import {
  addressSchema,
  fieldErrors,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validation";

export type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  field?: string;
};

const IDLE: FormState = { ok: false, message: "" };

async function clientKey(scope: string): Promise<string> {
  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  return `${scope}:${ip}`;
}

async function audit(actor: string, action: string, resource: string, detail: string) {
  try {
    await db.insert(auditLogs).values({ actor, action, resource, detail });
  } catch {
    /* logging must never break auth */
  }
}

function safeInternalPath(value: string | undefined): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

/* ---------------------------- login ---------------------------- */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const rawEmail = String(formData.get("email") ?? "");
  const redirectTo = safeInternalPath(String(formData.get("redirectTo") ?? ""));

  const parsed = loginSchema.safeParse({ email: rawEmail, password: String(formData.get("password") ?? "") });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ...IDLE, message: Object.values(errors)[0] ?? "Check your details.", errors };
  }

  const limit = await rateLimit(await clientKey("login"), 8, 300);
  if (!limit.ok) {
    return { ...IDLE, message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).` };
  }

  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const user = rows[0];

  // Constant-work path: always run a hash comparison so timing does not reveal
  // whether the account exists.
  const reference = "v2$16384$8$1$YWJjZGVmZ2hpamtsbW5vcA==$" + "A".repeat(88);
  const passwordOk = verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? reference,
  );

  if (!user || !passwordOk) {
    if (user) await registerFailedLogin(user);
    await audit(parsed.data.email, "Failed sign in", user ? `user #${user.id}` : "unknown email", "Invalid credentials");
    return { ...IDLE, message: "Those credentials do not match our records." };
  }

  if (isLocked(user)) {
    const mins = Math.max(1, Math.ceil((new Date(user.lockedUntil as Date).getTime() - Date.now()) / 60000));
    return { ...IDLE, message: `Account temporarily locked after ${LOCKOUT_THRESHOLD} failed attempts. Try again in ${mins} minute(s).` };
  }
  if (user.status === "disabled") {
    return { ...IDLE, message: "This account has been disabled. Contact support for help." };
  }

  await clearFailedLogins(user.id);
  await createSession(user.id);
  await audit(user.email, "Signed in", `user #${user.id}`, `Role: ${user.role}`);
  revalidatePath("/", "layout");

  if (user.role === "admin" || user.role === "staff") redirect("/admin/dashboard");
  redirect(redirectTo);
}

/* ---------------------------- register ---------------------------- */

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    acceptsMarketing: formData.get("acceptsMarketing") === "on",
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ...IDLE, message: Object.values(errors)[0] ?? "Check your details.", errors };
  }

  const limit = await rateLimit(await clientKey("register"), 5, 3600);
  if (!limit.ok) {
    return { ...IDLE, message: "Too many accounts created from this network. Try again later." };
  }

  const strength = passwordStrength(parsed.data.password);
  if (!strength.ok) return { ...IDLE, message: strength.message, field: "password" };

  const existing = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing[0]) {
    return { ...IDLE, message: "An account already exists with that email. Try signing in instead." };
  }

  const inserted = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      acceptsMarketing: parsed.data.acceptsMarketing ?? false,
      passwordChangedAt: new Date(),
    })
    .returning();

  await createSession(inserted[0].id);
  await audit(inserted[0].email, "Created account", `user #${inserted[0].id}`, "Customer registration");
  revalidatePath("/", "layout");
  redirect("/account");
}

/* ---------------------------- logout ---------------------------- */

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await revokeAllSessions(user.id);
    await audit(user.email, "Signed out", `user #${user.id}`, "All sessions revoked");
  }
  await destroyCurrentSession();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ---------------------------- profile ---------------------------- */

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ...IDLE, message: "Please sign in again." };

  const parsed = profileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    acceptsMarketing: formData.get("acceptsMarketing") === "on",
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ...IDLE, message: Object.values(errors)[0] ?? "Check your details.", errors };
  }

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  await audit(user.email, "Updated profile", `user #${user.id}`, "Contact details changed");
  revalidatePath("/account/profile");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ...IDLE, message: "Please sign in again." };

  const limit = await rateLimit(`pwchange:${user.id}`, 5, 900);
  if (!limit.ok) return { ...IDLE, message: "Too many attempts. Try again shortly." };

  const parsed = passwordChangeSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ...IDLE, message: Object.values(errors)[0] ?? "Check your details.", errors };
  }

  if (!verifyPassword(parsed.data.current, user.passwordHash)) {
    return { ...IDLE, message: "Your current password is incorrect.", field: "current" };
  }
  const strength = passwordStrength(parsed.data.next);
  if (!strength.ok) return { ...IDLE, message: strength.message, field: "next" };
  if (verifyPassword(parsed.data.next, user.passwordHash)) {
    return { ...IDLE, message: "Choose a password you have not used before.", field: "next" };
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(parsed.data.next), passwordChangedAt: new Date() })
    .where(eq(users.id, user.id));
  await revokeAllSessions(user.id);
  await createSession(user.id);
  await audit(user.email, "Changed password", `user #${user.id}`, "Other sessions revoked");
  revalidatePath("/account/profile");
  return { ok: true, message: "Password changed. Other devices were signed out." };
}

/* ---------------------------- addresses ---------------------------- */

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ...IDLE, message: "Please sign in again." };

  const parsed = addressSchema.safeParse({
    label: String(formData.get("label") ?? "Home"),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    address1: String(formData.get("address1") ?? ""),
    address2: String(formData.get("address2") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "United States"),
    phone: String(formData.get("phone") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ...IDLE, message: Object.values(errors)[0] ?? "Check the address fields.", errors };
  }

  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id));
  if (existing.length >= 10) return { ...IDLE, message: "You have reached the maximum of 10 saved addresses." };

  if (parsed.data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }
  await db.insert(addresses).values({ ...parsed.data, userId: user.id });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(id: number) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

/* ---------------------------- password reset ---------------------------- */

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.pick({ email: true }).safeParse({ email: String(formData.get("email") ?? "") });
  const limit = await rateLimit(await clientKey("pwreset"), 4, 900);
  if (!limit.ok) {
    return { ok: true, message: "If that email exists, a reset link is on its way." };
  }
  if (!parsed.success) {
    return { ok: true, message: "If that email exists, a reset link is on its way." };
  }

  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (rows[0]) {
    const token = (await import("node:crypto")).randomBytes(32).toString("base64url");
    await db.insert(passwordResetTokens).values({
      userId: rows[0].id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await audit(rows[0].email, "Requested password reset", `user #${rows[0].id}`, "Reset token issued (1 hour)");
    // No transactional email provider is configured in this environment, so the
    // one-time link is surfaced directly instead of being emailed.
    return {
      ok: true,
      message: `Reset link generated for ${parsed.data.email}. Open /account/reset-password?token=${token} within 1 hour.`,
    };
  }
  return { ok: true, message: "If that email exists, a reset link is on its way." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const next = String(formData.get("password") ?? "");
  if (!token) return { ...IDLE, message: "This reset link is invalid." };

  const limit = await rateLimit(await clientKey("pwreset-use"), 8, 900);
  if (!limit.ok) return { ...IDLE, message: "Too many attempts. Try again shortly." };

  const strength = passwordStrength(next);
  if (!strength.ok) return { ...IDLE, message: strength.message, field: "password" };

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hashToken(token)))
    .limit(1);
  const record = rows[0];
  if (!record || record.usedAt || new Date(record.expiresAt) < new Date()) {
    return { ...IDLE, message: "This reset link has expired. Request a new one." };
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(next), passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null })
    .where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));
  await revokeAllSessions(record.userId);

  const account = await db.select({ email: users.email }).from(users).where(eq(users.id, record.userId)).limit(1);
  await audit(account[0]?.email ?? "user", "Reset password", `user #${record.userId}`, "Password reset via token; sessions revoked");

  redirect("/account/login?reset=1");
}

/* ---------------------------- sessions ---------------------------- */

export async function revokeSessionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = Number(formData.get("id"));
  await revokeSession(user.id, id);
  const active = await listSessions(user.id);
  if (!active.length) {
    await destroyCurrentSession();
    redirect("/account/login");
  }
  revalidatePath("/account/sessions");
}

export async function signOutEverywhereAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await revokeAllSessions(user.id);
  await destroyCurrentSession();
  redirect("/account/login?signedout=1");
}

