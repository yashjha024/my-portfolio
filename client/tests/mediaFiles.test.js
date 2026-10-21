import test from 'node:test';
import assert from 'node:assert';
import {
  IMAGE_UPLOAD_ACCEPT,
  PDF_UPLOAD_ACCEPT,
  UPLOAD_ACCEPT,
  describeMediaError,
  mergeUpdatedAsset,
  needsOpaqueBackground,
  resolveCompressedOutput,
  runBatchDelete,
  summarizeBatchDelete,
  validateUploadFile,
} from '../src/utils/mediaFiles.js';

const fakeFile = (name, type, size = 1000) => ({ name, type, size });

test('file pickers advertise only formats the server accepts', () => {
  for (const accept of [UPLOAD_ACCEPT, IMAGE_UPLOAD_ACCEPT, PDF_UPLOAD_ACCEPT]) {
    assert.ok(!/svg|gif|heic|image\/\*/i.test(accept), accept);
  }
  assert.strictEqual(
    UPLOAD_ACCEPT,
    '.png,image/png,.jpg,.jpeg,image/jpeg,.webp,image/webp,.pdf,application/pdf'
  );
  assert.ok(!IMAGE_UPLOAD_ACCEPT.includes('pdf'));
  assert.strictEqual(PDF_UPLOAD_ACCEPT, '.pdf,application/pdf');
});

test('upload pre-check rejects unsupported, mismatched and oversized files with clear messages', () => {
  assert.strictEqual(validateUploadFile(fakeFile('photo.png', 'image/png')), null);
  assert.strictEqual(validateUploadFile(fakeFile('scan.JPEG', 'image/jpeg')), null);
  assert.match(validateUploadFile(fakeFile('icon.svg', 'image/svg+xml')), /not a supported format/);
  assert.match(
    validateUploadFile(fakeFile('anim.gif', 'image/gif')),
    /Supported: PNG, JPG, WEBP & PDF/
  );
  assert.match(validateUploadFile(fakeFile('photo.webp', 'image/png')), /does not match its type/);
  assert.match(
    validateUploadFile(fakeFile('huge.png', 'image/png', 10 * 1024 * 1024 + 1)),
    /10 MB/
  );
  assert.match(
    validateUploadFile(fakeFile('spec.pdf', 'application/pdf'), { allowedTypes: ['image/png'] }),
    /not a supported format/
  );
});

test('compressed output name and MIME type follow the blob the browser produced', () => {
  // WebP requested but the browser fell back to PNG
  assert.deepStrictEqual(
    resolveCompressedOutput({ blobType: 'image/png', originalName: 'diagram.final.png' }),
    { type: 'image/png', name: 'diagram.final.png' }
  );
  assert.deepStrictEqual(
    resolveCompressedOutput({ blobType: 'image/webp', originalName: 'photo.jpg' }),
    { type: 'image/webp', name: 'photo.webp' }
  );
  assert.deepStrictEqual(
    resolveCompressedOutput({ blobType: 'image/jpeg', originalName: 'noextension' }),
    { type: 'image/jpeg', name: 'noextension.jpg' }
  );
  assert.strictEqual(
    resolveCompressedOutput({ blobType: 'image/bmp', originalName: 'x.png' }),
    null
  );
  assert.strictEqual(resolveCompressedOutput({ blobType: '', originalName: 'x.png' }), null);
});

test('only JPEG output gets an opaque background (PNG/WebP keep transparency)', () => {
  assert.strictEqual(needsOpaqueBackground('image/jpeg'), true);
  assert.strictEqual(needsOpaqueBackground('image/webp'), false);
  assert.strictEqual(needsOpaqueBackground('image/png'), false);
});

test('metadata updates keep is_used unless the server returns a verified value', () => {
  const existing = { id: '1', alt_text: 'old', is_used: true, usage_count: 2, folder: 'thinking' };
  assert.deepStrictEqual(mergeUpdatedAsset(existing, { id: '1', alt_text: 'new' }), {
    ...existing,
    alt_text: 'new',
  });
  assert.strictEqual(mergeUpdatedAsset(existing, { id: '1', is_used: null }).is_used, true);
  assert.strictEqual(
    mergeUpdatedAsset(existing, { id: '1', is_used: false, usage_count: 0 }).is_used,
    false
  );
});

const httpError = (status, data) =>
  Object.assign(new Error(`Request failed with status ${status}`), { response: { status, data } });

test('batch cleanup classifies every outcome and never over-reports deletions', async () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
  const responses = {
    a: () => Promise.resolve({ data: { success: true } }),
    b: () =>
      Promise.reject(
        httpError(409, {
          code: 'MEDIA_IN_USE',
          error: '"b.png" is still used by 1 item(s).',
          references: [{ label: 'Article', title: 'Launch', status: 'draft' }],
        })
      ),
    c: () =>
      Promise.reject(
        httpError(502, { code: 'STORAGE_DELETE_FAILED', error: 'Storage deletion failed: offline' })
      ),
    d: () => Promise.reject(new Error('Network Error')),
    e: () => Promise.resolve({ data: { success: false, error: 'weird' } }),
  };
  const result = await runBatchDelete(items, (item) => responses[item.id]());

  assert.deepStrictEqual(
    result.deleted.map((i) => i.id),
    ['a']
  );
  assert.deepStrictEqual(
    result.inUse.map((r) => r.item.id),
    ['b']
  );
  assert.deepStrictEqual(
    result.failed.map((r) => r.item.id),
    ['c', 'd', 'e']
  );
  assert.match(result.inUse[0].message, /Used by: Article "Launch" \(draft\)/);

  const summary = summarizeBatchDelete(result);
  assert.match(summary, /^Deleted 1 file\./);
  assert.match(summary, /1 skipped because they are now in use/);
  assert.match(summary, /3 failed: Storage deletion failed: offline \| Network Error \| weird/);
});

test('API errors are described with the server message and in-use references', () => {
  assert.strictEqual(
    describeMediaError(httpError(400, { error: 'Unsupported file type: image/svg+xml.' })),
    'Unsupported file type: image/svg+xml.'
  );
  const many = Array.from({ length: 7 }, (_, i) => ({ label: 'Case study', title: `CS ${i}` }));
  const message = describeMediaError(
    httpError(409, { code: 'MEDIA_IN_USE', error: 'In use.', references: many })
  );
  assert.match(message, /^In use\. Used by: Case study "CS 0", .* Case study "CS 4" and 2 more\.$/);
  assert.strictEqual(describeMediaError(undefined, 'fallback'), 'fallback');
});
