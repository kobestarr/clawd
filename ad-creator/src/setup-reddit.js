#!/usr/bin/env node

/**
 * Reddit Ads API Setup Wizard
 *
 * Interactive CLI for configuring Reddit Ads API credentials per client
 * Supports multiple clients (e.g., bluprintx, client2, client3)
 */

const readline = require('readline');
const {
  saveCredentials,
  saveTokens,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getAdAccount
} = require('../lib/reddit-api');

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

function logBanner() {
  console.log('\n' + colors.bright + '═'.repeat(60));
  console.log('  REDDIT ADS API SETUP WIZARD');
  console.log('═'.repeat(60) + colors.reset + '\n');
}

function logSection(title) {
  console.log('\n' + colors.bright + title + colors.reset + '\n');
}

function logSuccess(msg) {
  console.log(colors.green + '✅ ' + msg + colors.reset);
}

function logError(msg) {
  console.log(colors.red + '❌ ' + msg + colors.reset);
}

function logWarning(msg) {
  console.log(colors.yellow + '⚠️  ' + msg + colors.reset);
}

function logInfo(msg) {
  console.log(colors.cyan + '💡 ' + msg + colors.reset);
}

/**
 * Prompt user for input
 */
function ask(question, defaultVal = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const prompt = defaultVal
      ? `${question} [${defaultVal}]: `
      : `${question}: `;

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultVal);
    });
  });
}

/**
 * Main setup function
 */
