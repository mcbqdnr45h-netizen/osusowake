import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
const r = await db.execute(sql`UPDATE stores SET lat = 34.8506443, lng = 135.6215961 WHERE id = 141`);
console.log("rows:", r.rowCount);
process.exit(0);
