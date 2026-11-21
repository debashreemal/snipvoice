/**
 * Health check endpoint for SnipVoice serverless backend.
 * Checks whether Groq and Supabase environment variables are present without exposing values.
 */
export default async function handler(req, res) {
  const hasGroq = Boolean(
    process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0
  );

  const hasSupabase = Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL.trim().length > 0 &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0
  );

  const hasGnani = Boolean(
    process.env.GNANI_API_KEY && process.env.GNANI_API_KEY.trim().length > 0
  );

  const payload = {
    ok: true,
    groq: hasGroq,
    supabase: hasSupabase,
    gnani: hasGnani,
  };

  // Support standard Vercel Node handler (res.status().json())
  if (res && typeof res.status === 'function') {
    return res.status(200).json(payload);
  }

  // Support Web standard Response if running in Web standard context
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
