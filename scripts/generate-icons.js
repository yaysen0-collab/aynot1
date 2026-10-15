import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon design: Soft calming teal background, rounded friendly book/notebook with pen/star, representing teaching/mentoring
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#115e59"/>
    </linearGradient>
    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#042f2e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

  <!-- Inner Soft Badge / Book Composition -->
  <g filter="url(#shadow)" transform="translate(64, 64)">
    <!-- Main Notebook Board -->
    <rect x="32" y="32" width="320" height="320" rx="36" fill="url(#bookGrad)"/>
    
    <!-- Notebook Left Spine / Binding -->
    <rect x="32" y="32" width="48" height="320" rx="20" fill="#0d9488"/>
    <circle cx="56" cy="96" r="10" fill="#ffffff" opacity="0.8"/>
    <circle cx="56" cy="192" r="10" fill="#ffffff" opacity="0.8"/>
    <circle cx="56" cy="288" r="10" fill="#ffffff" opacity="0.8"/>

    <!-- Content Lines / Student representation -->
    <!-- Line 1: Header / Name -->
    <rect x="112" y="86" width="160" height="18" rx="9" fill="#0f766e" opacity="0.85"/>
    <!-- Line 2: Note content -->
    <rect x="112" y="128" width="200" height="12" rx="6" fill="#94a3b8"/>
    <rect x="112" y="156" width="170" height="12" rx="6" fill="#cbd5e1"/>
    <rect x="112" y="184" width="140" height="12" rx="6" fill="#cbd5e1"/>

    <!-- Little badge / heart / star tag in bottom right -->
    <rect x="112" y="236" width="76" height="28" rx="14" fill="#ccfbf1"/>
    <circle cx="128" cy="250" r="6" fill="#0d9488"/>
    <rect x="142" y="246" width="34" height="8" rx="4" fill="#0f766e"/>

    <rect x="200" y="236" width="90" height="28" rx="14" fill="#fef3c7"/>
    <circle cx="216" cy="250" r="6" fill="#f59e0b"/>
    <rect x="230" y="246" width="48" height="8" rx="4" fill="#d97706"/>

    <!-- Floating Stylus / Pencil -->
    <g transform="translate(250, 190) rotate(42)">
      <rect x="0" y="0" width="30" height="120" rx="6" fill="url(#accentGrad)"/>
      <polygon points="0,120 15,148 30,120" fill="#fed7aa"/>
      <polygon points="10,138 15,148 20,138" fill="#1e293b"/>
      <rect x="0" y="0" width="30" height="24" rx="6" fill="#f43f5e"/>
      <rect x="0" y="20" width="30" height="8" fill="#cbd5e1"/>
    </g>
  </g>
</svg>`;

// Maskable version with extra margin
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#115e59"/>
    </linearGradient>
    <linearGradient id="bookGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="accentGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <!-- Full Bleed Background for Maskable (safe zone is center 80%) -->
  <rect width="512" height="512" fill="url(#bgGrad2)"/>

  <!-- Centered safe zone content -->
  <g transform="translate(100, 100) scale(0.61)">
    <rect x="32" y="32" width="440" height="440" rx="48" fill="url(#bookGrad2)"/>
    <rect x="32" y="32" width="68" height="440" rx="28" fill="#0d9488"/>
    <circle cx="66" cy="120" r="14" fill="#ffffff" opacity="0.8"/>
    <circle cx="66" cy="252" r="14" fill="#ffffff" opacity="0.8"/>
    <circle cx="66" cy="384" r="14" fill="#ffffff" opacity="0.8"/>

    <rect x="140" y="110" width="220" height="24" rx="12" fill="#0f766e" opacity="0.85"/>
    <rect x="140" y="168" width="260" height="16" rx="8" fill="#94a3b8"/>
    <rect x="140" y="206" width="230" height="16" rx="8" fill="#cbd5e1"/>
    <rect x="140" y="244" width="190" height="16" rx="8" fill="#cbd5e1"/>

    <g transform="translate(330, 240) rotate(42)">
      <rect x="0" y="0" width="40" height="160" rx="8" fill="url(#accentGrad2)"/>
      <polygon points="0,160 20,198 40,160" fill="#fed7aa"/>
      <polygon points="14,186 20,198 26,186" fill="#1e293b"/>
      <rect x="0" y="0" width="40" height="32" rx="8" fill="#f43f5e"/>
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

  const bufNormal = Buffer.from(svgContent);
  const bufMaskable = Buffer.from(svgMaskable);

  await sharp(bufNormal).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(bufNormal).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(bufNormal).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(bufMaskable).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Icons generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
