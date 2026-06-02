// Silent Support — "delete-account" Edge Function (Deno).
//
// Permanently deletes the CALLER's own account. Security model:
//   - The caller is identified from THEIR OWN access token (getUser), so a user
//     can only ever delete themselves — never an id passed in the body.
//   - The service-role key lives only here, server-side (auto-injected by
//     Supabase as SUPABASE_SERVICE_ROLE_KEY). It is never shipped to the client.
//   - Deleting the auth user cascades (ON DELETE CASCADE) to emotion_logs, so
//     all of the user's backed-up check-ins are removed too.
//
// Deploy with "Verify JWT" ENABLED (the default) so unauthenticated calls are
// rejected at the gateway before this code even runs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'Not authenticated' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'Server not configured' }, 500);

  // 1. Identify the caller from their own token. This is the only id we trust.
  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401);
  const userId = userData.user.id;

  // 2. Delete with the service role. Cascade removes the user's emotion_logs.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return json({ error: 'Could not delete account' }, 500);

  return json({ ok: true });
});
