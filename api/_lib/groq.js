import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

// Export default Groq client instance
export const groq = apiKey ? new Groq({ apiKey }) : null;

/**
 * Get an active Groq client instance or throw if key is missing
 */
export function getGroqClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY environment variable is not set.');
  }
  return new Groq({ apiKey: key });
}

/**
 * Calls Llama 3.3 70B Versatile on Groq asking for pure JSON, strips any markdown code fences,
 * parses the JSON safely, and throws a clear error if parsing fails.
 *
 * @param {string} systemPrompt - Instructions for the model
 * @param {string} userPrompt - User input content
 * @returns {Promise<any>} Parsed JSON object
 */
export async function askJson(systemPrompt, userPrompt) {
  const client = getGroqClient();

  const targetModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  let completion;

  try {
    completion = await client.chat.completions.create({
      model: targetModel,
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid, raw JSON. Do not include markdown code blocks, backticks (\`\`\` or \`\`\`json), comments, or introductory/explanatory text.`,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
  } catch (err) {
    // If llama-3.3-70b-versatile is not accessible on this key tier, fall back to an active high-capacity model
    if (err?.status === 404 || err?.code === 'model_not_found') {
      const fallbackModel = 'openai/gpt-oss-120b';
      completion = await client.chat.completions.create({
        model: fallbackModel,
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid, raw JSON. Do not include markdown code blocks, backticks (\`\`\` or \`\`\`json), comments, or introductory/explanatory text.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
    } else {
      throw err;
    }
  }

  const rawContent = completion.choices?.[0]?.message?.content ?? '';

  // Strip markdown fences if the model included them despite instructions
  let clean = rawContent.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    return JSON.parse(clean);
  } catch (parseError) {
    throw new Error(
      `Failed to parse Groq response as JSON: ${parseError.message}.\nRaw output was: ${rawContent}`
    );
  }
}

export default groq;
