import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
const r = await db.execute(sql`UPDATE stores SET lat = 34.850513, lng = 135.621597 WHERE id = 141`);
console.log("rows:", r.rowCount);
process.exit(0);
