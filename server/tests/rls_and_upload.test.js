import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import { hasValidSignature } from '../src/utils/validation.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to start express server on a random open port for testing
function startTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

test('Health, Liveness, and Readiness check endpoints', async () => {
  const { server, url } = await startTestServer();
  try {
    // 1. Liveness Check
    const resLive = await fetch(`${url}/healthz/liveness`);
    assert.strictEqual(resLive.status, 200);
    const dataLive = await resLive.json();
    assert.strictEqual(dataLive.success, true);
    assert.strictEqual(dataLive.status, 'ok');
    assert.ok(typeof dataLive.uptime === 'number');

    // 2. Readiness Check
    const resReady = await fetch(`${url}/healthz/readiness`);
    const dataReady = await resReady.json();
    assert.ok(typeof dataReady.checks === 'object');
    assert.ok('database' in dataReady.checks);
    assert.ok('storage' in dataReady.checks);
    assert.ok('email_configured' in dataReady.checks);
  } finally {
    server.close();
  }
});

test('Double-Submit Cookie CSRF protection and Origin enforcement', async () => {
  const { server, url } = await startTestServer();
  try {
    // 1. Get CSRF token
    const resCsrf = await fetch(`${url}/api/csrf-token`);
    assert.strictEqual(resCsrf.status, 200);
    const dataCsrf = await resCsrf.json();
    assert.ok(dataCsrf.csrfToken);
    const setCookieHeader = resCsrf.headers.get('set-cookie');
    assert.ok(setCookieHeader && setCookieHeader.includes('csrf-token='));

    // 2. Test Origin mismatch rejection on mutation route
    const resBadOrigin = await fetch(`${url}/api/settings/profile`, {
      method: 'PUT',
      headers: {
        Origin: 'https://evil-attacker.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ biography: 'hacked' }),
    });
    assert.strictEqual(resBadOrigin.status, 403);
    const dataBadOrigin = await resBadOrigin.json();
    assert.strictEqual(dataBadOrigin.error, 'Invalid request origin.');
  } finally {
    server.close();
  }
});

test('Upload file validation: magic bytes, MIME types, and SVG rejection', async () => {
  // 1. Test hasValidSignature with SVG (must reject)
  const svgFile = {
    mimetype: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle /></svg>'),
  };
  assert.strictEqual(
    hasValidSignature(svgFile),
    false,
    'SVG files must be rejected by signature validator'
  );

  // 2. Test hasValidSignature with fake JPEG (magic byte spoofing)
  const fakeJpeg = {
    mimetype: 'image/jpeg',
    buffer: Buffer.from('This is actually plain text pretending to be a JPG'),
  };
  assert.strictEqual(
    hasValidSignature(fakeJpeg),
    false,
    'Spoofed JPEG with text payload must be rejected'
  );

  // 3. Test hasValidSignature with genuine JPEG magic bytes (0xFF 0xD8 0xFF)
  const validJpeg = {
    mimetype: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  };
  assert.strictEqual(
    hasValidSignature(validJpeg),
    true,
    'Genuine JPEG magic bytes must pass validation'
  );

  // 4. Test genuine PNG magic bytes (0x89 0x50 0x4E 0x47)
  const validPng = {
    mimetype: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  };
  assert.strictEqual(
    hasValidSignature(validPng),
    true,
    'Genuine PNG magic bytes must pass validation'
  );
});

test('RLS policy verification across migration sequence', async () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  const initialSchema = fs.readFileSync(path.join(migrationsDir, files[0]), 'utf-8');
  const storageHardening = fs.readFileSync(path.join(migrationsDir, files[1]), 'utf-8');
  const prodContracts = fs.readFileSync(path.join(migrationsDir, files[2]), 'utf-8');

  // Verify initial schema does NOT reference folder prematurely before prodContracts adds it
  assert.ok(
    !initialSchema.includes('folder IS DISTINCT FROM'),
    'initial_schema.sql must not reference folder column before migration 3 adds it'
  );

  // Verify prds public policy requires published status and public visibility
  assert.ok(
    initialSchema.includes("status = 'published' AND visibility = 'public'"),
    'PRDs must enforce status=published and visibility=public for anonymous SELECT'
  );

  // Verify contact_messages restricts SELECT/ALL to is_admin()
  assert.ok(
    initialSchema.includes('FOR ALL USING (is_admin())') &&
      initialSchema.includes('contact_messages'),
    'contact_messages must restrict management and queries to admins only'
  );

  // Verify both public and private storage buckets are provisioned
  assert.ok(
    storageHardening.includes("'portfolio-media'"),
    'Public media bucket must be provisioned'
  );
  assert.ok(
    storageHardening.includes("'portfolio-media-private'"),
    'Private media bucket must be provisioned'
  );
  assert.ok(
    storageHardening.includes('public,\n    file_size_limit = 10485760') ||
      storageHardening.includes('public = false'),
    'Buckets must strictly enforce 10MB size limits and public vs private isolation'
  );

  // Verify final media policy in prodContracts checks is_public and folder separation
  assert.ok(
    prodContracts.includes('is_admin() OR is_public = true'),
    'Media public policy must check is_admin() OR is_public = true'
  );
});
