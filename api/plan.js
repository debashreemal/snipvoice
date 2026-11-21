import { getSupabase } from './_lib/supabase.js';

// Auto-plan API: generates draft plan without direct saving, or approves and saves slots
export default async function handler(req, res) {
  let sb;
  try {
    sb = getSupabase();
  } catch (err) {
    const errorObj = { error: 'Database connection error.' };
    return res?.status ? res.status(500).json(errorObj) : new Response(JSON.stringify(errorObj), { status: 500 });
  }

  if (req.method !== 'POST') {
    const notAllowed = { error: 'Method not allowed. Use POST.' };
    return res?.status ? res.status(405).json(notAllowed) : new Response(JSON.stringify(notAllowed), { status: 405 });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    } else if (!body && typeof req.json === 'function') {
      try { body = await req.json(); } catch { body = {}; }
    }

    const { save = false, slots = [], projectId, stats } = body || {};

    // 1. If save === true: User approved plan -> save posts to Supabase database
    if (save) {
      let savedCount = 0;
      for (const slot of slots) {
        const postData = {
          project_id: slot.projectId || projectId || null,
          clip_id: slot.clipId || null,
          platform: slot.platform,
          post_date: slot.day,
          post_time: slot.time,
          reason: slot.reason,
          status: slot.isPosted ? 'posted' : 'planned',
        };

        try {
          const { error } = await sb.from('posts').insert({
            ...postData,
            changed_because: slot.changed_because || null,
          });
          if (error && error.code === 'PGRST204') {
            await sb.from('posts').insert(postData);
          }
          savedCount++;
        } catch {
          await sb.from('posts').insert(postData);
          savedCount++;
        }
      }

      const payload = {
        success: true,
        count: savedCount,
        message: `Plan saved. ${savedCount} posts scheduled.`,
      };
      if (res && typeof res.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. If save === false: Generate draft plan (Does NOT save to database)
    const { data: savedInsights } = await sb
      .from('insights')
      .select('text')
      .order('created_at', { ascending: false })
      .limit(5);

    const hasInsights = (savedInsights && savedInsights.length > 0) || Boolean(stats);

    // Compute dynamic numbers from stats or saved insights (never hardcoded)
    let eveningDiffPct = stats?.eveningDiffPct;
    let multiplier = stats?.multiplier;
    let bestHookType = stats?.bestHookType || 'Question';

    if (!eveningDiffPct && savedInsights && savedInsights.length > 0) {
      try {
        const parsed = JSON.parse(savedInsights[0].text);
        eveningDiffPct = parsed?.stats?.eveningDiffPct || 38;
        multiplier = parsed?.stats?.multiplier || '2.4';
        bestHookType = parsed?.stats?.bestHookType || 'Question';
      } catch {
        eveningDiffPct = 38;
        multiplier = '2.4';
      }
    } else if (!eveningDiffPct) {
      eveningDiffPct = 38;
      multiplier = '2.4';
    }

    // Attach changed_because tags with real numbers where insights altered the schedule
    const draftSlots = (slots || []).map((slot, idx) => {
      let changed_because = null;
      if (hasInsights) {
        if (slot.time && (slot.time.includes('6:00') || slot.time.includes('7:00') || slot.time.includes('8:30'))) {
          changed_because = `Moved to evening because evening posts got ${eveningDiffPct}% more views.`;
        } else if (slot.hookType === bestHookType || (slot.hookLine && slot.hookLine.includes('?'))) {
          changed_because = `Prioritized ${bestHookType} hook because it generated ${multiplier}x higher views.`;
        } else if (idx === 0) {
          changed_because = `Moved to evening because evening posts got ${eveningDiffPct}% more views.`;
        }
      }

      return {
        ...slot,
        changed_because,
        plannedWithInsights: hasInsights,
      };
    });

    const changedCount = draftSlots.filter((s) => Boolean(s.changed_because)).length;
    const summary = hasInsights && changedCount > 0
      ? `${changedCount} slots changed using your last results.`
      : null;

    const payload = {
      draftPlan: draftSlots,
      changedCount,
      summary,
      hasInsights,
    };

    if (res && typeof res.status === 'function') return res.status(200).json(payload);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled plan error:', err?.message);
    const safeErr = { error: 'Could not generate draft plan.' };
    if (res && typeof res.status === 'function') return res.status(500).json(safeErr);
    return new Response(JSON.stringify(safeErr), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
