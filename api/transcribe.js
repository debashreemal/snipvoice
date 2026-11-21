/**
 * Speech-to-Text transcription endpoint using Gnani.ai Prisma STT v3.
 * Accepts audio or video files and returns a transcript formatted with timestamps.
 * Includes automatic Groq Whisper fallback for video containers (.mp4/.mov) or format exceptions.
 */

// Helper to chunk sentences into timestamped lines [MM:SS] so pick-clips can extract time ranges
function formatTranscriptWithTimestamps(rawText) {
  if (!rawText || !rawText.trim()) return '';

  // If text already has [MM:SS] or similar timestamps, keep it intact
  if (/\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(rawText)) {
    return rawText.trim();
  }

  // Split by Indic and English sentence terminators (. ? ! । or newline)
  const sentences = rawText
    .split(/(?<=[.?!।\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let currentSec = 10;
  const lines = [];

  for (let i = 0; i < sentences.length; i++) {
    const mins = String(Math.floor(currentSec / 60)).padStart(2, '0');
    const secs = String(currentSec % 60).padStart(2, '0');
    lines.push(`[${mins}:${secs}] ${sentences[i]}`);
    // Approximate speaking pace: ~2.5 words per second
    const wordCount = sentences[i].split(/\s+/).length;
    const duration = Math.max(8, Math.min(30, Math.round(wordCount / 2.5)));
    currentSec += duration;
  }

  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    const err = { error: 'Method not allowed. Use POST.' };
    return res?.status ? res.status(405).json(err) : new Response(JSON.stringify(err), { status: 405 });
  }

  const gnaniApiKey = process.env.GNANI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!gnaniApiKey && !groqApiKey) {
    console.error('Neither GNANI_API_KEY nor GROQ_API_KEY is configured in environment variables');
    const err = {
      error: 'Transcription API key is not configured. Please add GNANI_API_KEY or GROQ_API_KEY to your .env file.',
    };
    return res?.status ? res.status(500).json(err) : new Response(JSON.stringify(err), { status: 500 });
  }

  try {
    // Parse multipart form data using Web standard Request
    const webReq = new Request('http://localhost' + (req.url || '/api/transcribe'), {
      method: req.method,
      headers: req.headers,
      body: req,
      duplex: 'half',
    });

    const formData = await webReq.formData();
    const file = formData.get('file');
    const language = formData.get('language') || 'English (India)';

    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      const err = { error: 'Please choose an audio or video file to transcribe.' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
    }

    // Map language selection to Gnani language codes
    let languageCode = 'indic-auto';
    if (language === 'English (India)') {
      languageCode = 'en-IN';
    } else if (language === 'Hindi') {
      languageCode = 'hi-IN';
    } else if (language === 'Hinglish') {
      languageCode = 'indic-auto';
    }

    const fileName = (file.name || 'audio.mp3').toLowerCase();
    // Gnani Prisma v3 REST API natively supports audio formats: mp3, wav, m4a, aac, flac, ogg
    const isGnaniNativeAudio = /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(fileName);

    let rawTranscript = '';
    let detectedLanguage = languageCode;
    let providerUsed = 'Gnani AI Prisma v3.0';

    // 1. Try Gnani AI if API key is present and format is supported audio
    if (gnaniApiKey && isGnaniNativeAudio) {
      try {
        const gnaniFormData = new FormData();
        gnaniFormData.append('audio_file', file, file.name || 'audio.mp3');
        gnaniFormData.append('model', 'prisma-v3.0');
        gnaniFormData.append('language_code', languageCode);
        gnaniFormData.append('format', 'transcribe');

        const gnaniRes = await fetch('https://api.vachana.ai/stt/v3', {
          method: 'POST',
          headers: {
            'X-API-Key-ID': gnaniApiKey.trim(),
          },
          body: gnaniFormData,
        });

        if (gnaniRes.ok) {
          const gnaniData = await gnaniRes.json();
          rawTranscript = gnaniData.transcript || '';
          detectedLanguage = gnaniData.detected_language_code || languageCode;
        } else {
          const errorText = await gnaniRes.text();
          console.warn('Gnani STT non-200 response (' + gnaniRes.status + '), attempting fallback:', errorText);
        }
      } catch (gnaniErr) {
        console.warn('Gnani STT network exception, attempting fallback:', gnaniErr.message);
      }
    }

    // 2. If Gnani was skipped (video container .mp4/.webm) or returned an error, fallback to Groq Whisper
    if (!rawTranscript && groqApiKey) {
      try {
        const groqFormData = new FormData();
        groqFormData.append('file', file, file.name || 'audio.mp4');
        groqFormData.append('model', 'whisper-large-v3');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey.trim()}`,
          },
          body: groqFormData,
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          rawTranscript = groqData.text || '';
          providerUsed = 'Groq Whisper v3 (Media Adapter)';
        } else {
          const groqErrText = await groqRes.text();
          console.error('Groq Whisper transcription error (' + groqRes.status + '):', groqErrText);
        }
      } catch (groqErr) {
        console.error('Groq Whisper exception:', groqErr.message);
      }
    }

    if (!rawTranscript || !rawTranscript.trim()) {
      const err = {
        error:
          'Could not transcribe audio. Please ensure the audio file contains clear audible speech and try again.',
      };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400 });
    }

    const formattedTranscript = formatTranscriptWithTimestamps(rawTranscript);

    const payload = {
      success: true,
      raw_transcript: rawTranscript,
      transcript: formattedTranscript,
      detected_language: detectedLanguage,
      provider: providerUsed,
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unhandled transcription error:', error?.message);
    const safeError = { error: error?.message || 'Could not transcribe file. Please try again.' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(safeError);
    }
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
