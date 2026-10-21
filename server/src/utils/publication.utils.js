import { supabase } from '../config/supabase.js';

/**
 * Decide the `published_at` value for a write.
 * - Creating an item directly as published stamps it now.
 * - A transition into `published` (from draft, archived, or a row that never had a date) stamps it now.
 * - Edits to an already-published item, and writes that don't touch status, keep the stored timestamp.
 *
 * @param {Object|null} current - Stored row ({ status, published_at }) or null when creating
 * @param {string|undefined} nextStatus - Status sent in this write, if any
 * @param {Date} [now]
 * @returns {string|undefined} ISO timestamp to write, or undefined to leave the column untouched
 */
export const resolvePublishedAt = (current, nextStatus, now = new Date()) => {
  if (nextStatus !== 'published') return undefined;
  if (!current) return now.toISOString();
  if (current.status === 'published' && current.published_at) return undefined;
  return now.toISOString();
};

/**
 * Apply `resolvePublishedAt` to an update payload, loading the stored status only when needed.
 * Returns false when the row does not exist.
 */
export const applyPublishedAtForUpdate = async (table, id, payload) => {
  if (payload.status !== 'published') return true;
  const { data: current, error } = await supabase
    .from(table)
    .select('status, published_at')
    .eq('id', id)
    .single();
  if (error || !current) return false;
  const publishedAt = resolvePublishedAt(current, payload.status);
  if (publishedAt) payload.published_at = publishedAt;
  return true;
};
