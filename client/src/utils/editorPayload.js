/**
 * Single normalization path for CMS editor writes. Manual saves and autosaves both call these
 * builders, so they always send the same shape. Builders never copy `status` from the form:
 * status is only sent when the caller requests an explicit transition (Save Draft / Publish / Archive),
 * so a plain Save or an autosave can never change publication state.
 *
 * Each builder returns `{ payload }` or `{ error }` (a user-facing validation message).
 */
import { parseSectionsJson, serializeSections } from './prdSections.js';

const SLUG_PATTERN = /^[a-z0-9-]{3,120}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Comma-separated text or an array -> trimmed, non-empty, de-duplicated list (order preserved). */
export const toList = (value) => {
  const source = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const seen = new Set();
  const list = [];
  for (const raw of source) {
    const item = String(raw ?? '').trim();
    if (item && !seen.has(item)) {
      seen.add(item);
      list.push(item);
    }
  }
  return list;
};

/** Empty year -> null (never 0); otherwise an integer, or NaN when the input is not a whole number. */
export const toNullableYear = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const year = Number(value);
  return Number.isInteger(year) ? year : Number.NaN;
};

/** Empty or whitespace id -> null. */
export const toNullableId = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const withStatus = (payload, status) => (status ? { ...payload, status } : payload);

/** Human-readable message for a failed save, including the first server-side field error. */
export const describeSaveError = (error, fallback = 'Save failed.') => {
  const data = error?.response?.data;
  const fieldErrors = data?.details?.fieldErrors;
  const firstField =
    fieldErrors && Object.keys(fieldErrors).find((key) => fieldErrors[key]?.length);
  const base = data?.error || error?.message || fallback;
  return firstField ? `${base} (${firstField}: ${fieldErrors[firstField][0]})` : base;
};

const textLength = (value) => (typeof value === 'string' ? value.trim().length : 0);

const validateIdentity = (form, label) => {
  if (textLength(form.title) < 3) return `${label} title must be at least 3 characters long.`;
  if (!SLUG_PATTERN.test(form.slug || '')) {
    return 'Slug must be 3-120 characters of lowercase letters, numbers, and hyphens.';
  }
  return null;
};

export const buildCaseStudyPayload = (form, inputs = {}, { status } = {}) => {
  const identityError = validateIdentity(form, 'Case study');
  if (identityError) return { error: identityError };
  if (textLength(form.summary) < 10) {
    return { error: 'Summary must be at least 10 characters (elevator pitch).' };
  }
  const year = toNullableYear(form.year);
  if (year !== null && (Number.isNaN(year) || year < 1900 || year > 2200)) {
    return { error: 'Year must be a whole number between 1900 and 2200, or left empty.' };
  }
  const prdSnapshot = form.prd_snapshot ?? {};
  if (typeof prdSnapshot !== 'object' || Array.isArray(prdSnapshot)) {
    return { error: 'PRD Snapshot must be a valid JSON object before saving.' };
  }
  const relatedWork = form.related_work ?? [];
  if (!Array.isArray(relatedWork)) {
    return { error: 'Related Work must be a valid JSON array before saving.' };
  }

  const optionsText = form.options_decision || form.options_tradeoffs || '';

  return {
    payload: withStatus(
      {
        title: form.title.trim(),
        slug: form.slug,
        summary: form.summary.trim(),
        type: form.type,
        featured: Boolean(form.featured),
        sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
        role: form.role ?? '',
        timeline: form.timeline ?? '',
        team: form.team ?? '',
        domain: form.domain ?? '',
        problem: form.problem ?? '',
        approach: form.approach ?? '',
        outcome: form.outcome ?? '',
        metrics: Array.isArray(form.metrics) ? form.metrics : [],
        tools: toList(inputs.toolsInput ?? form.tools),
        tags: toList(inputs.tagsInput ?? form.tags),
        skills: toList(inputs.skillsInput ?? form.skills),
        year,
        role_constraints: form.role_constraints ?? '',
        research_inputs: form.research_inputs ?? '',
        problem_framing: form.problem_framing ?? '',
        // The editor exposes one "Options & Trade-offs" field; keep both columns in sync
        options_decision: optionsText,
        options_tradeoffs: optionsText,
        prd_snapshot: prdSnapshot,
        delivery: form.delivery ?? '',
        outcome_learning: form.outcome_learning ?? '',
        related_work: relatedWork,
        cover_image: form.cover_image ?? '',
        gallery: Array.isArray(form.gallery) ? form.gallery : [],
        live_url: form.live_url ?? '',
        repo_url: form.repo_url ?? '',
        prototype_url: form.prototype_url ?? '',
        prd_url: form.prd_url ?? '',
        seo_title: form.seo_title ?? '',
        seo_description: form.seo_description ?? '',
      },
      status
    ),
  };
};

export const buildArticlePayload = (form, inputs = {}, { status } = {}) => {
  const identityError = validateIdentity(form, 'Article');
  if (identityError) return { error: identityError };
  if (textLength(form.excerpt) < 10) return { error: 'Excerpt must be at least 10 characters.' };
  if (textLength(form.body) < 20) return { error: 'Body content must be at least 20 characters.' };

  return {
    payload: withStatus(
      {
        title: form.title.trim(),
        slug: form.slug,
        type: form.type,
        excerpt: form.excerpt.trim(),
        body: form.body,
        cover_image: form.cover_image ?? '',
        tags: toList(inputs.tagsInput ?? form.tags),
        reading_time: form.reading_time ?? '',
        disclaimer: form.disclaimer ?? '',
        related_work: Array.isArray(form.related_work) ? form.related_work : [],
      },
      status
    ),
  };
};

/**
 * @param {Object} form
 * @param {{ model: Object, jsonMode?: boolean, jsonText?: string }} sectionsState
 */
export const buildPrdPayload = (form, sectionsState, { status } = {}) => {
  const identityError = validateIdentity(form, 'PRD');
  if (identityError) return { error: identityError };
  if (textLength(form.context) < 10) {
    return { error: 'Background context must be at least 10 characters.' };
  }

  let model = sectionsState.model;
  if (sectionsState.jsonMode) {
    const parsed = parseSectionsJson(sectionsState.jsonText);
    if (parsed.error) {
      return {
        error: `${parsed.error} Fix the Raw JSON before saving; the stored sections are unchanged.`,
      };
    }
    model = parsed.model;
  }

  const relatedCaseStudyId = toNullableId(form.related_case_study_id);
  if (relatedCaseStudyId && !UUID_PATTERN.test(relatedCaseStudyId)) {
    return { error: 'Linked case study is invalid; choose one from the list or clear it.' };
  }

  return {
    payload: withStatus(
      {
        title: form.title.trim(),
        slug: form.slug,
        stage: form.stage,
        visibility: form.visibility,
        context: form.context,
        sections: serializeSections(model),
        pdf_url: form.pdf_url ?? '',
        related_case_study_id: relatedCaseStudyId,
      },
      status
    ),
  };
};
