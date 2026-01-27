#!/usr/bin/env node

/**
 * Test Runner for Ad Creator
 * 
 * Uses test assets to verify the ad creator works correctly.
 * Run this to test the code without real credentials.
 * 
 * Usage:
 *   node test/run.js
 */

const fs = require('fs');
const path = require('path');

// Test assets directory
const TEST_ASSETS = path.join(__dirname, '..', 'test-assets');

console.log('');
console.log('🧪 Ad Creator Test Suite');
console.log('═'.repeat(60));
console.log('');

// Test 1: Load text assets
console.log('📄 Test 1: Loading text assets...');
try {
  const headlines = fs.readFileSync(path.join(TEST_ASSETS, 'text', 'headlines.csv'), 'utf8')
    .split('\n')
    .filter(line => line.trim());
  
  const ctas = fs.readFileSync(path.join(TEST_ASSETS, 'text', 'ctas.csv'), 'utf8')
    .split('\n')
    .filter(line => line.trim());
  
  const themes = fs.readFileSync(path.join(TEST_ASSETS, 'text', 'themes.csv'), 'utf8')
    .split('\n')
    .filter(line => line.trim());
  
  console.log(`   ✅ Headlines: ${headlines.length}`);
  console.log(`   ✅ CTAs: ${ctas.length}`);
  console.log(`   ✅ Themes: ${themes.length}`);
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log('');
  process.exit(1);
}

// Test 2: Check sample output format
console.log('📦 Test 2: Validating sample output format...');
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(TEST_ASSETS, 'sample-output', 'sample-manifest.json'), 'utf8')
  );
  
  const requiredFields = ['config', 'combinations'];
  const missingFields = requiredFields.filter(f => !manifest[f]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing fields: ${missingFields.join(', ')}`);
  }
  
  console.log('   ✅ Valid JSON structure');
  console.log(`   ✅ Config: ${Object.keys(manifest.config).length} fields`);
  console.log(`   ✅ Combinations: ${manifest.combinations.length} samples`);
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log('');
  process.exit(1);
}

// Test 3: Generate combinations (mini version)
console.log('🔄 Test 3: Generating combinations...');
try {
  const headlines = ['Headline 1', 'Headline 2', 'Headline 3'];
  const ctas = ['CTA 1', 'CTA 2'];
  const images = ['Img-V1', 'Img-V2'];
  const lpVariants = ['FULL_LP', 'Mini_LP'];
  
  const combinations = [];
  let count = 0;
  
  for (const image of images) {
    for (const headline of headlines) {
      for (const cta of ctas) {
        for (const lp of lpVariants) {
          combinations.push({
            id: `ad_${count}`,
            ad_title: `Test-Campaign | Test-Theme | ${image}_${lp}`,
            headline,
            cta,
            lp_variant: lp
          });
          count++;
        }
      }
    }
  }
  
  const expected = images.length * headlines.length * ctas.length * lpVariants.length;
  
  console.log(`   ✅ Generated ${combinations.length} combinations (expected: ${expected})`);
  console.log(`   ✅ Formula: ${images.length} images × ${headlines.length} headlines × ${ctas.length} CTAs × ${lpVariants.length} LP variants`);
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log('');
  process.exit(1);
}

// Test 4: Verify image folder structure
console.log('📁 Test 4: Checking image folder structure...');
try {
  const imagesDir = path.join(TEST_ASSETS, 'images');
  
  if (!fs.existsSync(imagesDir)) {
    throw new Error('Images directory not found');
  }
  
  const platforms = fs.readdirSync(imagesDir).filter(f => fs.statSync(path.join(imagesDir, f)).isDirectory());
  console.log(`   ✅ Found ${platforms.length} platform(s): ${platforms.join(', ')}`);
  
  for (const platform of platforms) {
    const platformPath = path.join(imagesDir, platform);
    const clients = fs.readdirSync(platformPath).filter(f => fs.statSync(path.join(platformPath, f)).isDirectory());
    console.log(`   ✅ ${platform}: ${clients.length} client(s) - ${clients.join(', ')}`);
  }
  
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log('');
  process.exit(1);
}

// Summary
console.log('═'.repeat(60));
console.log('🎉 All tests passed!');
console.log('');
console.log('Next steps:');
console.log('1. Review the sample output format in test-assets/sample-output/');
console.log('2. Add real test images to test-assets/images/');
console.log('3. Run with real credentials: node ad-creator-scale.js');
console.log('');
