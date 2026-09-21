/**
 * Manual bootstrap for a brand-new environment.
 *
 *   npx tsx scripts/setup.ts
 *
 * 1. Creates every table if missing (idempotent DDL)
 * 2. Seeds the full demo catalogue when the database is empty
 *
 * The running server performs this automatically on first use, so this
 * script is optional — handy for CI, docker entrypoints, or verifying a
 * fresh database before starting the app.
 */
import { ensureSeeded, seedDatabase } from "../src/db/seed";

const reset = process.argv.includes("--reset");

async function main() {
  console.log("SJ Golf Store — database bootstrap");
  if (reset) {
    console.log("--reset flag detected: wiping and reseeding…");
    await seedDatabase();
    console.log("Database reset and seeded.");
    return;
  }
  await ensureSeeded();
  console.log("Schema ready · catalogue seeded (if empty).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  });
