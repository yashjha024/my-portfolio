import { supabase } from '../config/supabase.js';
import {
  caseStudySchema,
  parsePagination,
  parseResource,
  generatePreviewToken,
  verifyPreviewToken,
} from '../utils/validation.utils.js';
import { logAuditAction } from '../utils/audit.utils.js';

export const getPublicCaseStudies = async (req, res, next) => {
  try {
    const { type, domain, tag } = req.query;
    const { page, limit, q, offset } = parsePagination(req.query);

    let query = supabase
      .from('case_studies')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (type && type !== 'all') query = query.eq('type', type);
    if (domain && domain !== 'all') query = query.ilike('domain', `%${domain}%`);
    if (tag && tag !== 'all') query = query.contains('tags', [tag]);
    if (q) {
      query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,problem.ilike.%${q}%`);
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

export const getCaseStudyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const previewToken = req.query.preview_token || req.headers['x-preview-token'];
    let query = supabase.from('case_studies').select('*').eq('slug', slug);

    if (previewToken) {
      if (!req.user || req.user.role !== 'owner') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Draft preview requires owner authentication.',
        });
      }
      if (!verifyPreviewToken(previewToken, slug, 'work')) {
        return res
          .status(403)
          .json({ success: false, error: 'Forbidden: Invalid or expired draft preview token.' });
      }
      // Allowed: owner with valid preview token can view regardless of status
    } else {
      query = query.eq('status', 'published');
    }

    const { data: caseStudy, error } = await query.single();
    if (error || !caseStudy) {
      return res
        .status(404)
        .json({ success: false, error: 'Case study not found or not published' });
    }
    res.status(200).json({ success: true, data: caseStudy });
  } catch (error) {
    next(error);
  }
};

export const getCaseStudyPreviewToken = async (req, res, next) => {
  try {
    const { data: caseStudy, error } = await supabase
      .from('case_studies')
      .select('id, slug')
      .eq('id', req.params.id)
      .single();

    if (error || !caseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }

    const token = generatePreviewToken(caseStudy, 'work');
    res.status(200).json({
      success: true,
      previewToken: token,
      previewUrl: `/work/${caseStudy.slug}?preview_token=${token}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCaseStudies = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const { page, limit, q, offset } = parsePagination(req.query, 50);

    let query = supabase
      .from('case_studies')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('type', type);
    if (q) {
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,summary.ilike.%${q}%`);
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

export const getAdminCaseStudyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('case_studies').select('*');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createCaseStudy = async (req, res, next) => {
  try {
    const payload = parseResource(caseStudySchema, req.body);
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

    const { data, error } = await supabase
      .from('case_studies')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    logAuditAction({
      req,
      action: 'CREATE',
      resourceType: 'CASE_STUDY',
      resourceId: data.id || data.slug,
      details: { title: data.title, status: data.status },
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateCaseStudy = async (req, res, next) => {
  try {
    const payload = parseResource(caseStudySchema, req.body);
    if (payload.status === 'published' && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('case_studies')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) {
      return res
        .status(400)
        .json({ success: false, error: error?.message || 'Case study not found' });
    }

    logAuditAction({
      req,
      action: 'UPDATE',
      resourceType: 'CASE_STUDY',
      resourceId: data.id || req.params.id,
      details: { title: data.title, status: data.status },
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteCaseStudy = async (req, res, next) => {
  try {
    const { error } = await supabase.from('case_studies').delete().eq('id', req.params.id);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    logAuditAction({
      req,
      action: 'DELETE',
      resourceType: 'CASE_STUDY',
      resourceId: req.params.id,
    });

    res.status(200).json({ success: true, message: 'Case study deleted successfully' });
  } catch (error) {
    next(error);
  }
};
