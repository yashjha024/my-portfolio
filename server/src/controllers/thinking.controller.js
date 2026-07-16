import { supabase } from '../config/supabase.js';
import { articleSchema, parsePagination, parseResource } from '../utils/validation.utils.js';

export const getPublicArticles = async (req, res, next) => {
  try {
    const { type, tag } = req.query;
    const { page, limit, q, offset } = parsePagination(req.query);

    let query = supabase
      .from('thinking_articles')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (type && type !== 'all') query = query.eq('type', type);
    if (tag && tag !== 'all') query = query.contains('tags', [tag]);
    if (q) {
      query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,body.ilike.%${q}%`);
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

export const getArticleBySlug = async (req, res, next) => {
  try {
    const { data: article, error } = await supabase
      .from('thinking_articles')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (error || !article) {
      return res.status(404).json({ success: false, error: 'Article not found or not published' });
    }
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const getAdminArticles = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const { page, limit, q, offset } = parsePagination(req.query, 50);

    let query = supabase
      .from('thinking_articles')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('type', type);
    if (q) {
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,excerpt.ilike.%${q}%`);
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

export const createArticle = async (req, res, next) => {
  try {
    const payload = parseResource(articleSchema, req.body);
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
      .from('thinking_articles')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const payload = parseResource(articleSchema, req.body);
    if (payload.status === 'published' && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('thinking_articles')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) {
      return res.status(400).json({ success: false, error: error?.message || 'Article not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const { error } = await supabase.from('thinking_articles').delete().eq('id', req.params.id);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(200).json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
};
