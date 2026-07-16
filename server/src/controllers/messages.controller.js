import { supabase } from '../config/supabase.js';

/**
 * Get all contact messages ordered by creation date descending
 */
export const getAdminMessages = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching admin messages:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch contact messages.' });
    }

    return res.status(200).json({
      success: true,
      messages: messages || [],
    });
  } catch (err) {
    console.error('getAdminMessages error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * Update message status (e.g. from 'new' to 'read', 'replied', or 'archived')
 */
export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid message status.' });
    }

    const { data: updated, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message status:', error);
      return res.status(500).json({ success: false, error: 'Failed to update message status.' });
    }

    return res.status(200).json({
      success: true,
      message: updated,
    });
  } catch (err) {
    console.error('updateMessageStatus error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * Delete a contact message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('contact_messages').delete().eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete message.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
    });
  } catch (err) {
    console.error('deleteMessage error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