async function setup() {
  logBanner();

  log('This wizard will configure Reddit Ads API credentials for a client.');
  log('Each client has separate credentials stored by name.', 'dim');
  console.log('');

  logInfo('Prerequisites:');
  log('  • Reddit Ads account created', 'dim');
  log('  • API app created at https://www.reddit.com/prefs/apps', 'dim');
  log('  • Client ID and Secret from app settings', 'dim');
  log('  • Ad Account ID from https://ads.reddit.com', 'dim');
  console.log('');

  const proceed = await ask('Ready to begin? (y/n)', 'y');

  if (proceed.toLowerCase() !== 'y') {
    log('\nSetup cancelled.', 'yellow');
    process.exit(0);
  }

  try {
    // Step 1: Client identification
    logSection('Step 1: Client Identification');

    const clientName = await ask('Client name (e.g., bluprintx, acme, client2)');

    if (!clientName) {
      logError('Client name is required');
      process.exit(1);
    }

    // Convert to lowercase for consistency
    const clientId = clientName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    logSuccess(`Client ID: ${clientId}`);

    // Step 2: Reddit API credentials
    logSection('Step 2: Reddit API Credentials');

    log('Get these from: https://www.reddit.com/prefs/apps', 'dim');
    console.log('');

    const client_id = await ask('Client ID');
    if (!client_id) {
      logError('Client ID is required');
      process.exit(1);
    }

    const client_secret = await ask('Client Secret');
    if (!client_secret) {
      logError('Client Secret is required');
      process.exit(1);
    }

    const redirect_uri = await ask('Redirect URI', 'http://localhost:3000/callback');

    const user_agent = await ask('User Agent', `ad-creator/${clientId}/1.0`);

    // Step 3: Ad Account ID
    logSection('Step 3: Ad Account Information');

    log('Find this in the URL when viewing your account:', 'dim');
    log('  https://ads.reddit.com/accounts/a2_XXXXXX', 'dim');
    console.log('');

    const ad_account_id = await ask('Ad Account ID (e.g., a2_i5qw2u3t9aca)');

    if (!ad_account_id) {
      logError('Ad Account ID is required');
      process.exit(1);
    }

    // Step 4: Optional configuration
    logSection('Step 4: Optional Configuration');

    const token_scopes = await ask(
      'Token scopes (comma-separated)',
      'adsread,adsconversions,history,adsedit,read'
    );

    // Build credentials object
    const credentials = {
      client_id,
      client_secret,
      redirect_uri,
      user_agent,
      ad_account_id,
      token_scopes: token_scopes.split(',').map(s => s.trim()),
      client_name: clientId,
      created_at: new Date().toISOString()
    };

    // Save credentials
    logSection('Step 5: Saving Configuration');

    const credPath = await saveCredentials(clientId, credentials);

    logSuccess(`Credentials saved: ${credPath}`);

    // Step 6: OAuth Authorization
    logSection('Step 6: OAuth Authorization');

    log('Reddit requires you to authorize this app to access your account.', 'dim');
    console.log('');

    // Generate authorization URL
    const authUrl = getAuthorizationUrl(credentials);

    log('📋 Copy this authorization URL and open it in your browser:', 'cyan');
    console.log('');
    console.log(colors.bright + authUrl + colors.reset);
    console.log('');

    log('Steps:', 'yellow');
    log('  1. Open the URL above in your browser', 'dim');
    log('  2. Log in to Reddit if needed', 'dim');
    log('  3. Click "Allow" to authorize the app', 'dim');
    log('  4. You\'ll be redirected to your redirect URI', 'dim');
    log('  5. Copy the "code" parameter from the redirect URL', 'dim');
    console.log('');

    log('Example redirect URL:', 'yellow');
    log(`  ${redirect_uri}?state=abc123&code=PASTE_THIS_CODE_HERE`, 'dim');
    console.log('');

    const authCode = await ask('Paste the authorization code here');

    if (!authCode) {
      logError('Authorization code is required');
      process.exit(1);
    }

    // Step 7: Exchange code for tokens
    logSection('Step 7: Exchanging Code for Tokens');

    log('Exchanging authorization code for access token...', 'dim');

    try {
      const tokenResponse = await exchangeCodeForToken(credentials, authCode);

      logSuccess('OAuth tokens obtained successfully');
      log(`  Token type: ${tokenResponse.token_type}`, 'dim');
      log(`  Token length: ${tokenResponse.access_token.length} characters`, 'dim');
      log(`  Expires in: ${tokenResponse.expires_in} seconds`, 'dim');
      log(`  Scopes: ${tokenResponse.scope}`, 'dim');

      // Save tokens
      const tokenData = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000) - 60000, // Subtract 1 min buffer
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope
      };

      const tokenPath = await saveTokens(clientId, tokenData);
      logSuccess(`Tokens saved: ${tokenPath}`);

      // Try to get ad account info
      log('\nVerifying API access...', 'dim');

      try {
        const accountInfo = await getAdAccount(clientId, ad_account_id);

        logSuccess('Ad account access verified');
        log(`  Account ID: ${accountInfo.id || ad_account_id}`, 'dim');
        if (accountInfo.name) log(`  Account Name: ${accountInfo.name}`, 'dim');

      } catch (accountError) {
        logWarning(`Could not fetch account details: ${accountError.message}`);
        logInfo('Tokens are saved - you can try API calls later');
      }

    } catch (tokenError) {
      logError(`OAuth failed: ${tokenError.message}`);
      logWarning('Credentials saved but token exchange failed');
      logInfo('Verify the authorization code and try again');
      process.exit(1);
    }

    // Final summary
    logSection('Setup Complete!');

    logSuccess(`Reddit API configured for client: ${clientId}`);
    console.log('');

    console.log(colors.bright + 'Configuration Saved:' + colors.reset);
    console.log(`  Client Name: ${clientId}`);
    console.log(`  Client ID: ${client_id.substring(0, 10)}...`);
    console.log(`  Ad Account: ${ad_account_id}`);
    console.log(`  Credentials: ${credPath}`);
    console.log('');

    console.log(colors.bright + 'Next Steps:' + colors.reset);
    console.log('  1. Run ad-creator and ads will use this client:');
    console.log('');
    console.log(colors.cyan + `     node ad-creator.js --client ${clientId}` + colors.reset);
    console.log('');
    console.log('  2. Or set as default client:');
    console.log('');
    console.log(colors.dim + `     export REDDIT_CLIENT=${clientId}` + colors.reset);
    console.log('');

    logInfo('To add another client, run: npm run setup:reddit');
    console.log('');

  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run setup if executed directly
if (require.main === module) {
  setup().catch(error => {
    logError('Unexpected error:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { setup };
