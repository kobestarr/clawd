const { App } = require('@slack/bolt');
const persona = require('../core/persona');
const claude = require('../core/claude');
const conversation = require('../core/conversation');

let app = null;
let botUserId = null;

// --- Webhook posting (Phase 1 - no bot token needed) ---

async function postToWebhook(text, options = {}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not set');
    return false;
  }

  const payload = {
    text,
    ...options,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`Webhook post failed: ${response.status} ${response.statusText}`);
    return false;
  }
  return true;
}

async function postBriefing(text, emoji, label) {
  const block = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${label}`, emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: text.substring(0, 3000) },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Posted by Robyn 🦊 | ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}` },
        ],
      },
    ],
  };

  return postToWebhook(text, block);
}

// --- Bolt app (Phase 2 - two-way chat) ---

function initBolt() {
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN) {
    console.log('Slack Bolt not configured (no bot/app tokens). Webhook-only mode.');
    return null;
  }

  app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  });

  // Listen for direct messages
  app.message(async ({ message, say }) => {
    if (message.bot_id || message.subtype) return;

    try {
      const channelId = `slack-${message.channel}`;
      const systemPrompt = persona.buildSystemPrompt('slack');
      const history = conversation.getHistory(channelId);

      conversation.addMessage(channelId, 'user', message.text);

      const response = await claude.chat(systemPrompt, history, message.text);

      conversation.addMessage(channelId, 'assistant', response);

      await say(response);
    } catch (error) {
      console.error('Slack message handler error:', error);
      await say("Sorry, I hit an error. Give me a sec and try again.");
    }
  });

  // Listen for @Robyn mentions
  app.event('app_mention', async ({ event, say }) => {
    try {
      const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
      if (!text) {
        await say("Hey! What's up?");
        return;
      }

      const channelId = `slack-${event.channel}`;
      const systemPrompt = persona.buildSystemPrompt('slack');
      const history = conversation.getHistory(channelId);

      conversation.addMessage(channelId, 'user', text);

      const response = await claude.chat(systemPrompt, history, text);

      conversation.addMessage(channelId, 'assistant', response);

      await say({ text: response, thread_ts: event.ts });
    } catch (error) {
      console.error('Slack mention handler error:', error);
      await say({ text: "Sorry, hit an error. Try again in a sec.", thread_ts: event.ts });
    }
  });

  return app;
}

async function startBolt() {
  const boltApp = initBolt();
  if (!boltApp) return false;

  await boltApp.start();
  console.log('Slack Bolt connected (Socket Mode)');

  // Get bot user ID for filtering
  try {
    const auth = await boltApp.client.auth.test();
    botUserId = auth.user_id;
    console.log(`Slack bot user: ${botUserId}`);
  } catch (e) {
    console.error('Failed to get bot user ID:', e.message);
  }

  return true;
}

// --- Test helper ---

async function testWebhook(message) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
  const result = await postToWebhook(message);
  console.log(result ? 'Webhook test passed' : 'Webhook test failed');
}

module.exports = { postToWebhook, postBriefing, initBolt, startBolt, testWebhook };
