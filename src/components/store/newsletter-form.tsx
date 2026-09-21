"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/app/actions/marketing";

export function NewsletterForm({ source = "footer", variant = "dark" }: { source?: string; variant?: "dark" | "light" }) {
  const [state, action, pending] = useActionState(subscribeAction, null);
  const dark = variant === "dark";

  return (
    <div>
      <form action={action} className={`flex flex-col gap-2 sm:flex-row`}>
        <input type="hidden" name="source" value={source} />
        <input
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          className={`flex-1 border px-4 py-3.5 text-sm outline-none transition ${
            dark
              ? "border-white/25 bg-transparent text-white placeholder:text-white/50 focus:border-white"
              : "border-line bg-white text-ink placeholder:text-moss focus:border-forest"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`btn ${dark ? "bg-white text-forest hover:bg-paper-warm" : "btn-primary"} shrink-0`}
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>
      {state ? (
        <p className={`mt-3 text-sm ${state.ok ? (dark ? "text-sand" : "text-forest") : "text-red-500"}`}>{state.message}</p>
      ) : (
        <p className={`mt-3 text-xs ${dark ? "text-white/50" : "text-ink-soft"}`}>
          We send one email a week. Unsubscribe any time. See our Privacy Policy.
        </p>
      )}
    </div>
  );
}
