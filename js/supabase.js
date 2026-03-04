console.log("🔥 supabase.js LOADED");
/**
 * Supabase Client Initialization
 * Hardened for production stability.
 */
const SUPABASE_URL = "https://gipxccfydceahzmqdoks.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpcHhjY2Z5ZGNlYWh6bXFkb2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjI2NDQsImV4cCI6MjA4NjAzODY0NH0.evPHM1GdBOufR2v2KYARiG8r81McUtUAPNVovn6P6-s";

console.log("ACTIVE SUPABASE URL:", SUPABASE_URL);

// Force initialization as requested
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("🔥 Supabase Client Ready:", window.supabaseClient);

console.log("Client Project URL:", window.supabaseClient?.supabaseUrl);
console.log("Supabase Client Hardened & Initialized.");
