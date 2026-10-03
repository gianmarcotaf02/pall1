/**
 * Genera le icone PNG dell'app (PWA e iOS) a partire dagli SVG.
 *
 *   node scripts/build-icons.mjs
 *
 * Scrive in `public/icons/`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/icons");
mkdirSync(outDir, { recursive: true });

const TARGETS = [
  { svg: "public/icon.svg", file: "icon-192.png", size: 192 },
  { svg: "public/icon.svg", file: "icon-512.png", size: 512 },
  { svg: "public/icon.svg", file: "apple-touch-icon.png", size: 180, opaque: true },
  { svg: "public/icon-maskable.svg", file: "icon-maskable-512.png", size: 512 },
];

const browser = await chromium.launch();

for (const target of TARGETS) {
  const svg = (await import("node:fs")).readFileSync(resolve(root, target.svg), "utf8");
  const page = await browser.newPage({
    viewport: { width: target.size, height: target.size },
    deviceScaleFactor: 1,
  });

  await page.setContent(
    `<!doctype html><html><head><style>
       html,body{margin:0;width:${target.size}px;height:${target.size}px;background:${target.opaque ? "#09782b" : "transparent"}}
       svg{display:block;width:${target.size}px;height:${target.size}px}
     </style></head><body>${svg}</body></html>`,
    { waitUntil: "load" },
  );

  const buffer = await page.screenshot({ omitBackground: !target.opaque });
  writeFileSync(resolve(outDir, target.file), buffer);
  await page.close();

  console.log(`${target.file} · ${target.size}px · ${(buffer.length / 1024).toFixed(1)} kB`);
}

await browser.close();
