import test from 'node:test';
import assert from 'node:assert';
import {
  addCanonicalItem,
  addCustomSection,
  parseSections,
  parseSectionsJson,
  removeCustomSection,
  sectionsToJson,
  serializeSections,
  toRenderableSections,
  updateCanonicalItem,
  updateCustomSection,
} from '../src/utils/prdSections.js';
import { buildPrdPayload } from '../src/utils/editorPayload.js';

const SEEDED_CANONICAL = {
  problem: 'Static thresholds page SREs 340 times a week.',
  goals: ['Reduce false positives by 60%'],
  nonGoals: ['Replacing PagerDuty'],
  requirements: [
    {
      id: 'REQ-101',
      name: 'OTel ingestion',
      priority: 'P0',
      desc: 'Ingest 100k points/sec.',
      acceptanceCriteria: ['p99 < 5ms'],
    },
  ],
  metrics: [{ name: 'False-Positive Paging Rate', target: '-60%' }],
  releaseGates: [
    { name: 'Shadow testing', status: 'Passed', criteria: '14 days' },
    'Security review',
  ],
  owner_notes: 'extra key the editor does not know about',
};

const CUSTOM_ARRAY = [
  { title: '1. Functional Requirements', content: '### Table\n- [ ] Login' },
  { title: '2. Rollout', content: 'Phased rollout.' },
];

const roundTrip = (stored) => serializeSections(parseSections(stored));

test('custom array sections survive load -> save -> reload unchanged', () => {
  assert.deepStrictEqual(roundTrip(CUSTOM_ARRAY), CUSTOM_ARRAY);
  assert.deepStrictEqual(roundTrip(roundTrip(CUSTOM_ARRAY)), CUSTOM_ARRAY);

  const payload = buildPrdPayload(
    {
      title: 'PRD',
      slug: 'prd-slug',
      stage: 'Approved',
      visibility: 'public',
      context: 'Long enough context.',
      related_case_study_id: '',
    },
    { model: parseSections(CUSTOM_ARRAY) }
  ).payload;
  assert.deepStrictEqual(payload.sections, CUSTOM_ARRAY, 'saved payload keeps the array shape');
});

test('canonical sections survive round-trips, including structured items and unknown keys', () => {
  const saved = roundTrip(SEEDED_CANONICAL);
  assert.deepStrictEqual(saved.requirements, SEEDED_CANONICAL.requirements);
  assert.deepStrictEqual(saved.releaseGates, SEEDED_CANONICAL.releaseGates);
  assert.strictEqual(saved.owner_notes, SEEDED_CANONICAL.owner_notes);
  assert.ok(!('customSections' in saved));
  assert.deepStrictEqual(roundTrip(saved), saved);
});

test('switching modes keeps both canonical lists and custom sections', () => {
  let model = parseSections(SEEDED_CANONICAL);
  model = addCustomSection(model);
  model = updateCustomSection(model, 0, { title: 'Appendix', content: 'Extra notes' });

  const saved = serializeSections(model);
  assert.deepStrictEqual(saved.goals, SEEDED_CANONICAL.goals, 'canonical lists kept');
  assert.deepStrictEqual(saved.customSections, [{ title: 'Appendix', content: 'Extra notes' }]);

  const reloaded = parseSections(saved);
  assert.deepStrictEqual(reloaded.custom, [{ title: 'Appendix', content: 'Extra notes' }]);
  assert.deepStrictEqual(reloaded.canonical.requirements, SEEDED_CANONICAL.requirements);

  // Custom-first PRD that gains canonical content keeps its custom sections too
  let customFirst = parseSections(CUSTOM_ARRAY);
  customFirst = addCanonicalItem(customFirst, 'goals');
  customFirst = updateCanonicalItem(customFirst, 'goals', 0, 'New goal');
  const mixed = serializeSections(customFirst);
  assert.deepStrictEqual(mixed.goals, ['New goal']);
  assert.deepStrictEqual(mixed.customSections, CUSTOM_ARRAY);

  // Removing all custom sections from a custom-only PRD still saves an (empty) array
  let emptied = parseSections(CUSTOM_ARRAY);
  emptied = removeCustomSection(removeCustomSection(emptied, 0), 0);
  assert.deepStrictEqual(serializeSections(emptied), []);
});

test('editing a structured item updates fields without turning it into a JSON string', () => {
  let model = parseSections(SEEDED_CANONICAL);
  model = updateCanonicalItem(model, 'requirements', 0, { name: 'OpenTelemetry ingestion' });
  const req = model.canonical.requirements[0];
  assert.strictEqual(typeof req, 'object');
  assert.strictEqual(req.name, 'OpenTelemetry ingestion');
  assert.strictEqual(req.priority, 'P0', 'other fields kept');
  assert.deepStrictEqual(req.acceptanceCriteria, ['p99 < 5ms']);

  model = addCanonicalItem(model, 'requirements');
  assert.deepStrictEqual(model.canonical.requirements[1], {
    id: 'REQ-002',
    priority: 'P1',
    name: '',
    desc: '',
  });
  model = addCanonicalItem(model, 'metrics');
  assert.deepStrictEqual(model.canonical.metrics[1], { name: '', target: '' });
});

test('raw JSON reflects current content and invalid JSON never replaces the model', () => {
  let model = parseSections(SEEDED_CANONICAL);
  model = updateCanonicalItem(model, 'goals', 0, 'Updated goal');
  const json = sectionsToJson(model);
  assert.match(json, /Updated goal/, 'JSON view is generated from current state, not stale text');

  const invalid = parseSectionsJson('{"goals": [');
  assert.ok(invalid.error);
  assert.strictEqual(invalid.model, undefined);

  const valid = parseSectionsJson(JSON.stringify(CUSTOM_ARRAY));
  assert.strictEqual(valid.model.primaryShape, 'custom');
  assert.deepStrictEqual(serializeSections(valid.model), CUSTOM_ARRAY);
});

test('public rendering handles canonical, custom, legacy metric and string items', () => {
  const view = toRenderableSections({
    ...SEEDED_CANONICAL,
    requirements: [...SEEDED_CANONICAL.requirements, 'Plain string requirement'],
    metrics: [
      { label: 'Legacy label', target: '+15%' },
      { name: '', target: '' },
    ],
    customSections: [
      { title: 'Appendix', content: 'Notes' },
      { title: '', content: '  ' },
    ],
  });
  assert.strictEqual(view.problem, SEEDED_CANONICAL.problem);
  assert.deepStrictEqual(view.goals, SEEDED_CANONICAL.goals);
  assert.strictEqual(view.requirements[1].name, 'Plain string requirement');
  assert.deepStrictEqual(view.metrics, [{ name: 'Legacy label', target: '+15%' }]);
  assert.deepStrictEqual(view.releaseGates[1], {
    name: 'Security review',
    status: '',
    criteria: '',
  });
  assert.deepStrictEqual(view.custom, [{ title: 'Appendix', content: 'Notes' }]);

  const customOnly = toRenderableSections(CUSTOM_ARRAY);
  assert.strictEqual(customOnly.custom.length, 2);
  assert.strictEqual(customOnly.problem, '');
  assert.deepStrictEqual(customOnly.requirements, []);

  assert.deepStrictEqual(toRenderableSections(null).custom, []);
});
