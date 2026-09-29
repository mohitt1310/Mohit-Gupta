import fs from 'fs';
import sharp from 'sharp';

// Look at the uploaded logo image:
// "UTTAM®"
// U, T, T, M are extra heavy sans-serif.
// A is a vibrant blue triangle with lightning bolt.
// Subtitle: "POWER AND DISTRIBUTION TRANSFORMERS" in bold serif capitals.
// Exactly proportional to the uploaded image.

const createSvg = (theme = 'default') => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#F1F5F9' : '#000000';
  const triangleBlue = '#006CE5';
  const lightningGlow = '#38BDF8';
  const lightningCore = '#FFFFFF';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 400" width="100%" height="100%">
  <defs>
    <filter id="lightningGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <g id="uttam-logo-group">
    <!-- UTT -->
    <text x="18" y="240" 
      font-family="system-ui, -apple-system, 'Segoe UI', Impact, 'Arial Black', sans-serif" 
      font-weight="900" 
      font-size="220" 
      letter-spacing="6" 
      fill="${textColor}">
      UTT
    </text>

    <!-- Triangle A with lightning bolt -->
    <g id="letter-A">
      <!-- Triangle Shape -->
      <polygon points="615,55 715,240 515,240" fill="${triangleBlue}" />
      
      <!-- Electric Lightning Bolt cutting across -->
      <!-- Glow outline -->
      <polyline points="675,50 632,135 658,140 558,260" 
        fill="none" 
        stroke="${lightningGlow}" 
        stroke-width="11" 
        stroke-linecap="round" 
        stroke-linejoin="miter" 
        filter="url(#lightningGlow)"
      />
      <!-- Sharp core bolt -->
      <polyline points="675,50 632,135 658,140 558,260" 
        fill="none" 
        stroke="${lightningCore}" 
        stroke-width="5" 
        stroke-linecap="round" 
        stroke-linejoin="miter" 
      />
    </g>

    <!-- M -->
    <text x="725" y="240" 
      font-family="system-ui, -apple-system, 'Segoe UI', Impact, 'Arial Black', sans-serif" 
      font-weight="900" 
      font-size="220" 
      letter-spacing="6" 
      fill="${textColor}">
      M
    </text>

    <!-- Registered Trademark ® -->
    <g id="trademark-r" transform="translate(935, 70)">
      <circle cx="26" cy="26" r="24" fill="none" stroke="${textColor}" stroke-width="6.5" />
      <text x="26" y="36" 
        font-family="system-ui, -apple-system, Arial, sans-serif" 
        font-weight="900" 
        font-size="28" 
        text-anchor="middle" 
        fill="${textColor}">
        R
      </text>
    </g>

    <!-- Tagline: POWER AND DISTRIBUTION TRANSFORMERS -->
    <text x="500" y="325" 
      font-family="Georgia, 'Times New Roman', Times, serif" 
      font-weight="bold" 
      font-size="45" 
      letter-spacing="5" 
      text-anchor="middle" 
      fill="${subColor}">
      POWER AND DISTRIBUTION TRANSFORMERS
    </text>
  </g>
</svg>`;
};

// Also create one without subtitle for compact icon/sidebar use
const createCompactSvg = (theme = 'default') => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const triangleBlue = '#006CE5';
  const lightningGlow = '#38BDF8';
  const lightningCore = '#FFFFFF';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 270" width="100%" height="100%">
  <defs>
    <filter id="lightningGlowCompact" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <g id="uttam-logo-group">
    <!-- UTT -->
    <text x="18" y="240" 
      font-family="system-ui, -apple-system, 'Segoe UI', Impact, 'Arial Black', sans-serif" 
      font-weight="900" 
      font-size="220" 
      letter-spacing="6" 
      fill="${textColor}">
      UTT
    </text>

    <!-- Triangle A with lightning bolt -->
    <g id="letter-A">
      <polygon points="615,55 715,240 515,240" fill="${triangleBlue}" />
      
      <polyline points="675,50 632,135 658,140 558,260" 
        fill="none" 
        stroke="${lightningGlow}" 
        stroke-width="11" 
        stroke-linecap="round" 
        stroke-linejoin="miter" 
        filter="url(#lightningGlowCompact)"
      />
      <polyline points="675,50 632,135 658,140 558,260" 
        fill="none" 
        stroke="${lightningCore}" 
        stroke-width="5" 
        stroke-linecap="round" 
        stroke-linejoin="miter" 
      />
    </g>

    <!-- M -->
    <text x="725" y="240" 
      font-family="system-ui, -apple-system, 'Segoe UI', Impact, 'Arial Black', sans-serif" 
      font-weight="900" 
      font-size="220" 
      letter-spacing="6" 
      fill="${textColor}">
      M
    </text>

    <!-- Registered Trademark ® -->
    <g id="trademark-r" transform="translate(935, 70)">
      <circle cx="26" cy="26" r="24" fill="none" stroke="${textColor}" stroke-width="6.5" />
      <text x="26" y="36" 
        font-family="system-ui, -apple-system, Arial, sans-serif" 
        font-weight="900" 
        font-size="28" 
        text-anchor="middle" 
        fill="${textColor}">
        R
      </text>
    </g>
  </g>
</svg>`;
};

async function run() {
  const defaultSvg = createSvg('default');
  fs.writeFileSync('public/uttam-logo.svg', defaultSvg);
  if (fs.existsSync('dist')) {
    fs.writeFileSync('dist/uttam-logo.svg', defaultSvg);
  }

  // Generate crisp high-resolution PNG: public/logo.png
  await sharp(Buffer.from(defaultSvg))
    .resize(2000, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile('public/logo.png');

  console.log('Successfully generated public/uttam-logo.svg and public/logo.png');
}

run().catch(console.error);
