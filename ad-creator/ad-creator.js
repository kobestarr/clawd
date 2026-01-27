#!/usr/bin/env node

/**
 * Ad Creative Generation Engine v2.0
 * 
 * Generates all combinations of ad creatives from:
 * - Images from Google Drive (siloed by ad group)
 * - Text variations from Google Sheets
 * - URL variations for A/B testing landing pages
 * 
 * Usage:
 *   node ad-creator.js
 *   (Will prompt for ad group, landing page URL, etc.)
 * 
 * Or with args:
 *   node ad-creator.js --ad-group "Agentforce-7-Lessons" --url "https://bluprintx.com/..."
 * 
 * ============================================================================
 * FOLDER STRUCTURE & SCALING NOTES
 * ============================================================================
 * 
 * CURRENT SETUP (Personal Use):
 * - Uses Google OAuth credentials from ~/.clawdbot/gdrive/
 * - Assumes: Bluprintx/Ads/Images/{AdGroup}/{SubTheme}
 * 
 * EXPECTED DRIVE FOLDER STRUCTURE:
 *   Bluprintx/
 *   └── Ads/
 *       └── Images/
 *           └── Agentforce-7-Lessons/
 *               └── Salesforce-Communities/
 *                   ├── Img-V1.png
 *                   ├── Img-V2.png
 *                   └── Img-V3.png
 * 
 * TO SCALE FOR MULTI-USER/TEAM USE:
 * 1. Service Account: Use a Google Cloud service account instead of OAuth
 *    - Create at: https://console.cloud.google.com/iam-admin/serviceaccounts
 *    - Share the target Drive folders with the service account email
 * 
 * 2. Folder Structure for Teams:
 *    Each user would have their own folder:
 *    - /{OrgName}/{UserName}/Ads/Images/{AdGroup}/{SubTheme}/
 * 
 * 3. Environment Variables (for production):
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY
 *    - DEFAULT_DRIVE_FOLDER_PATH
 * 
 * 4. For Client-Facing Use:
 *    - Users connect their own Google account via OAuth
 *    - Or provide a shared "Bluprintx" folder they can upload to
 *    - Clear instructions in UI: "Upload images to: Bluprintx/Ads/Images/{YourAdGroup}/"
 * 
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

// Load config
const gdriveCredentialsPath = process.env.HOME + '/.clawdbot/gdrive/credentials.json';
const gdriveTokensPath = process.env.HOME + '/.clawdbot/gdrive/tokens/default.json';

if (!fs.existsSync(gdriveCredentialsPath) || !fs.existsSync(gdriveTokensPath)) {
  log('\n⚠️  Google Drive credentials not found.\n', 'yellow');
  log('Run: clawdbot agents add google-drive\n', 'blue');
  log('Or set up OAuth at: https://console.cloud.google.com/apis/credentials\n', 'blue');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(gdriveCredentialsPath, 'utf8'));
const tokens = JSON.parse(fs.readFileSync(gdriveTokensPath, 'utf8'));

// Setup OAuth
const oauth2Client = new google.auth.OAuth2(
  config.installed.client_id,
  config.installed.client_secret,
  'http://localhost:3000/oauth2callback'
);
oauth2Client.setCredentials(tokens);

const drive = google.drive({ version: 'v3', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

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
console.log('        🎨 Ad Creative Generation Engine v2.0');
console.log('════════════════════════════════════════════════════════════');
console.log('');

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
  log('📋 Step 1: Configuration\n', 'cyan');

  // Get ad group name
  const adGroup = await ask('  Ad Group Name (e.g., Agentforce-7-Lessons): ');
  if (!adGroup) {
    log('  ❌ Ad group name is required\n', 'yellow');
    rl.close();
    return;
  }

  log('  ✅ Ad Group: ' + adGroup + '\n', 'green');

  // Get landing page URL
  const fullLpUrl = await ask('  Full Landing Page URL: ');
  if (!fullLpUrl) {
    log('  ❌ Landing page URL is required\n', 'yellow');
    rl.close();
    return;
  }

  // Generate mini LP URL
  const miniLpUrl = fullLpUrl.replace('/agentforce-360/', '/agentforce-360-min/').replace('/?', '-min/?');
  log('  ✅ Mini LP URL: ' + miniLpUrl + '\n', 'green');

  // Get subtheme (optional)
  const subTheme = await ask('  Sub-theme (optional, press Enter): ') || '';
  const subThemeStr = subTheme ? ' | ' + subTheme : '';

  log('\n📁 Step 2: Google Drive Configuration\n', 'cyan');

  // Get Drive folder
  const baseFolder = await ask('  Drive Folder (default: Bluprintx/Ads/Images): ') || 'Bluprintx/Ads/Images';
  const imageFolder = subTheme ? baseFolder + '/' + adGroup + '/' + subTheme : baseFolder + '/' + adGroup;

  log('  📂 Images folder: ' + imageFolder + '\n', 'blue');

  log('📊 Step 3: Google Sheets Configuration\n', 'cyan');

  // Get Sheet ID
  const sheetId = await ask('  Google Sheet ID: ');
  if (!sheetId) {
    log('  ⚠️  No sheet provided - using example data\n', 'yellow');
  } else {
    log('  ✅ Sheet ID: ' + sheetId + '\n', 'green');
  }

  log('🔄 Step 4: Processing\n', 'cyan');
  rl.close();

  // Create output directory
  const outputDir = './output/' + adGroup;
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(outputDir + '/ads', { recursive: true });
  fs.mkdirSync(outputDir + '/images', { recursive: true });

  // Step 1: Fetch images from Drive
  log('  📥 Fetching images from Drive...\n', 'blue');
  const images = sheetId ? await fetchImagesFromDrive(imageFolder) : [];
  
  if (images.length === 0) {
    log('  ⚠️  No images found in Drive, using example images\n', 'yellow');
    // Example images if no Drive access
    const exampleImages = [
      { id: 'img_1', name: 'Img-V1', url: 'https://drive.google.com/.../v1.png' },
      { id: 'img_2', name: 'Img-V2', url: 'https://drive.google.com/.../v2.png' },
      { id: 'img_3', name: 'Img-V3', url: 'https://drive.google.com/.../v3.png' }
    ];
    images.push(...exampleImages);
  }

  log('  ✅ Found ' + images.length + ' images\n', 'green');

  // Step 2: Fetch text from Sheets or use example
  log('  📥 Fetching text variations...\n', 'blue');
  const textVariations = sheetId ? await fetchTextFromSheet(sheetId) : getExampleText();

  log('  ✅ Text loaded:\n', 'green');
  Object.keys(textVariations).forEach(key => {
    log('     - ' + key + ': ' + textVariations[key].length + ' items\n', 'blue');
  });

  // Step 3: Generate combinations with URL variants
  log('  🔄 Generating combinations...\n', 'blue');
  const combinations = generateCombinations(images, textVariations, {
    adGroup,
    subTheme: subThemeStr,
    fullLpUrl,
    miniLpUrl
  });

  log('  ✅ Generated ' + combinations.length + ' ad variations\n', 'green');

  // Step 4: Save everything
  log('  💾 Saving to ' + outputDir + '...\n', 'blue');
  await saveCombinations(combinations, outputDir, { adGroup, subThemeStr, fullLpUrl, miniLpUrl });

  // Final summary
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  log('          ✅ Generation Complete!', 'green');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  📁 Output Directory: ' + outputDir);
  console.log('  📝 Total Variations: ' + combinations.length);
  console.log('  🔗 Landing Pages: 2 (FULL_LP + Mini_LP)');
  console.log('');
  console.log('  Files created:');
  console.log('    ├── manifest.json     - All combinations');
  console.log('    ├── summary.txt       - Human-readable');
  console.log('    └── ads/              - Individual ad files');
  console.log('');
  console.log('  Ad Title Format:');
  console.log('    ' + adGroup + subThemeStr + ' | {Theme} | Img-V{1-3}_FULL_LP');
  console.log('    ' + adGroup + subThemeStr + ' | {Theme} | Img-V{1-3}_Mini_LP');
  console.log('');
}

async function fetchImagesFromDrive(folderPath) {
  try {
    // Find folder
    const folder = await drive.files.list({
      q: "name='" + folderPath + "' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id)'
    });

    if (!folder.data.files.length) {
      log('  ⚠️  Folder not found: ' + folderPath + '\n', 'yellow');
      return [];
    }

    const folderId = folder.data.files[0].id;

    // List images (including shortcuts)
    const images = await drive.files.list({
      q: "'" + folderId + "' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/vnd.google-apps.shortcut')",
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)'
    });

    return images.data.files.map(file => ({
      id: file.id,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      type: file.mimeType,
      url: file.webViewLink,
      isShortcut: file.mimeType === 'application/vnd.google-apps.shortcut'
    }));
  } catch (error) {
    log('  ❌ Error fetching images: ' + error.message + '\n', 'yellow');
    return [];
  }
}

async function fetchTextFromSheet(sheetId) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetsList = meta.data.sheets.map(s => s.properties.title);
    const variations = {};

    for (const sheetName of sheetsList) {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetName + '!A:A'
      });

      if (result.data.values && result.data.values.length > 1) {
        const values = result.data.values.slice(1).map(row => row[0]).filter(v => v);
        if (values.length > 0) {
          variations[sheetName.toLowerCase()] = values;
        }
      }
    }

    return variations;
  } catch (error) {
    log('  ⚠️  Error reading sheet: ' + error.message + '\n', 'yellow');
    return {};
  }
}

function getExampleText() {
  return {
    themes: [
      'Salesforce-Communities',
      'Boss-Wants-AI',
      'Enterprise-Ready',
      'ROI-Driven'
    ],
    headlines: [
      '7 Lessons from Agentforce Pioneers',
      'Why Your Boss Wants AI Agents',
      'Enterprise AI That Actually Works',
      'Drive ROI with Agentforce'
    ],
    ctas: [
      'Download Guide',
      'Learn More',
      'Get Started'
    ]
  };
}

function generateCombinations(images, textVariations, options) {
  const { adGroup, subTheme, fullLpUrl, miniLpUrl } = options;
  const combinations = [];
  
  const themes = textVariations.themes || textVariations.theme || [];
  const headlines = textVariations.headlines || textVariations.headline || [];
  const ctas = textVariations.ctas || textVariations.cta || [];

  // Generate for each landing page variant
  const lpVariants = [
    { type: 'FULL_LP', url: fullLpUrl },
    { type: 'Mini_LP', url: miniLpUrl }
  ];

  let count = 0;

  for (const image of images) {
    for (const theme of themes) {
      const themeStr = theme ? ' | ' + theme : '';
      for (const headline of headlines) {
        for (const cta of ctas) {
          for (const lp of lpVariants) {
            // Format: AdGroup | SubTheme | Theme | Img-V1_LP-Type
            const adTitle = adGroup + subTheme + themeStr + ' | ' + image.name + '_' + lp.type;
            
            combinations.push({
              id: 'ad_' + Date.now() + '_' + count,
              ad_title: adTitle,
              ad_group: adGroup,
              sub_theme: subTheme.replace(' | ', ''),
              theme: theme,
              image: image,
              headline: headline,
              cta: cta,
              landing_page: lp.url,
              lp_variant: lp.type,
              platform: 'reddit',
              created: new Date().toISOString()
            });
            count++;
          }
        }
      }
    }
  }

  return combinations;
}

async function saveCombinations(combinations, outputDir, options) {
  const { adGroup, subTheme, fullLpUrl, miniLpUrl } = options;

  // Save manifest
  const manifest = {
    config: {
      ad_group: adGroup,
      sub_theme: subTheme,
      landing_pages: {
        full: fullLpUrl,
        mini: miniLpUrl
      },
      generated: new Date().toISOString(),
      total_variations: combinations.length
    },
    combinations: combinations
  };

  fs.writeFileSync(outputDir + '/manifest.json', JSON.stringify(manifest, null, 2));

  // Save summary
  let summary = 'Ad Creative Summary\n';
  summary += '═══════════════════════════════════════\n\n';
  summary += 'Ad Group:        ' + adGroup + '\n';
  summary += 'Sub-theme:       ' + (subTheme || 'None') + '\n';
  summary += 'Landing Pages:\n';
  summary += '  FULL_LP: ' + fullLpUrl + '\n';
  summary += '  Mini_LP: ' + miniLpUrl + '\n';
  summary += 'Total Variations: ' + combinations.length + '\n\n';
  summary += '═══════════════════════════════════════\n';
  summary += 'Generated Ads\n';
  summary += '═══════════════════════════════════════\n\n';

  combinations.slice(0, 20).forEach((ad, i) => {
    summary += (i + 1) + '. ' + ad.ad_title + '\n';
    summary += '   Headline: ' + ad.headline + '\n';
    summary += '   CTA: ' + ad.cta + '\n';
    summary += '   LP: ' + ad.lp_variant + '\n\n';
  });

  if (combinations.length > 20) {
    summary += '... and ' + (combinations.length - 20) + ' more variations\n';
  }

  fs.writeFileSync(outputDir + '/summary.txt', summary);

  // Save individual ad files
  combinations.forEach(ad => {
    fs.writeFileSync(outputDir + '/ads/' + ad.id + '.json', JSON.stringify(ad, null, 2));
  });
}

main().catch(console.error);
