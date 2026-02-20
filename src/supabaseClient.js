import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pboirnjiyytbvihtdpgb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBib2lybmppeXl0YnZpaHRkcGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTQzNjMsImV4cCI6MjA4MDczMDM2M30.EzpBH1jvIqgDRAX-UMdLfghUO40yxiG6ODC5iGK0xHc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
