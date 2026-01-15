import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const logoPath = './asset/logo.png';
const assetDir = './asset';

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generateFavicons() {
  try {
    console.log('Generating favicons from logo.png...');
    
    // Generate PNG favicons
    for (const { size, name } of sizes) {
      await sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(assetDir, name));
      console.log(`✓ Generated ${name}`);
    }
    
    // Generate ICO file from 32x32 PNG
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(assetDir, 'favicon.ico'));
    console.log('✓ Generated favicon.ico');
    
    console.log('\nAll favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
