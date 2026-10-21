import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// ---------------------------------------------------------------------------
// In-memory Supabase stub (auth, PostgREST, Storage). Nothing reaches a real project.
// ---------------------------------------------------------------------------
const OWNER_EMAIL = 'owner@example.test';
const OWNER_TOKEN = 'owner-access-token';
const OWNER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: OWNER_EMAIL,
  email_confirmed_at: '2026-01-01T00:00:00Z',
};
const SUPABASE_PUBLIC = 'https://stub.supabase.co/storage/v1/object/public/portfolio-media';

let seq = 0;
const uuid = () => {
  seq += 1;
  return `aaaaaaaa-aaaa-4aaa-8aaa-${String(seq).padStart(12, '0')}`;
};

const makeMedia = (name, overrides = {}) => {
  const filename = `1760000000000_${name}`;
  const folder = overrides.folder || 'general';
  const storagePath = `assets/${folder}/${filename}`;
  return {
    id: uuid(),
    filename,
    original_name: name,
    url: `${SUPABASE_PUBLIC}/${storagePath}`,
    storage_path: storagePath,
    type: name.endsWith('.pdf') ? 'pdf' : 'image',
    folder,
    is_public: true,
    size_bytes: 1234,
    alt_text: `Alt for ${name}`,
    created_at: new Date(Date.UTC(2026, 0, 1) + seq * 1000).toISOString(),
    ...overrides,
  };
};

const db = {};
const storageObjects = new Map(); // `${bucket}/${path}` -> true
const faults = {
  failTables: new Map(),
  missingTables: new Set(),
  storageRemove: null,
  mediaDelete: null,
};
const requests = [];

const resetData = () => {
  seq = 0;
  storageObjects.clear();
  faults.failTables.clear();
  faults.missingTables.clear();
  faults.storageRemove = null;
  faults.mediaDelete = null;
  requests.length = 0;
  for (const key of Object.keys(db)) delete db[key];
  Object.assign(db, {
    users: [{ id: OWNER.id, email: OWNER_EMAIL, role: 'owner', full_name: 'Owner' }],
    media: [],
    case_studies: [],
    thinking_articles: [],
    prds: [],
    site_settings: [{ id: 1, profile_photo_url: null, resume_url: null, social_links: {} }],
    experiences: [],
    educations: [],
    audit_logs: [],
  });
};

const addMedia = (...items) => {
  for (const item of items) {
    db.media.push(item);
    const bucket = item.url.includes('/api/media/download/')
      ? 'portfolio-media-private'
      : 'portfolio-media';
    storageObjects.set(`${bucket}/${item.storage_path}`, true);
  }
  // Newest first, matching the list endpoint's ordering
  db.media.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return items;
};

const matchesFilters = (row, params) => {
  for (const [key, raw] of params) {
    if (['select', 'order', 'offset', 'limit', 'or', 'on_conflict', 'columns'].includes(key))
      continue;
    if (raw.startsWith('eq.') && String(row[key]) !== raw.slice(3)) return false;
  }
  return true;
};

