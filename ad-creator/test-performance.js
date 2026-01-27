#!/usr/bin/env node

/**
 * Reddit Ads Performance Report
 * 
 * Generates a comprehensive report showing:
 * - Total spend
 * - Most popular ad (most impressions)
 * - Lowest CPC ad
 * - Lead conversions
 * 
 * Usage: node test-performance.js [client-name]
 * Example: node test-performance.js bluprintx
 */

const { loadCredentials, getAdAccount, getAccessToken } = require('./lib/reddit-api');
const https = require('https');

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

async function getAdInsights(accountId, token, adId) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'ads-api.reddit.com',
      path: '/api/v3/ad_accounts/' + accountId + '/insights?ads=' + adId + '&start_date=2026-01-20&end_date=2026-01-27',
      method: 'GET',
      headers: {
        'User-Agent': 'ad-creator/2.0',
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data && result.data.length > 0) {
            resolve(result.data[0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function getAllAds(accountId, token) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'ads-api.reddit.com',
      path: '/api/v3/ad_accounts/' + accountId + '/ads',
      method: 'GET',
      headers: {
        'User-Agent': 'ad-creator/2.0',
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ data: [] });
        }
      });
    });
    req.on('error', () => resolve({ data: [] }));
    req.end();
  });
}

async function generateReport(clientName = 'bluprintx') {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       REDDIT ADS PERFORMANCE REPORT                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Report Generated: ' + new Date().toISOString().substring(0, 10));
  console.log('Client: ' + clientName);
  console.log('');

  try {
    // Load credentials and get account ID
    const credentials = await loadCredentials(clientName);
    const accountId = credentials.ad_account_id;
    const account = await getAdAccount(clientName, accountId);
    const accessToken = await getAccessToken(clientName);

    // Account Status
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    ACCOUNT STATUS                         ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    log('  Account:    ' + account.data?.name, 'bright');
    log('  Currency:   ' + account.data?.currency, 'cyan');
    log('  Status:     ' + account.data?.admin_approval, 'green');
    console.log('');

    // Get all ads
    const adsResult = await getAllAds(accountId, accessToken);

    // Get insights for all ads
    const adsData = [];
    for (const ad of (adsResult.data || [])) {
      const insights = await getAdInsights(accountId, accessToken, ad.id);
      adsData.push({
        ...ad,
        insights
      });
    }

    // Calculate totals
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    adsData.forEach(ad => {
      if (ad.insights) {
        const spendMicro = ad.insights.spend || 0;
        const spend = spendMicro / 1000000;
        totalSpend += spend;
        totalImpressions += ad.insights.impressions || 0;
        totalClicks += ad.insights.clicks || 0;
        totalConversions += ad.insights.conversions || 0;
      }
    });

    // Overall Metrics
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    OVERALL METRICS                        ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Total Spend:        ' + colors.bright + '£' + totalSpend.toFixed(2) + colors.reset);
    console.log('  Total Impressions:  ' + totalImpressions.toLocaleString());
    console.log('  Total Clicks:       ' + totalClicks.toLocaleString());
    console.log('  Avg CPC:            £' + (totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0.00'));
    console.log('');

    // Most Popular Ad (Most Impressions)
    const mostPopular = adsData
      .filter(ad => ad.insights?.impressions > 0)
      .sort((a, b) => (b.insights?.impressions || 0) - (a.insights?.impressions || 0))[0];

    console.log('═══════════════════════════════════════════════════════════');
    console.log('               MOST POPULAR AD (Most Impressions)          ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    if (mostPopular) {
      log('  Ad:  ' + (mostPopular.name?.substring(0, 50) || 'Unknown'), 'bright');
      console.log('  Impressions: ' + (mostPopular.insights?.impressions || 0).toLocaleString());
      console.log('  Clicks:      ' + (mostPopular.insights?.clicks || 0).toLocaleString());
      console.log('  Spend:       £' + ((mostPopular.insights?.spend || 0) / 1000000).toFixed(2));
    } else if (adsData.length > 0) {
      console.log('  No impression data yet (campaign is new)');
      console.log('  Most recently created ad:');
      const latest = adsData[0];
      log('  ' + (latest.name?.substring(0, 50) || 'Unknown'), 'yellow');
    }
    console.log('');

    // Lowest CPC Ad
    const lowestCPC = adsData
      .filter(ad => ad.insights?.clicks > 0)
      .sort((a, b) => {
        const cpcA = ((a.insights?.spend || 0) / 1000000) / (a.insights?.clicks || 1);
        const cpcB = ((b.insights?.spend || 0) / 1000000) / (b.insights?.clicks || 1);
        return cpcA - cpcB;
      })[0];

    console.log('═══════════════════════════════════════════════════════════');
    console.log('              LOWEST CPC AD (Best Value)                   ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    if (lowestCPC) {
      const cpc = ((lowestCPC.insights?.spend || 0) / 1000000) / (lowestCPC.insights?.clicks || 1);
      log('  Ad:  ' + (lowestCPC.name?.substring(0, 50) || 'Unknown'), 'bright');
      console.log('  CPC: £' + cpc.toFixed(2));
      console.log('  Clicks: ' + (lowestCPC.insights?.clicks || 0));
    } else if (adsData.length > 0) {
      console.log('  No click data yet (ads may still be in learning phase)');
    }
    console.log('');

    // Leads Generated
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    LEADS GENERATED                        ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    log('  Total Conversions: ' + totalConversions, 'green');
    console.log('');
    console.log('  Note: Conversions are tracked via Reddit conversion pixel.');
    console.log('        This represents form submissions on your landing page.');
    console.log('');

    // All Ads Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    ALL ADS SUMMARY                        ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  #  Ad Name                                          Impress.  Clicks  Conv.  Spend');
    console.log('  ────────────────────────────────────────────────────────────────────────────────');
    
    adsData.forEach((ad, i) => {
      const name = (ad.name || 'Unknown').substring(0, 45);
      const imp = (ad.insights?.impressions || 0).toString().padStart(8);
      const clk = (ad.insights?.clicks || 0).toString().padStart(6);
      const conv = (ad.insights?.conversions || 0).toString().padStart(5);
      const spend = '£' + ((ad.insights?.spend || 0) / 1000000).toFixed(2).padStart(6);
      console.log('  ' + (i + 1).toString().padStart(2) + '  ' + name.padEnd(45) + '  ' + imp + '  ' + clk + '  ' + conv + '  ' + spend);
    });
    console.log('');

    // Footer
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    DATA FRESHNESS                         ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Report Date: ' + new Date().toISOString());
    console.log('  Data may be 24-48 hours delayed');
    console.log('');
    console.log('  View live data: https://ads.reddit.com/accounts/' + accountId);
    console.log('');

  } catch (error) {
    console.log('');
    log('Error generating report: ' + error.message, 'red');
    console.log('');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  const clientName = process.argv[2] || 'bluprintx';
  generateReport(clientName);
}

module.exports = { generateReport };
