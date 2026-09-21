"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contactEnquiries, newsletterSubscribers } from "@/db/schema";
import { rateLimit } from "@/lib/auth";
import { contactSchema, fieldErrors, subscribeSchema } from "@/lib/validation";

export type MarketingState = { ok: boolean; message: string; errors?: Record<string, string> };

export async function subscribeAction(_prev: MarketingState | null, formData: FormData): Promise<MarketingState> {
  const parsed = subscribeSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    source: String(formData.get("source") ?? "footer"),
  });
  if (!parsed.success) {
    return { ok: false, message: fieldErrors(parsed.error).email ?? "Enter a valid email address." };
  }

  const limit = await rateLimit("newsletter:global", 60, 3600);
  if (!limit.ok) return { ok: false, message: "Too many requests right now. Please try again later." };

  try {
    const inserted = await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data.email, source: parsed.data.source })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) {
      return { ok: true, message: "You're already on the list — nothing else to do." };
    }
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "You're on the list. Watch your inbox for new gear." };
}

export async function contactAction(_prev: MarketingState | null, formData: FormData): Promise<MarketingState> {
  const parsed = contactSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, message: Object.values(errors)[0] ?? "Please complete every field.", errors };
  }

  const limit = await rateLimit("contact:global", 20, 3600);
  if (!limit.ok) return { ok: false, message: "Too many messages sent. Please try again later." };

  await db.insert(contactEnquiries).values({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  revalidatePath("/admin/notifications");
  return { ok: true, message: "Thanks — our team replies within one business day." };
}
