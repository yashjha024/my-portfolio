import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

// Vercel's build environment exported NODE_ENV=development, which shipped React's development
// bundle with import.meta.env.PROD=false. The Vite config must force a production build anyway.
test(
  'production build stays in production mode even when NODE_ENV=development',
  { timeout: 120000 },
  () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-mode-'));
    try {
      const result = spawnSync(
        process.execPath,
        [viteBin, 'build', '--outDir', outDir, '--emptyOutDir'],
        {
          cwd: clientDir,
          env: { ...process.env, NODE_ENV: 'development' },
          encoding: 'utf8',
        }
      );
      assert.strictEqual(result.status, 0, result.stderr || result.stdout);
      const assetsDir = path.join(outDir, 'assets');
      const entry = fs.readdirSync(assetsDir).find((f) => /^index-.*\.js$/.test(f));
      const code = fs.readFileSync(path.join(assetsDir, entry), 'utf8');
      assert.match(code, /IS_PROD:!0/, 'import.meta.env.PROD is true');
      assert.doesNotMatch(code, /IS_PROD:!1/);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  }
);