const stub = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    const url = new URL(req.url, 'http://stub');
    requests.push({ method: req.method, path: url.pathname });
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
      res.end(JSON.stringify(body));
    };

    if (url.pathname === '/auth/v1/user') {
      return req.headers.authorization === `Bearer ${OWNER_TOKEN}`
        ? send(200, { ...OWNER, aud: 'authenticated', role: 'authenticated' })
        : send(401, { msg: 'invalid JWT' });
    }

    if (url.pathname.startsWith('/storage/v1/object/sign/')) {
      return send(200, { signedURL: `/object/sign/${url.pathname.split('/sign/')[1]}?token=stub` });
    }
    if (url.pathname.startsWith('/storage/v1/object/')) {
      const rest = url.pathname.replace('/storage/v1/object/', '');
      if (req.method === 'DELETE') {
        if (faults.storageRemove)
          return send(500, { statusCode: '500', error: 'Internal', message: faults.storageRemove });
        const bucket = rest;
        const { prefixes } = JSON.parse(raw || '{}');
        const removed = (prefixes || []).filter((p) => storageObjects.delete(`${bucket}/${p}`));
        return send(
          200,
          removed.map((name) => ({ name }))
        );
      }
      if (req.method === 'POST') {
        storageObjects.set(rest, true);
        return send(200, { Key: rest, Id: uuid() });
      }
    }

    const table = url.pathname.replace('/rest/v1/', '');
    if (faults.missingTables.has(table)) {
      return send(404, { code: 'PGRST205', message: `Could not find the table 'public.${table}'` });
    }
    if (faults.failTables.has(table) && req.method === 'GET') {
      return send(400, { code: '42703', message: faults.failTables.get(table) });
    }
    if (!db[table]) return send(404, { code: 'PGRST205', message: 'unknown table' });

    const wantsObject = (req.headers.accept || '').includes('vnd.pgrst.object');
    const params = [...url.searchParams.entries()];
    const rows = db[table].filter((row) => matchesFilters(row, params));

    if (req.method === 'GET') {
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || rows.length || 1);
      const page = rows.slice(offset, offset + limit);
      if (wantsObject)
        return page.length === 1 ? send(200, page[0]) : send(406, { code: 'PGRST116' });
      return send(200, page, {
        'Content-Range': `${offset}-${offset + Math.max(page.length - 1, 0)}/${rows.length}`,
      });
    }
    if (req.method === 'PATCH') {
      const patch = JSON.parse(raw || '{}');
      rows.forEach((row) => Object.assign(row, patch));
      return wantsObject && rows.length === 1 ? send(200, rows[0]) : send(200, rows);
    }
    if (req.method === 'DELETE') {
      if (table === 'media' && faults.mediaDelete)
        return send(500, { code: 'XX000', message: faults.mediaDelete });
      db[table] = db[table].filter((row) => !rows.includes(row));
      return send(204, null);
    }
    if (req.method === 'POST') {
      const body = JSON.parse(raw || '[]');
      const inserted = (Array.isArray(body) ? body : [body]).map((row) => ({
        id: uuid(),
        created_at: new Date().toISOString(),
        ...row,
      }));
      db[table].push(...inserted);
      return send(201, wantsObject ? inserted[0] : inserted);
    }
    return send(405, {});
  });
});
await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve));

Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL: 'https://portfolio.example.test',
  JWT_SECRET: 'test-only-preview-secret-0123456789abcdef',
  SUPABASE_URL: `http://127.0.0.1:${stub.address().port}`,
  SUPABASE_SERVICE_ROLE_KEY: 'stub-service-role-key',
  OWNER_EMAIL,
  RESEND_API_KEY: '',
});

const { default: app } = await import('../src/app.js');
const { invalidateReferenceIndex, REFERENCE_SOURCES } =
  await import('../src/utils/mediaUsage.utils.js');
const { resolveStorageBucket } = await import('../src/controllers/media.controller.js');

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const API = `http://127.0.0.1:${server.address().port}`;
test.after(() => {
  server.close();
  stub.close();
});
test.beforeEach(() => {
  resetData();
  invalidateReferenceIndex();
});

