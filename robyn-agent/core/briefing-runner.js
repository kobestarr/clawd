const { execFile } = require('child_process');
const path = require('path');

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');

const BRIEFING_SCRIPTS = {
  morning: [
    { cmd: 'bash', args: [path.join(SCRIPTS_DIR, 'briefings/morning-briefing.sh')] },
  ],
  standup: [
    { cmd: 'bash', args: [path.join(SCRIPTS_DIR, 'briefings/asana-briefing.sh')] },
  ],
  lunch: [
    { cmd: 'bash', args: [path.join(SCRIPTS_DIR, 'briefings/daily-balance-check.sh')] },
  ],
  eod: [
    { cmd: 'bash', args: [path.join(SCRIPTS_DIR, 'briefings/asana-briefing.sh')] },
    { cmd: 'bash', args: [path.join(SCRIPTS_DIR, 'briefings/daily-balance-check.sh')] },
  ],
  weekly: [
    { cmd: 'bash', args: [path.join(SCRIPTS_DIR, 'briefings/weekly-briefing.sh')] },
  ],
};

function runScript(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 30000, env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Script error (${args[0]}):`, error.message);
        resolve(`[Script error: ${error.message}]`);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function runBriefing(type) {
  const scripts = BRIEFING_SCRIPTS[type];
  if (!scripts) {
    return `Unknown briefing type: ${type}`;
  }

  const results = [];
  for (const script of scripts) {
    const output = await runScript(script.cmd, script.args);
    results.push(output.trim());
  }
  return results.join('\n\n');
}

module.exports = { runBriefing, BRIEFING_SCRIPTS };
