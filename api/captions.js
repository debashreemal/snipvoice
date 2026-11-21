import { getSupabase } from './_lib/supabase.js';
import { askJson } from './_lib/groq.js';

// Parse MM:SS or HH:MM:SS to seconds
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;
  const cleaned = String(timeStr).replace(/[\[\]]/g, '').trim();
  const parts = cleaned.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

// Extract transcript slice between start_time and end_time
function extractTranscriptSlice(fullTranscript, startTimeStr, endTimeStr) {
  if (!fullTranscript) return '';
  const startSec = parseTimeToSeconds(startTimeStr);
  const endSec = parseTimeToSeconds(endTimeStr);

  if (startSec === null || endSec === null || startSec >= endSec) {
    return fullTranscript.slice(0, 4000);
  }

  const lines = fullTranscript.split('\n');
  const matchedLines = [];

  for (const line of lines) {
    const match = line.match(/(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?/);
    if (match) {
      const lineSec = parseTimeToSeconds(match[1]);
      if (lineSec !== null && lineSec >= startSec && lineSec <= endSec) {
        matchedLines.push(line);
      }
    }
  }

  if (matchedLines.length > 0) {
    return matchedLines.join('\n');
  }

  return fullTranscript.slice(0, 4000);
}

// Remove any avoided words that slipped in
function removeAvoidedWords(text, avoidWordsStr) {
  if (!text || !avoidWordsStr) return text;
  const words = avoidWordsStr
    .split(/[,;\n]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);

  let cleaned = text;
  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

// Compute voice_match percentage in code
function computeVoiceMatch(text, platform, brandVoice, learnedNotes) {
  const avoidList = (brandVoice?.avoid_words || '')
    .split(/[,;\n]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 1);

  const notesList = (learnedNotes || [])
    .map((n) => (n.note || '').trim())
    .filter(Boolean);

  // If no learned notes and no avoid words, voice_match is null
  if (avoidList.length === 0 && notesList.length === 0) {
    return null;
  }

  const checklist = [];
  const lowerText = text.toLowerCase();

  // 1. Checklist item for each avoided word
  for (const word of avoidList) {
    checklist.push(!lowerText.includes(word));
  }

  // 2. Checklist items derived from learned notes
  for (const note of notesList) {
    const lowerNote = note.toLowerCase();

    if (lowerNote.includes('emoji')) {
      // Check: zero emojis in text
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(text);
      checklist.push(!hasEmoji);
    } else if (lowerNote.includes('hashtag')) {
      // Check: no hashtag spam
      const hashtagCount = (text.match(/#[a-zA-Z0-9_]+/g) || []).length;
      checklist.push(hashtagCount <= 2);
    } else if (lowerNote.includes('short') || lowerNote.includes('concise') || lowerNote.includes('punchy')) {
      // Check: concise sentences
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const isConcise = sentences.every((s) => s.trim().split(/\s+/).length < 25);
      checklist.push(isConcise);
    } else if (lowerNote.includes('question')) {
      // Check: includes a question mark
      checklist.push(text.includes('?'));
    } else if (lowerNote.includes('no corporate') || lowerNote.includes('jargon')) {
      const buzzwords = ['synergy', 'bandwidth', 'leverage', 'circle back', 'game changer'];
      const hasBuzzword = buzzwords.some((b) => lowerText.includes(b));
      checklist.push(!hasBuzzword);
    } else {
      // Generic style check: avoids clickbait spam
      const hasClickbait = /link in bio|click here|follow for more/i.test(text);
      checklist.push(!hasClickbait);
    }
  }

  if (checklist.length === 0) return null;

  const passed = checklist.filter(Boolean).length;
  const score = Math.round((passed / checklist.length) * 100);
  return Math.min(100, Math.max(0, score));
}

// Normalize platform string (e.g. 'instagram' -> 'Instagram')
function normalizePlatform(p) {
  if (!p) return 'Instagram';
  const lower = String(p).trim().toLowerCase();
  if (lower === 'instagram') return 'Instagram';
  if (lower === 'linkedin') return 'LinkedIn';
  if (lower === 'x' || lower === 'twitter') return 'X';
  return p;
}

export default async function handler(req, res) {
  const sb = getSupabase();

  // -------------------------------------------------------------
  // GET: Fetch existing captions for a clip or project
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, 'http://localhost');
      const clipId = url.searchParams.get('clipId');
      const projectId = url.searchParams.get('projectId');

      if (!clipId && !projectId) {
        const err = { error: 'clipId or projectId query parameter is required.' };
        return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
      }

      let query = sb.from('captions').select('*');
      if (clipId) {
        query = query.eq('clip_id', clipId);
      } else if (projectId) {
        const { data: projClips } = await sb.from('clips').select('id').eq('project_id', projectId);
        const clipIds = (projClips || []).map((c) => c.id);
        if (clipIds.length === 0) {
          return res?.status ? res.status(200).json({ captions: [] }) : new Response(JSON.stringify({ captions: [] }), { status: 200 });
        }
        query = query.in('clip_id', clipIds);
      }

      const { data: rows, error: qErr } = await query;
      if (qErr) {
        console.error('Fetch captions error:', qErr.message);
        const err = { error: 'Could not fetch captions.' };
        return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
      }

      const formatted = (rows || []).map((r) => ({
        id: r.id,
        clipId: r.clip_id,
        platform: normalizePlatform(r.platform),
        text: r.edited_text || r.original_text || '',
        original: r.original_text || '',
        voice_match: r.voice_match,
        isEdited: Boolean(r.edited_text),
      }));

      const payload = { captions: formatted };
      return res?.status ? res.status(200).json(payload) : new Response(JSON.stringify(payload), { status: 200 });
    } catch (err) {
      console.error('GET /api/captions unhandled error:', err?.message);
      const safeErr = { error: 'Could not fetch captions.' };
      return res?.status ? res.status(500).json(safeErr) : new Response(JSON.stringify(safeErr), { status: 500 });
    }
  }

  // -------------------------------------------------------------
  // POST: Generate or regenerate captions
  // -------------------------------------------------------------
  if (req.method !== 'POST') {
    const err = { error: 'Method not allowed. Use GET or POST.' };
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

    const { clipId } = body || {};
    let rawPlatforms = body?.platforms;
    if (!Array.isArray(rawPlatforms) || rawPlatforms.length === 0) {
      rawPlatforms = ['Instagram', 'LinkedIn', 'X'];
    }

    const requestedPlatforms = Array.from(new Set(rawPlatforms.map(normalizePlatform)));

    if (!clipId) {
      const err = { error: 'clipId is required.' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
    }

    // 2. Load from Supabase:
    // a. Clip and project transcript
    const { data: clip, error: clipErr } = await sb
      .from('clips')
      .select('id, project_id, hook, hook_type, reason, start_time, end_time')
      .eq('id', clipId)
      .maybeSingle();

    if (clipErr || !clip) {
      console.error('Clip not found:', clipErr?.message);
      const err = { error: 'Clip not found.' };
      return res?.status ? res.status(404).json(err) : new Response(JSON.stringify(err), { status: 404 });
    }

    let projectTranscript = '';
    if (clip.project_id) {
      const { data: proj } = await sb
        .from('projects')
        .select('transcript')
        .eq('id', clip.project_id)
        .maybeSingle();
      projectTranscript = proj?.transcript || '';
    }

    // b. Transcript lines between start_time and end_time
    const clipContent = extractTranscriptSlice(projectTranscript, clip.start_time, clip.end_time);

    // c. brand_voice (id = 1)
    const { data: brandVoice } = await sb
      .from('brand_voice')
      .select('tone, use_words, avoid_words')
      .eq('id', 1)
      .maybeSingle();

    // d. learned_notes: all notes
    const { data: learnedNotes } = await sb
      .from('learned_notes')
      .select('note')
      .order('created_at', { ascending: false });

    // e. edits: last 5 rows (original_text, edited_text)
    const { data: lastEdits } = await sb
      .from('edits')
      .select('platform, original_text, edited_text')
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Groq Prompt Construction
    const toneStr = brandVoice?.tone || 'Direct & Punchy';
    const useWordsStr = brandVoice?.use_words || 'None specified';
    const avoidWordsStr = brandVoice?.avoid_words || 'None specified';

    let notesStr = 'None yet.';
    if (learnedNotes && learnedNotes.length > 0) {
      notesStr = learnedNotes
        .map((n) => n.note)
        .filter(Boolean)
        .join('; ');
    }

    let beforeAfterStr = 'None yet.';
    if (lastEdits && lastEdits.length > 0) {
      beforeAfterStr = lastEdits
        .map(
          (e, idx) =>
            `Example ${idx + 1} (${e.platform || 'General'}):\nBEFORE: "${e.original_text}"\nAFTER: "${e.edited_text}"`
        )
        .join('\n\n');
    }

    const systemPrompt = `You write social media captions for an Indian creator, in the creator's own voice. Write in the same language style as the clip content (Hinglish stays Hinglish, in Roman letters). Return JSON only: {"captions":[{"platform":"Instagram|LinkedIn|X","text":"..."}]}.
Platform rules: Instagram is short, conversational, with a hook in the first line. LinkedIn is a bit longer, a clear point and a takeaway, no hashtag spam. X is under 280 characters.
VOICE RULES (highest priority, always follow them): tone is ${toneStr}. Use these words when natural: ${useWordsStr}. Never use these words: ${avoidWordsStr}. Learned style notes: ${notesStr}.
STYLE EXAMPLES from this creator's own edits. Match the style of the AFTER versions, not the BEFORE versions:
${beforeAfterStr}
${notesStr === 'None yet.' && beforeAfterStr === 'None yet.' ? 'If there are no edits and no notes, write a normal good caption and do not invent style rules.' : ''}`;

    const userPrompt = `Hook: "${clip.hook}"
Hook Type: ${clip.hook_type || 'Bold claim'}
Why Picked: ${clip.reason || 'High retention moment'}
Clip Content:
${clipContent}

Generate captions ONLY for these platforms: ${requestedPlatforms.join(', ')}.`;

    // 4. Call askJson with 1 retry on invalid format
    let generatedCaptions = null;
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const rawJson = await askJson(systemPrompt, userPrompt);
        if (rawJson && Array.isArray(rawJson.captions) && rawJson.captions.length > 0) {
          generatedCaptions = rawJson.captions;
          break;
        } else {
          lastError = new Error('Model did not return captions array');
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!generatedCaptions) {
      console.error('Failed to generate captions after retry:', lastError?.message);
      const err = { error: 'Could not write captions. Check your input and try again.' };
      return res?.status ? res.status(422).json(err) : new Response(JSON.stringify(err), { status: 422 });
    }

    // Enforce rules in code
    const results = [];

    for (const plat of requestedPlatforms) {
      // Find matching item from generated output
      const found = generatedCaptions.find(
        (c) => normalizePlatform(c.platform).toLowerCase() === plat.toLowerCase()
      );

      let text = (found?.text || '').trim();
      if (!text) {
        // Fallback text if model omitted requested platform
        text = `${clip.hook}\n\nKey takeaway: ${clip.reason || 'Watch till the end!'}`;
      }

      // Remove avoided words if they slipped in
      text = removeAvoidedWords(text, brandVoice?.avoid_words);

      // Cut X captions to 280 characters
      if (plat === 'X' && text.length > 280) {
        text = text.slice(0, 277).trim() + '...';
      }

      // 5. Compute voice_match in code
      const voiceMatch = computeVoiceMatch(text, plat, brandVoice, learnedNotes);

      // 6. Save: upsert one row per clip and platform in captions
      // Regenerating replaces the previous generated text for that platform only if it was not edited.
      const { data: existing } = await sb
        .from('captions')
        .select('id, original_text, edited_text, voice_match')
        .eq('clip_id', clip.id)
        .eq('platform', plat)
        .maybeSingle();

      let savedId = null;
      let returnedText = text;

      if (existing) {
        savedId = existing.id;
        if (!existing.edited_text) {
          // Unedited -> overwrite original_text and voice_match
          await sb
            .from('captions')
            .update({
              original_text: text,
              voice_match: voiceMatch,
            })
            .eq('id', existing.id);
          returnedText = text;
        } else {
          // If it was edited, preserve existing.edited_text
          returnedText = existing.edited_text;
        }
      } else {
        const { data: inserted, error: insErr } = await sb
          .from('captions')
          .insert({
            clip_id: clip.id,
            platform: plat,
            original_text: text,
            edited_text: null,
            voice_match: voiceMatch,
          })
          .select('id')
          .single();

        if (insErr) {
          console.error('Insert caption error:', insErr.message);
        }
        savedId = inserted?.id || `cap-${Date.now()}-${plat}`;
      }

      results.push({
        id: savedId,
        clipId: clip.id,
        platform: plat,
        text: returnedText,
        voice_match: voiceMatch,
      });
    }

    // 7. Return payload
    const payload = { captions: results };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unhandled captions error:', error?.message);
    const safeError = { error: 'Could not write captions. Try again.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
