import test from 'node:test';
import assert from 'node:assert';
import {
  buildArticlePayload,
  buildCaseStudyPayload,
  buildPrdPayload,
  describeSaveError,
  toList,
  toNullableYear,
} from '../src/utils/editorPayload.js';
import { parseSections } from '../src/utils/prdSections.js';

const caseStudyForm = (overrides = {}) => ({
  title: 'Case study title',
  slug: 'case-study-title',
  summary: 'A summary long enough to pass validation.',
  type: 'product_case_study',
  status: 'published',
  year: '',
  prd_snapshot: {},
  related_work: [],
  ...overrides,
});

const prdForm = (overrides = {}) => ({
  title: 'PRD title',
  slug: 'prd-title',
  stage: 'In Development',
  visibility: 'public',
  status: 'draft',
  context: 'Background context long enough.',
  pdf_url: '',
  related_case_study_id: '',
  ...overrides,
});

test('empty year becomes null, never 0; numeric strings become integers', () => {
  assert.strictEqual(toNullableYear(''), null);
  assert.strictEqual(toNullableYear(null), null);
  assert.strictEqual(toNullableYear(undefined), null);
  assert.strictEqual(toNullableYear('2024'), 2024);
  assert.ok(Number.isNaN(toNullableYear('20.5')));

  assert.strictEqual(buildCaseStudyPayload(caseStudyForm({ year: '' })).payload.year, null);
  assert.strictEqual(buildCaseStudyPayload(caseStudyForm({ year: '2025' })).payload.year, 2025);
  assert.match(buildCaseStudyPayload(caseStudyForm({ year: '1200' })).error, /Year/);
});

test('tags, tools and skills are normalized identically from text or arrays', () => {
  assert.deepStrictEqual(toList(' Figma, , SQL ,Figma,  Jira '), ['Figma', 'SQL', 'Jira']);
  assert.deepStrictEqual(toList(['Figma', ' SQL ', '', 'Figma']), ['Figma', 'SQL']);
  assert.deepStrictEqual(toList(undefined), []);

  const { payload } = buildCaseStudyPayload(caseStudyForm(), {
    toolsInput: 'Figma, Mixpanel, Figma',
    tagsInput: ' Discovery ,PRD',
    skillsInput: '',
  });
  assert.deepStrictEqual(payload.tools, ['Figma', 'Mixpanel']);
  assert.deepStrictEqual(payload.tags, ['Discovery', 'PRD']);
  assert.deepStrictEqual(payload.skills, []);

  const article = buildArticlePayload(
    {
      title: 'Article',
      slug: 'article',
      excerpt: 'An excerpt of ten+',
      body: 'x'.repeat(30),
      tags: [],
    },
    { tagsInput: 'UX, UX, Metrics' }
  );
  assert.deepStrictEqual(article.payload.tags, ['UX', 'Metrics']);
});

test('status is only sent for explicit transitions, never copied from the form', () => {
  const plain = buildCaseStudyPayload(caseStudyForm({ status: 'published' }));
  assert.ok(!('status' in plain.payload), 'plain Save preserves server-side status');

  const draft = buildCaseStudyPayload(caseStudyForm(), {}, { status: 'draft' });
  assert.strictEqual(draft.payload.status, 'draft');

  const publish = buildPrdPayload(
    prdForm(),
    { model: parseSections(null) },
    { status: 'published' }
  );
  assert.strictEqual(publish.payload.status, 'published');
});

test('payloads only contain keys the strict server schemas accept', () => {
  const { payload } = buildCaseStudyPayload(
    caseStudyForm({ id: 'x', created_at: 'x', updated_at: 'x', published_at: 'x', author_id: 'x' })
  );
  for (const key of ['id', 'created_at', 'updated_at', 'published_at', 'author_id', 'status']) {
    assert.ok(!(key in payload), `${key} must not be sent`);
  }
});

test('empty related case study is sent as null, not an empty string', () => {
  const empty = buildPrdPayload(prdForm({ related_case_study_id: '' }), {
    model: parseSections(null),
  });
  assert.strictEqual(empty.payload.related_case_study_id, null);

  const spaces = buildPrdPayload(prdForm({ related_case_study_id: '   ' }), {
    model: parseSections(null),
  });
  assert.strictEqual(spaces.payload.related_case_study_id, null);

  const linked = '11111111-1111-4111-8111-111111111111';
  const withLink = buildPrdPayload(prdForm({ related_case_study_id: linked }), {
    model: parseSections(null),
  });
  assert.strictEqual(withLink.payload.related_case_study_id, linked);

  assert.match(
    buildPrdPayload(prdForm({ related_case_study_id: 'not-a-uuid' }), {
      model: parseSections(null),
    }).error,
    /Linked case study/
  );
});

test('invalid raw JSON blocks saving with a clear error and leaves sections untouched', () => {
  const stored = { problem: 'Original problem', goals: ['Keep me'] };
  const model = parseSections(stored);
  const before = JSON.stringify(model);

  const result = buildPrdPayload(prdForm(), {
    model,
    jsonMode: true,
    jsonText: '{"problem": "half typed", ',
  });
  assert.strictEqual(result.payload, undefined);
  assert.match(result.error, /JSON is invalid/);
  assert.match(result.error, /stored sections are unchanged/);
  assert.strictEqual(JSON.stringify(model), before, 'editor model is not mutated');

  const nonObject = buildPrdPayload(prdForm(), { model, jsonMode: true, jsonText: '42' });
  assert.match(nonObject.error, /object or an array/);
});

test('invalid in-progress JSON fields on case studies block saving', () => {
  assert.match(
    buildCaseStudyPayload(caseStudyForm({ prd_snapshot: '{"title": ' })).error,
    /PRD Snapshot/
  );
  assert.match(
    buildCaseStudyPayload(caseStudyForm({ related_work: '[{"title"' })).error,
    /Related Work/
  );
});

test('server validation details are surfaced in the error message', () => {
  const error = {
    response: {
      data: {
        error: 'Request validation failed',
        details: { fieldErrors: { year: ['Number must be greater than or equal to 1900'] } },
      },
    },
  };
  assert.strictEqual(
    describeSaveError(error),
    'Request validation failed (year: Number must be greater than or equal to 1900)'
  );
  assert.strictEqual(describeSaveError(new Error('Network Error')), 'Network Error');
});
