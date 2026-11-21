import { getSupabase } from './_lib/supabase.js';

// Insights API: GET saved insights, POST new performance insights
export default async function handler(req, res) {
  let sb;
  try {
    sb = getSupabase();
  } catch (err) {
    const errorObj = { error: 'Database connection error.' };
    return res?.status ? res.status(500).json(errorObj) : new Response(JSON.stringify(errorObj), { status: 500 });
  }

  // GET: Fetch saved insights
  if (req.method === 'GET') {
    try {
      const { data, error } = await sb
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching insights:', error.message);
        const errObj = { error: 'Could not fetch insights.' };
        return res?.status ? res.status(500).json(errObj) : new Response(JSON.stringify(errObj), { status: 500 });
      }

      const payload = { insights: data || [] };
      if (res && typeof res.status === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      const errObj = { error: 'Failed to retrieve insights.' };
      return res?.status ? res.status(500).json(errObj) : new Response(JSON.stringify(errObj), { status: 500 });
    }
  }

  // POST: Save insights with computed performance metrics
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      } else if (!body && typeof req.json === 'function') {
        try { body = await req.json(); } catch { body = {}; }
      }

      const { insights, stats } = body || {};
      const itemsToSave = Array.isArray(insights) ? insights : [];

      for (const item of itemsToSave) {
        const text = typeof item === 'string' ? item : item.text;
        const payloadData = typeof item === 'object' ? item : { text, stats };
        await sb.from('insights').insert({
          text: JSON.stringify(payloadData),
        });
      }

      const payload = { success: true, count: itemsToSave.length };
      if (res && typeof res.status === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Failed to save insights:', e?.message);
      const errObj = { error: 'Failed to save insights.' };
      return res?.status ? res.status(500).json(errObj) : new Response(JSON.stringify(errObj), { status: 500 });
    }
  }

  const notAllowed = { error: 'Method not allowed.' };
  return res?.status ? res.status(405).json(notAllowed) : new Response(JSON.stringify(notAllowed), { status: 405 });
}
