/**
 * PRD `sections` contract and editor model.
 *
 * Stored shapes (prds.sections JSONB):
 * - Canonical object: { problem, goals[], nonGoals[], requirements[{ id, priority, name, desc, ... }],
 *   metrics[{ name, target }], releaseGates[string | { name, status, criteria }], ...extra keys }
 *   Custom sections may ride along as `customSections: [{ title, content }]`.
 * - Custom array: [{ title, content }]
 *
 * The editor model keeps both parts side by side so switching views never discards either one:
 *   { canonical: Object, custom: Array, primaryShape: 'canonical' | 'custom' }
 */

export const CANONICAL_LIST_KEYS = ['goals', 'nonGoals', 'requirements', 'metrics', 'releaseGates'];
const CUSTOM_KEY = 'customSections';

export const createEmptyCanonical = () => ({
  problem: '',
  goals: [],
  nonGoals: [],
  requirements: [],
  metrics: [],
  releaseGates: [],
});

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeCanonical = (stored) => {
  const canonical = { ...stored };
  if (canonical.problem === undefined || canonical.problem === null) canonical.problem = '';
  for (const key of CANONICAL_LIST_KEYS) {
    // Only fill missing keys; unexpected non-array values are preserved untouched
    if (canonical[key] === undefined || canonical[key] === null) canonical[key] = [];
  }
  return canonical;
};

/** Stored sections (object, array, or missing) -> editor model. Never drops stored data. */
export const parseSections = (stored) => {
  if (Array.isArray(stored)) {
    return { canonical: createEmptyCanonical(), custom: [...stored], primaryShape: 'custom' };
  }
  if (!isPlainObject(stored)) {
    return { canonical: createEmptyCanonical(), custom: [], primaryShape: 'canonical' };
  }
  const { [CUSTOM_KEY]: custom, ...rest } = stored;
  return {
    canonical: normalizeCanonical(rest),
    custom: Array.isArray(custom) ? [...custom] : [],
    primaryShape: 'canonical',
  };
};

export const canonicalHasContent = (canonical) =>
  Object.entries(canonical).some(([key, value]) => {
    if (key === 'problem') return typeof value === 'string' ? value.trim() !== '' : value != null;
    if (CANONICAL_LIST_KEYS.includes(key))
      return Array.isArray(value) ? value.length > 0 : value != null;
    return value !== undefined;
  });

/**
 * Editor model -> stored sections.
 * A custom-only PRD keeps its array shape; anything with canonical content is stored as the
 * canonical object, carrying custom sections under `customSections`.
 */
export const serializeSections = (model) => {
  const custom = Array.isArray(model.custom) ? model.custom : [];
  if (model.primaryShape === 'custom' && !canonicalHasContent(model.canonical)) {
    return custom;
  }
  const sections = { ...model.canonical };
  if (custom.length > 0) sections[CUSTOM_KEY] = custom;
  return sections;
};

export const sectionsToJson = (model) => JSON.stringify(serializeSections(model), null, 2);

/** Raw JSON text -> `{ model }` or `{ error }`; the previous model is never modified. */
export const parseSectionsJson = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { error: `PRD sections JSON is invalid (${err.message}).` };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { error: 'PRD sections JSON must be an object or an array.' };
  }
  return { model: parseSections(parsed) };
};

// ---------------------------------------------------------------------------
// Immutable editing helpers
// ---------------------------------------------------------------------------

export const createCanonicalItem = (key, existing = []) => {
  if (key === 'requirements') {
    return {
      id: `REQ-${String(existing.length + 1).padStart(3, '0')}`,
      priority: 'P1',
      name: '',
      desc: '',
    };
  }
  if (key === 'metrics') return { name: '', target: '' };
  if (key === 'releaseGates') return { name: '', status: '', criteria: '' };
  return '';
};

const withCanonical = (model, patch) => ({ ...model, canonical: { ...model.canonical, ...patch } });

