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

    // Fetch top recent items across work and articles
    const [{ data: recentWork }, { data: recentArticles }, { data: recentPrds }] =
      await Promise.all([
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
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard statistics.' });
  }
};
