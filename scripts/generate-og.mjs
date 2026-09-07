import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // Read official logo
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Radial Vignette -->
    <radialGradient id="vignette" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#14151a"/>
      <stop offset="50%" stop-color="#0c0d11"/>
      <stop offset="100%" stop-color="#050608"/>
    </radialGradient>

    <!-- Center Soft Aura -->
    <radialGradient id="centerAura" cx="50%" cy="36%" r="42%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#050608" stop-opacity="0"/>
    </radialGradient>

    <!-- Pink Text Gradient for Highlighted Word -->
    <linearGradient id="pinkTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>

    <!-- Selection Box Background -->
    <linearGradient id="boxBackground" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#241728" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#1a1422" stop-opacity="0.95"/>
    </linearGradient>

    <!-- Bottom UI Card Gradient -->
    <linearGradient id="uiCardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#13141a"/>
      <stop offset="100%" stop-color="#0a0b0e"/>
    </linearGradient>

    <!-- Mosaic Pixel Pattern matching Bytebot background -->
    <pattern id="mosaicGrid" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="12" height="12" fill="rgba(255, 255, 255, 0.035)"/>
      <rect x="14" y="14" width="12" height="12" fill="rgba(255, 255, 255, 0.02)"/>
      <rect x="14" y="0" width="12" height="12" fill="rgba(255, 255, 255, 0.01)"/>
      <rect x="0" y="14" width="12" height="12" fill="rgba(255, 255, 255, 0.045)"/>
    </pattern>

    <!-- Mask to fade the mosaic towards the center -->
    <radialGradient id="mosaicMaskGrad" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="65%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
    </radialGradient>
    <mask id="mosaicMask">
      <rect width="${width}" height="${height}" fill="url(#mosaicMaskGrad)"/>
    </mask>
  </defs>

  <!-- Base Dark Background -->
  <rect width="${width}" height="${height}" fill="#060709"/>
  <rect width="${width}" height="${height}" fill="url(#vignette)"/>

  <!-- Mosaic Texture with Vignette Mask -->
  <rect width="${width}" height="${height}" fill="url(#mosaicGrid)" mask="url(#mosaicMask)"/>

  <!-- Subtle Center Aura -->
  <rect width="${width}" height="${height}" fill="url(#centerAura)"/>

  <!-- ==================== FLOATING CURSORS & CAPSULES ==================== -->

  <!-- Top-Left Floating Cursor & Pill -->
  <g transform="translate(255, 185)">
    <g transform="rotate(-18)">
      <path d="M 0 0 L 17 12 L 8 13 L 13 22 L 9 24 L 5 15 L 0 19 Z" fill="#6b7280"/>
      <rect x="20" y="8" width="54" height="18" rx="9" fill="#1b1c24" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <rect x="25" y="12" width="44" height="10" rx="5" fill="#374151" opacity="0.6"/>
    </g>
  </g>

  <!-- Top-Right Floating Cursor & Pill -->
  <g transform="translate(905, 215)">
    <g transform="rotate(15)">
      <path d="M 0 0 L 17 12 L 8 13 L 13 22 L 9 24 L 5 15 L 0 19 Z" fill="#6b7280"/>
      <rect x="20" y="8" width="58" height="18" rx="9" fill="#1b1c24" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <rect x="25" y="12" width="48" height="10" rx="5" fill="#374151" opacity="0.6"/>
    </g>
  </g>

  <!-- Bottom-Left Floating Cursor & Pill -->
  <g transform="translate(130, 480)">
    <g transform="rotate(-22)">
      <path d="M 0 0 L 17 12 L 8 13 L 13 22 L 9 24 L 5 15 L 0 19 Z" fill="#6b7280"/>
      <rect x="20" y="8" width="64" height="20" rx="10" fill="#1b1c24" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <rect x="26" y="13" width="52" height="10" rx="5" fill="#374151" opacity="0.6"/>
    </g>
  </g>

  <!-- ==================== HEADER (LOGO + NAME) ==================== -->
  <g transform="translate(438, 120)">
    <!-- Official Multipu 3D Logo Mark -->
    <image href="${logoDataUri}" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>
    <!-- Brand Typography -->
    <text x="80" y="47" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="700" letter-spacing="-1">multipu</text>
  </g>

  <!-- ==================== HERO HEADLINE ==================== -->
  <g transform="translate(600, 260)">
    <!-- Line 1: Your Multi-Chain Token -->
    <text x="0" y="0" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="700" letter-spacing="-2">
      Your Multi-Chain Token
    </text>

    <!-- Line 2: Automation [Playground] -->
    <g transform="translate(-330, 28)">
      <!-- Word: Automation -->
      <text x="0" y="56" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="700" letter-spacing="-2">
        Automation
      </text>

      <!-- Selection Bounding Box around Playground -->
      <g transform="translate(320, 0)">
        <rect x="0" y="0" width="345" height="78" rx="6" fill="url(#boxBackground)"/>

        <!-- Reticle Corner Brackets (Pink) -->
        <!-- Top-Left Bracket -->
        <path d="M 0 14 L 0 0 L 14 0" fill="none" stroke="#f472b6" stroke-width="3.5" stroke-linecap="square"/>
        <!-- Top-Right Bracket -->
        <path d="M 345 14 L 345 0 L 331 0" fill="none" stroke="#f472b6" stroke-width="3.5" stroke-linecap="square"/>
        <!-- Bottom-Left Bracket -->
        <path d="M 0 64 L 0 78 L 14 78" fill="none" stroke="#f472b6" stroke-width="3.5" stroke-linecap="square"/>
        <!-- Bottom-Right Bracket -->
        <path d="M 345 64 L 345 78 L 331 78" fill="none" stroke="#f472b6" stroke-width="3.5" stroke-linecap="square"/>

        <!-- Highlighted Text: Playground -->
        <text x="172" y="56" text-anchor="middle" fill="url(#pinkTextGrad)" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="700" letter-spacing="-2">
          Playground
        </text>

        <!-- White Active Pointer Cursor at bottom right of Playground box -->
        <g transform="translate(305, 58)">
          <path d="M 0 0 L 22 17 L 11 18 L 18 31 L 12 34 L 5 20 L 0 26 Z" fill="#ffffff"/>
          <!-- Attached white pill capsule -->
          <g transform="translate(24, 16)">
            <rect x="0" y="0" width="86" height="30" rx="15" fill="#f3f4f6" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
            <rect x="8" y="6" width="70" height="18" rx="9" fill="#e5e7eb"/>
          </g>
        </g>
      </g>
    </g>
  </g>

  <!-- ==================== BOTTOM PEEKING UI CARD ==================== -->
  <g transform="translate(240, 445)">
    <!-- Main Card Container -->
    <rect x="0" y="0" width="720" height="240" rx="18" fill="url(#uiCardGradient)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.2"/>

    <!-- Table Header Row -->
    <g transform="translate(36, 30)">
      <text x="0" y="0" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500">Chain</text>
      <text x="165" y="0" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500">Token</text>
      <text x="330" y="0" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500">Launchpad Target</text>
    </g>

    <!-- Row 1 (Input Card Row) -->
    <g transform="translate(36, 50)">
      <!-- Dropdown Pill -->
      <rect x="0" y="0" width="140" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500">Solana</text>
      <path d="M 116 23 L 122 29 L 128 23" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>

      <!-- Input Field 2 -->
      <rect x="160" y="0" width="150" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500" transform="translate(160, 0)">$MULTIPU</text>

      <!-- Input Field 3 -->
      <rect x="330" y="0" width="270" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="400" transform="translate(330, 0)">Pump.fun &amp; Meteora DLMM</text>

      <!-- Trash icon -->
      <g transform="translate(622, 13)">
        <path d="M 4 5 L 16 5 M 6 5 L 6 16 L 14 16 L 14 5 M 8 5 L 8 3 L 12 3 L 12 5" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Row 2 (Input Card Row) -->
    <g transform="translate(36, 108)">
      <rect x="0" y="0" width="140" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500">BNB Chain</text>
      <path d="M 116 23 L 122 29 L 128 23" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>

      <rect x="160" y="0" width="150" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500" transform="translate(160, 0)">$MULTIPU</text>

      <rect x="330" y="0" width="270" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="400" transform="translate(330, 0)">Four.meme Launchpad</text>

      <g transform="translate(622, 13)">
        <path d="M 4 5 L 16 5 M 6 5 L 6 16 L 14 16 L 14 5 M 8 5 L 8 3 L 12 3 L 12 5" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Row 3 (Peeking Row) -->
    <g transform="translate(36, 166)">
      <rect x="0" y="0" width="140" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500">Robinhood</text>
      <rect x="160" y="0" width="150" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="500" transform="translate(160, 0)">$MULTIPU</text>
      <rect x="330" y="0" width="270" height="44" rx="8" fill="#1b1d26" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
      <text x="18" y="27" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="400" transform="translate(330, 0)">Pons Protocol</text>
    </g>
  </g>
</svg>
  `;

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: width,
    },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "sans-serif",
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const publicOgPath = path.join(process.cwd(), "public", "og.png");
  fs.writeFileSync(publicOgPath, pngBuffer);

  const publicOgJpgPath = path.join(process.cwd(), "public", "og.jpg");
  fs.writeFileSync(publicOgJpgPath, pngBuffer);

  const appOgPath = path.join(process.cwd(), "app", "opengraph-image.png");
  fs.writeFileSync(appOgPath, pngBuffer);

  console.log("Successfully generated polished pixel-matched OG image.");
}

generateOgImage().catch(console.error);
