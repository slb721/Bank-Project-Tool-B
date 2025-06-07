import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqncqkxejmncuueegiau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