const owner = { Authorization: `Bearer ${OWNER_TOKEN}` };
const api = (method, path, body) =>
  fetch(`${API}${path}`, {
    method,
    headers: { ...owner, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
const listMedia = async (query = '') => (await api('GET', `/api/media/list${query}`)).json();

// ---------------------------------------------------------------------------
// Usage detection
// ---------------------------------------------------------------------------
test('usage detection covers every supported reference type', async () => {
  const assets = addMedia(
    makeMedia('cover.png'),
    makeMedia('og.png'),
    makeMedia('gallery.png'),
    makeMedia('narrative.png'),
    makeMedia('snapshot.png'),
    makeMedia('article-body.png'),
    makeMedia('prd-spec.pdf'),
    makeMedia('prd-section.png'),
    makeMedia('resume.pdf', { folder: 'documents' }),
    makeMedia('logo.png'),
    makeMedia('education.png'),
    makeMedia('private-diagram.png', {
      folder: 'private',
      is_public: false,
      url: '/api/media/download/1760000000000_private-diagram.png',
    }),
    makeMedia('orphan.png')
  );
  const [
    cover,
    og,
    gallery,
    narrative,
    snapshot,
    articleBody,
    prdSpec,
    prdSection,
    resume,
    logo,
    education,
    privateDiagram,
    orphan,
  ] = assets;

  db.case_studies.push({
    id: uuid(),
    title: 'Case study',
    status: 'published',
    cover_image: cover.url,
    og_image: og.url,
    gallery: [{ type: 'image', url: gallery.url }],
    approach: `Intro\n![diagram](${narrative.url})\n`,
    prd_snapshot: { attachments: [{ href: snapshot.url }] },
  });
  db.thinking_articles.push({
    id: uuid(),
    title: 'Article',
    status: 'draft',
    // Markdown referencing the private download URL by filename
    body: `See ![x](/api/media/download/${privateDiagram.filename}) and ![y](${articleBody.url})`,
  });
  db.prds.push({
    id: uuid(),
    title: 'PRD',
    status: 'published',
    pdf_url: prdSpec.url,
    sections: { customSections: [{ title: 'Diagram', content: `![d](${prdSection.url})` }] },
  });
  db.site_settings[0].resume_url = resume.url;
  db.experiences.push({ id: uuid(), title: 'PM', status: 'published', logo_url: logo.url });
  db.educations.push({
    id: uuid(),
    institution: 'University',
    status: 'published',
    description: `Thesis poster ![p](${education.url})`,
  });

  const body = await listMedia('?limit=100');
  assert.strictEqual(body.usage_available, true);
  const usedById = Object.fromEntries(body.data.map((m) => [m.id, m.is_used]));
  for (const asset of assets.filter((a) => a !== orphan)) {
    assert.strictEqual(usedById[asset.id], true, `${asset.original_name} must be detected as used`);
  }
  assert.strictEqual(usedById[orphan.id], false);

  // The scan reads every column that can hold an asset reference
  const scanned = Object.fromEntries(REFERENCE_SOURCES.map((s) => [s.table, s.columns]));
  assert.ok(scanned.case_studies.includes('og_image'));
  assert.ok(scanned.experiences.includes('logo_url'));
  assert.ok(scanned.educations.includes('description'));
  assert.ok(scanned.site_settings.includes('resume_url'));
});

test('usage scan pages through all rows instead of stopping at a fixed limit', async () => {
  const [asset] = addMedia(makeMedia('deep.png'));
  for (let i = 0; i < 1200; i += 1) {
    db.thinking_articles.push({
      id: uuid(),
      title: `Article ${i}`,
      status: 'published',
      body: 'text',
    });
  }
  db.thinking_articles.push({
    id: uuid(),
    title: 'Last',
    status: 'published',
    body: `![x](${asset.url})`,
  });

  const body = await listMedia();
  assert.strictEqual(body.data[0].is_used, true, 'reference in row 1201 is found');

  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 409);
});

test('an unreadable content source makes usage unknown, never "unused"', async () => {
  const [asset] = addMedia(makeMedia('maybe-used.png'));
  faults.failTables.set('experiences', 'column experiences.logo_url does not exist');

  const body = await listMedia();
  assert.strictEqual(body.usage_available, false);
  assert.strictEqual(body.data[0].is_used, null);

  const unusedRes = await api('GET', '/api/media/list?unused=true');
  assert.strictEqual(unusedRes.status, 503);

  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 503);
  assert.strictEqual((await res.json()).code, 'MEDIA_USAGE_UNVERIFIED');
  assert.strictEqual(db.media.length, 1, 'nothing deleted');
  assert.strictEqual(storageObjects.size, 1);
});

test('a content table that does not exist yet contributes no references', async () => {
  const [asset] = addMedia(makeMedia('fine.png'));
  faults.missingTables.add('educations');
  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 200);
});

// ---------------------------------------------------------------------------
// Deletion
// ---------------------------------------------------------------------------
test('deleting an in-use asset is refused by the server with its references', async () => {
  const [asset] = addMedia(makeMedia('hero.png'));
  db.case_studies.push({
    id: uuid(),
    title: 'Live case study',
    status: 'published',
    cover_image: asset.url,
  });

  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 409);
  const body = await res.json();
  assert.strictEqual(body.code, 'MEDIA_IN_USE');
  assert.deepStrictEqual(
    body.references.map((r) => [r.table, r.title, r.status, r.columns]),
    [['case_studies', 'Live case study', 'published', ['cover_image']]]
  );
  assert.strictEqual(db.media.length, 1);
  assert.ok(storageObjects.has(`portfolio-media/${asset.storage_path}`), 'file untouched');
  assert.ok(!requests.some((r) => r.method === 'DELETE' && r.path.startsWith('/storage')));
});

test('deletion re-checks usage on the server even if the cached list said "unused"', async () => {
  const [asset] = addMedia(makeMedia('race.png'));
  const before = await listMedia();
  assert.strictEqual(before.data[0].is_used, false);

  // Content starts referencing the asset after the list was loaded (cache still warm)
  db.prds.push({ id: uuid(), title: 'New PRD', status: 'draft', context: `![x](${asset.url})` });
  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 409);
});

