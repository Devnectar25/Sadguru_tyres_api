import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaFilePath = path.join(__dirname, "../schema.sql");

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:devnectar%402133@db.zfxkqnwmydzoqqojrjms.supabase.co:5432/postgres";

async function initializeDatabase() {
  console.log("=======================================================");
  console.log("🚀 CONNECTING TO SUPABASE POSTGRESQL DATABASE...");
  console.log(`Connection string: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }, // Required for Supabase cloud PostgreSQL connections
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL!");

    const sqlContent = fs.readFileSync(schemaFilePath, "utf8");
    console.log("Executing schema.sql to create database tables...");

    await client.query(sqlContent);
    console.log("=======================================================");
    console.log("🎉 SUCCESS! All tables successfully created in Supabase:");
    console.log("   - tyre_products");
    console.log("   - partner_brands");
    console.log("   - service_bookings");
    console.log("   - quote_inquiries");
    console.log("=======================================================");
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
  } finally {
    await client.end();
  }
}

initializeDatabase();
