import { supabase } from '../config/supabase.js';

/**
 * Media usage detection.
 *
 * Assets are referenced by URL/path text, not foreign keys: cover images and logos hold URLs,
 * Markdown fields embed `![...](url)` / `[...](url)`, and JSONB columns (gallery, sections,
 * prd_snapshot, social links...) carry URLs inside nested values. Every column below is read and
 * searched as text, so all of these forms are covered.
 *
 * Keep this list in sync with the schema in supabase/migrations whenever a content column that can
 * hold an asset reference is added.
 */
export const REFERENCE_SOURCES = [
  {
    table: 'case_studies',
    label: 'Case study',
    titleColumn: 'title',
    columns: [
      'cover_image',
      'og_image',
      'gallery',
      'problem',
      'approach',
      'outcome',
      'role_constraints',
      'research_inputs',
      'problem_framing',
      'options_decision',
      'options_tradeoffs',
      'delivery',
      'outcome_learning',
      'prd_snapshot',
      'metrics',
      'related_work',
      'live_url',
      'prototype_url',
      'prd_url',
    ],
  },
  {
    table: 'thinking_articles',
    label: 'Article',
    titleColumn: 'title',
    columns: ['cover_image', 'body', 'related_work'],
  },
  {
    table: 'prds',
    label: 'PRD',
    titleColumn: 'title',
    columns: ['pdf_url', 'context', 'sections'],
  },
  {
    table: 'site_settings',
    label: 'Site settings',
    titleColumn: null,
    hasStatus: false,
    columns: ['profile_photo_url', 'resume_url', 'biography', 'social_links', 'footer_details'],
  },
  {
    table: 'experiences',
    label: 'Experience',
    titleColumn: 'title',
    columns: ['logo_url', 'description', 'impact_metrics'],
  },
  {
    table: 'educations',
    label: 'Education',
    titleColumn: 'institution',
    columns: ['description'],
  },
];

const PAGE_SIZE = 1000;
// PostgREST / Postgres codes for "table does not exist": there can be no references in it
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);
const INDEX_TTL_MS = 30 * 1000;

export class MediaUsageUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'MediaUsageUnavailableError';
    this.cause = cause;
  }
}

const toText = (value) => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/** Read every row of one source (all pages), returning searchable documents. */
const readSource = async (client, source) => {
  const selectColumns = [
    'id',
    ...(source.titleColumn ? [source.titleColumn] : []),
    ...(source.hasStatus === false ? [] : ['status']),
    ...source.columns,
  ];
  const documents = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(source.table)
      .select(selectColumns.join(', '))
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      if (MISSING_TABLE_CODES.has(error.code)) return documents;
      // Fail closed: an unreadable source means usage is unknown, never "unused"
      throw new MediaUsageUnavailableError(
        `Could not scan ${source.table} for media references: ${error.message}`,
        error
      );
    }
    for (const row of data || []) {
      documents.push({
        table: source.table,
        label: source.label,
        id: row.id,
        title: source.titleColumn ? row[source.titleColumn] || null : source.label,
        status: source.hasStatus === false ? null : row.status || null,
        fields: source.columns
          .map((column) => ({ column, text: toText(row[column]) }))
          .filter((field) => field.text),
      });
    }
    if (!data || data.length < PAGE_SIZE) return documents;
  }
};

/** Build a fresh reference index across every content source. Throws MediaUsageUnavailableError. */
export const buildReferenceIndex = async (client = supabase) => {
  const documents = [];
  for (const source of REFERENCE_SOURCES) {
    documents.push(...(await readSource(client, source)));
  }
  return { documents, builtAt: Date.now() };
};

/**
 * Strings that identify an asset inside content. `storage_path` covers public URLs regardless of
 * host; `filename` and `id` cover the private `/api/media/download/:filename|:id` URLs.
 */
export const assetNeedles = (asset) =>
  [asset.url, asset.storage_path, asset.filename, asset.id]
    .filter((value) => typeof value === 'string' && value.length >= 8)
    .filter((value, index, all) => all.indexOf(value) === index);

/** All content references to `asset` in `index`, grouped per content row. */
export const findReferences = (asset, index) => {
  const needles = assetNeedles(asset);
  if (needles.length === 0) return [];
  const references = [];
  for (const doc of index.documents) {
    const columns = doc.fields
      .filter((field) => needles.some((needle) => field.text.includes(needle)))
      .map((field) => field.column);
    if (columns.length > 0) {
      references.push({
        table: doc.table,
        label: doc.label,
        id: doc.id,
        title: doc.title,
        status: doc.status,
        columns,
      });
    }
  }
  return references;
};

// Short-lived cache used only for list display badges; deletion always uses a fresh index.
let cachedIndex = null;
let pendingIndex = null;

export const getCachedReferenceIndex = async (client = supabase, now = Date.now()) => {
  if (cachedIndex && now - cachedIndex.builtAt < INDEX_TTL_MS) return cachedIndex;
  if (!pendingIndex) {
    pendingIndex = buildReferenceIndex(client)
      .then((index) => {
        cachedIndex = index;
        return index;
      })
      .finally(() => {
        pendingIndex = null;
      });
  }
  return pendingIndex;
};

export const invalidateReferenceIndex = () => {
  cachedIndex = null;
};
