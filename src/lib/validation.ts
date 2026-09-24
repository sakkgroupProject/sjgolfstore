import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(160);

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(30, "Phone number is too long.")
  .regex(/^\+?[0-9().\s-]+$/, "Enter a valid phone number.")
  .refine((value) => value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15, "Enter a valid phone number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(200),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "Password is too long.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/\d/, "Password must contain a number."),
  acceptsMarketing: z.boolean().optional().default(false),
});

export const profileSchema = z.object({
  firstName: z.string().trim().max(60).default(""),
  lastName: z.string().trim().max(60).default(""),
  phone: z.string().trim().max(30).default(""),
  acceptsMarketing: z.boolean().optional().default(false),
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(8, "New password must be at least 8 characters.").max(200),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).default("Home"),
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  address1: z.string().trim().min(3, "Street address is required.").max(160),
  address2: z.string().trim().max(160).default(""),
  city: z.string().trim().min(1, "City is required.").max(80),
  state: z.string().trim().length(2, "Use a 2-letter state code.").toUpperCase(),
  postalCode: z.string().trim().min(3, "ZIP is required.").max(12),
  country: z.string().trim().max(60).default("United States"),
  phone: z.string().trim().max(30).default(""),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  address1: z.string().trim().min(3, "Street address is required.").max(160),
  address2: z.string().trim().max(160).default(""),
  city: z.string().trim().min(1, "City is required.").max(80),
  state: z.string().trim().min(2).max(2).toUpperCase(),
  postalCode: z.string().trim().min(3, "ZIP is required.").max(12),
  country: z.string().trim().max(60).default("United States"),
  shippingRateId: z.number().int().positive(),
  cardName: z.string().trim().min(2, "Name on card is required.").max(80),
  cardNumber: z.string().min(13, "Enter a valid card number.").max(25),
  cardExpiry: z.string().regex(/^\d{2}\s?\/\s?\d{2}$/, "Use MM/YY format."),
  cardCvc: z.string().regex(/^\d{3,4}$/, "Enter the 3 or 4 digit code."),
  notes: z.string().trim().max(500).default(""),
  createAccount: z.boolean().optional().default(false),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  email: emailSchema,
  subject: z.string().trim().max(120).default(""),
  message: z.string().trim().min(10, "Please add a little more detail.").max(2000),
});

export const subscribeSchema = z.object({
  email: emailSchema,
  source: z.string().trim().max(40).default("footer"),
});

export const discountSchema = z
  .object({ code: z.string().trim().min(1).max(40) })
  .transform((v: { code: string }) => ({ code: v.code.toUpperCase() }));

export const trackOrderSchema = z.object({
  number: z.string().trim().min(3, "Enter your order number.").max(30).toUpperCase(),
  email: emailSchema,
});

/** Strips characters that have no business in a Luhn-valid card number. */
export function luhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
