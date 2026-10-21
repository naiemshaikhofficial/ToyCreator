const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function makeCover() {
  const width = 600;
  const height = 600;

  const targetDir = path.join(__dirname, '..', 'public', 'products');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cyanGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.30" />
          <stop offset="50%" stop-color="#004466" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#111114" stop-opacity="1" />
        </radialGradient>
      </defs>

      <rect width="${width}" height="${height}" fill="#111114" />
      <rect width="${width}" height="${height}" fill="url(#cyanGlow)" />

      <!-- Acoustic Wave Rings -->
      <circle cx="300" cy="270" r="210" fill="none" stroke="#00d2ff" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="4,6" />
      <circle cx="300" cy="270" r="160" fill="none" stroke="#00d2ff" stroke-opacity="0.18" stroke-width="1.5" />
      <circle cx="300" cy="270" r="110" fill="none" stroke="#00d2ff" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="6,4" />

      <!-- Top Badge -->
      <rect x="200" y="40" width="200" height="28" rx="14" fill="#18181c" stroke="#2a2a30" stroke-width="1" />
      <text x="300" y="58" fill="#00d2ff" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" text-anchor="middle" letter-spacing="2.5">
        PRODUCER TOY DSP
      </text>

      <!-- Bottom Specs Bar -->
      <rect x="30" y="500" width="540" height="60" rx="14" fill="#141418" stroke="#26262c" stroke-width="1" />
      <text x="300" y="526" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1.5">
        SMART ALGORITHMIC REVERB
      </text>
      <text x="300" y="546" fill="#888890" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" text-anchor="middle" letter-spacing="1.5">
        VST3 • AUDIO UNITS • 64-BIT
      </text>
    </svg>
  `;

  const logoSource = path.join(__dirname, '..', '..', 'ProducerToy-Plugins', 'ProVerb', 'Resources', 'Bold ProVerb Gaming Logo.png');
  const logo = await sharp(logoSource)
    .resize(460)
    .toBuffer();

  const logoMeta = await sharp(logo).metadata();

  const outputPath = path.join(targetDir, 'proverb.png');
  await sharp(Buffer.from(svg))
    .composite([
      {
        input: logo,
        top: Math.round(270 - logoMeta.height / 2),
        left: Math.round((width - 460) / 2),
      }
    ])
    .png()
    .toFile(outputPath);

  console.log('Created:', outputPath);
}

makeCover().catch(console.error);
