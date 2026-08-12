import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { AutosaveIndicator } from '../../components/admin/AutosaveIndicator.jsx';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal.jsx';
import { MarkdownEditor } from '../../components/admin/MarkdownEditor.jsx';
import { Save, Eye, ArrowLeft, Plus, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';

export const EditThinkingPage = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('saved');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'feature_proposal',
    status: 'draft',
    excerpt: '',
    body: '',
    cover_image: '',
    tags: [],
    reading_time: '6 min read',
    disclaimer:
      'Independent product concept — not affiliated with or endorsed by any brand mentioned.',
    related_work: [], // array of { title, url }
  });

  const [tagsInput, setTagsInput] = useState('');
  const initialMount = useRef(true);
  const autosaveTimeout = useRef(null);

  const fetchArticle = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/thinking/${id}`).catch(async () => {
        return api.get(`/thinking/${id}`);
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setFormData({
          title: item.title || '',
          slug: item.slug || '',
          type: item.type || 'feature_proposal',
          status: item.status || 'draft',
          excerpt: item.excerpt || '',
          body: item.body || '',
          cover_image: item.cover_image || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          reading_time: item.reading_time || '6 min read',
          disclaimer: item.disclaimer || '',
          related_work: Array.isArray(item.related_work) ? item.related_work : [],
        });
        setTagsInput((item.tags || []).join(', '));
        setLastSavedAt(item.updated_at || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch article:', err);
      setError('Could not load article details.');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, title: val };
      if (isNew || !prev.slug) {
        next.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
    setAutosaveStatus('unsaved');
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAutosaveStatus('unsaved');
  };

  // Debounced Autosave
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (isNew || formData.status !== 'draft') return;

    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);

    autosaveTimeout.current = setTimeout(async () => {
      try {
        setAutosaveStatus('saving');
        await api.put(`/admin/thinking/${id}`, formData);
        setAutosaveStatus('saved');
        setLastSavedAt(new Date().toISOString());
      } catch (err) {
        console.error('Autosave failed:', err);
        setAutosaveStatus('error');
      }
    }, 3000);

    return () => clearTimeout(autosaveTimeout.current);
  }, [formData, id, isNew]);

  const validateForm = () => {
    if (!formData.title || formData.title.trim().length < 3) {
      alert('Title must be at least 3 characters long.');
      return false;
    }
    if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
      alert('Slug must contain only lowercase letters, numbers, and hyphens.');
      return false;
    }
    if (!formData.excerpt || formData.excerpt.trim().length < 10) {
      alert('Excerpt must be at least 10 characters.');
      return false;
    }
    if (!formData.body || formData.body.trim().length < 20) {
      alert('Body content must be at least 20 characters.');
      return false;
    }
    return true;
  };

  const handleSave = async (targetStatus = null) => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      const payload = { ...formData };
      if (targetStatus) payload.status = targetStatus;

      if (typeof tagsInput === 'string') {
        payload.tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }

      let res;
      if (isNew) {
        res = await api.post('/admin/thinking', payload);
      } else {
        res = await api.put(`/admin/thinking/${id}`, payload);
      }

      if (res.data?.success) {
        setAutosaveStatus('saved');
        setLastSavedAt(new Date().toISOString());
        if (isNew && res.data.data?.id) {
          navigate(`/admin/thinking/edit/${res.data.data.id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err?.response?.data?.error || 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const addRelatedWork = () => {
    setFormData((prev) => ({
      ...prev,
      related_work: [
        ...prev.related_work,
        { title: 'Related Case Study', url: '/work/case-study-slug' },
      ],
    }));
    setAutosaveStatus('unsaved');
  };

  const updateRelatedWork = (index, field, value) => {
    setFormData((prev) => {
      const list = [...prev.related_work];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, related_work: list };
    });
    setAutosaveStatus('unsaved');
  };

  const removeRelatedWork = (index) => {
    setFormData((prev) => ({
      ...prev,
      related_work: prev.related_work.filter((_, i) => i !== index),
    }));
    setAutosaveStatus('unsaved');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <span className="text-muted-foreground font-mono text-xs uppercase">
          Loading Article Editor...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="border-border bg-card shadow-soft sticky top-2 z-20 flex flex-col justify-between gap-4 rounded-2xl border p-5 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/thinking"
            className="text-muted-foreground hover:bg-secondary rounded-xl p-2 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {isNew ? 'Write New Article' : formData.title || 'Edit Article'}
              </h1>
              {!isNew && <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />}
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
              Slug: <span className="text-violet-400">/{formData.slug || 'untitled'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formData.slug && (
            <button
              type="button"
              onClick={async () => {
                if (formData.status === 'published') {
                  window.open(`/thinking/${formData.slug}`, '_blank');
                  return;
                }
                if (!id) {
                  alert('Please save the draft before previewing.');
                  return;
                }
                try {
                  const res = await api.post(`/thinking/${id}/preview-token`);
                  if (res.data?.success && res.data.previewUrl) {
                    window.open(res.data.previewUrl, '_blank');
                  }
                } catch (err) {
                  alert(err?.response?.data?.error || 'Failed to generate preview token');
                }
              }}
              className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{formData.status === 'published' ? 'Preview' : 'Preview Draft'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="shadow-soft flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-violet-600/20 transition-all hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Body Column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Article Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Improving WhatsApp Group Event Coordination"
                value={formData.title}
                onChange={handleTitleChange}
                className="border-border bg-background w-full rounded-xl border px-4 py-2.5 text-base font-bold text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Excerpt / Elevator Summary (140-300 chars) <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Summarize the core problem observed, target users, and proposed feature..."
                value={formData.excerpt}
                onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                className="border-border bg-background w-full rounded-xl border p-4 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <MarkdownEditor
                label="Full Markdown Body Content"
                required={true}
                value={formData.body}
                onChange={(val) => handleFieldChange('body', val)}
                onSave={() => handleSave('draft')}
                autosaveStatus={autosaveStatus}
                lastSavedAt={lastSavedAt}
                minHeight="520px"
              />
            </div>
          </div>

          {/* Related Work Strip */}
          <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                Related Work & References
              </h3>
              <button
                type="button"
                onClick={addRelatedWork}
                className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Reference</span>
              </button>
            </div>

            {formData.related_work.length === 0 ? (
              <p className="text-muted-foreground font-mono text-xs italic">
                No related portfolio references added.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.related_work.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-border bg-background flex items-center gap-3 rounded-xl border p-3"
                  >
                    <input
                      type="text"
                      placeholder="Title e.g. Flagship Project"
                      value={item.title || ''}
                      onChange={(e) => updateRelatedWork(idx, 'title', e.target.value)}
                      className="border-border bg-card flex-1 rounded-lg border px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="URL e.g. /work/flagship-project"
                      value={item.url || ''}
                      onChange={(e) => updateRelatedWork(idx, 'url', e.target.value)}
                      className="border-border bg-card flex-1 rounded-lg border px-3 py-1.5 font-mono text-xs text-violet-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeRelatedWork(idx)}
                      className="text-muted-foreground rounded-lg p-1.5 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Configuration Column */}
        <div className="space-y-6">
          <div className="border-border bg-card space-y-5 rounded-2xl border p-6">
            <h3 className="border-border text-foreground border-b pb-2 font-mono text-sm uppercase tracking-wider">
              Article Configuration
            </h3>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Article Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="teardown">Product Teardown</option>
                <option value="feature_proposal">Feature Proposal</option>
                <option value="essay">Product Strategy Essay</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Publish Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                URL Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2 font-mono text-xs text-violet-300 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Estimated Reading Time
              </label>
              <input
                type="text"
                value={formData.reading_time}
                onChange={(e) => handleFieldChange('reading_time', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2 font-mono text-xs text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Topics & Tags
              </label>
              <input
                type="text"
                placeholder="UX, Onboarding, Messaging, Metrics"
                value={tagsInput}
                onChange={(e) => {
                  setTagsInput(e.target.value);
                  setAutosaveStatus('unsaved');
                }}
                className="border-border bg-background w-full rounded-xl border px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-[10px]">
                Comma-separated tags for public index filters.
              </p>
            </div>
          </div>

          {/* Cover & Brand Disclaimer */}
          <div className="border-border bg-card space-y-5 rounded-2xl border p-6">
            <h3 className="border-border text-foreground border-b pb-2 font-mono text-sm uppercase tracking-wider">
              Media & Disclaimer
            </h3>

            <div>
              <label className="text-muted-foreground mb-2 block font-mono text-xs uppercase">
                Cover Image URL
              </label>
              {formData.cover_image && (
                <div className="border-border group relative mb-2 h-32 w-full overflow-hidden rounded-xl border">
                  <img
                    src={formData.cover_image}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('cover_image', '')}
                    className="bg-background absolute inset-0 flex items-center justify-center gap-1 text-xs font-medium text-rose-400 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.cover_image}
                  onChange={(e) => handleFieldChange('cover_image', e.target.value)}
                  className="border-border bg-background flex-1 rounded-xl border px-3 py-1.5 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="bg-secondary text-foreground hover:bg-secondary rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  Pick
                </button>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Brand & Legal Disclaimer
              </label>
              <textarea
                rows={3}
                value={formData.disclaimer}
                onChange={(e) => handleFieldChange('disclaimer', e.target.value)}
                className="border-border bg-background text-muted-foreground w-full rounded-xl border p-3 font-mono text-xs leading-relaxed focus:border-violet-500 focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-[10px]">
                Required per PRD Section 5 for all independent concepts mentioning real trademarks.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => handleFieldChange('cover_image', url)}
        allowedTypes="image"
      />
    </div>
  );
};
