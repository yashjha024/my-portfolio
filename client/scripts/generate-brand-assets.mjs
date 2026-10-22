/**
 * Regenerates the raster brand assets in client/public from their sources:
 *   public/favicon.svg     -> favicon-32.png, apple-touch-icon.png (180), icon-512.png, favicon.ico
 *   brand/og-default.html  -> og-default.png (1200x630 social preview)
 *
 * Uses a local Chrome/Edge in headless mode (no npm dependencies). Run manually after editing a
 * source:  node client/scripts/generate-brand-assets.mjs   (set CHROME_PATH to override the browser)
 * The generated PNGs are committed; the build does not run this script.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(clientDir, 'public');

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const browser = BROWSER_CANDIDATES.find((candidate) => fs.existsSync(candidate));
if (!browser) {
  console.error('No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.');
  process.exit(1);
}

const screenshot = (sourceFile, outFile, width, height) => {
  execFileSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--default-background-color=00000000',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=5000',
      `--screenshot=${outFile}`,
      pathToFileURL(sourceFile).href,
    ],
    { stdio: 'ignore' }
  );
  const png = fs.readFileSync(outFile);
  const actual = [png.readUInt32BE(16), png.readUInt32BE(20)];
  if (actual[0] !== width || actual[1] !== height) {
    throw new Error(
      `${path.basename(outFile)} rendered at ${actual.join('x')}, expected ${width}x${height}`
    );
  }
  return png;
};

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-assets-'));
const iconPage = (size) => {
  const file = path.join(workDir, `icon-${size}.html`);
  const svg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');
  fs.writeFileSync(
    file,
    `<!doctype html><html><body style="margin:0;background:transparent">` +
      `<div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>` +
      `</body></html>`
  );
  return file;
};

/** Minimal ICO container holding one PNG image (supported by all current browsers). */
const pngToIco = (png, size) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
};

try {
  const outputs = [
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
    ['icon-512.png', 512],
  ];
  for (const [name, size] of outputs) {
    screenshot(iconPage(size), path.join(publicDir, name), size, size);
    console.info(`wrote public/${name} (${size}x${size})`);
  }
  fs.writeFileSync(
    path.join(publicDir, 'favicon.ico'),
    pngToIco(fs.readFileSync(path.join(publicDir, 'favicon-32.png')), 32)
  );
  console.info('wrote public/favicon.ico (32x32 PNG in ICO)');

  screenshot(
    path.join(clientDir, 'brand', 'og-default.html'),
    path.join(publicDir, 'og-default.png'),
    1200,
    630
  );
  console.info('wrote public/og-default.png (1200x630)');
} finally {
  fs.rmSync(workDir, { recursive: true, force: true });
}
