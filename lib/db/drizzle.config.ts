import { defineConfig } from "drizzle-kit";
import path from "path";

const url = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error("SUPABASE_DATABASE_URL または DATABASE_URL を設定してください。");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: !!process.env.SUPABASE_DATABASE_URL,
  },
});
