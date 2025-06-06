import { createClient } from '@supabase/supabase-js';

// Your Supabase details (set these in StackBlitz Env panel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hard‐coded test user ID (must match a row you insert manually in Supabase)
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';
