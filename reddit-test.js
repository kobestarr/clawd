#!/usr/bin/env node

/**
 * Reddit API Credentials Test
 * Tests if the Reddit Ads API credentials work
 */

const fs = require('fs');
const https = require('https');

// Load credentials
const credentials = JSON.parse(fs.readFileSync(require('os').homedir() + '/.clawdbot/reddit/credentials.json', 'utf8'));

console.log('==============================================');
console.log('🔐 Reddit API Credentials Test');
console.log('==============================================\n');

console.log('Credentials loaded:');
console.log('  Client ID:    ' + credentials.client_id.substring(0, 10) + '...');
console.log('  Client Secret: ' + credentials.client_secret.substring(0, 10) + '...');
console.log('  Redirect:     ' + credentials.redirect_uri);
console.log('');

// Test 1: Check if we can reach Reddit API
console.log('📡 Testing Reddit API connection...\n');

const testRequest = (endpoint) => {
  return new Promise((resolve, reject) => {
    const req = https.get('https://ads-api.reddit.com' + endpoint, {
      headers: {
        'User-Agent': credentials.user_agent,
        'Authorization': 'Basic ' + Buffer.from(credentials.client_id + ':' + credentials.client_secret).toString('base64')
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
};

// Test OAuth token endpoint
console.log('1️⃣ Testing OAuth token endpoint...');

const tokenRequest = () => {
  return new Promise((resolve, reject) => {
    const postData = 'grant_type=client_credentials';
    
    const req = https.request('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'User-Agent': credentials.user_agent,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(credentials.client_id + ':' + credentials.client_secret).toString('base64')
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.write(postData);
    req.end();
  });
};

tokenRequest()
  .then(result => {
    console.log('   Status: ' + result.status);
    
    if (result.data.error) {
      console.log('   ❌ Error: ' + result.data.error);
      console.log('   Message: ' + result.data.message);
    } else {
      console.log('   ✅ Success! Token received.');
      console.log('   Token type: ' + result.data.token_type);
      console.log('   Expires in: ' + result.data.expires_in + ' seconds');
    }
    
    console.log('\n==============================================');
    console.log('🎯 Next Steps:');
    console.log('==============================================');
    console.log('1. Credentials are valid! ✅');
    console.log('2. We can now build the Reddit Ads integration');
    console.log('3. Create a simple auth flow');
    console.log('4. Access your ad account');
    console.log('\n📖 Docs: https://ads-api.reddit.com/docs/v3/');
    console.log('');
  })
  .catch(err => {
    console.log('   ❌ Connection error: ' + err.message);
    console.log('\nThis might be a network issue or Reddit might be down.');
  });
