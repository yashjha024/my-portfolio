import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/admin/StatusBadge.jsx';
import {
  Briefcase,
  BookOpen,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const Dashboard = () => {
  const [data, setData] = useState({ stats: null, recentActivity: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data?.success) {
        setData({
          stats: res.data.stats,
          recentActivity: res.data.recentActivity || [],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Could not fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <span className="text-muted-foreground font-mono text-xs uppercase">
          Loading Command Center...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
        {error}
      </div>
    );
  }

  const { stats, recentActivity } = data;

  const statCards = [
    {
      title: 'Case Studies',
      value: stats?.totalCaseStudies || 0,
      subtext: `${stats?.publishedCaseStudies || 0} Published • ${stats?.draftCaseStudies || 0} Drafts`,
      icon: Briefcase,
      color: 'text-primary bg-indigo-500/10 border-primary/40',
      path: '/admin/work',
    },
    {
      title: 'Thinking Articles',
      value: stats?.totalArticles || 0,
      subtext: 'Product teardowns & essays',
      icon: BookOpen,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      path: '/admin/thinking',
    },
    {
      title: 'PRD Library Specs',
      value: stats?.totalPrds || 0,
      subtext: 'Engineering & launch specs',
      icon: FileText,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      path: '/admin/prds',
    },
    {
      title: 'Media Assets',
      value: stats?.totalMedia || 0,
      subtext: 'Uploaded images & PDFs',
      icon: ImageIcon,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      path: '/admin/media',
    },
    {
      title: 'Inquiries & Inbox',
      value: stats?.unreadMessages || 0,
      subtext: 'Visitor inquiries requiring reply',
      icon: MessageSquare,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      path: '/admin/messages',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Executive Command Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time content telemetry, publishing velocity, and system status
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-card text-foreground hover:bg-secondary flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(card.path)}
              className="border-border bg-card hover:border-border group cursor-pointer rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl border p-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 font-mono text-xs transition-colors">
                  <span>Manage</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {card.value}
                </span>
                <p className="text-foreground mt-1 text-xs font-medium">{card.title}</p>
                <p className="text-muted-foreground mt-1 font-mono text-[11px]">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Strip */}
      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="text-muted-foreground mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
          <TrendingUp className="text-primary h-4 w-4" />
          <span>High-Velocity Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/work/new"
            className="bg-primary shadow-soft shadow-subtle hover:bg-primary/90 group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="h-4 w-4 shrink-0" />
              <span>New Case Study</span>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/admin/thinking/new"
            className="border-border bg-secondary hover:bg-secondary group flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium text-white transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="h-4 w-4 shrink-0 text-violet-400" />
              <span>New Article</span>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/admin/prds/new"
            className="border-border bg-secondary hover:bg-secondary group flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium text-white transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>New PRD Spec</span>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/admin/media"
            className="border-border bg-secondary hover:bg-secondary group flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium text-white transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Upload Media</span>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="border-border bg-card shadow-soft overflow-hidden rounded-2xl border">
        <div className="border-border flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2">
            <Clock className="text-primary h-4 w-4" />
            <h2 className="text-base font-bold text-white">Recent Content Activity</h2>
          </div>
          <span className="text-muted-foreground font-mono text-xs">Last 10 updates</span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-muted-foreground p-12 text-center font-mono text-sm">
            No recent content modifications recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-border bg-background text-muted-foreground border-b font-mono text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Content Title</th>
                  <th className="px-5 py-3.5">Module</th>
                  <th className="px-5 py-3.5">Status / Stage</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y text-sm">
                {recentActivity.map((item, idx) => {
                  const moduleConfig = {
                    work: {
                      label: 'Case Study',
                      path: `/admin/work/edit/${item.id}`,
                      color: 'text-primary bg-indigo-500/10',
                    },
                    thinking: {
                      label: 'Article',
                      path: `/admin/thinking/edit/${item.id}`,
                      color: 'text-violet-400 bg-violet-500/10',
                    },
                    prds: {
                      label: 'PRD Spec',
                      path: `/admin/prds/edit/${item.id}`,
                      color: 'text-emerald-400 bg-emerald-500/10',
                    },
                  };

                  const mod = moduleConfig[item.module] || moduleConfig.work;

                  return (
                    <tr key={idx} className="hover:bg-secondary transition-colors">
                      <td
                        className="max-w-xs truncate px-5 py-3.5 font-medium text-white"
                        title={item.title}
                      >
                        {item.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 font-mono text-xs font-medium ${mod.color}`}
                        >
                          {mod.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {item.status ? (
                          <StatusBadge status={item.status} />
                        ) : (
                          <span className="text-muted-foreground font-mono text-xs uppercase">
                            {item.stage || 'Active'}
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-5 py-3.5 font-mono text-xs">
                        {new Date(item.updated_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={mod.path}
                          className="text-primary hover:bg-primary/90/10 hover:text-primary rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
