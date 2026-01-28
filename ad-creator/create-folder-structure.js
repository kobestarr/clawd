/**
 * Create Clawdbot Folder Structure in Google Drive
 * 
 * Creates organized folder hierarchy for all projects
 * 
 * Usage: node create-folder-structure.js
 */

const { google } = require('googleapis');

// Load service account credentials
const credsPath = './config/service-account.json';
let credentials;

try {
  credentials = require(credsPath);
} catch (e) {
  console.error('❌ Service account credentials not found!');
  console.error('   Copy config/service-account.json.template to config/service-account.json');
  console.error('   And add your service account JSON credentials.\n');
  process.exit(1);
}

// Initialize auth
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive.file']
);

const drive = google.drive({ version: 'v3', auth });

// Folder structure to create
const folderStructure = {
  name: 'Clawdbot',
  children: [
    {
      name: 'ad-creator',
      children: [
        { name: 'Reddit Ads' },
        { name: 'Assets' },
        { name: 'Templates' }
      ]
    },
    {
      name: 'ad-intel',
      children: [
        { name: 'Projects' },
        { name: 'Screenshots' },
        { name: 'Analysis' }
      ]
    },
    {
      name: 'podcast-pitch-generator',
      children: [
        { name: 'Pitches' },
        { name: 'Outlines' }
      ]
    }
  ]
};

async function createFolder(name, parentId = null) {
  try {
    // Check if exists
    const response = await drive.files.list({
      q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(`  📁 ${name} (exists)`);
      return response.data.files[0].id;
    }

    // Create folder
    const createResponse = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      },
      fields: 'id, name'
    });

    console.log(`  📁 ${name} (created)`);
    return createResponse.data.id;
  } catch (error) {
    console.error(`  ❌ Error creating ${name}:`, error.message);
    return null;
  }
}

async function buildStructure(structure, parentId = null) {
  // Create current folder
  const currentId = await createFolder(structure.name, parentId);
  
  if (!currentId) return;

  // Create children
  if (structure.children) {
    console.log(`\n  Building: ${structure.name}/`);
    for (const child of structure.children) {
      await buildStructure(child, currentId);
    }
  }
}

async function main() {
  console.log('🚀 Creating Clawdbot Folder Structure...\n');
  console.log('This creates:');
  console.log('  Clawdbot/');
  console.log('  ├── ad-creator/');
  console.log('  │   ├── Reddit Ads/');
  console.log('  │   ├── Assets/');
  console.log('  │   └── Templates/');
  console.log('  ├── ad-intel/');
  console.log('  │   ├── Projects/');
  console.log('  │   ├── Screenshots/');
  console.log('  │   └── Analysis/');
  console.log('  └── podcast-pitch-generator/');
  console.log('      ├── Pitches/');
  console.log('      └── Outlines/\n');
  console.log('─'.repeat(60));

  await buildStructure(folderStructure);

  console.log('\n' + '─'.repeat(60));
  console.log('✅ Folder structure created!');
  console.log('\nNext steps:');
  console.log('1. Share the "Clawdbot" folder with your Google account');
  console.log('2. Copy the folder ID from the URL');
  console.log('3. Set GOOGLE_DRIVE_FOLDER_ID in .env');
}

main().catch(console.error);
