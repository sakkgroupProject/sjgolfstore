import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Warms the database: creates the schema if missing and seeds the demo
    // catalogue on a brand-new install. Subsequent calls are a single
    // `select 1` round-trip.
    await ensureSeeded();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "connected", seeded: true });
  } catch (error) {
    console.error("[health] bootstrap failed:", error instanceof Error ? error.message : error);
    return Response.json({ ok: false, db: "unreachable" }, { status: 500 });
  }
}
