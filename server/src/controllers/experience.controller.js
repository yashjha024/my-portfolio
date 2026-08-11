import { supabase } from '../config/supabase.js';

/**
 * GET /api/experiences
 * Public endpoint to fetch published experiences ordered by sort_order
 */
export const getPublicExperiences = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public experiences:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch experiences.' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getPublicExperiences exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * GET /api/admin/experiences
 * Admin endpoint to list all experiences with search & filters
 */
export const getAdminExperiences = async (req, res) => {
  try {
    const { status, q } = req.query;
    let query = supabase.from('experiences').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (q && q.trim()) {
      query = query.or(
        `title.ilike.%${q.trim()}%,organization.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`
      );
    }

    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching admin experiences:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch experiences.' });
    }

    return res.status(200).json({ success: true, data: data || [], count: count || 0 });
  } catch (err) {
    console.error('getAdminExperiences exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * POST /api/admin/experiences
 * Create a new experience record
 */
export const createExperience = async (req, res) => {
  try {
    const {
      title,
      organization,
      employment_type,
      location,
      start_date,
      end_date,
      is_present,
      description,
      impact_metrics,
      logo_url,
      sort_order,
      status,
    } = req.body;

    if (!title || !organization || !start_date) {
      return res.status(400).json({
        success: false,
        error: 'Title, Organization, and Start Date are required.',
      });
    }

    const payload = {
      title: title.trim(),
      organization: organization.trim(),
      employment_type: employment_type || 'Full-time',
      location: location ? location.trim() : null,
      start_date: start_date.trim(),
      end_date: is_present ? 'Present' : end_date ? end_date.trim() : 'Present',
      is_present: Boolean(is_present),
      description: description ? description.trim() : null,
      impact_metrics: Array.isArray(impact_metrics) ? impact_metrics : [],
      logo_url: logo_url || null,
      sort_order: Number.isInteger(Number(sort_order)) ? Number(sort_order) : 0,
      status: status || 'published',
    };

    const { data, error } = await supabase
      .from('experiences')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating experience:', error);
      return res
        .status(500)
        .json({ success: false, error: error.message || 'Failed to create experience.' });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('createExperience exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * PUT /api/admin/experiences/:id
 * Update an existing experience record
 */
export const updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      organization,
      employment_type,
      location,
      start_date,
      end_date,
      is_present,
      description,
      impact_metrics,
      logo_url,
      sort_order,
      status,
    } = req.body;

    const payload = {};
    if (title !== undefined) payload.title = title.trim();
    if (organization !== undefined) payload.organization = organization.trim();
    if (employment_type !== undefined) payload.employment_type = employment_type;
    if (location !== undefined) payload.location = location ? location.trim() : null;
    if (start_date !== undefined) payload.start_date = start_date.trim();
    if (is_present !== undefined) payload.is_present = Boolean(is_present);
    if (end_date !== undefined || is_present !== undefined) {
      payload.end_date = is_present ? 'Present' : end_date ? end_date.trim() : 'Present';
    }
    if (description !== undefined) payload.description = description ? description.trim() : null;
    if (impact_metrics !== undefined)
      payload.impact_metrics = Array.isArray(impact_metrics) ? impact_metrics : [];
    if (logo_url !== undefined) payload.logo_url = logo_url || null;
    if (sort_order !== undefined) payload.sort_order = Number(sort_order) || 0;
    if (status !== undefined) payload.status = status;

    const { data, error } = await supabase
      .from('experiences')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating experience:', error);
      return res
        .status(500)
        .json({ success: false, error: error.message || 'Failed to update experience.' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('updateExperience exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/admin/experiences/:id
 * Delete an experience record
 */
export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('experiences').delete().eq('id', id);

    if (error) {
      console.error('Error deleting experience:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete experience.' });
    }

    return res.status(200).json({ success: true, message: 'Experience deleted successfully.' });
  } catch (err) {
    console.error('deleteExperience exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
