import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sqncqkxejmncuueegiau.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbmNxa3hlam1uY3V1ZWVnaWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMzE1MzMsImV4cCI6MjA2NDgwNzUzM30.r9rfACe7N4dGTMv4rNVwxKxiUUt7sOaH4to6nhC65r0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
