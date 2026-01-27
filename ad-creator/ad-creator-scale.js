#!/usr/bin/env node

/**
 * Ad Creator - Scalable Multi-Platform Version
 * 
 * Generates and uploads ad creatives to multiple platforms:
 * - LinkedIn
 * - Reddit
 * - Meta (Facebook/Instagram)
 * 
 * With support for multiple client accounts per platform.
 * 
 * Usage:
 *   node ad-creator-scale.js --platform reddit --client kobestarr-digital
 *   node ad-creator-scale.js --platform linkedin --client stripped-media
 * 
 * Interactive mode:
 *   node ad-creator-scale.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { load, status, PLATFORMS } = require('./lib/platform-manager');

// UI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

console.log('');
console.log('════════════════════════════════════════════════════════════');
log('        🎨 Ad Creator - Multi-Platform Scalable Version', 'cyan');
console.log('════════════════════════════════════════════════════════════');
console.log('');

// Parse command line args
const args = process.argv.slice(2);
const cliArgs = {
  platform: args.find(a => a.startsWith('--platform='))?.split('=')[1],
  client: args.find(a => a.startsWith('--client='))?.split('=')[1],
  list: args.includes('--list'),
  init: args.includes('--init'),
  help: args.includes('--help')
};

// Show help
if (cliArgs.help || cliArgs.list) {
  console.log('Usage:');
  console.log('  node ad-creator-scale.js                    # Interactive mode');
  console.log('  node ad-creator-scale.js --platform reddit --client kobestarr-digital');
  console.log('  node ad-creator-scale.js --list             # Show all platforms/clients');
  console.log('  node ad-creator-scale.js --init --platform reddit --client kobestarr-digital');
  console.log('');
  console.log('Available platforms:', PLATFORMS.join(', '));
  console.log('');
  
  if (cliArgs.list) {
    status();
  }
  process.exit(0);
}

// Interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Get platform
  let platform = cliArgs.platform;
  if (!platform) {
    console.log('📋 Step 1: Select Platform\n');
    log('Available: ' + PLATFORMS.join(', '), 'blue');
    platform = await ask('Platform: ');
  }
  
  if (!PLATFORMS.includes(platform.toLowerCase())) {
    log(`❌ Unknown platform: ${platform}`, 'yellow');
    rl.close();
    process.exit(1);
  }
  
  platform = platform.toLowerCase();
  
  // Get client
  let client = cliArgs.client;
  if (!client) {
    console.log('\n📋 Step 2: Select Client\n');
    client = await ask('Client name (e.g., kobestarr-digital, stripped-media): ');
  }
  
  client = client.toLowerCase().replace(/\s+/g, '-');
  
  console.log('\n🔗 Loading platform + client...\n');
  rl.close();
  
  try {
    // Load platform
    const pm = load(platform, client);
    
    log(`✅ Platform: ${platform}`, 'green');
    log(`✅ Client:   ${client}`, 'green');
    log(`✅ Auth:     ${pm.isAuthenticated() ? 'Yes' : 'No'}`, pm.isAuthenticated() ? 'green' : 'yellow');
    console.log('');
    
    // Check authentication
    if (!pm.isAuthenticated()) {
      log('⚠️  Not authenticated for this platform/client\n', 'yellow');
      log('📋 OAuth URL:', 'blue');
      console.log(pm.getAuthUrl());
      console.log('');
      log('Next steps:', 'cyan');
      console.log('1. Open the URL above');
      console.log('2. Authorize the app');
      console.log('3. Copy the authorization code');
      console.log('4. Run: node lib/platform-manager.js complete-auth --platform ' + platform + ' --client ' + client);
      console.log('');
    } else {
      log('✅ Ready to generate and upload ads!', 'green');
      console.log('');
      console.log('Next steps:');
      console.log('1. Configure assets (images, text)');
      console.log('2. Generate ad combinations');
      console.log('3. Upload to ' + platform);
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, 'yellow');
    console.log('To initialize this platform/client:');
    console.log(`  node ad-creator-scale.js --init --platform ${platform} --client ${client}\n`);
  }
}

main().catch(console.error);
