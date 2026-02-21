const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

async function chat(systemPrompt, conversationHistory, userMessage, options = {}) {
  const { model = 'claude-sonnet-4-20250514', maxTokens = 1024 } = options;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

async function formatBriefing(rawOutput, briefingType, briefingEmoji) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return rawOutput; // No API key = return raw output
  }

  const prompt = `You are Robyn, a helpful AI assistant. Format this raw briefing data into a clean, readable message for Slack. Add a warm greeting appropriate for a ${briefingType} briefing. Use Slack mrkdwn formatting. Keep it concise but friendly. Don't add information that isn't in the data.\n\nRaw data:\n${rawOutput}`;

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}

module.exports = { chat, formatBriefing };
