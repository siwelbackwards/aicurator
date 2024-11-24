import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjiguvbovteakpnkkjtb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqaWd1dmJvdnRlYWtwbmtranRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwMjM4MjcsImV4cCI6MjA0NzU5OTgyN30.wR1CEikYQtfR-aLFCNQ91de0B2dWDDn4rgPAGrW1tdg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});