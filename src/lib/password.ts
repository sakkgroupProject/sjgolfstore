import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** scrypt parameters — OWASP-aligned for interactive login. */
export const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

function b64(buf: Buffer): string {
  return buf.toString("base64");
}

/**
 * Hash a password with scrypt and a unique per-password salt.
 * Format: v2$N$r$p$salt$hash  (base64 segments) — versioned so parameters can
 * be strengthened later without invalidating existing accounts.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  });
  return `v2$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${b64(salt)}$${b64(hash)}`;
}

/**
 * Constant-time password verification.
 * Accepts the current v2 format and the legacy `salt:hex` format used by early
 * seeds, so existing accounts keep working across upgrades.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (stored.startsWith("v2$")) {
      const [, nStr, rStr, pStr, saltB64, hashB64] = stored.split("$");
      const expected = Buffer.from(hashB64, "base64");
      const candidate = scryptSync(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
        N: Number(nStr),
        r: Number(rStr),
        p: Number(pStr),
      });
      return candidate.length === expected.length && timingSafeEqual(candidate, expected);
    }
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, "hex");
    const candidate = scryptSync(password, salt, 64);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export function passwordStrength(password: string): { ok: boolean; score: number; message: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const common = ["password", "12345678", "qwerty", "golf1234", "letmein", "admin123", "iloveyou"];
  if (password.length < 8 || common.some((w) => password.toLowerCase().includes(w))) {
    return { ok: false, score, message: "Use at least 8 characters and avoid common words." };
  }
  return {
    ok: score >= 3,
    score,
    message: score >= 4 ? "Strong password" : "Add capitals, numbers or symbols for a stronger password.",
  };
}
