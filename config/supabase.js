import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_SUPABASE_URL = "https://zfxkqnwmydzoqqojrjms.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeGtxbndteWR6b3Fxb2pyam1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg0OTcxNSwiZXhwIjoyMTA2NDI1NzE1fQ.7nTP5pcR-CVXv4bZS9e86D_DxPgnqIgyZeiMpLDTVdc";

const supabaseUrl = process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  DEFAULT_SUPABASE_URL;

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  DEFAULT_SUPABASE_KEY;

if (process.env.NODE_ENV !== "test") {
  const isServiceRole = supabaseKey.includes("service_role") || Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(`📡 Supabase Client connected to: ${supabaseUrl}`);
  console.log(`🔑 Supabase Auth mode: ${isServiceRole ? "Service Role (Full Admin Access)" : "Anon / Public Key"}`);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
