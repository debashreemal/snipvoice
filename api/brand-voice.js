import { getSupabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  let sb;
  try {
    sb = getSupabase();
  } catch (initErr) {
    console.error('Supabase client error:', initErr.message);
    const err = { error: 'Database connection configuration error.' };
    return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
  }

  const DEFAULT_USE = 'Jugaad, Hustle, Organic reach, Relatable, Bharat, Consistency, Ground reality';
  const DEFAULT_AVOID = 'Viral hack, Synergy, Guru, Guaranteed, 10x growth, Passive income';

  if (req.method === 'GET') {
    try {
      const { data: row } = await sb
        .from('brand_voice')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const payload = {
        tone: row?.tone || 'Direct & conversational',
        wordsIUse: row?.use_words && row.use_words.trim().length > 0 ? row.use_words : DEFAULT_USE,
        wordsIAvoid: row?.avoid_words && row.avoid_words.trim().length > 0 ? row.avoid_words : DEFAULT_AVOID,
      };

      if (res && typeof res.status === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Error fetching brand voice:', err.message);
      const fallback = {
        tone: 'Direct & conversational',
        wordsIUse: DEFAULT_USE,
        wordsIAvoid: DEFAULT_AVOID,
      };
      if (res && typeof res.status === 'function') {
        return res.status(200).json(fallback);
      }
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (req.method === 'POST') {
    const { tone, wordsIUse, wordsIAvoid } = req.body || {};

    try {
      const { data, error } = await sb
        .from('brand_voice')
        .upsert({
          id: 1,
          tone: tone || 'Direct & conversational',
          use_words: wordsIUse || '',
          avoid_words: wordsIAvoid || '',
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating brand voice:', error.message);
        const err = { error: 'Failed to save brand voice profile in database.' };
        return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
      }

      const payload = { success: true, brandVoice: data };
      if (res && typeof res.status === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Unhandled brand voice save error:', err.message);
      const safeError = { error: 'Could not update brand voice.' };
      if (res && typeof res.status === 'function') {
        return res.status(500).json(safeError);
      }
      return new Response(JSON.stringify(safeError), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const err = { error: 'Method not allowed.' };
  return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
}
