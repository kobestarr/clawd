#!/usr/bin/env node

/**
 * Reddit Ads API - Find Ad Account ID
 * 
 * Go to Reddit Ads Manager:
 * 1. https://ads.reddit.com
 * 2. Look at the URL when viewing your account
 * 3. The account ID is usually in the format: a_XXXXXXXX
 * 
 * Or check your Reddit account settings for connected ad accounts
 */

const fs = require('fs');
const https = require('https');

const credentials = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/reddit/credentials.json', 'utf8'));
const token = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/reddit/token.json', 'utf8')).access_token;

console.log('==============================================');
console.log('🔐 Reddit Ads API - Find Your Ad Account');
console.log('==============================================\n');

console.log('📋 To find your ad account ID:\n');

console.log('Option 1: Check Reddit Ads Manager URL');
console.log('  1. Go to https://ads.reddit.com');
console.log('  2. Click on your ad account');
console.log('  3. Look at the URL: ads.reddit.com/accounts/a_XXXXX');
console.log('  4. Your account ID is: a_XXXXX\n');

console.log('Option 2: Check Reddit Account Settings');
console.log('  1. Go to https://www.reddit.com/settings/account');
console.log('  2. Look for "Connected Apps" or "Ad Accounts"\n');

console.log('Option 3: Check URL when creating an ad');
console.log('  1. Go to https://ads.reddit.com/new/campaign');
console.log('  2. Look at the redirect URL or API calls\n');

console.log('==============================================');
console.log('📝 Once you have the account ID, run:');
console.log('==============================================\n');

console.log('  node reddit-api.js <account_id>');
console.log('');
console.log('Example:');
console.log('  node reddit-api.js a_12345678');
console.log('');

// Try to access any available accounts
console.log('==============================================');
console.log('🔄 Attempting to auto-detect ad accounts...');
console.log('==============================================\n');

// Try different potential endpoints
const potentialAccounts = [
  'a_2dm_XXXXXXXX',  // Common format
  'a_XXXXXXXX',      // Alternative format
  '2dm_XXXXXXXX'     // Another format
];

// Test if we can access any ads data
const testEndpoint = (path, name) => {
  return new Promise((resolve) => {
    const req = https.get('https://ads-api.reddit.com/v3/' + path, {
      headers: {
        'User-Agent': 'Bluprintx Ad Tool v1.0',
        'Authorization': 'Bearer ' + token
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ name, status: res.statusCode, data: data.substring(0, 200) });
      });
    });
    req.on('error', () => resolve({ name, status: 'error' }));
    req.end();
  });
};

async function checkEndpoints() {
  const endpoints = [
    { path: 'ad_accounts', name: 'List all ad accounts' },
    { path: 'user/me/ad_accounts', name: 'User ad accounts' },
  ];

  for (const ep of endpoints) {
    const result = await testEndpoint(ep.path, ep.name);
    console.log('  ' + ep.name + ': ' + (result.status === 200 ? '✅' : '❌ Status: ' + result.status));
  }
}

checkEndpoints().then(() => {
  console.log('\n📖 Full docs: https://ads-api.reddit.com/docs/v3/');
  console.log('');
});
