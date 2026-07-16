import { supabase } from '../config/supabase.js';
import { parsePagination, parseResource, prdSchema } from '../utils/validation.utils.js';

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
    const { data: prd, error } = await supabase
      .from('prds')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .single();

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
    res.status(200).json({ success: true, message: 'PRD deleted successfully' });
  } catch (error) {
    next(error);
  }
};
