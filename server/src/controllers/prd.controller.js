import { supabase } from '../config/supabase.js';
import {
  parsePagination,
  parseResource,
  prdSchema,
  generatePreviewToken,
  verifyPreviewToken,
} from '../utils/validation.utils.js';
import { logAuditAction } from '../utils/audit.utils.js';

export const getPublicPrds = async (req, res, next) => {
  try {
    const { stage } = req.query;
    const { page, limit, q, offset } = parsePagination(req.query);

    let query = supabase
      .from('prds')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (stage && stage !== 'all') query = query.eq('stage', stage);
    if (q) {
      query = query.or(`title.ilike.%${q}%,context.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.status(200).json({
      success: true,
      count: count || 0,
      page: Number(page),
      totalPages: Math.ceil((count || 0) / Number(limit)),
      data: data || [],
    });
  } catch (error) {
    next(error);
  }
};

export const getPrdBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const previewToken = req.query.preview_token || req.headers['x-preview-token'];
    let query = supabase.from('prds').select('*').eq('slug', slug);

    if (previewToken) {
      if (!req.user || req.user.role !== 'owner') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Draft preview requires owner authentication.',
        });
      }
      if (!verifyPreviewToken(previewToken, slug, 'prd')) {
        return res
          .status(403)
          .json({ success: false, error: 'Forbidden: Invalid or expired draft preview token.' });
      }
    } else {
      query = query.eq('status', 'published').eq('visibility', 'public');
    }

    const { data: prd, error } = await query.single();
    if (error || !prd) {
      return res
        .status(404)
        .json({ success: false, error: 'PRD not found, private, or not published' });
    }
    res.status(200).json({ success: true, data: prd });
  } catch (error) {
    next(error);
  }
};

export const getPrdPreviewToken = async (req, res, next) => {
  try {
    const { data: prd, error } = await supabase
      .from('prds')
      .select('id, slug')
      .eq('id', req.params.id)
      .single();

    if (error || !prd) {
      return res.status(404).json({ success: false, error: 'PRD not found' });
    }

    const token = generatePreviewToken(prd, 'prd');
    res.status(200).json({
      success: true,
      previewToken: token,
      previewUrl: `/prds/${prd.slug}?preview_token=${token}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPrds = async (req, res, next) => {
  try {
    const { status, stage, visibility } = req.query;
    const { page, limit, q, offset } = parsePagination(req.query, 50);

    let query = supabase
      .from('prds')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status && status !== 'all') query = query.eq('status', status);
    if (stage && stage !== 'all') query = query.eq('stage', stage);
    if (visibility && visibility !== 'all') query = query.eq('visibility', visibility);
    if (q) {
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,context.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.status(200).json({
      success: true,
      count: count || 0,
      page: Number(page),
      totalPages: Math.ceil((count || 0) / Number(limit)),
      data: data || [],
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPrdById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('prds').select('*');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return res.status(404).json({ success: false, error: 'PRD not found' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createPrd = async (req, res, next) => {
  try {
    const payload = parseResource(prdSchema, req.body);
    if (req.user?.id) {
      payload.author_id = req.user.id;
    }
    if (!payload.slug && payload.title) {
      payload.slug = payload.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100);
    }

    const { data, error } = await supabase.from('prds').insert([payload]).select('*').single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    logAuditAction({
      req,
      action: 'CREATE',
      resourceType: 'PRD',
      resourceId: data.id,
      details: { title: data.title, status: data.status, visibility: data.visibility },
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updatePrd = async (req, res, next) => {
  try {
    const payload = parseResource(prdSchema, req.body);

    const { data, error } = await supabase
      .from('prds')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) {
      return res.status(400).json({ success: false, error: error?.message || 'PRD not found' });
    }

    logAuditAction({
      req,
      action: 'UPDATE',
      resourceType: 'PRD',
      resourceId: data.id,
      details: { title: data.title, status: data.status, visibility: data.visibility },
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deletePrd = async (req, res, next) => {
  try {
    const { error } = await supabase.from('prds').delete().eq('id', req.params.id);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    logAuditAction({
      req,
      action: 'DELETE',
      resourceType: 'PRD',
      resourceId: req.params.id,
    });

    res.status(200).json({ success: true, message: 'PRD deleted successfully' });
  } catch (error) {
    next(error);
  }
};
