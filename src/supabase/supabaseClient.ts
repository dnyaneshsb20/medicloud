import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://qsdsbsnnygtdjiwwumml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZHNic25ueWd0ZGppd3d1bW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTg1MTgsImV4cCI6MjA2NzI5NDUxOH0.5wMjiGOW-ih70pBYAUF_kiaBzhgQVFl-ejbJObv3eJk';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);