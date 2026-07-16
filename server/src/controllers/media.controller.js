import { supabase } from '../config/supabase.js';
import { parsePagination } from '../utils/validation.utils.js';

const hasValidSignature = (file) => {
  const bytes = file.buffer;
  if (!bytes?.length) return false;
  if (file.mimetype === 'image/jpeg')
    return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (file.mimetype === 'image/png')
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/webp')
    return (
      bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
    );
  if (file.mimetype === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
  return false;
};

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
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
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

    // Upload to Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from('portfolio-media')
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

    const { data: publicUrlData } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(storagePath);

    const publicUrl =
      publicUrlData?.publicUrl ||
      (process.env.SUPABASE_URL
        ? `${process.env.SUPABASE_URL}/storage/v1/object/public/portfolio-media/${storagePath}`
        : `/uploads/${filename}`);

    const mediaRecord = {
      filename,
      original_name: file.originalname,
      url: publicUrl,
      storage_path: storagePath,
      type: mediaType,
      folder,
      is_public: req.body.is_public !== 'false',
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
        .from('portfolio-media')
        .remove([storagePath])
        .catch(() => null);
      return res.status(400).json({ success: false, error: dbError.message });
    }

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
    }

    const { error } = await supabase.from('media').delete().eq('id', req.params.id);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(200).json({ success: true, message: 'Media asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};
