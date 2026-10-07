import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_SUPABASE_URL = "https://zfxkqnwmydzoqqojrjms.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeGtxbndteWR6b3Fxb2pyam1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg0OTcxNSwiZXhwIjoyMTA2NDI1NzE1fQ.7nTP5pcR-CVXv4bZS9e86D_DxPgnqIgyZeiMpLDTVdc";

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
