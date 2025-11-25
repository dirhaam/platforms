/**
 * PWA Icon Generator Script
 * 
 * This script generates PWA icons.
 * 
 * Prerequisites:
 * npm install sharp
 * 
 * Usage:
 * node scripts/generate-pwa-icons.js [source-image]
 * node scripts/generate-pwa-icons.js --png  (create PNG from SVG)
 * 
 * Example:
 * node scripts/generate-pwa-icons.js public/logo.png
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '../public/pwa');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

async function generateFromSource(sourcePath) {
  if (!sharp) {
    console.error('Sharp not installed. Run: npm install sharp');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sourceImage = sharp(sourcePath);
  
  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    await sourceImage
      .clone()
      .resize(size, size, {
        fit: 'contain',
        background: { r: 59, g: 130, b: 246, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: ${outputPath}`);
  }
  
  console.log('\nAll PNG icons generated successfully!');
}

async function convertSvgToPng() {
  if (!sharp) {
    console.error('Sharp not installed. Run: npm install sharp');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of SIZES) {
    const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.log(`SVG not found: ${svgPath}, creating...`);
      createSingleSvg(size);
    }

    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted: ${pngPath}`);
  }
  
  console.log('\nAll SVG icons converted to PNG!');
}

function createSingleSvg(size) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">B</text>
</svg>`;
  
  const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
  fs.writeFileSync(outputPath, svg);
}

function createPlaceholderSvgs() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of SIZES) {
    createSingleSvg(size);
    console.log(`Created SVG: icon-${size}x${size}.svg`);
  }
  
  console.log('\nSVG placeholders created.');
}

// Main
const args = process.argv.slice(2);

if (args.includes('--png')) {
  console.log('Converting SVG icons to PNG...');
  convertSvgToPng().catch(console.error);
} else if (args.includes('--svg')) {
  console.log('Creating SVG placeholder icons...');
  createPlaceholderSvgs();
} else if (args.length > 0 && !args[0].startsWith('--')) {
  const sourcePath = args[0];
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }
  console.log(`Generating icons from: ${sourcePath}`);
  generateFromSource(sourcePath).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node generate-pwa-icons.js <image.png>  - Generate from source image');
  console.log('  node generate-pwa-icons.js --png        - Convert existing SVGs to PNG');
  console.log('  node generate-pwa-icons.js --svg        - Create SVG placeholders');
}
