import { getSupabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    const err = { error: 'Method not allowed. Use POST.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
  }

  const { clipId, status } = req.body || {};

  if (!clipId || !status) {
    const err = { error: 'clipId and status are required.' };
    return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
  }

  let sb;
  try {
    sb = getSupabase();
  } catch (initErr) {
    console.error('Supabase client error:', initErr.message);
    const err = { error: 'Database connection configuration error.' };
    return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
  }

  try {
    const { error } = await sb
      .from('clips')
      .update({ status: status.toLowerCase() })
      .eq('id', clipId);

    if (error) {
      console.warn('Could not update clip status:', error.message);
      const err = { error: 'Failed to update clip status in database.' };
      return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
    }

    const payload = { success: true, clipId, status };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled update clip status error:', err.message);
    const safeError = { error: 'Could not update clip status.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
