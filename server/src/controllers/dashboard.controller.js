import { supabase } from '../config/supabase.js';

/**
 * Return aggregate statistics and recent activity for the Admin CMS Dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Parallel counts query using Promise.allSettled for maximum resilience
    const results = await Promise.allSettled([
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

    const extractCount = (res) =>
      res.status === 'fulfilled' && !res.value.error ? res.value.count || 0 : 0;

    const stats = {
      totalCaseStudies: extractCount(results[0]),
      publishedCaseStudies: extractCount(results[1]),
      draftCaseStudies: extractCount(results[2]),
      totalArticles: extractCount(results[3]),
      totalPrds: extractCount(results[4]),
      totalMedia: extractCount(results[5]),
      unreadMessages: extractCount(results[6]),
    };

    // Fetch top recent items across work, articles, prds, and audit logs
    const activityResults = await Promise.allSettled([
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
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const recentWork =
      activityResults[0].status === 'fulfilled' && !activityResults[0].value.error
        ? activityResults[0].value.data || []
        : [];
    const recentArticles =
      activityResults[1].status === 'fulfilled' && !activityResults[1].value.error
        ? activityResults[1].value.data || []
        : [];
    const recentPrds =
      activityResults[2].status === 'fulfilled' && !activityResults[2].value.error
        ? activityResults[2].value.data || []
        : [];
    const recentAuditLogs =
      activityResults[3].status === 'fulfilled' && !activityResults[3].value.error
        ? activityResults[3].value.data || []
        : [];

    const recentActivity = [
      ...recentWork.map((item) => ({ ...item, module: 'work' })),
      ...recentArticles.map((item) => ({ ...item, module: 'thinking' })),
      ...recentPrds.map((item) => ({ ...item, module: 'prds' })),
    ]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      stats,
      recentActivity,
      auditLogs: recentAuditLogs,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(200).json({
      success: true,
      stats: {
        totalCaseStudies: 0,
        publishedCaseStudies: 0,
        draftCaseStudies: 0,
        totalArticles: 0,
        totalPrds: 0,
        totalMedia: 0,
        unreadMessages: 0,
      },
      recentActivity: [],
      auditLogs: [],
    });
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
