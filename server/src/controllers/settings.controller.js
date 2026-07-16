import { supabase } from '../config/supabase.js';
import { parseResource, settingsSchema } from '../utils/validation.utils.js';

/**
 * Get public site settings (id = 1 singleton)
 */
export const getPublicSettings = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Site settings not found' });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin site settings
 */
export const getAdminSettings = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    res.status(200).json({ success: true, data: data || { id: 1 } });
  } catch (error) {
    next(error);
  }
};

/**
 * Update singleton site settings (id = 1)
 */
export const updateSettings = async (req, res, next) => {
  try {
    const payload = { ...parseResource(settingsSchema, req.body), id: 1 };
    if (req.user?.id) {
      payload.updated_by = req.user.id;
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error || !data) {
      return res
        .status(400)
        .json({ success: false, error: error?.message || 'Failed to update settings' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
