#!/usr/bin/env node

/**
 * Example: Ad Creative Generation
 * 
 * This script demonstrates how to use the ad-creator
 * with example data (for testing without real Drive/Sheets)
 */

const fs = require('fs');
const path = require('path');

console.log('==============================================');
console.log('🎨 Ad Creative Generation - Example Run');
console.log('==============================================\n');

// Example data (simulating what would come from Drive/Sheets)
const exampleImages = [
  { id: 'img_1', name: 'hero-banner.png', url: 'https://drive.google.com/.../hero-banner.png' },
  { id: 'img_2', name: 'product-screenshot.jpg', url: 'https://drive.google.com/.../product.png' },
  { id: 'img_3', name: 'team-photo.jpg', url: 'https://drive.google.com/.../team.png' },
  { id: 'img_4', name: 'infographic.png', url: 'https://drive.google.com/.../info.png' }
];

const exampleText = {
  headlines: [
    'Boost Your Sales with AI Agents',
    'Automate Your Workflow Today',
    'Scale Faster with Bluprintx',
    'Enterprise-Grade AI for Sales',
    'The Future of Sales is Here'
  ],
  ctas: [
    'Learn More',
    'Book a Demo',
    'Get Started',
    'Try Free'
  ],
  descriptions: [
    'AI agents that actually work for enterprise teams. Built on Salesforce, trusted by Fortune 500.',
    'Transform your sales process in 30 days. See measurable results from day one.',
    'The only AI platform designed specifically for B2B sales teams.'
  ]
};

console.log('📁 Example Images (4):');
exampleImages.forEach(img => console.log('   - ' + img.name));
console.log('');

console.log('📊 Example Text Variations:');
console.log('   Headlines: ' + exampleText.headlines.length);
console.log('   CTAs:      ' + exampleText.ctas.length);
console.log('   Descriptions: ' + exampleText.descriptions.length);
console.log('');

// Generate combinations
const combinations = [];
let count = 0;

for (const image of exampleImages) {
  for (const headline of exampleText.headlines) {
    for (const cta of exampleText.ctas) {
      for (const description of exampleText.descriptions) {
        combinations.push({
          id: 'ad_' + Date.now() + '_' + count,
          image: image,
          headline: headline,
          cta: cta,
          description: description,
          platform: 'reddit',
          created: new Date().toISOString()
        });
        count++;
      }
    }
  }
}

console.log('🔄 Generated ' + combinations.length + ' combinations');
console.log('   (4 images × 5 headlines × 4 CTAs × 3 descriptions)\n');

// Save example output
const outputDir = './example-output';
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(outputDir + '/ads', { recursive: true });

// Save manifest
const manifest = {
  source: 'example',
  total: combinations.length,
  generated: new Date().toISOString(),
  breakdown: {
    images: exampleImages.length,
    headlines: exampleText.headlines.length,
    ctas: exampleText.ctas.length,
    descriptions: exampleText.descriptions.length
  },
  combinations: combinations
};

fs.writeFileSync(outputDir + '/manifest.json', JSON.stringify(manifest, null, 2));

// Save summary
let summary = 'Ad Creative Summary\n';
summary += '====================\n\n';
summary += 'Source: Example Data\n';
summary += 'Total combinations: ' + combinations.length + '\n';
summary += 'Breakdown:\n';
summary += '  Images: ' + exampleImages.length + '\n';
summary += '  Headlines: ' + exampleText.headlines.length + '\n';
summary += '  CTAs: ' + exampleText.ctas.length + '\n';
summary += '  Descriptions: ' + exampleText.descriptions.length + '\n\n';
summary += 'Combinations:\n';
summary += '=============\n\n';

combinations.slice(0, 10).forEach((ad, i) => {
  summary += 'Ad ' + (i + 1) + ': ' + ad.image.name + '\n';
  summary += '  Headline: ' + ad.headline + '\n';
  summary += '  CTA: ' + ad.cta + '\n';
  summary += '  Description: ' + ad.description.substring(0, 60) + '...\n\n';
});

if (combinations.length > 10) {
  summary += '... and ' + (combinations.length - 10) + ' more combinations\n';
}

fs.writeFileSync(outputDir + '/summary.txt', summary);

console.log('💾 Example output saved to: ' + outputDir);
console.log('');
console.log('Files created:');
console.log('  manifest.json  - Full combinations data');
console.log('  summary.txt    - Human-readable summary');
console.log('  ads/           - Individual ad files\n');

console.log('==============================================');
console.log('✅ Example Complete!');
console.log('==============================================\n');
console.log('To use with real data:');
console.log('  node ad-creator.js \\');
console.log('    --drive-folder "Bluprintx/Ads/Images" \\');
console.log('    --sheet-id "YOUR_SPREADSHEET_ID"\n');
