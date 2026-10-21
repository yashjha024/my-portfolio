import { supabase } from '../config/supabase.js';
import { parsePagination, hasValidSignature } from '../utils/validation.utils.js';
import { logAuditAction } from '../utils/audit.utils.js';
import {
  buildReferenceIndex,
  findReferences,
  getCachedReferenceIndex,
  invalidateReferenceIndex,
  MediaUsageUnavailableError,
} from '../utils/mediaUsage.utils.js';

export const PUBLIC_BUCKET = 'portfolio-media';
export const PRIVATE_BUCKET = 'portfolio-media-private';
const PRIVATE_FOLDERS = new Set(['private', 'confidential']);
const MEDIA_TYPES = new Set(['image', 'pdf', 'document']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALL_ROWS_PAGE = 1000;

// Supported upload formats: MIME type -> allowed file extensions
export const UPLOAD_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
};

/**
 * The bucket an object actually lives in decides who can read it. Prefer the stored URL (written at
 * upload time from the bucket used) over the `is_public` flag, which older code could flip without
 * moving the file.
 */
export const resolveStorageBucket = (media) => {
  const url = media?.url || '';
  if (url.includes(`/object/public/${PUBLIC_BUCKET}/`)) return PUBLIC_BUCKET;
  if (url.includes('/api/media/download/')) return PRIVATE_BUCKET;
  const flaggedPrivate = media?.is_public === false || PRIVATE_FOLDERS.has(media?.folder);
  return flaggedPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET;
};

const deriveFolder = (media) => {
  if (media.folder) return media.folder;
  const parts = (media.storage_path || '').split('/');
  return parts.length >= 3 ? parts[1] : 'general';
};

/** API shape for a media row; `is_used` is null when usage could not be verified. */
export const toMediaDto = (media, index) => {
  const bucket = resolveStorageBucket(media);
  const references = index ? findReferences(media, index) : null;
  return {
    ...media,
    folder: deriveFolder(media),
    storage_bucket: bucket,
    storage_visibility: bucket === PUBLIC_BUCKET ? 'public' : 'private',
    visibility_mismatch: (media.is_public !== false) !== (bucket === PUBLIC_BUCKET),
    is_used: references ? references.length > 0 : null,
    usage_count: references ? references.length : null,
  };
};

const loadCachedIndex = async () => {
  try {
    return await getCachedReferenceIndex();
  } catch (err) {
    if (err instanceof MediaUsageUnavailableError) {
      console.warn('[MEDIA] Usage index unavailable:', err.message);
      return null;
    }
    throw err;
  }
};

// PostgREST `or()` filter syntax uses , ( ) as separators; strip them from free-text search
const sanitizeSearch = (q) => q.replace(/[,()*\\%]/g, ' ').trim();

export const getMediaList = async (req, res, next) => {
  try {
    const { type, folder = 'all', unused = 'false' } = req.query;
    const { q, page, limit, offset } = parsePagination(req.query, 48);

    if (type && type !== 'all' && !MEDIA_TYPES.has(type)) {
      return res.status(400).json({ success: false, error: `Unknown media type: ${type}` });
    }

    // Filters are applied in SQL so counts and pages describe the whole library
    const buildQuery = (columns = '*', options = {}) => {
      let query = supabase
        .from('media')
        .select(columns, options)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (type && type !== 'all') query = query.eq('type', type);
      if (folder && folder !== 'all') query = query.eq('folder', String(folder).toLowerCase());
      const search = q ? sanitizeSearch(q) : '';
      if (search) {
        query = query.or(
          `original_name.ilike.%${search}%,filename.ilike.%${search}%,alt_text.ilike.%${search}%`
        );
      }
      return query;
    };

    const index = await loadCachedIndex();

    if (unused === 'true') {
      if (!index) {
        return res.status(503).json({
          success: false,
          code: 'MEDIA_USAGE_UNVERIFIED',
          error: 'Media usage could not be verified, so unused assets cannot be listed right now.',
        });
      }
      // Usage is derived from content, so this filter runs over every matching row, then pages
      const matching = [];
      for (let from = 0; ; from += ALL_ROWS_PAGE) {
        const { data, error } = await buildQuery().range(from, from + ALL_ROWS_PAGE - 1);
        if (error) throw error;
        matching.push(...(data || []));
        if (!data || data.length < ALL_ROWS_PAGE) break;
      }
      const unusedItems = matching.map((m) => toMediaDto(m, index)).filter((m) => !m.is_used);
      return res.status(200).json({
        success: true,
        count: unusedItems.length,
        page,
        limit,
        totalPages: Math.ceil(unusedItems.length / limit),
        usage_available: true,
        data: unusedItems.slice(offset, offset + limit),
      });
    }

    const { data, count, error } = await buildQuery('*', { count: 'exact' }).range(
      offset,
      offset + limit - 1
    );
    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      usage_available: Boolean(index),
      data: (data || []).map((m) => toMediaDto(m, index)),
    });
  } catch (error) {
    next(error);
  }
};

