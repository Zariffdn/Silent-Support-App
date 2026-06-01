const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in the values.',
  );
}

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
};
