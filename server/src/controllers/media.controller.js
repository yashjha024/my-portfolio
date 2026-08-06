import { supabase } from '../config/supabase.js';
import { parsePagination, hasValidSignature } from '../utils/validation.utils.js';
import { logAuditAction } from '../utils/audit.utils.js';

export const getMediaList = async (req, res, next) => {
  try {
    const { type, folder = 'all', unused = 'false' } = req.query;
    const { q, page, limit, offset } = parsePagination(req.query, 100);

    let query = supabase
      .from('media')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (type && type !== 'all') query = query.eq('type', type);
    if (q) {
      query = query.or(`original_name.ilike.%${q}%,filename.ilike.%${q}%,alt_text.ilike.%${q}%`);
    }

    const { data: rawData, count, error } = await query;
    if (error) throw error;

    let data = rawData || [];

    // Parallel fetch of content tables to detect unused orphaned media items
    let allTextBlob = '';
    try {
      const [csRes, thRes, prdRes, setRes] = await Promise.all([
        supabase
          .from('case_studies')
          .select('cover_image, gallery, problem, approach, outcome')
          .limit(500),
        supabase.from('thinking_articles').select('cover_image, body').limit(500),
        supabase.from('prds').select('pdf_url, context, sections').limit(500),
        supabase.from('site_settings').select('profile_photo_url, resume_url').limit(10),
      ]);

      allTextBlob = JSON.stringify({
        cs: csRes.data || [],
        th: thRes.data || [],
        prd: prdRes.data || [],
        set: setRes.data || [],
      });
    } catch (err) {
      console.warn('Could not inspect all content tables for unused check:', err.message);
    }

    // Attach folder and is_used flags
    data = data.map((item) => {
      const parts = (item.storage_path || '').split('/');
      const itemFolder = item.folder || (parts.length >= 3 ? parts[1] : 'general');
      const isUsed =
        Boolean(allTextBlob) &&
        (allTextBlob.includes(item.url) ||
          allTextBlob.includes(item.filename) ||
          allTextBlob.includes(item.storage_path));

      return {
        ...item,
        folder: itemFolder,
        is_used: isUsed,
      };
    });

    // Filter by folder if requested
    if (folder && folder !== 'all') {
      data = data.filter((item) => item.folder.toLowerCase() === folder.toLowerCase());
    }

    // Filter by unused if requested
    if (unused === 'true') {
      data = data.filter((item) => !item.is_used);
    }

    res.status(200).json({
      success: true,
      count: count || data.length,
      page: Number(page),
      totalPages: Math.ceil((count || data.length) / Number(limit)),
      data,
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
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ success: false, error: `Unsupported MIME type: ${file.mimetype}` });
    }
    if (!hasValidSignature(file)) {
      return res
        .status(400)
        .json({ success: false, error: 'File content does not match its declared type.' });
    }
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File exceeds 10MB size limit' });
    }

    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${sanitizedName}`;
    const folder = req.body.folder
      ? req.body.folder.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      : 'general';
    const storagePath = `assets/${folder}/${filename}`;

    // Determine enum type
    let mediaType = 'document';
    if (file.mimetype.startsWith('image/')) mediaType = 'image';
    else if (file.mimetype.includes('pdf')) mediaType = 'pdf';

    const isPublic = req.body.is_public !== 'false' && req.body.is_public !== false;
    const isPrivateAsset = !isPublic || folder === 'private' || folder === 'confidential';
    const targetBucket = isPrivateAsset ? 'portfolio-media-private' : 'portfolio-media';

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
        .status(500)
        .json({ success: false, error: `Storage upload failed: ${uploadError.message}` });
    }

    let assetUrl = `/api/media/download/${filename}`;
    if (!isPrivateAsset) {
      const { data: publicUrlData } = supabase.storage.from(targetBucket).getPublicUrl(storagePath);
      assetUrl =
        publicUrlData?.publicUrl ||
        (process.env.SUPABASE_URL
          ? `${process.env.SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${storagePath}`
          : `/uploads/${filename}`);
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
      alt_text: req.body.alt_text || file.originalname.split('.')[0] || 'Media asset',
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
      data: {
        ...data,
        folder,
        is_used: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedia = async (req, res, next) => {
  try {
    const { alt_text, is_public } = req.body;
    const { data, error } = await supabase
      .from('media')
      .update({
        ...(typeof alt_text === 'string' ? { alt_text: alt_text.slice(0, 240) } : {}),
        ...(typeof is_public === 'boolean' ? { is_public } : {}),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) {
      return res.status(400).json({ success: false, error: error?.message || 'Media not found' });
    }

    const parts = (data.storage_path || '').split('/');
    const itemFolder = parts.length >= 3 ? parts[1] : 'general';

    logAuditAction({
      req,
      action: 'UPDATE',
      resourceType: 'MEDIA',
      resourceId: data.id || req.params.id,
      details: { alt_text, is_public },
    });

    res.status(200).json({
      success: true,
      data: {
        ...data,
        folder: itemFolder,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    // Lookup item to get storage_path
    const { data: mediaItem } = await supabase
      .from('media')
      .select('storage_path')
      .eq('id', req.params.id)
      .single();

    if (mediaItem?.storage_path) {
      await supabase.storage
        .from('portfolio-media')
        .remove([mediaItem.storage_path])
        .catch(() => null);
      await supabase.storage
        .from('portfolio-media-private')
        .remove([mediaItem.storage_path])
        .catch(() => null);
    }

    const { error } = await supabase.from('media').delete().eq('id', req.params.id);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    logAuditAction({
      req,
      action: 'DELETE',
      resourceType: 'MEDIA',
      resourceId: req.params.id,
    });

    res.status(200).json({ success: true, message: 'Media asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMediaDownload = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    // Check if identifier is a UUID or filename
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );
    let query = supabase.from('media').select('*');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('filename', identifier);
    }

    const { data: mediaItem, error } = await query.single();
    if (error || !mediaItem) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    const isPrivate =
      !mediaItem.is_public || mediaItem.folder === 'private' || mediaItem.folder === 'confidential';
    if (isPrivate) {
      // Require admin authentication for private assets
      if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ success: false, error: 'Forbidden: Private asset' });
      }
    }

    const bucketName = isPrivate ? 'portfolio-media-private' : 'portfolio-media';
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(mediaItem.storage_path, 3600);

    if (signedError || !signedData?.signedUrl) {
      return res.status(500).json({ success: false, error: 'Failed to generate download link' });
    }

    res.redirect(signedData.signedUrl);
  } catch (error) {
    next(error);
  }
};
