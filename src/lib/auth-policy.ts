/** Shared, importable-from-anywhere auth policy constants. */
export const LOCKOUT_THRESHOLD = 6;
export const LOCKOUT_MINUTES = 15;
export const SESSION_TTL_DAYS = 14;
export const MAX_SESSIONS_PER_USER = 12;
export const RATE_LIMITS = {
  login: { limit: 8, windowSeconds: 300 },
  register: { limit: 5, windowSeconds: 3600 },
  passwordReset: { limit: 4, windowSeconds: 900 },
  passwordResetUse: { limit: 8, windowSeconds: 900 },
  passwordChange: { limit: 5, windowSeconds: 900 },
  checkout: { limit: 40, windowSeconds: 600 },
  contact: { limit: 20, windowSeconds: 3600 },
  newsletter: { limit: 60, windowSeconds: 3600 },
} as const;