test('an unused asset is deleted from storage and the library', async () => {
  const [asset] = addMedia(makeMedia('unused.png'));
  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(db.media.length, 0);
  assert.strictEqual(storageObjects.size, 0);
});

test('private assets are removed from the bucket they live in', async () => {
  const [asset] = addMedia(
    makeMedia('secret.pdf', {
      folder: 'private',
      is_public: false,
      url: '/api/media/download/1760000000000_secret.pdf',
    })
  );
  const res = await api('DELETE', `/api/media/${asset.id}`);
  assert.strictEqual(res.status, 200);
  assert.ok(
    requests.some(
      (r) => r.method === 'DELETE' && r.path === '/storage/v1/object/portfolio-media-private'
    )
  );
  assert.ok(
    !requests.some((r) => r.method === 'DELETE' && r.path === '/storage/v1/object/portfolio-media')
  );
});

test('deletion failures are reported with accurate status codes and keep data consistent', async () => {
  const [a, b] = addMedia(makeMedia('storage-fail.png'), makeMedia('record-fail.png'));

  faults.storageRemove = 'storage offline';
  const storageFail = await api('DELETE', `/api/media/${a.id}`);
  assert.strictEqual(storageFail.status, 502);
  assert.strictEqual((await storageFail.json()).code, 'STORAGE_DELETE_FAILED');
  assert.ok(
    db.media.some((m) => m.id === a.id),
    'record kept so the delete can be retried'
  );

  faults.storageRemove = null;
  faults.mediaDelete = 'deadlock detected';
  const recordFail = await api('DELETE', `/api/media/${b.id}`);
  assert.strictEqual(recordFail.status, 500);
  assert.strictEqual((await recordFail.json()).code, 'MEDIA_RECORD_DELETE_FAILED');

  const missing = await api('DELETE', '/api/media/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  assert.strictEqual(missing.status, 404, 'deleting a missing asset is not reported as success');

  const invalid = await api('DELETE', '/api/media/not-a-uuid');
  assert.strictEqual(invalid.status, 400);
});

// ---------------------------------------------------------------------------
// Metadata, visibility, listing
// ---------------------------------------------------------------------------
test('alt text updates keep is_used and other fields', async () => {
  const [asset] = addMedia(makeMedia('used.png', { folder: 'case-studies' }));
  db.case_studies.push({ id: uuid(), title: 'CS', status: 'published', cover_image: asset.url });

  const res = await api('PUT', `/api/media/${asset.id}`, { alt_text: '  New alt text  ' });
  assert.strictEqual(res.status, 200);
  const { data } = await res.json();
  assert.strictEqual(data.alt_text, 'New alt text');
  assert.strictEqual(data.is_used, true);
  assert.strictEqual(data.folder, 'case-studies');
  assert.strictEqual(data.url, asset.url);
  assert.strictEqual(data.storage_visibility, 'public');

  const missing = await api('PUT', '/api/media/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', {
    alt_text: 'x',
  });
  assert.strictEqual(missing.status, 404);
  const unknownField = await api('PUT', `/api/media/${asset.id}`, {
    alt_text: 'x',
    folder: 'private',
  });
  assert.strictEqual(unknownField.status, 400);
});

test('visibility flag cannot be flipped without moving the file', async () => {
  const [asset] = addMedia(makeMedia('public.png'));
  const res = await api('PUT', `/api/media/${asset.id}`, { is_public: false });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).code, 'MEDIA_VISIBILITY_IMMUTABLE');
  assert.strictEqual(db.media[0].is_public, true, 'flag unchanged');
});

test('access and bucket follow where the object is actually stored', async () => {
  // Legacy row whose flag was flipped to private while the file stayed in the public bucket
  const [flipped] = addMedia(makeMedia('flipped.png', { is_public: false }));
  assert.strictEqual(resolveStorageBucket(flipped), 'portfolio-media');
  const listed = (await listMedia()).data[0];
  assert.strictEqual(listed.storage_visibility, 'public');
  assert.strictEqual(listed.visibility_mismatch, true);

  const privateAsset = makeMedia('private.pdf', {
    folder: 'private',
    is_public: false,
    url: '/api/media/download/1760000000000_private.pdf',
  });
  addMedia(privateAsset);
  assert.strictEqual(resolveStorageBucket(privateAsset), 'portfolio-media-private');

  const anonymous = await fetch(`${API}/api/media/download/${privateAsset.id}`, {
    redirect: 'manual',
  });
  assert.strictEqual(anonymous.status, 403);
  const asOwner = await fetch(`${API}/api/media/download/${privateAsset.id}`, {
    headers: owner,
    redirect: 'manual',
  });
  assert.strictEqual(asOwner.status, 302);
  assert.match(asOwner.headers.get('location'), /portfolio-media-private/);
});

