import { createClient } from '@supabase/supabase-js';

const meta = import.meta as unknown as { env: Record<string, string> };
const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://iqcpomnmkherjapoqkej.supabase.co';
const supabaseAnonKey =
  meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY3BvbW5ta2hlcmphcG9xa2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDkzODksImV4cCI6MjA4ODA4NTM4OX0.4-7fNC2D5vSdSDFRvlC1tlO-mMBnJlVXxr16oMhz_Os';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
