#!/usr/bin/env node

/**
 * Ad Creative Generation Engine
 * 
 * Generates all combinations of ad creatives from:
 * - Images from Google Drive
 * - Text variations from Google Sheets
 * 
 * Usage:
 *   node ad-creator.js --drive-folder "Bluprintx/Ads/Images" --sheet-id "SPREADSHEET_ID"
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load config
const config = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/gdrive/credentials.json', 'utf8'));
const tokens = JSON.parse(fs.readFileSync(process.env.HOME + '/.clawdbot/gdrive/tokens/default.json', 'utf8'));

// Setup OAuth
const oauth2Client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  'http://localhost:3000/oauth2callback'
);
oauth2Client.setCredentials(tokens);

const drive = google.drive({ version: 'v3', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

console.log('==============================================');
console.log('🎨 Ad Creative Generation Engine');
console.log('==============================================\n');

// Check for command line args
const args = process.argv.slice(2);
const driveFolder = args.find(a => a.startsWith('--drive-folder='))?.split('=')[1];
const sheetId = args.find(a => a.startsWith('--sheet-id='))?.split('=')[1];
const outputDir = args.find(a => a.startsWith('--output='))?.split('=')[1] || './output';

async function main() {
  if (!driveFolder || !sheetId) {
    console.log('Usage: node ad-creator.js --drive-folder "Folder/Path" --sheet-id "SPREADSHEET_ID"\n');
    console.log('Options:');
    console.log('  --drive-folder   Google Drive folder with images');
    console.log('  --sheet-id       Google Sheet with text variations');
    console.log('  --output         Output directory (default: ./output)\n');
    return;
  }

  console.log('📋 Configuration:');
  console.log('  Drive Folder:  ' + driveFolder);
  console.log('  Sheet ID:      ' + sheetId);
  console.log('  Output Dir:    ' + outputDir);
  console.log('');

  // Step 1: Fetch images from Drive
  console.log('📁 Step 1: Fetching images from Google Drive...\n');
  const images = await fetchImagesFromDrive(driveFolder);
  console.log('✅ Found ' + images.length + ' images\n');

  // Step 2: Fetch text from Sheets
  console.log('📊 Step 2: Fetching text variations from Google Sheets...\n');
  const textVariations = await fetchTextFromSheet(sheetId);
  console.log('✅ Text variations loaded:\n');
  Object.keys(textVariations).forEach(key => {
    console.log('  ' + key + ': ' + textVariations[key].length + ' variations');
  });
  console.log('');

  // Step 3: Generate combinations
  console.log('🔄 Step 3: Generating all combinations...\n');
  const combinations = generateCombinations(images, textVariations);
  console.log('✅ Generated ' + combinations.length + ' ad variations\n');

  // Step 4: Save combinations
  console.log('💾 Step 4: Saving combinations...\n');
  await saveCombinations(combinations, outputDir);
  console.log('✅ Saved to ' + outputDir + '\n');

  // Summary
  console.log('==============================================');
  console.log('🎉 Generation Complete!');
  console.log('==============================================\n');
  console.log('Output files:');
  console.log('  manifest.json     - All combinations with metadata');
  console.log('  ads/              - Individual ad files');
  console.log('  summary.txt       - Summary of all variations\n');
  console.log('📝 Next steps:');
  console.log('  1. Review the generated ads');
  console.log('  2. Approve or adjust as needed');
  console.log('  3. Upload to Reddit Ads when API is ready\n');
}

async function fetchImagesFromDrive(folderPath) {
  // Find folder
  const folder = await drive.files.list({
    q: "name='" + folderPath + "' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id)'
  });

  if (!folder.data.files.length) {
    console.log('⚠️  Folder not found: ' + folderPath);
    return [];
  }

  const folderId = folder.data.files[0].id;

  // List images in folder
  const images = await drive.files.list({
    q: "'" + folderId + "' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/vnd.google-apps.shortcut')",
    fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)'
  });

  return images.data.files.map(file => ({
    id: file.id,
    name: file.name,
    type: file.mimeType,
    url: file.webViewLink,
    thumbnail: file.thumbnailLink,
    isShortcut: file.mimeType === 'application/vnd.google-apps.shortcut'
  }));
}

async function fetchTextFromSheet(sheetId) {
  try {
    // Get sheet metadata
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetsList = meta.data.sheets.map(s => s.properties.title);
    console.log('  Available sheets: ' + sheetsList.join(', '));

    // Read each sheet for different text types
    const variations = {};
    
    for (const sheetName of sheetsList) {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetName + '!A:A'  // First column
      });

      if (result.data.values && result.data.values.length > 1) {
        // Skip header row
        const values = result.data.values.slice(1).map(row => row[0]).filter(v => v);
        if (values.length > 0) {
          variations[sheetName.toLowerCase()] = values;
        }
      }
    }

    return variations;
  } catch (error) {
    console.log('⚠️  Error reading sheet: ' + error.message);
    return {};
  }
}

function generateCombinations(images, textVariations) {
  const combinations = [];
  const headlines = textVariations.headlines || textVariations.headline || [];
  const ctas = textVariations.ctas || textVariations.cta || textVariations['call to action'] || [];
  const descriptions = textVariations.descriptions || textVariations.description || [];

  // Generate all combinations
  for (const image of images) {
    for (const headline of headlines) {
      for (const cta of ctas) {
        for (const description of descriptions) {
          combinations.push({
            id: 'ad_' + Date.now() + '_' + combinations.length,
            image: image,
            headline: headline,
            cta: cta,
            description: description,
            platform: 'reddit',
            created: new Date().toISOString()
          });
        }
      }
    }
  }

  return combinations;
}

async function saveCombinations(combinations, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(outputDir + '/ads', { recursive: true });

  // Save manifest
  fs.writeFileSync(outputDir + '/manifest.json', JSON.stringify({
    total: combinations.length,
    generated: new Date().toISOString(),
    combinations: combinations
  }, null, 2));

  // Save summary
  let summary = 'Ad Creative Summary\n';
  summary += '====================\n\n';
  summary += 'Total combinations: ' + combinations.length + '\n\n';

  combinations.forEach((ad, i) => {
    summary += 'Ad ' + (i + 1) + ':\n';
    summary += '  Image: ' + ad.image.name + '\n';
    summary += '  Headline: ' + ad.headline + '\n';
    summary += '  CTA: ' + ad.cta + '\n';
    summary += '  Description: ' + ad.description.substring(0, 50) + '...\n\n';
  });

  fs.writeFileSync(outputDir + '/summary.txt', summary);

  // Save individual ad files
  combinations.forEach(ad => {
    fs.writeFileSync(outputDir + '/ads/' + ad.id + '.json', JSON.stringify(ad, null, 2));
  });
}

main().catch(console.error);