test('pagination and filters report counts for the whole matching set', async () => {
  for (let i = 0; i < 60; i += 1) addMedia(makeMedia(`general-${i}.png`));
  for (let i = 0; i < 5; i += 1) addMedia(makeMedia(`cs-${i}.png`, { folder: 'case-studies' }));
  for (let i = 0; i < 3; i += 1) addMedia(makeMedia(`doc-${i}.pdf`, { folder: 'case-studies' }));
  const used = db.media.find((m) => m.original_name === 'cs-0.png');
  db.case_studies.push({ id: uuid(), title: 'CS', status: 'published', cover_image: used.url });

  const page1 = await listMedia('?limit=48&page=1');
  assert.strictEqual(page1.count, 68);
  assert.strictEqual(page1.totalPages, 2);
  assert.strictEqual(page1.data.length, 48);
  const page2 = await listMedia('?limit=48&page=2');
  assert.strictEqual(page2.data.length, 20);

  const folder = await listMedia('?folder=case-studies');
  assert.strictEqual(folder.count, 8, 'folder filter applied before paging');
  assert.ok(folder.data.every((m) => m.folder === 'case-studies'));

  const folderImages = await listMedia('?folder=case-studies&type=image');
  assert.strictEqual(folderImages.count, 5);

  const unused = await listMedia('?folder=case-studies&unused=true&limit=4');
  assert.strictEqual(unused.count, 7, 'unused count covers every matching row, not one page');
  assert.strictEqual(unused.totalPages, 2);
  assert.strictEqual(unused.data.length, 4);
  assert.ok(unused.data.every((m) => m.is_used === false));

  const summary = await (await api('GET', '/api/media/summary')).json();
  assert.deepStrictEqual(summary.data, { total: 68, used: 1, unused: 67, usage_available: true });

  const badType = await api('GET', '/api/media/list?type=svg');
  assert.strictEqual(badType.status, 400);
});

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

const upload = (name, type, bytes, fields = {}) => {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), name);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return fetch(`${API}/api/media/upload`, { method: 'POST', headers: owner, body: form });
};

test('uploads return useful 400 errors for unsupported or inconsistent files', async () => {
  const svg = await upload('icon.svg', 'image/svg+xml', Buffer.from('<svg/>'));
  assert.strictEqual(svg.status, 400);
  assert.match((await svg.json()).error, /Unsupported file type: image\/svg\+xml/);

  const mislabeled = await upload('photo.webp', 'image/png', PNG_BYTES);
  assert.strictEqual(mislabeled.status, 400);
  assert.strictEqual((await mislabeled.json()).code, 'EXTENSION_MISMATCH');

  const spoofed = await upload('photo.png', 'image/png', Buffer.from('not really a png'));
  assert.strictEqual(spoofed.status, 400);
  assert.strictEqual((await spoofed.json()).code, 'CONTENT_MISMATCH');

  const tooLarge = await upload(
    'big.png',
    'image/png',
    Buffer.concat([PNG_BYTES, Buffer.alloc(10 * 1024 * 1024)])
  );
  assert.strictEqual(tooLarge.status, 400);
  assert.strictEqual((await tooLarge.json()).code, 'FILE_TOO_LARGE');

  assert.strictEqual(db.media.length, 0, 'nothing stored');
});

test('a valid upload stores alt_text and reports a fresh, unused public asset', async () => {
  const res = await upload('chart.png', 'image/png', PNG_BYTES, {
    alt_text: 'Revenue chart',
    folder: 'Case Studies',
  });
  assert.strictEqual(res.status, 201);
  const { data } = await res.json();
  assert.strictEqual(data.alt_text, 'Revenue chart');
  assert.strictEqual(data.folder, 'case-studies');
  assert.strictEqual(data.is_used, false);
  assert.strictEqual(data.storage_visibility, 'public');
  assert.ok(storageObjects.has(`portfolio-media/${data.storage_path}`));
});
