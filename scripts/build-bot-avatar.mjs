/**
 * Genera la foto profilo del bot Telegram dal marchio nuovo (`public/logo.svg`).
 *
 *   node scripts/build-bot-avatar.mjs
 *
 * Scrive `public/icons/bot-avatar.png` (512×512). Sfondo carta come nella home,
 * sagoma verde e marcature crema: è lo stesso marchio che sta in alto a sinistra
 * nell'app. Telegram ritaglia il cerchio, quindi il numero sta dentro con margine.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/icons");
const SIZE = 512;

/** Sfondo carta (tema chiaro) e verde del marchio, come in `app-shell`. */
const PAPER = "#eef6ef";
const ACCENT = "#09782b";

const svg = readFileSync(resolve(root, "public/logo.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/currentColor/g, ACCENT);

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  deviceScaleFactor: 1,
});

await page.setContent(
  `<!doctype html><html><head><style>
     html,body{margin:0;width:${SIZE}px;height:${SIZE}px;background:${PAPER}}
     svg{display:block;width:${SIZE}px;height:${SIZE}px}
   </style></head><body>${svg}</body></html>`,
  { waitUntil: "load" },
);

const buffer = await page.screenshot();
writeFileSync(resolve(outDir, "bot-avatar.png"), buffer);
await browser.close();

console.log(`bot-avatar.png · ${SIZE}px · ${(buffer.length / 1024).toFixed(1)} kB`);
