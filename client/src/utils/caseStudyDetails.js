/**
 * `case_studies.details` contract (JSONB object). Every block is optional; a block with no
 * usable content is dropped, so the public page renders nothing rather than placeholder copy.
 *
 * {
 *   status:   { label, stage }                       // stage: one of STATUS_STAGES keys
 *   lenses:   { pm, builder }                        // short markdown intro shown per lens
 *   features: [{ name, purpose, status, note, evidenceUrl }]
 *   pipeline: { title, intro, stages: [{ name, summary, status, detail }] }
 *   decisions:[{ title, lens, context, options: [string], choice, rationale, tradeoff }]
 *   investigation: { title, symptom, steps: [{ title, finding }], rootCause, resolution }
 *   timeline: [{ label, date, description }]
 *   evidence: [{ claim, source, url, verified }]
 * }
 *
 * `lens` on a decision is 'pm' | 'builder' | 'both' (default 'both').
 */

export const STATUS_STAGES = {
  implemented: { label: 'Implemented', tone: 'success' },
  partial: { label: 'Partially built', tone: 'warning' },
  prototype: { label: 'Prototype', tone: 'info' },
  planned: { label: 'Planned', tone: 'muted' },
  proposed: { label: 'Proposed', tone: 'muted' },
  unverified: { label: 'Not yet verified', tone: 'danger' },
  deprecated: { label: 'Deprecated', tone: 'muted' },
};

export const LENSES = ['pm', 'builder', 'all'];
const DECISION_LENSES = ['pm', 'builder', 'both'];

const str = (value, max = 4000) =>
  typeof value === 'string'
    ? value.trim().slice(0, max)
    : typeof value === 'number'
      ? String(value)
      : '';

const list = (value) => (Array.isArray(value) ? value : []);

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stage = (value) => {
  const key = str(value, 40).toLowerCase();
  return STATUS_STAGES[key] ? key : 'unverified';
};

const safeUrl = (value) => {
  const url = str(value, 2048);
  return /^(https?:\/\/|\/)/i.test(url) ? url : '';
};

const compact = (items) => items.filter(Boolean);

const normalizeStatus = (value) => {
  if (!isObject(value)) return null;
  const label = str(value.label, 80);
  if (!label && !value.stage) return null;
  const key = stage(value.stage);
  return { label: label || STATUS_STAGES[key].label, stage: key };
};

const normalizeLenses = (value) => {
  if (!isObject(value)) return { pm: '', builder: '' };
  return { pm: str(value.pm, 4000), builder: str(value.builder, 4000) };
};

const normalizeFeatures = (value) =>
  compact(
    list(value).map((item) => {
      if (!isObject(item)) return null;
      const name = str(item.name, 120);
      if (!name) return null;
      return {
        name,
        purpose: str(item.purpose, 600),
        status: stage(item.status),
        note: str(item.note, 600),
        evidenceUrl: safeUrl(item.evidenceUrl),
      };
    })
  );

const normalizePipeline = (value) => {
  if (!isObject(value)) return null;
  const stages = compact(
    list(value.stages).map((item) => {
      if (!isObject(item)) return null;
      const name = str(item.name, 80);
      if (!name) return null;
      return {
        name,
        summary: str(item.summary, 300),
        status: stage(item.status),
        detail: str(item.detail, 2000),
      };
    })
  );
  if (stages.length === 0) return null;
  return { title: str(value.title, 160), intro: str(value.intro, 1000), stages };
};

const normalizeDecisions = (value) =>
  compact(
    list(value).map((item) => {
      if (!isObject(item)) return null;
      const title = str(item.title, 160);
      if (!title) return null;
      const lens = str(item.lens, 10).toLowerCase();
      return {
        title,
        lens: DECISION_LENSES.includes(lens) ? lens : 'both',
        context: str(item.context, 1500),
        options: compact(list(item.options).map((opt) => str(opt, 300))),
        choice: str(item.choice, 600),
        rationale: str(item.rationale, 1500),
        tradeoff: str(item.tradeoff, 1000),
      };
    })
  );

