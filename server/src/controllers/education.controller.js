import { supabase } from '../config/supabase.js';

/**
 * GET /api/educations
 * Public endpoint to fetch published education records ordered by sort_order
 */
export const getPublicEducations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('educations')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public educations:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch education records.' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getPublicEducations exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * GET /api/admin/educations
 * Admin endpoint to list all education records
 */
export const getAdminEducations = async (req, res) => {
  try {
    const { status, q } = req.query;
    let query = supabase.from('educations').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (q && q.trim()) {
      query = query.or(
        `institution.ilike.%${q.trim()}%,degree.ilike.%${q.trim()}%,field_of_study.ilike.%${q.trim()}%`
      );
    }

    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching admin educations:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch educations.' });
    }

    return res.status(200).json({ success: true, data: data || [], count: count || 0 });
  } catch (err) {
    console.error('getAdminEducations exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * POST /api/admin/educations
 * Create a new education record
 */
export const createEducation = async (req, res) => {
  try {
    const {
      institution,
      degree,
      field_of_study,
      start_date,
      end_date,
      gpa,
      description,
      sort_order,
      status,
    } = req.body;

    if (!institution || !degree) {
      return res.status(400).json({
        success: false,
        error: 'Institution and Degree are required.',
      });
    }

    const payload = {
      institution: institution.trim(),
      degree: degree.trim(),
      field_of_study: field_of_study ? field_of_study.trim() : null,
      start_date: start_date ? start_date.trim() : null,
      end_date: end_date ? end_date.trim() : null,
      gpa: gpa ? gpa.trim() : null,
      description: description ? description.trim() : null,
      sort_order: Number.isInteger(Number(sort_order)) ? Number(sort_order) : 0,
      status: status || 'published',
    };

    const { data, error } = await supabase
      .from('educations')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating education:', error);
      return res
        .status(500)
        .json({ success: false, error: error.message || 'Failed to create education.' });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('createEducation exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * PUT /api/admin/educations/:id
 * Update an education record
 */
export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      institution,
      degree,
      field_of_study,
      start_date,
      end_date,
      gpa,
      description,
      sort_order,
      status,
    } = req.body;

    const payload = {};
    if (institution !== undefined) payload.institution = institution.trim();
    if (degree !== undefined) payload.degree = degree.trim();
    if (field_of_study !== undefined)
      payload.field_of_study = field_of_study ? field_of_study.trim() : null;
    if (start_date !== undefined) payload.start_date = start_date ? start_date.trim() : null;
    if (end_date !== undefined) payload.end_date = end_date ? end_date.trim() : null;
    if (gpa !== undefined) payload.gpa = gpa ? gpa.trim() : null;
    if (description !== undefined) payload.description = description ? description.trim() : null;
    if (sort_order !== undefined) payload.sort_order = Number(sort_order) || 0;
    if (status !== undefined) payload.status = status;

    const { data, error } = await supabase
      .from('educations')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating education:', error);
      return res
        .status(500)
        .json({ success: false, error: error.message || 'Failed to update education.' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('updateEducation exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/admin/educations/:id
 * Delete an education record
 */
export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('educations').delete().eq('id', id);

    if (error) {
      console.error('Error deleting education:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete education.' });
    }

    return res.status(200).json({ success: true, message: 'Education deleted successfully.' });
  } catch (err) {
    console.error('deleteEducation exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
