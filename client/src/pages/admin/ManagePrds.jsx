import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/admin/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog.jsx';
import { PaginationControls } from '../../components/admin/PaginationControls.jsx';
import {
  FileText,
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
  Lock,
  Globe,
  EyeOff,
} from 'lucide-react';

export const ManagePrdsPage = () => {
  const [prds, setPrds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const _navigate = useNavigate();

  const fetchPrds = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search.trim()) params.append('q', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (stageFilter !== 'all') params.append('stage', stageFilter);
      if (visibilityFilter !== 'all') params.append('visibility', visibilityFilter);

      const res = await api.get(`/admin/prds?${params.toString()}`);
      if (res.data?.success) {
        setPrds(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching PRDs:', err);
      setError('Failed to load PRD library specs from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrds();
  }, [page, statusFilter, stageFilter, visibilityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPrds();
  };

  const handleDuplicate = async (item) => {
    try {
      setDuplicatingId(item.id);
      const duplicatedPayload = {
        title: `${item.title} (Template Spec Copy)`,
        slug: `${item.slug}-copy-${Date.now().toString().slice(-4)}`,
        stage: item.stage || 'In Development',
        visibility: item.visibility || 'unlisted',
        status: 'draft',
        context: item.context,
        sections: item.sections || [],
        pdf_url: item.pdf_url,
        related_case_study_id: item.related_case_study_id,
      };

      const res = await api.post('/admin/prds', duplicatedPayload);
      if (res.data?.success) {
        fetchPrds();
      }
    } catch (err) {
      console.error('Failed to duplicate PRD:', err);
      alert(err.response?.data?.error || 'Could not duplicate PRD spec.');
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
      const res = await api.delete(`/admin/prds/${itemToDelete.id}`);
      if (res.data?.success) {
        setPrds((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        setTotalCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete PRD spec.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const formatVisibilityIcon = (vis) => {
    switch (vis) {
      case 'public':
        return <Globe className="h-3.5 w-3.5 text-emerald-400" title="Publicly accessible" />;
      case 'private':
        return <Lock className="h-3.5 w-3.5 text-rose-400" title="Private to admins" />;
      default:
        return <EyeOff className="h-3.5 w-3.5 text-amber-400" title="Unlisted (Link only)" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">PRD Library & Specs</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Manage functional specifications, requirements docs, and gated downloads ({totalCount}{' '}
              total)
            </p>
          </div>
        </div>
        <Link
          to="/admin/prds/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          <span>Create PRD Spec</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex-row">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PRD title or context..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 text-sm text-white transition-colors placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </form>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Stages</option>
              <option value="In Development">In Development</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Shipped">Shipped</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={visibilityFilter}
              onChange={(e) => {
                setVisibilityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button
            onClick={() => fetchPrds()}
            className="rounded-xl bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {loading && prds.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="font-mono text-xs uppercase text-slate-400">Loading PRD Specs...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
            <p className="font-medium text-rose-300">{error}</p>
            <button
              onClick={fetchPrds}
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 font-mono text-xs text-slate-200 hover:bg-slate-700"
            >
              Retry Connection
            </button>
          </div>
        ) : prds.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <h3 className="mb-1 text-base font-bold text-white">No PRD Specs Found</h3>
            <p className="mx-auto mb-6 max-w-sm text-xs text-slate-400">
              You haven&apos;t added any PRD specifications matching your current filters.
            </p>
            <Link
              to="/admin/prds/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First PRD Spec</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-4">PRD Title & Slug</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Visibility</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {prds.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white transition-colors group-hover:text-emerald-300">
                        {item.title}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-slate-500">/{item.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-medium text-emerald-300">
                        {item.stage || 'In Development'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs capitalize text-slate-300">
                        {formatVisibilityIcon(item.visibility)}
                        <span>{item.visibility || 'unlisted'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
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
                          href={`/prds/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                          title="Preview PRD Spec"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          disabled={duplicatingId === item.id}
                          onClick={() => handleDuplicate(item)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-400 disabled:opacity-30"
                          title="Duplicate PRD Spec"
                        >
                          {duplicatingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to={`/admin/prds/edit/${item.id}`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-400"
                          title="Edit PRD Spec"
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

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete PRD Specification"
        description={
          itemToDelete
            ? `Are you sure you want to delete "${itemToDelete.title}"? All structured sections and downloadable PDF links will be removed permanently.`
            : 'Are you sure?'
        }
        confirmText="Delete Permanently"
        loading={deleting}
      />
    </div>
  );
};
