const sharp = require('sharp');
const fs = require('fs');

async function createOgImage() {
  const width = 1200;
  const height = 630;
  
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#22242a" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#121212" stop-opacity="1" />
        </radialGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#121212" />
      <rect width="${width}" height="${height}" fill="url(#glow)" />
      
      <!-- Border Frame -->
      <rect x="30" y="30" width="${width - 60}" height="${height - 60}" rx="24" fill="none" stroke="#26262a" stroke-width="2" />
      
      <!-- Sub-badge -->
      <rect x="440" y="70" width="320" height="36" rx="18" fill="#1c1c20" stroke="#2f3138" stroke-width="1.5" />
      <text x="600" y="93" fill="#a0a0a0" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="3">
        PRODUCER TOY INFRASTRUCTURE
      </text>

      <!-- Main Heading -->
      <text x="600" y="380" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" text-anchor="middle" letter-spacing="-1.5">
        TOY CREATOR
      </text>
      
      <!-- Subtitle -->
      <text x="600" y="435" fill="#d0d0d0" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" text-anchor="middle">
        The Monetization and Licensing Portal for Audio Developers
      </text>
      
      <!-- Tags -->
      <text x="600" y="490" fill="#808080" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="2">
        VST3 • AU • AAX • SAMPLE PACKS • SYNTH PRESETS • CRYPTO LICENSING
      </text>
    </svg>
  `;

  // Logo resize
  const logoResized = await sharp('public/logo.png')
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Composite background with logo
  await sharp(Buffer.from(svg))
    .composite([
      {
        input: logoResized,
        top: 135,
        left: Math.round((width - 200) / 2),
      }
    ])
    .png()
    .toFile('public/og-image.png');

  console.log('Created public/og-image.png successfully');
}

createOgImage().catch(console.error);
