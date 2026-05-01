/**
 * PWA maskable ikonları üretir (bir kez çalıştırın: npm run generate-pwa-icons).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="12%" y1="8%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="55%" stop-color="#0c4a6e"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <ellipse cx="256" cy="278" rx="168" ry="92" fill="none" stroke="rgba(56,189,248,0.55)" stroke-width="14"/>
  <ellipse cx="256" cy="278" rx="152" ry="78" fill="rgba(255,255,255,0.08)"/>
  <ellipse cx="256" cy="268" rx="118" ry="52" fill="rgba(56,189,248,0.15)"/>
</svg>`;

for (const size of [180, 192, 512]) {
  await sharp(Buffer.from(svg512))
    .resize(size, size)
    .png()
    .toFile(
      path.join(outDir, size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`),
    );
}

console.log("PWA ikonları yazıldı:", outDir);
