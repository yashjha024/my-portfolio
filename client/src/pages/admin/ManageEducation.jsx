import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/admin/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog.jsx';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';

export const ManageEducationPage = () => {
  const [educations, setEducations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    location: '',
    start_date: '',
    end_date: 'Present',
    is_present: false,
    gpa: '',
    description: '',
    sort_order: 0,
    status: 'published',
  });

  const fetchEducations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/admin/educations?${params.toString()}`);
      if (res.data?.success) {
        setEducations(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching educations:', err);
      setError('Failed to load education records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEducations();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      institution: '',
      degree: '',
      field_of_study: '',
      location: '',
      start_date: '',
      end_date: 'Present',
      is_present: true,
      gpa: '',
      description: '',
      sort_order: educations.length + 1,
      status: 'published',
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      institution: item.institution || '',
      degree: item.degree || '',
      field_of_study: item.field_of_study || '',
      location: item.location || '',
      start_date: item.start_date || '',
      end_date: item.end_date || 'Present',
      is_present: Boolean(item.is_present || item.end_date === 'Present'),
      gpa: item.gpa || '',
      description: item.description || '',
      sort_order: item.sort_order || 0,
      status: item.status || 'published',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.institution.trim() || !formData.degree.trim()) {
      alert('Institution and Degree are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        const res = await api.put(`/admin/educations/${editingItem.id}`, formData);
        if (res.data?.success) {
          setEducations((prev) =>
            prev.map((ed) => (ed.id === editingItem.id ? res.data.data : ed))
          );
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/admin/educations', formData);
        if (res.data?.success) {
          setEducations((prev) => [res.data.data, ...prev]);
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving education:', err);
      alert(err.response?.data?.error || 'Failed to save education record.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.put(`/admin/educations/${item.id}`, { status: newStatus });
      if (res.data?.success) {
        setEducations((prev) =>
          prev.map((ed) => (ed.id === item.id ? { ...ed, status: newStatus } : ed))
        );
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Failed to update status.');
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
      const res = await api.delete(`/admin/educations/${itemToDelete.id}`);
      if (res.data?.success) {
        setEducations((prev) => prev.filter((ed) => ed.id !== itemToDelete.id));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete education record.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-border bg-card flex flex-col justify-between gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="border-primary/40 text-primary rounded-xl border bg-indigo-500/10 p-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Education CMS</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage academic background, degrees, field of study, and GPAs shown on your public
              /about page ({educations.length} total).
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary shadow-soft shadow-subtle hover:bg-primary/90 flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Education</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="border-border bg-card flex flex-col items-center justify-between gap-4 rounded-2xl border p-4 md:flex-row">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="text-muted-foreground absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by institution, degree, or field..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-background placeholder:text-muted-foreground focus:border-primary/40 w-full rounded-xl border py-2 pl-10 pr-4 text-sm text-[#171717] transition-colors focus:outline-none"
          />
        </form>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground font-mono text-xs uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-border bg-background focus:border-primary/40 rounded-xl border px-3 py-1.5 text-xs font-medium text-[#171717] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <button
            onClick={() => fetchEducations()}
            className="bg-secondary text-foreground hover:bg-secondary rounded-xl p-2 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="border-border bg-card shadow-soft overflow-hidden rounded-2xl border">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <span className="text-muted-foreground font-mono text-xs uppercase">
              Loading education records...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
            <p className="font-medium text-rose-600">{error}</p>
            <button
              onClick={fetchEducations}
              className="bg-secondary text-foreground hover:bg-secondary mt-4 rounded-xl px-4 py-2 font-mono text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : educations.length === 0 ? (
          <div className="p-16 text-center">
            <GraduationCap className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
            <h3 className="mb-1 text-base font-bold text-[#171717]">No Education Records Found</h3>
            <p className="text-muted-foreground mx-auto mb-6 max-w-sm text-xs">
              Add your first education record to display on your About page timeline.
            </p>
            <button
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Education</span>
            </button>
          </div>
        ) : (
          <div className="divide-border divide-y">
            {educations.map((item) => (
              <div
                key={item.id}
                className="hover:bg-secondary/40 flex flex-col justify-between gap-4 p-5 transition-colors sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="border-border bg-secondary/80 text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-bold">
                    <Building className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#171717]">{item.degree}</h3>
                      <span className="text-muted-foreground text-xs">— {item.institution}</span>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 font-mono text-xs">
                      {item.start_date || item.end_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.start_date && `${item.start_date} – `}
                          {item.is_present ? 'Present' : item.end_date}
                        </span>
                      ) : null}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                      {item.gpa && <span className="flex items-center gap-1">GPA: {item.gpa}</span>}
                      <span className="border-border bg-background rounded border px-1.5 py-0.5 text-[10px]">
                        Order #{item.sort_order}
                      </span>
                    </div>

                    {item.field_of_study && (
                      <p className="text-sm font-medium text-[#171717]">{item.field_of_study}</p>
                    )}

                    {item.description && (
                      <p className="text-muted-foreground line-clamp-2 max-w-2xl text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => toggleStatus(item)}
                    className="border-border bg-background hover:bg-secondary rounded-lg border px-3 py-1.5 font-mono text-xs font-medium text-[#171717] transition-colors"
                  >
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-muted-foreground hover:bg-secondary rounded-lg p-2 transition-colors hover:text-indigo-600"
                    title="Edit Record"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(item)}
                    className="text-muted-foreground hover:bg-secondary rounded-lg p-2 transition-colors hover:text-rose-600"
                    title="Delete Permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="border-border bg-card shadow-soft max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-[#171717]">
                {editingItem ? 'Edit Education Record' : 'Add New Education'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NIT Patna"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    Degree *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.field_of_study}
                    onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patna, BR"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    Start Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aug 2022"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-muted-foreground block font-mono text-xs uppercase">
                      End Date
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.is_present}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_present: e.target.checked,
                            end_date: e.target.checked ? 'Present' : '',
                          })
                        }
                        className="border-border rounded"
                      />
                      <span className="font-mono text-xs text-[#171717]">Presently Enrolled</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={formData.is_present}
                    placeholder={formData.is_present ? 'Present' : 'e.g. June 2026'}
                    value={formData.is_present ? 'Present' : formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    GPA / Grade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5/10"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: Number(e.target.value) })
                    }
                    className="border-border bg-background w-full rounded-xl border px-3.5 py-2 text-sm text-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                  Description / Activities
                </label>
                <textarea
                  rows={3}
                  placeholder="Coursework, societies, achievements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-border bg-background w-full rounded-xl border p-3 text-sm leading-relaxed text-[#171717] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground font-mono text-xs uppercase">
                    Status:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="border-border bg-background rounded-xl border px-3 py-1.5 text-xs font-medium text-[#171717]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bg-secondary border-border text-foreground hover:bg-secondary rounded-xl border px-4 py-2 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Save Education</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Education Record"
        description={
          itemToDelete
            ? `Are you sure you want to delete "${itemToDelete.degree} at ${itemToDelete.institution}"? This action cannot be undone.`
            : 'Are you sure?'
        }
        confirmText="Delete Permanently"
        loading={deleting}
      />
    </div>
  );
};
