import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // Read actual official logo and convert to base64
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="topAura" cx="50%" cy="10%" r="65%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.22"/>
      <stop offset="35%" stop-color="#8b5cf6" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#040507" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="centerGlow" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#040507" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="bottomFlare" cx="25%" cy="95%" r="45%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#040507" stop-opacity="0"/>
    </radialGradient>

    <!-- Gradients for typography & boxes -->
    <linearGradient id="textWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <linearGradient id="brandMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="45%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>

    <linearGradient id="boxFill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.14"/>
      <stop offset="50%" stop-color="#c084fc" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.05"/>
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e131e"/>
      <stop offset="100%" stop-color="#07090f"/>
    </linearGradient>

    <!-- Crisp Subtle Dot Grid -->
    <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.05)"/>
    </pattern>

    <!-- Linear Thin Grid -->
    <pattern id="subtleGrid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255, 255, 255, 0.025)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Deep Dark Solid Background -->
  <rect width="${width}" height="${height}" fill="#040507"/>

  <!-- Background Grids & Dots -->
  <rect width="${width}" height="${height}" fill="url(#subtleGrid)"/>
  <rect width="${width}" height="${height}" fill="url(#dotGrid)"/>

  <!-- Atmospheric Lighting -->
  <rect width="${width}" height="${height}" fill="url(#topAura)"/>
  <rect width="${width}" height="${height}" fill="url(#centerGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#bottomFlare)"/>

  <!-- Minimal Framed Border with Corner Accents -->
  <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="18" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="1"/>

  <!-- ==================== HEADER ==================== -->
  <g transform="translate(68, 62)">
    <!-- Actual Official Logo Image -->
    <image href="${logoDataUri}" x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>

    <!-- Brand Typography -->
    <text x="60" y="32" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="26" font-weight="700" letter-spacing="-0.5">Multipu</text>
    <text x="158" y="32" fill="#64748b" font-family="ui-monospace, monospace" font-size="14" font-weight="500">.fun</text>

    <!-- Live Multi-Chain Cluster Pill -->
    <g transform="translate(670, 6)">
      <rect x="0" y="0" width="394" height="36" rx="18" fill="rgba(15, 20, 30, 0.85)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <circle cx="20" cy="18" r="4" fill="#10b981"/>
      <text x="32" y="22" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="11" font-weight="600" letter-spacing="0.5">SOLANA</text>
      <text x="96" y="22" fill="#475569" font-family="ui-monospace, monospace" font-size="11">•</text>
      <text x="112" y="22" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="11" font-weight="600" letter-spacing="0.5">BNB CHAIN</text>
      <text x="194" y="22" fill="#475569" font-family="ui-monospace, monospace" font-size="11">•</text>
      <text x="210" y="22" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="11" font-weight="600" letter-spacing="0.5">ROBINHOOD</text>
      
      <!-- Live Tag -->
      <rect x="312" y="7" width="70" height="22" rx="11" fill="rgba(16, 185, 129, 0.14)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1"/>
      <text x="347" y="22" text-anchor="middle" fill="#34d399" font-family="ui-monospace, monospace" font-size="10" font-weight="700">ONLINE</text>
    </g>
  </g>

  <!-- ==================== FLOATING NODES ==================== -->
  <!-- Floating Chip: Pump.fun / Meteora / Bags -->
  <g transform="translate(68, 150)">
    <rect x="0" y="0" width="220" height="34" rx="8" fill="rgba(13, 17, 26, 0.85)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
    <text x="16" y="22" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11" font-weight="500">Pump.fun</text>
    <text x="88" y="22" fill="#475569" font-family="ui-monospace, monospace" font-size="11">/</text>
    <text x="102" y="22" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11" font-weight="500">Meteora</text>
    <text x="164" y="22" fill="#475569" font-family="ui-monospace, monospace" font-size="11">/</text>
    <text x="178" y="22" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11" font-weight="500">Bags</text>
  </g>

  <!-- Floating Chip: Four.meme / Pons -->
  <g transform="translate(900, 150)">
    <rect x="0" y="0" width="232" height="34" rx="8" fill="rgba(13, 17, 26, 0.85)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
    <text x="16" y="22" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11" font-weight="500">Four.meme</text>
    <text x="96" y="22" fill="#475569" font-family="ui-monospace, monospace" font-size="11">/</text>
    <text x="110" y="22" fill="#60a5fa" font-family="ui-monospace, monospace" font-size="11" font-weight="600">Pons Protocol</text>
  </g>

  <!-- Floating Pill: MCP Agent Protocol Active -->
  <g transform="translate(860, 206)">
    <rect x="0" y="0" width="272" height="34" rx="17" fill="rgba(139, 92, 246, 0.08)" stroke="rgba(139, 92, 246, 0.28)" stroke-width="1"/>
    <circle cx="16" cy="17" r="3.5" fill="#c084fc"/>
    <text x="28" y="21" fill="#e9d5ff" font-family="ui-monospace, monospace" font-size="11" font-weight="600">MCP Agent Protocol Active</text>
  </g>

  <!-- ==================== HERO HEADLINE ==================== -->
  <g transform="translate(0, 226)">
    <!-- Category Subtitle Tag -->
    <text x="600" y="28" text-anchor="middle" fill="#60a5fa" font-family="ui-monospace, monospace" font-size="12" font-weight="700" letter-spacing="2.5">MULTI-CHAIN TOKEN ORCHESTRATOR</text>

    <!-- Line 1: Deploy Once. -->
    <text x="600" y="98" text-anchor="middle" fill="url(#textWhiteGrad)" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="64" font-weight="800" letter-spacing="-2.5">
      Deploy Once.
    </text>

    <!-- Line 2: Launch [Everywhere.] with centered highlight frame -->
    <g transform="translate(290, 126)">
      <!-- Word: Launch -->
      <text x="0" y="56" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="64" font-weight="800" letter-spacing="-2.5">
        Launch
      </text>

      <!-- Frame for Everywhere -->
      <g transform="translate(230, 0)">
        <rect x="0" y="0" width="390" height="76" rx="14" fill="url(#boxFill)" stroke="rgba(244, 114, 182, 0.45)" stroke-width="1.5"/>
        
        <!-- Reticle Corner Markers -->
        <path d="M 8 18 L 8 8 L 18 8" fill="none" stroke="#f472b6" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 382 18 L 382 8 L 372 8" fill="none" stroke="#f472b6" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 8 58 L 8 68 L 18 68" fill="none" stroke="#f472b6" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 382 58 L 382 68 L 372 68" fill="none" stroke="#f472b6" stroke-width="2.5" stroke-linecap="round"/>

        <!-- Text inside framed box -->
        <text x="195" y="56" text-anchor="middle" fill="url(#brandMagenta)" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="62" font-weight="800" letter-spacing="-2">
          Everywhere.
        </text>
      </g>
    </g>

    <!-- Subtitle explanation -->
    <text x="600" y="234" text-anchor="middle" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="17" font-weight="400" letter-spacing="-0.2">
      Simultaneous token deployments, live DEX terminal, and autonomous agent trading.
    </text>
  </g>

  <!-- ==================== BOTTOM DATA RIBBON ==================== -->
  <g transform="translate(68, 502)">
    <!-- Container background -->
    <rect x="0" y="0" width="1064" height="72" rx="14" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>

    <!-- Section 1: Solana -->
    <g transform="translate(24, 16)">
      <text x="0" y="14" fill="#64748b" font-family="ui-monospace, monospace" font-size="10" font-weight="700" letter-spacing="1">CLUSTER 01</text>
      <text x="0" y="35" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="14" font-weight="600">Solana</text>
      <text x="64" y="35" fill="#10b981" font-family="ui-monospace, monospace" font-size="12">Pump • Raydium</text>
    </g>

    <line x1="266" y1="14" x2="266" y2="58" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>

    <!-- Section 2: BNB Chain -->
    <g transform="translate(290, 16)">
      <text x="0" y="14" fill="#64748b" font-family="ui-monospace, monospace" font-size="10" font-weight="700" letter-spacing="1">CLUSTER 02</text>
      <text x="0" y="35" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="14" font-weight="600">BNB Chain</text>
      <text x="88" y="35" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="12">Four.meme</text>
    </g>

    <line x1="532" y1="14" x2="532" y2="58" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>

    <!-- Section 3: Robinhood Chain -->
    <g transform="translate(556, 16)">
      <text x="0" y="14" fill="#64748b" font-family="ui-monospace, monospace" font-size="10" font-weight="700" letter-spacing="1">CLUSTER 03</text>
      <text x="0" y="35" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="14" font-weight="600">Robinhood</text>
      <text x="90" y="35" fill="#60a5fa" font-family="ui-monospace, monospace" font-size="12">Pons Protocol</text>
    </g>

    <line x1="798" y1="14" x2="798" y2="58" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>

    <!-- Section 4: Intelligence -->
    <g transform="translate(822, 16)">
      <text x="0" y="14" fill="#64748b" font-family="ui-monospace, monospace" font-size="10" font-weight="700" letter-spacing="1">AI AGENT ENGINE</text>
      <text x="0" y="35" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="14" font-weight="600">OlaXBT</text>
      <text x="68" y="35" fill="#c084fc" font-family="ui-monospace, monospace" font-size="12">KeeperHub MCP</text>
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

  console.log("All OG images updated with official Multipu logo.");
}

generateOgImage().catch(console.error);
