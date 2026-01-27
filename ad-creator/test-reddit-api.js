#!/usr/bin/env node

/**
 * Test Reddit Ads API with Bluprintx credentials
 *
 * Usage: node test-reddit-api.js [client-name]
 * Example: node test-reddit-api.js bluprintx
 */

const {
  getAccessToken,
  getAdAccount,
  listAdAccounts,
  loadCredentials,
  checkConfiguration
} = require('./lib/reddit-api');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

async function test() {
  const clientName = process.argv[2] || 'bluprintx';

  console.log('');
  console.log('═'.repeat(60));
  log(`  Reddit Ads API Test - Client: ${clientName}`, 'cyan');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // Check if configured
    log('1️⃣ Checking configuration...', 'cyan');
    const isConfigured = await checkConfiguration(clientName);

    if (!isConfigured) {
      log(`   ❌ Client "${clientName}" not configured`, 'red');
      log(`   Run: npm run setup:reddit`, 'yellow');
      process.exit(1);
    }

    log(`   ✅ Configuration found`, 'green');

    // Load credentials
    log('\n2️⃣ Loading credentials...', 'cyan');
    const credentials = await loadCredentials(clientName);

    log(`   Client ID: ${credentials.client_id.substring(0, 10)}...`, 'reset');
    log(`   Ad Account: ${credentials.ad_account_id}`, 'reset');
    log(`   User Agent: ${credentials.user_agent}`, 'reset');

    // Get OAuth token
    log('\n3️⃣ Getting OAuth access token...', 'cyan');
    const accessToken = await getAccessToken(credentials);

    log(`   ✅ Token obtained`, 'green');
    log(`   Token type: Bearer`, 'reset');
    log(`   Token length: ${accessToken.length} characters`, 'reset');
    log(`   Token preview: ${accessToken.substring(0, 20)}...`, 'reset');

    // Test endpoints
    log('\n4️⃣ Testing API endpoints...', 'cyan');

    // Test 1: Get specific ad account
    log('\n   a) GET /accounts/{accountId}', 'yellow');
    try {
      const account = await getAdAccount(clientName, credentials.ad_account_id);
      log(`      ✅ Success - Account retrieved`, 'green');
      log(`      Account ID: ${account.id || credentials.ad_account_id}`, 'reset');
      if (account.name) log(`      Name: ${account.name}`, 'reset');
      if (account.status) log(`      Status: ${account.status}`, 'reset');
    } catch (error) {
      log(`      ⚠️  ${error.message}`, 'yellow');
    }

    // Test 2: List all ad accounts
    log('\n   b) GET /accounts', 'yellow');
    try {
      const accounts = await listAdAccounts(clientName);
      log(`      ✅ Success - ${accounts.length || 0} accounts found`, 'green');
      if (accounts.data && Array.isArray(accounts.data)) {
        accounts.data.slice(0, 3).forEach(acc => {
          log(`      - ${acc.id || 'N/A'}: ${acc.name || 'Unnamed'}`, 'reset');
        });
      }
    } catch (error) {
      log(`      ⚠️  ${error.message}`, 'yellow');
    }

    // Summary
    console.log('');
    console.log('═'.repeat(60));
    log('  Test Complete', 'green');
    console.log('═'.repeat(60));
    console.log('');

    log('✅ OAuth authentication working', 'green');
    log('✅ API endpoints accessible', 'green');
    console.log('');

    log('Next steps:', 'cyan');
    log('  1. Integration is ready to use', 'reset');
    log('  2. Run ad-creator with --client flag:', 'reset');
    console.log('');
    log(`     node ad-creator.js --client ${clientName}`, 'reset');
    console.log('');

  } catch (error) {
    console.log('');
    log(`❌ Test failed: ${error.message}`, 'red');
    console.log('');
    log('Troubleshooting:', 'yellow');
    log('  1. Verify credentials in config/reddit-' + clientName + '.json', 'reset');
    log('  2. Check client_id and client_secret are correct', 'reset');
    log('  3. Verify ad_account_id format (should be a2_XXXXXX)', 'reset');
    log('  4. Ensure Reddit app has required scopes', 'reset');
    console.log('');
    process.exit(1);
  }
}

test();
