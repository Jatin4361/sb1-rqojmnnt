import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovkcfuwhyymfremtotkr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92a2NmdXdoeXltZnJlbXRvdGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTY2OTIsImV4cCI6MjA1MjE5MjY5Mn0.LJC8GyjyPIlvRbt-lwoyP-4kTUDzZ8RRj-Lv154LA6c';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);