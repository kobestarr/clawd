require('dotenv').config();

const cron = require('node-cron');
const scheduleConfig = require('./config/schedules');
const briefingRunner = require('./core/briefing-runner');
const claude = require('./core/claude');
const slack = require('./channels/slack');

async function sendBriefing(schedule) {
  console.log(`[${new Date().toISOString()}] Running ${schedule.name} briefing...`);

  try {
    // Run the briefing scripts
    const rawOutput = await briefingRunner.runBriefing(schedule.type);

    // Optionally format with Claude (if API key available)
    let formatted = rawOutput;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        formatted = await claude.formatBriefing(rawOutput, schedule.name, schedule.emoji);
      } catch (e) {
        console.error(`Claude formatting failed, using raw output: ${e.message}`);
      }
    }

    // Post to Slack
    const sent = await slack.postBriefing(formatted, schedule.emoji, schedule.label);
    if (sent) {
      console.log(`[${schedule.name}] Posted to Slack`);
    } else {
      console.error(`[${schedule.name}] Failed to post to Slack`);
    }
  } catch (error) {
    console.error(`[${schedule.name}] Briefing error:`, error);
    await slack.postToWebhook(`⚠️ ${schedule.label} failed: ${error.message}`);
  }
}

function startScheduler() {
  const { briefings, timezone } = scheduleConfig;

  for (const schedule of briefings) {
    cron.schedule(schedule.cron, () => sendBriefing(schedule), { timezone });
    console.log(`Scheduled: ${schedule.emoji} ${schedule.label} at ${schedule.cron} (${timezone})`);
  }
}

async function main() {
  console.log('');
  console.log('🦊 Robyn Agent starting...');
  console.log(`   Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);
  console.log(`   Node: ${process.version}`);
  console.log('');

  // Phase 1: Start briefing scheduler
  if (process.env.SLACK_WEBHOOK_URL) {
    startScheduler();
    console.log('✅ Briefing scheduler active');
  } else {
    console.warn('⚠️  SLACK_WEBHOOK_URL not set - briefings disabled');
  }

  // Phase 2: Start Slack Bolt (two-way chat)
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
    try {
      await slack.startBolt();
      console.log('✅ Slack two-way chat active');
    } catch (error) {
      console.error('❌ Slack Bolt failed to start:', error.message);
    }
  } else {
    console.log('ℹ️  Slack bot tokens not set - two-way chat disabled');
  }

  console.log('');
  console.log('🦊 Robyn is awake and listening.');
  console.log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🦊 Robyn shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🦊 Robyn shutting down...');
  process.exit(0);
});

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