/** Library-wide totals for the usage bar (independent of the current page and filters). */
export const getMediaSummary = async (req, res, next) => {
  try {
    const index = await loadCachedIndex();
    const rows = [];
    for (let from = 0; ; from += ALL_ROWS_PAGE) {
      const { data, error } = await supabase
        .from('media')
        .select('id, url, storage_path, filename, is_public, folder')
        .order('id', { ascending: true })
        .range(from, from + ALL_ROWS_PAGE - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < ALL_ROWS_PAGE) break;
    }
    const usedCount = index ? rows.filter((m) => findReferences(m, index).length > 0).length : null;
    return res.status(200).json({
      success: true,
      data: {
        total: rows.length,
        used: usedCount,
        unused: usedCount === null ? null : rows.length - usedCount,
        usage_available: Boolean(index),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const file = req.file;
    const allowedExtensions = UPLOAD_EXTENSIONS[file.mimetype];
    if (!allowedExtensions) {
      return res.status(400).json({
        success: false,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        error: `Unsupported file type: ${file.mimetype}. Supported: PNG, JPG, WEBP, PDF.`,
      });
    }
    const extension = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return res.status(400).json({
        success: false,
        code: 'EXTENSION_MISMATCH',
        error: `File extension ".${extension}" does not match its type (${file.mimetype}). Expected .${allowedExtensions.join(' or .')}.`,
      });
    }
    if (!hasValidSignature(file)) {
      return res.status(400).json({
        success: false,
        code: 'CONTENT_MISMATCH',
        error: 'File content does not match its declared type.',
      });
    }
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File exceeds 10MB size limit' });
    }

    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${sanitizedName}`;
    const folder =
      (req.body.folder
        ? req.body.folder
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : '') || 'general';
    const storagePath = `assets/${folder}/${filename}`;

    // Determine enum type
    let mediaType = 'document';
    if (file.mimetype.startsWith('image/')) mediaType = 'image';
    else if (file.mimetype.includes('pdf')) mediaType = 'pdf';

    // Visibility is fixed here by the bucket choice; it cannot be changed later by a flag
    const isPublic = req.body.is_public !== 'false' && req.body.is_public !== false;
    const isPrivateAsset = !isPublic || PRIVATE_FOLDERS.has(folder);
    const targetBucket = isPrivateAsset ? PRIVATE_BUCKET : PUBLIC_BUCKET;

    // Upload to Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload failed:', uploadError.message);
      return res
        .status(502)
        .json({ success: false, error: `Storage upload failed: ${uploadError.message}` });
    }

    let assetUrl = `/api/media/download/${filename}`;
    if (!isPrivateAsset) {
      const { data: publicUrlData } = supabase.storage.from(targetBucket).getPublicUrl(storagePath);
      assetUrl =
        publicUrlData?.publicUrl ||
        `${process.env.SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${storagePath}`;
    }

    const mediaRecord = {
      filename,
      original_name: file.originalname,
      url: assetUrl,
      storage_path: storagePath,
      type: mediaType,
      folder,
      is_public: !isPrivateAsset,
      size_bytes: file.size || 0,
      alt_text: (req.body.alt_text || file.originalname.split('.')[0] || 'Media asset').slice(
        0,
        240
      ),
      uploaded_by: req.user?.id || null,
    };

    const { data, error: dbError } = await supabase
      .from('media')
      .insert([mediaRecord])
      .select('*')
      .single();

    if (dbError) {
      // Remove orphaned storage file if DB insert fails
      await supabase.storage
        .from(targetBucket)
        .remove([storagePath])
        .catch(() => null);
      return res.status(400).json({ success: false, error: dbError.message });
    }

    logAuditAction({
      req,
      action: 'CREATE',
      resourceType: 'MEDIA',
      resourceId: data.id || filename,
      details: { filename, type: mediaType, folder, is_public: !isPrivateAsset },
    });

    res.status(201).json({
      success: true,
      data: { ...toMediaDto(data, null), is_used: false, usage_count: 0 },
    });
  } catch (error) {
    next(error);
  }
};

/** Metadata edits: only alt text. Visibility is fixed by the storage bucket chosen at upload. */
export const updateMedia = async (req, res, next) => {
  try {
    const body = req.body || {};
    if ('is_public' in body) {
      return res.status(400).json({
        success: false,
        code: 'MEDIA_VISIBILITY_IMMUTABLE',
        error:
          'Visibility is decided by the storage bucket used at upload. Changing only the flag would not make a public file private (or a private file public). Re-upload the file with the visibility you need.',
      });
    }
    const unknownKeys = Object.keys(body).filter((key) => key !== 'alt_text');
    if (unknownKeys.length > 0 || typeof body.alt_text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Only alt_text (a string) can be updated on a media asset.',
      });
    }

    const { data, error } = await supabase
      .from('media')
      .update({ alt_text: body.alt_text.trim().slice(0, 240) })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) return res.status(400).json({ success: false, error: error.message });
    if (!data) return res.status(404).json({ success: false, error: 'Media asset not found' });

    logAuditAction({
      req,
      action: 'UPDATE',
      resourceType: 'MEDIA',
      resourceId: data.id,
      details: { alt_text: data.alt_text },
    });

    res.status(200).json({ success: true, data: toMediaDto(data, await loadCachedIndex()) });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an asset only after a fresh, server-side usage scan proves nothing references it.
 * There is deliberately no force option: remove the references from content first.
 */
export const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) {
      return res.status(400).json({ success: false, error: 'Invalid media id' });
    }

    const { data: media, error: lookupError } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!media) {
      return res
        .status(404)
        .json({ success: false, code: 'MEDIA_NOT_FOUND', error: 'Media asset not found' });
    }

    let index;
    try {
      index = await buildReferenceIndex();
    } catch (err) {
      if (err instanceof MediaUsageUnavailableError) {
        return res.status(503).json({
          success: false,
          code: 'MEDIA_USAGE_UNVERIFIED',
          error: `Deletion refused: usage could not be verified (${err.message}).`,
        });
      }
      throw err;
    }

    const references = findReferences(media, index);
    if (references.length > 0) {
      return res.status(409).json({
        success: false,
        code: 'MEDIA_IN_USE',
        error: `"${media.original_name}" is still used by ${references.length} item(s). Remove it from that content before deleting.`,
        references,
      });
    }

    // Storage first: if it fails nothing is lost and the delete can be retried
    const bucket = resolveStorageBucket(media);
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([media.storage_path]);
    if (storageError) {
      return res.status(502).json({
        success: false,
        code: 'STORAGE_DELETE_FAILED',
        error: `Storage deletion failed: ${storageError.message}`,
      });
    }

    const { error: deleteError } = await supabase.from('media').delete().eq('id', id);
    if (deleteError) {
      return res.status(500).json({
        success: false,
        code: 'MEDIA_RECORD_DELETE_FAILED',
        error: `The file was removed from storage but its library record could not be deleted: ${deleteError.message}`,
      });
    }

    invalidateReferenceIndex();
    logAuditAction({
      req,
      action: 'DELETE',
      resourceType: 'MEDIA',
      resourceId: id,
      details: { filename: media.filename, bucket },
    });

    res.status(200).json({ success: true, message: 'Media asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMediaDownload = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    let query = supabase.from('media').select('*');
    query = UUID_PATTERN.test(identifier)
      ? query.eq('id', identifier)
      : query.eq('filename', identifier);

    const { data: mediaItem, error } = await query.maybeSingle();
    if (error || !mediaItem) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    // Access follows the bucket the object is actually stored in
    const bucketName = resolveStorageBucket(mediaItem);
    if (bucketName === PRIVATE_BUCKET && (!req.user || !req.user.is_admin)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Private asset' });
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(mediaItem.storage_path, 3600);

    if (signedError || !signedData?.signedUrl) {
      return res.status(502).json({ success: false, error: 'Failed to generate download link' });
    }

    res.set('Cache-Control', 'no-store');
    res.redirect(signedData.signedUrl);
  } catch (error) {
    next(error);
  }
};
