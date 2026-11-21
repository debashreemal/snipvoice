import { getSupabase } from './_lib/supabase.js';

// POST: Reset demo data (clears edits, learned notes, voice history, insights, and resets brand voice)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    const err = { error: 'Method not allowed. Use POST.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body && typeof req.json === 'function') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const { confirm } = body || {};
    if (confirm !== 'RESET') {
      const err = { error: 'Confirmation string must be exactly "RESET".' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
    }

    const sb = getSupabase();

    // 1. Delete all rows from edits, learned_notes, voice_history and insights
    await Promise.all([
      sb.from('edits').delete().filter('id', 'not.is', null),
      sb.from('learned_notes').delete().filter('id', 'not.is', null),
      sb.from('voice_history').delete().filter('id', 'not.is', null),
      sb.from('insights').delete().filter('id', 'not.is', null),
    ]);

    // 2. Reset brand_voice row 1 (tone 'Direct', use_words '', avoid_words '')
    await sb.from('brand_voice').upsert({
      id: 1,
      tone: 'Direct',
      use_words: '',
      avoid_words: '',
    });

    const payload = { success: true, message: 'Demo data cleared.' };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled reset error:', err?.message);
    const safeErr = { error: 'Could not reset demo data.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeErr);
    }
    return new Response(JSON.stringify(safeErr), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
