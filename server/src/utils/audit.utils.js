import { supabase } from '../config/supabase.js';

/**
 * Log an admin action or mutation asynchronously.
 * Never throws to avoid failing the primary request on logging errors.
 *
 * @param {Object} params
 * @param {Object} params.req - Express request object
 * @param {string} params.action - Action performed (e.g. 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} params.resourceType - Type of resource (e.g. 'CASE_STUDY', 'ARTICLE', 'PRD', 'SETTINGS')
 * @param {string} [params.resourceId] - ID or slug of the modified resource
 * @param {Object} [params.details] - Additional metadata or changed fields
 */
export const logAuditAction = async ({
  req,
  action,
  resourceType,
  resourceId = null,
  details = {},
}) => {
  try {
    const user = req?.user;
    const ipAddress =
      req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || null;

    const entry = {
      user_id: user?.id || null,
      user_email: user?.email || null,
      action: action.toUpperCase(),
      resource_type: resourceType.toUpperCase(),
      resource_id: resourceId ? String(resourceId) : null,
      details: details && typeof details === 'object' ? details : {},
      ip_address: typeof ipAddress === 'string' ? ipAddress : null,
    };

    // Log to console for local observability
    console.info(
      `[AUDIT] ${entry.action} ${entry.resource_type} (${entry.resource_id || 'N/A'}) by ${
        entry.user_email || 'System'
      }`
    );

    // Persist to Supabase
    const { error } = await supabase.from('audit_logs').insert([entry]);
    if (error && error.code !== '42P01') {
      // Ignore relation does not exist if migration hasn't run against remote db yet
      console.warn('[AUDIT] Failed to persist audit log to Supabase:', error.message);
    }
  } catch (err) {
    console.error('[AUDIT] Unexpected logging error:', err?.message || err);
  }
};