export const setProblem = (model, problem) => withCanonical(model, { problem });

export const addCanonicalItem = (model, key) => {
  const list = Array.isArray(model.canonical[key]) ? model.canonical[key] : [];
  return withCanonical(model, { [key]: [...list, createCanonicalItem(key, list)] });
};

/** `patch` is a string for string items, or a partial object merged into object items. */
export const updateCanonicalItem = (model, key, index, patch) => {
  const list = Array.isArray(model.canonical[key]) ? [...model.canonical[key]] : [];
  const current = list[index];
  list[index] = isPlainObject(current) && isPlainObject(patch) ? { ...current, ...patch } : patch;
  return withCanonical(model, { [key]: list });
};

export const removeCanonicalItem = (model, key, index) => {
  const list = Array.isArray(model.canonical[key]) ? model.canonical[key] : [];
  return withCanonical(model, { [key]: list.filter((_, i) => i !== index) });
};

export const addCustomSection = (model) => ({
  ...model,
  custom: [...model.custom, { title: `Section ${model.custom.length + 1}`, content: '' }],
});

export const updateCustomSection = (model, index, patch) => ({
  ...model,
  custom: model.custom.map((section, i) =>
    i === index
      ? { ...(isPlainObject(section) ? section : { content: String(section ?? '') }), ...patch }
      : section
  ),
});

export const removeCustomSection = (model, index) => ({
  ...model,
  custom: model.custom.filter((_, i) => i !== index),
});

// ---------------------------------------------------------------------------
// Public rendering
// ---------------------------------------------------------------------------

const asText = (value) => (typeof value === 'string' ? value : '');

/** Stored sections -> normalized, render-safe view used by the public PRD page. */
export const toRenderableSections = (stored) => {
  const { canonical, custom } = parseSections(stored);
  const list = (key) => (Array.isArray(canonical[key]) ? canonical[key] : []);
  const toLabel = (item, keys) =>
    typeof item === 'string' ? item : keys.map((k) => asText(item?.[k])).find(Boolean) || '';

  return {
    problem: asText(canonical.problem).trim(),
    goals: list('goals')
      .map((g) => toLabel(g, ['name', 'text', 'title']))
      .filter(Boolean),
    nonGoals: list('nonGoals')
      .map((g) => toLabel(g, ['name', 'text', 'title']))
      .filter(Boolean),
    requirements: list('requirements')
      .map((req, index) =>
        typeof req === 'string'
          ? { id: `REQ-${index + 1}`, priority: '', name: req, desc: '', acceptanceCriteria: [] }
          : {
              id: asText(req?.id) || `REQ-${index + 1}`,
              priority: asText(req?.priority),
              name: asText(req?.name) || asText(req?.title),
              desc: asText(req?.desc) || asText(req?.userStory) || asText(req?.description),
              acceptanceCriteria: Array.isArray(req?.acceptanceCriteria)
                ? req.acceptanceCriteria
                : [],
            }
      )
      .filter((req) => req.name || req.desc),
    metrics: list('metrics')
      .map((m) =>
        typeof m === 'string'
          ? { name: m, target: '' }
          : {
              name: asText(m?.name) || asText(m?.label),
              target: asText(m?.target) || asText(m?.value),
            }
      )
      .filter((m) => m.name || m.target),
    releaseGates: list('releaseGates')
      .map((gate) =>
        typeof gate === 'string'
          ? { name: gate, status: '', criteria: '' }
          : {
              name: asText(gate?.name),
              status: asText(gate?.status),
              criteria: asText(gate?.criteria),
            }
      )
      .filter((gate) => gate.name || gate.criteria),
    custom: custom
      .map((section) =>
        typeof section === 'string'
          ? { title: '', content: section }
          : { title: asText(section?.title), content: asText(section?.content) }
      )
      .filter((section) => section.title || section.content.trim()),
  };
};
