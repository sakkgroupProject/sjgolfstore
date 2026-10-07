import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`ALTER TABLE variants ADD COLUMN variant_images jsonb DEFAULT '[]'::jsonb NOT NULL;`);
  console.log('Done');
}

run().catch(console.error);
