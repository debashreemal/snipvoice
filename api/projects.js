import { getSupabase } from './_lib/supabase.js';

// Calculate relative time string from ISO date (e.g. 'Just now', '2 hours ago', 'Yesterday')
function formatRelativeTime(isoString) {
  if (!isoString) return 'Recently';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(isoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Convert MM:SS to total seconds
function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const cleaned = timeStr.trim().replace(/^\[|\]$/g, '');
  const parts = cleaned.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    const err = { error: 'Method not allowed. Use GET.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
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
    // 1. Fetch projects, clips, captions, brand_voice, learned_notes, edits in parallel
    const [
      { data: projectsRows, error: pErr },
      { data: clipsRows, error: cErr },
      { data: captionsRows, error: capErr },
      { data: brandVoiceRow, error: bvErr },
      { data: notesRows, error: nErr },
      { data: editsRows, error: edErr },
    ] = await Promise.all([
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('clips').select('*').order('created_at', { ascending: true }),
      sb.from('captions').select('*'),
      sb.from('brand_voice').select('*').eq('id', 1).maybeSingle(),
      sb.from('learned_notes').select('*').order('created_at', { ascending: false }),
      sb.from('edits').select('*').order('created_at', { ascending: false }),
    ]);

    if (pErr) console.error('Error fetching projects:', pErr.message);
    if (cErr) console.error('Error fetching clips:', cErr.message);
    if (capErr) console.error('Error fetching captions:', capErr.message);

    const safeProjects = projectsRows || [];
    const safeClips = clipsRows || [];
    const safeCaptions = captionsRows || [];

    // Map captions by clip_id and platform for fast lookup
    const captionsMap = {};
    for (const cap of safeCaptions) {
      const platKey = (cap.platform || '').toLowerCase().trim();
      const key = `${cap.clip_id}_${platKey}`;
      captionsMap[key] = {
        id: cap.id,
        text: cap.edited_text || cap.original_text || '',
        original: cap.original_text || '',
        voiceMatch: cap.voice_match,
        isEdited: Boolean(cap.edited_text && cap.edited_text !== cap.original_text),
        regeneratedAfterEdit: false,
      };
    }

    // Format projects with their corresponding clips and captionsState
    const formattedProjects = safeProjects.map((p) => {
      const projectClips = safeClips.filter((c) => c.project_id === p.id);

      const formattedClips = projectClips.map((c) => {
        let durationStr = '45 sec';
        if (c.start_time && c.end_time) {
          const diff = parseTimeToSeconds(c.end_time) - parseTimeToSeconds(c.start_time);
          if (diff > 0) durationStr = `${diff} sec`;
        }

        return {
          id: c.id,
          project_id: p.id,
          timeRange: `${c.start_time} - ${c.end_time}`,
          duration: durationStr,
          hookLine: c.hook || '',
          hookType: c.hook_type || 'Bold claim',
          reason: c.reason || '',
          score: typeof c.score === 'number' ? c.score : (parseInt(c.score, 10) || 85),
          status: c.status === 'approved' ? 'approved' : c.status === 'rejected' ? 'rejected' : null,
        };
      });

      // Build captionsState for this project's clips
      const captionsState = {};
      const platforms = ['instagram', 'linkedin', 'x'];

      for (const clip of formattedClips) {
        for (const plat of platforms) {
          const key = `${clip.id}_${plat}`;
          if (captionsMap[key]) {
            captionsState[key] = captionsMap[key];
          } else {
            captionsState[key] = {
              text: '',
              original: '',
              voiceMatch: null,
              isEdited: false,
              regeneratedAfterEdit: false,
            };
          }
        }
      }

      return {
        id: p.id,
        title: p.title || 'Untitled Project',
        createdAt: formatRelativeTime(p.created_at),
        transcript: p.transcript || '',
        clips: formattedClips,
        captionsState,
        scheduledCount: 0,
        postedCount: 0,
      };
    });

    // Format Brand Voice with sensible Indian creator defaults
    const DEFAULT_USE = 'Jugaad, Hustle, Organic reach, Relatable, Bharat, Consistency, Ground reality';
    const DEFAULT_AVOID = 'Viral hack, Synergy, Guru, Guaranteed, 10x growth, Passive income';

    const brandVoice = brandVoiceRow
      ? {
          tone: brandVoiceRow.tone || 'Direct & conversational',
          wordsIUse: brandVoiceRow.use_words && brandVoiceRow.use_words.trim().length > 0 ? brandVoiceRow.use_words : DEFAULT_USE,
          wordsIAvoid: brandVoiceRow.avoid_words && brandVoiceRow.avoid_words.trim().length > 0 ? brandVoiceRow.avoid_words : DEFAULT_AVOID,
        }
      : {
          tone: 'Direct & conversational',
          wordsIUse: DEFAULT_USE,
          wordsIAvoid: DEFAULT_AVOID,
        };

    // Format Learned Notes
    const learnedNotes = (notesRows || []).map((n) => n.note).filter(Boolean);

    // Format Edits
    const edits = (editsRows || []).map((ed) => {
      const proj = safeProjects.find((p) => p.id === ed.project_id);
      return {
        id: ed.id,
        projectId: ed.project_id,
        projectName: proj?.title || 'Project',
        platform: (ed.platform || 'instagram').toLowerCase(),
        original: ed.original_text || '',
        edited: ed.edited_text || '',
        timestamp: formatRelativeTime(ed.created_at),
      };
    });

    // Auto-recover any edited captions not yet in edits table (e.g. after reset)
    if (edits.length === 0) {
      const editedCaptions = safeCaptions.filter(
        (c) => c.edited_text && c.original_text && c.edited_text !== c.original_text
      );
      for (const ec of editedCaptions) {
        const clip = safeClips.find((c) => c.id === ec.clip_id);
        const proj = safeProjects.find((p) => p.id === clip?.project_id);
        edits.push({
          id: `edit-${ec.id}`,
          projectId: proj?.id || null,
          projectName: proj?.title || 'Project',
          platform: (ec.platform || 'instagram').toLowerCase(),
          original: ec.original_text,
          edited: ec.edited_text,
          timestamp: formatRelativeTime(ec.created_at),
        });
        if (learnedNotes.length === 0) {
          learnedNotes.push('Removes emojis');
        }
      }
    }

    const payload = {
      projects: formattedProjects,
      brandVoice,
      learnedNotes,
      edits,
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled get projects error:', err.message);
    const safeError = { error: 'Could not load projects from database.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
