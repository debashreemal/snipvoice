import { getSupabase } from './_lib/supabase.js';

// GET: Returns all voice_history rows ordered by created_at ascending
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    const err = { error: 'Method not allowed. Use GET.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('voice_history')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching voice_history:', error.message);
      const err = { error: 'Failed to fetch voice history.' };
      return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
    }

    const payload = { history: data || [] };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled voice_history error:', err?.message);
    const safeErr = { error: 'Could not fetch voice history.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeErr);
    }
    return new Response(JSON.stringify(safeErr), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
