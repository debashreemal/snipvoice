import { getSupabase } from './_lib/supabase.js';

// POST /api/update-project: Updates project metadata (e.g. title) in Supabase
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    const err = { error: 'Method not allowed. Use POST.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
  }

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

  const { id, title } = body || {};

  if (!id || !title || !title.trim()) {
    const err = { error: 'Project id and non-empty title are required.' };
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
      .from('projects')
      .update({ title: title.trim() })
      .eq('id', id);

    if (error) {
      console.error('Error updating project title in Supabase:', error.message);
      const safeErr = { error: 'Could not update project title.' };
      return res?.status ? res.status(500).json(safeErr) : new Response(JSON.stringify(safeErr), { status: 500 });
    }

    const payload = { success: true, title: title.trim() };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled update-project error:', err.message);
    const safeError = { error: 'Could not update project title.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
