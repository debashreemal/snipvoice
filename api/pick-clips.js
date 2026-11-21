import { getSupabase } from './_lib/supabase.js';
import { askJson } from './_lib/groq.js';

// Convert MM:SS or HH:MM:SS to total seconds
function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim().replace(/^\[|\]$/g, '');
  const parts = cleaned.split(':').map((p) => Number(p));
  if (parts.some((n) => isNaN(n))) return null;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0];
}

const VALID_HOOK_TYPES = new Set(['Question', 'Bold claim', 'Story', 'Stat']);

// Validate Groq response according to specification rules
function validateAndCleanClips(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const rawList = parsed.clips;
  if (!Array.isArray(rawList)) return null;

  // Accept 3 to 5 clips
  if (rawList.length < 3) return null;
  const candidateClips = rawList.slice(0, 5);

  const cleaned = [];

  for (const item of candidateClips) {
    if (!item || typeof item !== 'object') return null;
    const startStr = typeof item.start === 'string' ? item.start.trim() : '';
    const endStr = typeof item.end === 'string' ? item.end.trim() : '';
    const hook = typeof item.hook === 'string' ? item.hook.trim() : '';
    const reason = typeof item.reason === 'string' ? item.reason.trim() : '';

    if (!startStr || !endStr || !hook) return null;

    const startSec = parseTimeToSeconds(startStr);
    const endSec = parseTimeToSeconds(endStr);

    if (startSec === null || endSec === null || startSec >= endSec) {
      return null;
    }

    // Hook type validation: one of Question, Bold claim, Story, Stat (fallback to Bold claim)
    let hookType = item.hook_type || item.hookType || 'Bold claim';
    if (!VALID_HOOK_TYPES.has(hookType)) {
      hookType = 'Bold claim';
    }

    // Score: integer 0-100
    let score = parseInt(item.score, 10);
    if (isNaN(score)) score = 85;
    score = Math.min(100, Math.max(0, score));

    cleaned.push({
      start: startStr,
      end: endStr,
      hook,
      hook_type: hookType,
      reason: reason || 'High retention moment with a strong initial curiosity hook.',
      score,
    });
  }

  // Sort by score, highest first
  cleaned.sort((a, b) => b.score - a.score);

  return cleaned;
}

export default async function handler(req, res) {
  // Allow only POST
  if (req.method && req.method !== 'POST') {
    const errorResponse = { error: 'Method not allowed. Use POST.' };
    if (res && typeof res.status === 'function') {
      return res.status(405).json(errorResponse);
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Parse & validate input
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

    const title = (body?.title || '').trim();
    let transcript = (body?.transcript || '').trim();

    if (!title) {
      const errRes = { error: 'Project title is required.' };
      return res?.status ? res.status(400).json(errRes) : new Response(JSON.stringify(errRes), { status: 400 });
    }

    if (!transcript) {
      const errRes = { error: 'Transcript is required and cannot be empty.' };
      return res?.status ? res.status(400).json(errRes) : new Response(JSON.stringify(errRes), { status: 400 });
    }

    // If transcript is longer than 15,000 characters, cut to 15,000 and continue
    if (transcript.length > 15000) {
      transcript = transcript.slice(0, 15000);
    }

    // 2. Read saved brand voice from Supabase table brand_voice (id = 1)
    let brandVoiceContext = '';
    try {
      const sb = getSupabase();
      const { data: bvData } = await sb
        .from('brand_voice')
        .select('tone, use_words, avoid_words')
        .eq('id', 1)
        .maybeSingle();

      if (bvData) {
        brandVoiceContext = `\nCreator brand voice context:\n- Tone: ${bvData.tone || 'Direct & Punchy'}\n- Preferred vocabulary: ${bvData.use_words || 'None specified'}\n- Avoided vocabulary: ${bvData.avoid_words || 'None specified'}\n`;
      }
    } catch (bvErr) {
      // Contextual brand voice is supplementary; continue gracefully if absent
      console.warn('Brand voice lookup notice:', bvErr.message);
    }

    // 3. System Prompt for Groq
    const systemPrompt = `You are a short-form video editor for Indian creators. From the transcript, pick the 5 best moments to turn into clips. Return JSON only: {"clips":[{"start":"MM:SS","end":"MM:SS","hook":"the opening line of the clip, copied or lightly trimmed from the transcript","hook_type":"Question|Bold claim|Story|Stat","reason":"1 or 2 specific sentences on why this moment works","score":0-100}]}
Rules: use only timestamps that exist in the transcript. Each clip is 30 to 90 seconds. Clips must not overlap. Reasons must be specific (name the hook, emotion, surprise or takeaway), never generic. Sort by score, highest first.`;

    const userPrompt = `Project Title: ${title}\n${brandVoiceContext}\nTranscript:\n${transcript}`;

    // 4. Call askJson with retry once if parsing or validation fails
    let cleanedClips = null;
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const rawJson = await askJson(systemPrompt, userPrompt);
        const valid = validateAndCleanClips(rawJson);
        if (valid && valid.length >= 3) {
          cleanedClips = valid;
          break;
        } else {
          lastError = new Error('Model returned invalid clip structure or timestamp range');
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!cleanedClips || cleanedClips.length === 0) {
      console.error('Failed to pick clips after retry:', lastError?.message);
      const errRes = { error: 'Could not pick clips. Check your transcript and try again.' };
      return res?.status ? res.status(422).json(errRes) : new Response(JSON.stringify(errRes), { status: 422 });
    }

    // 5. Save row in projects & 5 rows in clips via Supabase
    const sb = getSupabase();

    const { data: projectRow, error: projectErr } = await sb
      .from('projects')
      .insert({
        title,
        transcript,
        status: 'clips_pending',
      })
      .select()
      .single();

    if (projectErr || !projectRow) {
      console.error('Database error saving project:', projectErr?.message);
      const errRes = { error: 'Could not save project to database. Please try again.' };
      return res?.status ? res.status(500).json(errRes) : new Response(JSON.stringify(errRes), { status: 500 });
    }

    const rowsToInsert = cleanedClips.map((clip) => ({
      project_id: projectRow.id,
      start_time: clip.start,
      end_time: clip.end,
      hook: clip.hook,
      hook_type: clip.hook_type,
      reason: clip.reason,
      score: clip.score,
      status: 'pending',
    }));

    const { data: clipsRows, error: clipsErr } = await sb
      .from('clips')
      .insert(rowsToInsert)
      .select();

    if (clipsErr || !clipsRows) {
      console.error('Database error saving clips:', clipsErr?.message);
      const errRes = { error: 'Could not save clips to database. Please try again.' };
      return res?.status ? res.status(500).json(errRes) : new Response(JSON.stringify(errRes), { status: 500 });
    }

    // 6. Return { project, clips } with database ids
    const payload = {
      project: projectRow,
      clips: clipsRows,
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 7. Never expose keys or raw error stacks to the frontend
    console.error('Unhandled pick-clips error:', error?.message);
    const safeError = { error: 'Could not pick clips. Check your transcript and try again.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
