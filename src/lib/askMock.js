/**
 * Mock Q&A engine for "Ask SnipVoice".
 * Provides realistic responses based on Indian creator workflows, projects, and analytics.
 * // REPLACE WITH /api/ask
 */

export async function askSnipVoice(question, history = []) {
  // Simulate network latency of ~1.2s
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const cleanQ = (question || '').trim().toLowerCase();

  // 1. "Summarise my week"
  if (cleanQ.includes('summarise my week') || cleanQ.includes('summarize my week')) {
    return {
      answer: `**You have 6 posts scheduled across 5 days, targeting peak Indian evening retention.**\n- Instagram Reels scheduled for Mon, Wed, Fri at 7:00 PM for maximum reach.\n- LinkedIn breakdowns scheduled for Tue & Thu at 11:00 AM targeting startup founders.\n- YouTube Shorts planned for Saturday morning at 10:00 AM for weekend viewing.`,
      sources: ['D2C Brand Secrets', 'Weekly Content Calendar']
    };
  }

  // 2. "Which hook type works best for me?"
  if (cleanQ.includes('which hook type') || cleanQ.includes('hook type works best')) {
    return {
      answer: `**Question hooks are your top performer, generating 2.4x more views than direct statements.**\n- Question hooks averaged 78.5k views compared to 32.7k for bold claims.\n- Your top performing opener was "Kyun 90% D2C founders fail hote hain?".\n- Problem-Agitate hooks ranked second with an average of 54.2k views.`,
      sources: ['D2C Brand Secrets', 'Performance Analytics']
    };
  }

  // 3. "What has SnipVoice learned about my style?"
  if (cleanQ.includes('learned about my style') || cleanQ.includes('my style') || cleanQ.includes('learned')) {
    return {
      answer: `**SnipVoice has adopted a Direct & Punchy Hinglish tone with conversational creator slang.**\n- Regularly uses creator terms: Jugaad, Retention, Bharat, Organic reach, Ground reality.\n- Strictly avoids buzzwords: Synergy, 10x overnight, Passive income, Viral hack.\n- Automatically drafts concise 2-sentence Instagram captions with relatable hooks.`,
      sources: ['Brand Voice Profile', 'Editor Memory']
    };
  }

  // 4. "What should I post next?"
  if (cleanQ.includes('what should i post next') || cleanQ.includes('post next')) {
    return {
      answer: `**Post your unused clip on Tier-2 unit economics using a question hook.**\n- Clip "How Tier-2 customers think differently" has high viral potential.\n- Schedule for Thursday at 6:30 PM to capitalize on weekday evening peak.\n- Frame the caption in Hinglish focusing on practical execution over theory.`,
      sources: ['D2C Brand Secrets', 'Clips Queue']
    };
  }

  // Default fallback for any other question
  return {
    answer: `**I do not have that data yet.**\n- Upload a video or paste a transcript in the Projects tab to build your creator knowledge base.\n- Schedule posts and record results in Performance analytics to unlock personalized suggestions.`,
    sources: ['SnipVoice Knowledge Base']
  };
}
