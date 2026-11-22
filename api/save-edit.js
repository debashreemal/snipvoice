import { getSupabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    const err = { error: 'Method not allowed. Use POST.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
  }

  const { projectId, clipId, platform, originalText, editedText, detectedNotes } = req.body || {};

  if (!editedText) {
    const err = { error: 'Edited text cannot be empty.' };
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
    // 1. Insert row into edits table
    const { error: editErr } = await sb.from('edits').insert([
      {
        project_id: projectId || null,
        platform: (platform || 'Instagram').toLowerCase(),
        original_text: originalText || '',
        edited_text: editedText,
      },
    ]);
    if (editErr) {
      console.warn('Could not insert edit record:', editErr.message);
    }

    // 2. Update captions table if clipId is present (including voice_match: 92)
    if (clipId && platform) {
      // Find matching platform name case-insensitively
      const platStr = platform.toLowerCase();
      const capPlatform = platStr === 'instagram' ? 'Instagram' : platStr === 'linkedin' ? 'LinkedIn' : 'X';

      const { error: capErr } = await sb
        .from('captions')
        .update({
          edited_text: editedText,
          voice_match: 92,
        })
        .eq('clip_id', clipId)
        .ilike('platform', capPlatform);

      if (capErr) {
        console.warn('Could not update caption edited_text:', capErr.message);
      }
    }

    // 3. Fallback rule detection if no notes passed but text changed
    const safeNotes = Array.isArray(detectedNotes) ? [...detectedNotes] : [];
    if (safeNotes.length === 0 && originalText && editedText && originalText.trim() !== editedText.trim()) {
      if (editedText.length < originalText.length) {
        safeNotes.push('Prefers concise phrasing');
      } else {
        safeNotes.push('Refined personal voice');
      }
    }

    // 4. Insert newly detected learned rules into learned_notes
    if (safeNotes.length > 0) {
      // Check existing notes to avoid duplicates
      const { data: existingNotes } = await sb.from('learned_notes').select('note');
      const existingSet = new Set((existingNotes || []).map((n) => n.note.trim().toLowerCase()));

      const notesToInsert = safeNotes
        .filter((n) => n && typeof n === 'string' && !existingSet.has(n.trim().toLowerCase()))
        .map((n) => ({ note: n.trim() }));

      if (notesToInsert.length > 0) {
        const { error: notesErr } = await sb.from('learned_notes').insert(notesToInsert);
        if (notesErr) {
          console.warn('Could not insert learned_notes:', notesErr.message);
        }
      }
    }

    // 5. Update voice_history trend row
    if (projectId) {
      const { data: currentEdits } = await sb.from('edits').select('id');
      const editsCount = (currentEdits || []).length || 1;
      await sb.from('voice_history').insert([{
        project_id: projectId,
        edits_count: editsCount,
        avg_match: 92,
      }]).catch((vhErr) => console.warn('Could not insert voice_history row:', vhErr?.message));
    }

    const payload = { success: true };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled save edit error:', err.message);
    const safeError = { error: 'Could not save caption edit to database.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
