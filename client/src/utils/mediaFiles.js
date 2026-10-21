/**
 * Media upload/library helpers shared by the media manager, media picker, markdown editor and
 * settings page. Supported formats mirror the server (server/src/controllers/media.controller.js).
 */

export const SUPPORTED_UPLOAD_TYPES = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
};
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_FORMATS_LABEL = 'PNG, JPG, WEBP & PDF (max 10 MB)';

const acceptFor = (types) =>
  types
    .flatMap((type) => [...SUPPORTED_UPLOAD_TYPES[type].map((ext) => `.${ext}`), type])
    .join(',');

/** `accept` attribute values advertising only formats the server stores. */
export const UPLOAD_ACCEPT = acceptFor(Object.keys(SUPPORTED_UPLOAD_TYPES));
export const IMAGE_UPLOAD_ACCEPT = acceptFor(['image/png', 'image/jpeg', 'image/webp']);
export const PDF_UPLOAD_ACCEPT = acceptFor(['application/pdf']);

const extensionOf = (name = '') => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

/** Client-side pre-check; returns a user-facing error message or null. The server re-validates. */
export const validateUploadFile = (
  file,
  { allowedTypes = Object.keys(SUPPORTED_UPLOAD_TYPES) } = {}
) => {
  if (!file) return 'No file selected.';
  const extensions = SUPPORTED_UPLOAD_TYPES[file.type];
  if (!extensions || !allowedTypes.includes(file.type)) {
    const shown = file.type || `.${extensionOf(file.name) || 'unknown'}`;
    return `"${file.name}" is not a supported format (${shown}). Supported: ${SUPPORTED_FORMATS_LABEL}.`;
  }
  if (!extensions.includes(extensionOf(file.name))) {
    return `"${file.name}" has an extension that does not match its type (${file.type}).`;
  }
  if (file.size > MAX_UPLOAD_BYTES) return `"${file.name}" is larger than the 10 MB upload limit.`;
  return null;
};

/** Formats the browser canvas can encode that the server accepts, with their canonical extension. */
const ENCODABLE_IMAGE_EXTENSIONS = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/**
 * Decide the compressed file's real type and name from the blob the browser actually produced.
 * `canvas.toBlob` silently falls back to PNG when it cannot encode the requested type (e.g. WebP on
 * older Safari), so the requested type must never be trusted for the extension or MIME type.
 * Returns null when the output is unusable and the original file should be uploaded instead.
 */
export const resolveCompressedOutput = ({ blobType, originalName }) => {
  const extension = ENCODABLE_IMAGE_EXTENSIONS[blobType];
  if (!extension) return null;
  const dot = originalName.lastIndexOf('.');
  const baseName = dot > 0 ? originalName.slice(0, dot) : originalName;
  return { type: blobType, name: `${baseName}.${extension}` };
};

/** Only formats without an alpha channel need an opaque background before drawing. */
export const needsOpaqueBackground = (outputType) => outputType === 'image/jpeg';

/** Keep server-computed usage when a metadata response omits it or could not verify it. */
export const mergeUpdatedAsset = (existing, updated) => ({
  ...existing,
  ...updated,
  is_used: typeof updated?.is_used === 'boolean' ? updated.is_used : (existing?.is_used ?? null),
  usage_count:
    typeof updated?.usage_count === 'number'
      ? updated.usage_count
      : (existing?.usage_count ?? null),
});

/** User-facing message for a failed media API call, including where an in-use asset is used. */
export const describeMediaError = (error, fallback = 'The media request failed.') => {
  const data = error?.response?.data;
  if (data?.code === 'MEDIA_IN_USE' && Array.isArray(data.references)) {
    const where = data.references
      .slice(0, 5)
      .map(
        (ref) =>
          `${ref.label}${ref.title ? ` "${ref.title}"` : ''}${ref.status ? ` (${ref.status})` : ''}`
      )
      .join(', ');
    const more = data.references.length > 5 ? ` and ${data.references.length - 5} more` : '';
    return `${data.error} Used by: ${where}${more}.`;
  }
  return data?.error || error?.message || fallback;
};

/**
 * Delete assets one at a time and classify every outcome. Nothing is counted as deleted unless the
 * server confirmed it.
 *
 * @param {Array<{id: string}>} items
 * @param {(item) => Promise<{ data?: { success?: boolean } }>} deleteFn
 */
export const runBatchDelete = async (items, deleteFn) => {
  const result = { deleted: [], inUse: [], failed: [] };
  for (const item of items) {
    try {
      const response = await deleteFn(item);
      if (response?.data?.success) {
        result.deleted.push(item);
      } else {
        result.failed.push({ item, message: response?.data?.error || 'Unexpected response' });
      }
    } catch (error) {
      const entry = { item, message: describeMediaError(error) };
      if (error?.response?.data?.code === 'MEDIA_IN_USE') result.inUse.push(entry);
      else result.failed.push(entry);
    }
  }
  return result;
};

export const summarizeBatchDelete = ({ deleted, inUse, failed }) => {
  const parts = [`Deleted ${deleted.length} file${deleted.length === 1 ? '' : 's'}.`];
  if (inUse.length > 0) parts.push(`${inUse.length} skipped because they are now in use.`);
  if (failed.length > 0)
    parts.push(`${failed.length} failed: ${failed.map((f) => f.message).join(' | ')}`);
  return parts.join(' ');
};