const normalizeInvestigation = (value) => {
  if (!isObject(value)) return null;
  const steps = compact(
    list(value.steps).map((item) => {
      if (!isObject(item)) return null;
      const title = str(item.title, 160);
      if (!title) return null;
      return { title, finding: str(item.finding, 1500) };
    })
  );
  const symptom = str(value.symptom, 1000);
  if (steps.length === 0 && !symptom) return null;
  return {
    title: str(value.title, 160),
    symptom,
    steps,
    rootCause: str(value.rootCause, 1500),
    resolution: str(value.resolution, 1500),
  };
};

const normalizeTimeline = (value) =>
  compact(
    list(value).map((item) => {
      if (!isObject(item)) return null;
      const label = str(item.label, 160);
      if (!label) return null;
      return { label, date: str(item.date, 60), description: str(item.description, 1000) };
    })
  );

const normalizeEvidence = (value) =>
  compact(
    list(value).map((item) => {
      if (!isObject(item)) return null;
      const claim = str(item.claim, 400);
      if (!claim) return null;
      return {
        claim,
        source: str(item.source, 200),
        url: safeUrl(item.url),
        verified: item.verified === true,
      };
    })
  );

/** Stored details (anything) -> a safe, fully-shaped object. Never throws. */
export const normalizeDetails = (raw) => {
  const value = isObject(raw) ? raw : {};
  return {
    status: normalizeStatus(value.status),
    lenses: normalizeLenses(value.lenses),
    features: normalizeFeatures(value.features),
    pipeline: normalizePipeline(value.pipeline),
    decisions: normalizeDecisions(value.decisions),
    investigation: normalizeInvestigation(value.investigation),
    timeline: normalizeTimeline(value.timeline),
    evidence: normalizeEvidence(value.evidence),
  };
};

/** True when any interactive block has content (drives whether the lens toggle is shown). */
export const hasInteractiveContent = (details) =>
  Boolean(
    details.lenses.pm ||
    details.lenses.builder ||
    details.features.length ||
    details.pipeline ||
    details.decisions.length ||
    details.investigation ||
    details.timeline.length ||
    details.evidence.length
  );

/** Decisions visible under a lens ('all' shows every decision). */
export const decisionsForLens = (decisions, lens) =>
  lens === 'all' ? decisions : decisions.filter((d) => d.lens === 'both' || d.lens === lens);

/** One-line counts for the admin editor, e.g. "6 features · 4 decisions". */
export const summarizeDetails = (details) => {
  const parts = [];
  const add = (n, word) => n && parts.push(`${n} ${word}${n === 1 ? '' : 's'}`);
  add(details.features.length, 'feature');
  add(details.pipeline?.stages.length || 0, 'pipeline stage');
  add(details.decisions.length, 'decision');
  add(details.investigation?.steps.length || 0, 'investigation step');
  add(details.timeline.length, 'milestone');
  add(details.evidence.length, 'evidence link');
  if (details.status) parts.unshift(`status: ${details.status.label}`);
  return parts.join(' · ');
};

/** Count of `[VERIFY` markers left in the document (blocks publishing in the editor UI). */
export const countVerifyMarkers = (raw) => {
  const matches = JSON.stringify(raw ?? {}).match(/\[VERIFY/gi);
  return matches ? matches.length : 0;
};

/** Starter document for the admin editor. Placeholder text is clearly marked for replacement. */
export const DETAILS_TEMPLATE = {
  status: { label: 'Early prototype', stage: 'prototype' },
  lenses: {
    pm: '[VERIFY: 2–3 sentences on the user problem and the product bet]',
    builder: '[VERIFY: 2–3 sentences on the system and what was actually built]',
  },
  features: [
    {
      name: '[VERIFY: feature name]',
      purpose: 'What it does for the user',
      status: 'implemented',
      note: '',
      evidenceUrl: '',
    },
  ],
  pipeline: {
    title: 'How it works',
    intro: '',
    stages: [{ name: 'Stage 1', summary: 'One line', status: 'implemented', detail: '' }],
  },
  decisions: [
    {
      title: '[VERIFY: decision title]',
      lens: 'pm',
      context: 'What forced the decision',
      options: ['Option A', 'Option B'],
      choice: 'What I chose',
      rationale: 'Why',
      tradeoff: 'What it cost',
    },
  ],
  investigation: null,
  timeline: [{ label: '[VERIFY: milestone]', date: '', description: '' }],
  evidence: [{ claim: '[VERIFY: claim]', source: 'GitHub', url: '', verified: false }],
};
