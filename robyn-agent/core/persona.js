const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

const PERSONA_FILES = [
  { name: 'soul', path: path.join(WORKSPACE_ROOT, 'SOUL.md') },
  { name: 'identity', path: path.join(WORKSPACE_ROOT, 'IDENTITY.md') },
  { name: 'user', path: path.join(WORKSPACE_ROOT, 'USER.md') },
  { name: 'agents', path: path.join(WORKSPACE_ROOT, 'AGENTS.md') },
  { name: 'memory', path: path.join(WORKSPACE_ROOT, 'MEMORY.md') },
];

let cachedPrompt = null;
let lastLoadTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // Reload every 5 minutes

function loadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function loadTodayLog() {
  const today = new Date().toISOString().split('T')[0];
  const logPath = path.join(WORKSPACE_ROOT, 'memory', 'daily', `${today}.md`);
  return loadFile(logPath);
}

function buildSystemPrompt(channel = 'slack') {
  const now = Date.now();
  if (cachedPrompt && (now - lastLoadTime) < CACHE_TTL) {
    return cachedPrompt;
  }

  const parts = [];

  // Core identity
  parts.push('# You are Robyn');
  parts.push('You are an AI assistant named Robyn. Read the following files to understand who you are and who you help.\n');

  for (const file of PERSONA_FILES) {
    const content = loadFile(file.path);
    if (content) {
      parts.push(content);
    }
  }

  // Today's context
  const todayLog = loadTodayLog();
  if (todayLog) {
    parts.push(`\n## Today's Context\n${todayLog}`);
  }

  // Channel-specific formatting
  if (channel === 'slack') {
    parts.push(`
## Channel: Slack
- Use Slack mrkdwn: *bold*, _italic_, \`code\`, > blockquote
- Keep responses concise and scannable
- Use bullet points and line breaks generously
- Emoji is fine but don't overdo it`);
  } else if (channel === 'whatsapp') {
    parts.push(`
## Channel: WhatsApp
- Use WhatsApp formatting: *bold*, _italic_
- No markdown tables - use bullet lists
- Keep messages shorter (mobile-first)
- Split long responses into multiple messages if needed`);
  }

  // Current date/time
  parts.push(`\n## Current Time\n${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);

  cachedPrompt = parts.join('\n\n');
  lastLoadTime = now;
  return cachedPrompt;
}

function invalidateCache() {
  cachedPrompt = null;
  lastLoadTime = 0;
}

module.exports = { buildSystemPrompt, invalidateCache };
