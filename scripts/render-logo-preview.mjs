/**
 * Rende il marchio su varie dimensioni e su fondo chiaro/scuro, per
 * controllare a occhio che regga anche a 16px.
 *
 *   node scripts/render-logo-preview.mjs
 *
 * Produce `tmp/logo-preview.png`.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mark = readFileSync(resolve(root, "public/logo.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/(<svg[^>]*)width="[^"]*"/, "$1")
  .replace(/(<svg[^>]*)height="[^"]*"/, "$1");

// l'icona app ha colori suoi (tassello verde + numero crema) e resta identica
// nei due temi: nell'anteprima va usata quella, non il marchio dentro un finto
// tassello
const icon = readFileSync(resolve(root, "public/icon.svg"), "utf8").replace(/<\?xml[^>]*\?>/, "");

const sizes = [16, 24, 32, 48, 64, 128, 256];

const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; font: 12px/1.4 system-ui, sans-serif; color:#111; }
  .band { padding: 20px 24px; }
  .light { background:#eef6ef; color:#09782b; }
  .dark  { background:#09110a; color:#5cc46f; }
  h2 { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; opacity:.6; margin:0 0 14px; }
  .row { display:flex; align-items:flex-end; gap:26px; }
  figure { margin:0; text-align:center; }
  figure svg { display:block; margin:0 auto; }
  figcaption { margin-top:6px; font-size:10px; opacity:.6; }
</style></head><body>
  <div class="band light">
    <h2>Fondo chiaro</h2>
    <div class="row">
      ${sizes
        .map(
          (size) =>
            `<figure>${mark.replace("<svg", `<svg style="width:${size}px;height:${size}px"`)}<figcaption>${size}</figcaption></figure>`,
        )
        .join("")}
      <figure>${icon.replace("<svg", `<svg style="width:96px;height:96px"`)}<figcaption>icona app</figcaption></figure>
    </div>
  </div>
  <div class="band dark">
    <h2>Fondo scuro</h2>
    <div class="row">
      ${sizes
        .map(
          (size) =>
            `<figure>${mark.replace("<svg", `<svg style="width:${size}px;height:${size}px"`)}<figcaption>${size}</figcaption></figure>`,
        )
        .join("")}
      <figure>${icon.replace("<svg", `<svg style="width:96px;height:96px"`)}<figcaption>icona app</figcaption></figure>
    </div>
  </div>
  <div class="band light">
    <h2>Icona app — dimensioni reali</h2>
    <div class="row">
      ${[16, 20, 24, 28, 32, 40, 48, 64, 96]
        .map(
          (size) =>
            `<figure>${readFileSync(resolve(root, "public/icon.svg"), "utf8")
              .replace(/<\?xml[^>]*\?>/, "")
              .replace("<svg", `<svg style="width:${size}px;height:${size}px"`)}<figcaption>${size}</figcaption></figure>`,
        )
        .join("")}
    </div>
  </div>
</body></html>`;

mkdirSync(resolve(root, "tmp"), { recursive: true });
writeFileSync(resolve(root, "tmp/logo-preview.html"), sheet);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 620 }, deviceScaleFactor: 2 });
await page.setContent(sheet, { waitUntil: "load" });
await page.screenshot({ path: resolve(root, "tmp/logo-preview.png"), fullPage: true });
await browser.close();

console.log("Scritto tmp/logo-preview.png");
