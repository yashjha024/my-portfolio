import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/admin/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog.jsx';
import { PaginationControls } from '../../components/admin/PaginationControls.jsx';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const ManageWorkPage = () => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete dialog state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicating state
  const [duplicatingId, setDuplicatingId] = useState(null);

  const _navigate = useNavigate();

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search.trim()) params.append('q', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await api.get(`/admin/work?${params.toString()}`);
      if (res.data?.success) {
        setCaseStudies(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching case studies:', err);
      setError('Failed to load case studies from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudies();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCaseStudies();
  };

  const handleDuplicate = async (item) => {
    try {
      setDuplicatingId(item.id);
      const duplicatedPayload = {
        title: `${item.title} (Template Copy)`,
        slug: `${item.slug}-copy-${Date.now().toString().slice(-4)}`,
        summary: item.summary,
        type: item.type,
        status: 'draft',
        featured: false,
        sort_order: (item.sort_order || 0) + 1,
        role: item.role,
        timeline: item.timeline,
        team: item.team,
        domain: item.domain,
        problem: item.problem,
        approach: item.approach,
        outcome: item.outcome,
        metrics: item.metrics || [],
        tools: item.tools || [],
        tags: item.tags || [],
        cover_image: item.cover_image,
        gallery: item.gallery || [],
        live_url: item.live_url,
        repo_url: item.repo_url,
        prototype_url: item.prototype_url,
        prd_url: item.prd_url,
      };

      const res = await api.post('/admin/work', duplicatedPayload);
      if (res.data?.success) {
        fetchCaseStudies();
      }
    } catch (err) {
      console.error('Failed to duplicate case study:', err);
      alert(err.response?.data?.error || 'Could not duplicate case study.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/admin/work/${itemToDelete.id}`);
      if (res.data?.success) {
        setCaseStudies((prev) => prev.filter((cs) => cs.id !== itemToDelete.id));
        setTotalCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete case study.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const formatTypeLabel = (type) => {
    switch (type) {
      case 'shipped_project':
        return 'Shipped Project';
      case 'product_case_study':
        return 'Product Case Study';
      case 'program_case_study':
        return 'Program Case Study';
      default:
        return type || 'Case Study';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-indigo-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Case Studies & Work</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Manage your portfolio case studies, shipped projects, and program evidence (
              {totalCount} total)
            </p>
          </div>
        </div>
        <Link
          to="/admin/work/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>Create Case Study</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex-row">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, domain, or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 text-sm text-white transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-xs uppercase text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="shipped_project">Shipped Project</option>
              <option value="product_case_study">Product Case Study</option>
              <option value="program_case_study">Program Case Study</option>
            </select>
          </div>

          <button
            onClick={() => fetchCaseStudies()}
            className="rounded-xl bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {loading && caseStudies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <span className="font-mono text-xs uppercase text-slate-400">
              Loading Case Studies...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
            <p className="font-medium text-rose-300">{error}</p>
            <button
              onClick={fetchCaseStudies}
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 font-mono text-xs text-slate-200 hover:bg-slate-700"
            >
              Retry Connection
            </button>
          </div>
        ) : caseStudies.length === 0 ? (
          <div className="p-16 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <h3 className="mb-1 text-base font-bold text-white">No Case Studies Found</h3>
            <p className="mx-auto mb-6 max-w-sm text-xs text-slate-400">
              You don&apos;t have any case studies matching your filter criteria yet. Start building
              your portfolio evidence!
            </p>
            <Link
              to="/admin/work/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Case Study</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-4">Title & Slug</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Domain</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Sort Order</th>
                  <th className="px-5 py-4">Last Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {caseStudies.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 font-bold text-white transition-colors group-hover:text-indigo-300">
                        <span>{item.title}</span>
                        {item.featured && (
                          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-amber-400">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-slate-500">/{item.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-medium text-indigo-300">
                        {formatTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-300">
                      {item.domain || 'General'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      #{item.sort_order || 0}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/work/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                          title="Preview on Public Site"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          disabled={duplicatingId === item.id}
                          onClick={() => handleDuplicate(item)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-indigo-400 disabled:opacity-30"
                          title="Duplicate as Template"
                        >
                          {duplicatingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to={`/admin/work/edit/${item.id}`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-indigo-400"
                          title="Edit Case Study"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => confirmDelete(item)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
                          title="Delete Permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Case Study"
        description={
          itemToDelete
            ? `Are you absolutely sure you want to delete "${itemToDelete.title}"? This action removes all sections, metrics, and evidence from the database permanently.`
            : 'Are you sure?'
        }
        confirmText="Delete Permanently"
        loading={deleting}
      />
    </div>
  );
};
