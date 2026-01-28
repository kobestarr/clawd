/**
 * Create Google Doc with ad permutations using Service Account
 * 
 * Usage: node create-google-doc-sa.js
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
  ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive']
);

const docs = google.docs({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

// Ad permutations data
const headlines = [
  "Your boss wants AI results. Here's 7 lessons from our builds.",
  "Execs want AI yesterday. This guide shows what actually works.",
  "Boss wants Agentforce live? Here's how we got 15 teams there.",
  "Boss want AI yesterday. This guide shows what works.",
  "The Board wants AI yesterday. Our guide shows what works."
];

const cta = "DOWNLOAD";
const urls = [
  "https://bluprintx.com/agentforce-360-min/?utm_source=Reddit&utm_medium=social&utm_campaign=agentforce_guide",
  "https://bluprintx.com/agentforce-360/?utm_source=Reddit&utm_medium=social&utm_campaign=agentforce_guide"
];
const images = ["v1.jpg", "v2.jpg", "v3.jpg"];

// Generate all permutations
const permutations = [];
for (const img of images) {
  for (const headline of headlines) {
    for (const url of urls) {
      permutations.push({ image: img, headline, cta, url });
    }
  }
}

async function createDocument() {
  console.log('📄 Creating Google Doc...\n');

  // Create the document
  const createResponse = await docs.documents.create({
    requestBody: { title: 'Reddit Ad Permutations - Agentforce' }
  });
  
  const documentId = createResponse.data.documentId;
  console.log(`✅ Document created: ${documentId}\n`);

  // Build document content
  let content = `Reddit Ad Permutations\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  content += `Summary: ${headlines.length} headlines × ${urls.length} URLs × ${images.length} images = ${permutations.length} permutations\n\n`;
  content += `---\n\n`;
  
  content += `Image\tHeadline\tCTA\tURL\n`;
  content += `-----\t--------\t---\t---\n`;
  
  for (const p of permutations) {
    content += `${p.image}\t${p.headline}\t${p.cta}\t${p.url}\n`;
  }

  // Insert content
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [{
        insertText: {
          location: { index: 1 },
          text: content
        }
      }]
    }
  });

  console.log(`📝 Added ${permutations.length} rows to document\n`);

  // Find Reddit Ads folder and move document there
  const folderResponse = await drive.files.list({
    q: `name='Reddit Ads' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)'
  });

  if (folderResponse.data.files && folderResponse.data.files.length > 0) {
    const folderId = folderResponse.data.files[0].id;
    await drive.files.update({
      fileId: documentId,
      addParents: folderId,
      fields: 'id, name, parents'
    });
    console.log(`📁 Moved to Reddit Ads folder\n`);
  }

  // Make publicly accessible
  await drive.permissions.create({
    fileId: documentId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Get shareable link
  const file = await drive.files.get({
    fileId: documentId,
    fields: 'name, webViewLink'
  });

  console.log('═'.repeat(60));
  console.log('✅ GOOGLE DOC CREATED!');
  console.log('═'.repeat(60));
  console.log(`\n📄 Document: ${file.data.name}`);
  console.log(`🔗 Link: ${file.data.webViewLink}`);
  console.log(`\nOpen this link to see all ${permutations.length} ad permutations!\n`);

  return file.data.webViewLink;
}

createDocument().catch(console.error);
