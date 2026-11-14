import test from 'node:test';
import assert from 'node:assert';
import {
  DETAILS_TEMPLATE,
  countVerifyMarkers,
  decisionsForLens,
  hasInteractiveContent,
  normalizeDetails,
  summarizeDetails,
} from '../src/utils/caseStudyDetails.js';
import { buildCaseStudyPayload } from '../src/utils/editorPayload.js';

test('normalizeDetails: missing or malformed input yields empty, non-interactive details', () => {
  for (const raw of [undefined, null, 'text', [], 42, {}]) {
    const details = normalizeDetails(raw);
    assert.strictEqual(hasInteractiveContent(details), false);
    assert.deepStrictEqual(details.features, []);
    assert.strictEqual(details.pipeline, null);
    assert.strictEqual(details.status, null);
  }
});

test('normalizeDetails: drops nameless items and empty blocks instead of rendering placeholders', () => {
  const details = normalizeDetails({
    features: [
      { name: '' },
      { purpose: 'no name' },
      'string',
      { name: 'Merge PDF', status: 'implemented' },
    ],
    pipeline: { title: 'Flow', stages: [{ summary: 'no name' }] },
    investigation: { steps: [] },
    timeline: [{ description: 'no label' }],
  });
  assert.deepStrictEqual(
    details.features.map((f) => f.name),
    ['Merge PDF']
  );
  assert.strictEqual(details.pipeline, null);
  assert.strictEqual(details.investigation, null);
  assert.deepStrictEqual(details.timeline, []);
});

test('normalizeDetails: unknown status falls back to "unverified", never to "implemented"', () => {
  const details = normalizeDetails({
    features: [
      { name: 'OCR rename', status: 'shipped!!' },
      { name: 'Split', status: 'Implemented' },
    ],
  });
  assert.strictEqual(details.features[0].status, 'unverified');
  assert.strictEqual(details.features[1].status, 'implemented');
});

test('normalizeDetails: rejects non-http evidence URLs', () => {
  const details = normalizeDetails({
    features: [{ name: 'A', evidenceUrl: 'javascript:alert(1)' }],
    evidence: [
      { claim: 'Repo', url: 'https://github.com/x/y', verified: true },
      { claim: 'Bad', url: 'data:text/html,hi', verified: 'yes' },
    ],
  });
  assert.strictEqual(details.features[0].evidenceUrl, '');
  assert.strictEqual(details.evidence[0].url, 'https://github.com/x/y');
  assert.strictEqual(details.evidence[1].url, '');
  assert.strictEqual(details.evidence[1].verified, false, 'only literal true counts as verified');
});

test('decisionsForLens: filters by lens and keeps "both" everywhere', () => {
  const { decisions } = normalizeDetails({
    decisions: [
      { title: 'Extension first', lens: 'pm' },
      { title: 'Rules before ML', lens: 'builder' },
      { title: 'Local-first', lens: 'BOTH' },
      { title: 'No lens' },
    ],
  });
  const titles = (lens) => decisionsForLens(decisions, lens).map((d) => d.title);
  assert.deepStrictEqual(titles('pm'), ['Extension first', 'Local-first', 'No lens']);
  assert.deepStrictEqual(titles('builder'), ['Rules before ML', 'Local-first', 'No lens']);
  assert.strictEqual(titles('all').length, 4);
});

test('template: is valid, interactive, and flags its own placeholders', () => {
  const details = normalizeDetails(DETAILS_TEMPLATE);
  assert.strictEqual(hasInteractiveContent(details), true);
  assert.ok(countVerifyMarkers(DETAILS_TEMPLATE) > 0);
  assert.match(summarizeDetails(details), /status: Early prototype/);
  assert.strictEqual(countVerifyMarkers({ a: 'clean' }), 0);
});

const baseForm = {
  title: 'FileCraft',
  slug: 'filecraft',
  summary: 'A unified document workspace.',
};

test('buildCaseStudyPayload: omits details until the record has the column or it is edited', () => {
  const { payload } = buildCaseStudyPayload(baseForm);
  assert.ok(!('details' in payload));
});

test('buildCaseStudyPayload: sends details objects and blocks invalid JSON text', () => {
  const ok = buildCaseStudyPayload({ ...baseForm, details: { features: [] } });
  assert.deepStrictEqual(ok.payload.details, { features: [] });

  for (const bad of ['{ not json', [], null]) {
    const res = buildCaseStudyPayload({ ...baseForm, details: bad });
    assert.match(res.error, /Interactive details/);
  }
});
