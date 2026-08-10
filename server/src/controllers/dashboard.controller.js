import { supabase } from '../config/supabase.js';

/**
 * Return aggregate statistics and recent activity for the Admin CMS Dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Parallel counts query
    const [
      { count: totalCaseStudies },
      { count: publishedCaseStudies },
      { count: draftCaseStudies },
      { count: totalArticles },
      { count: totalPrds },
      { count: totalMedia },
      { count: unreadMessages },
    ] = await Promise.all([
      supabase.from('case_studies').select('*', { count: 'exact', head: true }),
      supabase
        .from('case_studies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('case_studies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase.from('thinking_articles').select('*', { count: 'exact', head: true }),
      supabase.from('prds').select('*', { count: 'exact', head: true }),
      supabase.from('media').select('*', { count: 'exact', head: true }),
      supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new'),
    ]);

    // Fetch top recent items across work and articles and audit logs
    const [
      { data: recentWork },
      { data: recentArticles },
      { data: recentPrds },
      { data: recentAuditLogs },
    ] = await Promise.all([
      supabase
        .from('case_studies')
        .select('id, title, slug, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('thinking_articles')
        .select('id, title, slug, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('prds')
        .select('id, title, slug, status, stage, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5),
      (async () => {
        try {
          const res = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
          return { data: res.data || [] };
        } catch (_e) {
          return { data: [] };
        }
      })(),
    ]);

    const recentActivity = [
      ...(recentWork || []).map((item) => ({ ...item, module: 'work' })),
      ...(recentArticles || []).map((item) => ({ ...item, module: 'thinking' })),
      ...(recentPrds || []).map((item) => ({ ...item, module: 'prds' })),
    ]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      stats: {
        totalCaseStudies: totalCaseStudies || 0,
        publishedCaseStudies: publishedCaseStudies || 0,
        draftCaseStudies: draftCaseStudies || 0,
        totalArticles: totalArticles || 0,
        totalPrds: totalPrds || 0,
        totalMedia: totalMedia || 0,
        unreadMessages: unreadMessages || 0,
      },
      recentActivity,
      auditLogs: recentAuditLogs || [],
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard statistics.' });
  }
};

/**
 * Return paginated audit activity logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query?.limit, 10) || 30, 1), 100);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error && error.code !== '42P01') {
      throw error;
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load audit logs.' });
  }
};
