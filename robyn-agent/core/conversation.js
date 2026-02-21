const fs = require('fs');
const path = require('path');

const CONVERSATIONS_DIR = path.resolve(__dirname, '../memory/conversations');
const MAX_MESSAGES = 50;

function ensureDir() {
  if (!fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
  }
}

function getFilePath(channelId) {
  const safe = channelId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(CONVERSATIONS_DIR, `${safe}.json`);
}

function getHistory(channelId) {
  ensureDir();
  const filePath = getFilePath(channelId);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function addMessage(channelId, role, content) {
  ensureDir();
  const history = getHistory(channelId);
  history.push({ role, content, timestamp: new Date().toISOString() });

  // Sliding window - keep last MAX_MESSAGES
  while (history.length > MAX_MESSAGES) {
    history.shift();
  }

  const filePath = getFilePath(channelId);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  return history;
}

function clearHistory(channelId) {
  ensureDir();
  const filePath = getFilePath(channelId);
  fs.writeFileSync(filePath, '[]');
}

module.exports = { getHistory, addMessage, clearHistory };
