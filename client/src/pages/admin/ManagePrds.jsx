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
      <div className="border-border bg-card flex flex-col justify-between gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">PRD Library & Specs</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage functional specifications, requirements docs, and gated downloads ({totalCount}{' '}
              total)
            </p>
          </div>
        </div>
        <Link
          to="/admin/prds/new"
          className="shadow-soft flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          <span>Create PRD Spec</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="border-border bg-card flex flex-col items-center justify-between gap-4 rounded-2xl border p-4 md:flex-row">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="text-muted-foreground absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PRD title or context..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-background placeholder:text-muted-foreground w-full rounded-xl border py-2 pl-10 pr-4 text-sm text-white transition-colors focus:border-emerald-500 focus:outline-none"
          />
        </form>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border-border bg-background rounded-xl border px-3 py-1.5 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
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
              className="border-border bg-background rounded-xl border px-3 py-1.5 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
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
              className="border-border bg-background rounded-xl border px-3 py-1.5 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button
            onClick={() => fetchPrds()}
            className="bg-secondary text-foreground hover:bg-secondary rounded-xl p-2 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="border-border bg-card shadow-soft overflow-hidden rounded-2xl border">
        {loading && prds.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="text-muted-foreground font-mono text-xs uppercase">
              Loading PRD Specs...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
            <p className="font-medium text-rose-300">{error}</p>
            <button
              onClick={fetchPrds}
              className="bg-secondary text-foreground hover:bg-secondary mt-4 rounded-xl px-4 py-2 font-mono text-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : prds.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
            <h3 className="mb-1 text-base font-bold text-white">No PRD Specs Found</h3>
            <p className="text-muted-foreground mx-auto mb-6 max-w-sm text-xs">
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
                <tr className="border-border bg-background text-muted-foreground border-b font-mono text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-4">PRD Title & Slug</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Visibility</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y text-sm">
                {prds.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary group transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white transition-colors group-hover:text-emerald-300">
                        {item.title}
                      </div>
                      <div className="text-muted-foreground mt-0.5 font-mono text-xs">
                        /{item.slug}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-medium text-emerald-300">
                        {item.stage || 'In Development'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-foreground flex items-center gap-1.5 font-mono text-xs capitalize">
                        {formatVisibilityIcon(item.visibility)}
                        <span>{item.visibility || 'unlisted'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="text-muted-foreground px-5 py-4 font-mono text-xs">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            if (item.status === 'published' && item.visibility === 'public') {
                              window.open(`/prds/${item.slug}`, '_blank');
                              return;
                            }
                            try {
                              const res = await api.post(`/prds/${item.id}/preview-token`);
                              if (res.data?.success && res.data.previewUrl) {
                                window.open(res.data.previewUrl, '_blank');
                              }
                            } catch (err) {
                              alert(
                                err?.response?.data?.error || 'Failed to generate preview token'
                              );
                            }
                          }}
                          className="text-muted-foreground hover:bg-secondary rounded-lg p-2 transition-colors hover:text-white"
                          title={
                            item.status === 'published' && item.visibility === 'public'
                              ? 'Preview PRD Spec'
                              : 'Preview Draft / Private PRD'
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={duplicatingId === item.id}
                          onClick={() => handleDuplicate(item)}
                          className="text-muted-foreground hover:bg-secondary rounded-lg p-2 transition-colors hover:text-emerald-400 disabled:opacity-30"
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
                          className="text-muted-foreground hover:bg-secondary rounded-lg p-2 transition-colors hover:text-emerald-400"
                          title="Edit PRD Spec"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => confirmDelete(item)}
                          className="text-muted-foreground hover:bg-secondary rounded-lg p-2 transition-colors hover:text-rose-400"
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
            ? `Are you sure you want to delete"${itemToDelete.title}"? All structured sections and downloadable PDF links will be removed permanently.`
            : 'Are you sure?'
        }
        confirmText="Delete Permanently"
        loading={deleting}
      />
    </div>
  );
};
