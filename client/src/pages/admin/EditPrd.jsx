import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { AutosaveIndicator } from '../../components/admin/AutosaveIndicator.jsx';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal.jsx';
import { MarkdownEditor } from '../../components/admin/MarkdownEditor.jsx';
import {
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  UploadCloud,
  Loader2,
} from 'lucide-react';

export const EditPrdPage = () => {
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
    stage: 'In Development',
    visibility: 'unlisted',
    status: 'draft',
    context: '',
    sections: {},
    pdf_url: '',
    related_case_study_id: '',
  });

  const initialMount = useRef(true);
  const autosaveTimeout = useRef(null);

  const fetchPrd = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/prds/${id}?admin=true`).catch(async () => {
        const allRes = await api.get('/admin/prds?limit=100');
        const match = (allRes.data?.data || []).find((p) => p.id === id || p.slug === id);
        if (match) return { data: { success: true, data: match } };
        throw new Error('PRD not found');
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setFormData({
          title: item.title || '',
          slug: item.slug || '',
          stage: item.stage || 'In Development',
          visibility: item.visibility || 'unlisted',
          status: item.status || 'draft',
          context: item.context || '',
          sections: item.sections && typeof item.sections === 'object' ? item.sections : {},
          pdf_url: item.pdf_url || '',
          related_case_study_id: item.related_case_study_id || '',
        });
        setLastSavedAt(item.updated_at || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch PRD:', err);
      setError('Could not load PRD spec details.');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchPrd();
  }, [fetchPrd]);

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

  const handleSectionsJsonChange = (value) => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        handleFieldChange('sections', parsed);
        setError(null);
      } else {
        setError('PRD sections must be a JSON object.');
      }
    } catch (_error) {
      setError('PRD sections must contain valid JSON before saving.');
    }
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
        await api.put(`/admin/prds/${id}`, formData);
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
      alert('PRD Title must be at least 3 characters long.');
      return false;
    }
    if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
      alert('Slug must contain only lowercase letters, numbers, and hyphens.');
      return false;
    }
    if (!formData.context || formData.context.trim().length < 15) {
      alert('Please provide at least 15 characters of background overview context.');
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

      let res;
      if (isNew) {
        res = await api.post('/admin/prds', payload);
      } else {
        res = await api.put(`/admin/prds/${id}`, payload);
      }

      if (res.data?.success) {
        setAutosaveStatus('saved');
        setLastSavedAt(new Date().toISOString());
        if (isNew && res.data.data?.id) {
          navigate(`/admin/prds/edit/${res.data.data.id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err?.response?.data?.error || 'Failed to save PRD specification.');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    if (!Array.isArray(formData.sections)) return;
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: `Section ${prev.sections.length + 1}: Core Functional Requirements`,
          content:
            '### Requirements Table\n- [ ] User can authenticate effortlessly\n- [ ] System handles high concurrent throughput...',
        },
      ],
    }));
    setAutosaveStatus('unsaved');
  };

  const updateSection = (index, field, value) => {
    setFormData((prev) => {
      const list = [...prev.sections];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, sections: list };
    });
    setAutosaveStatus('unsaved');
  };

  const removeSection = (index) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
    setAutosaveStatus('unsaved');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="font-mono text-xs uppercase text-slate-400">Loading PRD Editor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="sticky top-2 z-20 flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/prds"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {isNew ? 'Create PRD Spec' : formData.title || 'Edit PRD Spec'}
              </h1>
              {!isNew && <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />}
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              Slug: <span className="text-emerald-400">/{formData.slug || 'untitled'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formData.slug && formData.status === 'published' && (
            <a
              href={`/prds/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </a>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>Publish Spec</span>
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
        {/* Main Sections Column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                PRD Document Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WhatsApp Group Event Coordinator PRD v1.2"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-base font-bold text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <MarkdownEditor
                label="Background Context & Strategic Overview"
                required={true}
                value={formData.context}
                onChange={(val) => handleFieldChange('context', val)}
                onSave={() => handleSave('draft')}
                autosaveStatus={autosaveStatus}
                lastSavedAt={lastSavedAt}
                minHeight="320px"
              />
            </div>
          </div>

          {/* Dynamic Structured Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                  Structured Specification Sections
                </h3>
                <p className="text-xs text-slate-400">
                  Add distinct modules (e.g. Goals, Target KPIs, User Flow, Edge Cases,
                  Out-of-Scope).
                </p>
              </div>
              <button
                type="button"
                onClick={addSection}
                disabled={!Array.isArray(formData.sections)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                <span>Add Section</span>
              </button>
            </div>

            {Array.isArray(formData.sections) ? (
              formData.sections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-12 text-center font-mono text-sm text-slate-500">
                  No custom specification sections added yet. Click &quot;Add Section&quot; to begin
                  structuring your requirements.
                </div>
              ) : (
                formData.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Section Title e.g. 1. Functional Requirements Table"
                        value={sec.title || ''}
                        onChange={(e) => updateSection(idx, 'title', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-950 hover:text-rose-400"
                        title="Remove Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <MarkdownEditor
                      value={sec.content || ''}
                      onChange={(val) => updateSection(idx, 'content', val)}
                      onSave={() => handleSave('draft')}
                      autosaveStatus={autosaveStatus}
                      lastSavedAt={lastSavedAt}
                      minHeight="240px"
                      placeholder="Write specification section markdown content..."
                    />
                  </div>
                ))
              )
            ) : (
              <textarea
                rows={18}
                value={JSON.stringify(formData.sections, null, 2)}
                onChange={(event) => handleSectionsJsonChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-white focus:border-emerald-500 focus:outline-none"
                aria-label="Structured PRD sections as JSON"
              />
            )}
          </div>
        </div>

        {/* Sidebar Configuration Column */}
        <div className="space-y-6">
          <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="border-b border-slate-800 pb-2 font-mono text-sm uppercase tracking-wider text-slate-300">
              PRD Metadata & Lifecycle
            </h3>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Development Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => handleFieldChange('stage', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="In Development">In Development</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Shipped">Shipped / Launched</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Access Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => handleFieldChange('visibility', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="public">Public (Indexed & Searchable)</option>
                <option value="unlisted">Unlisted (Accessible via direct link)</option>
                <option value="private">Private (Admin & Authenticated team only)</option>
              </select>
              <p className="mt-1 text-[10px] text-slate-500">
                {formData.visibility === 'public' &&
                  'Visible on the public PRD library index page.'}
                {formData.visibility === 'unlisted' &&
                  'Not listed on public page, but link works for interviewers.'}
                {formData.visibility === 'private' && 'Requires admin login to access or view.'}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Publish Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                URL Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PDF Download Attachment */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="border-b border-slate-800 pb-2 font-mono text-sm uppercase tracking-wider text-slate-300">
              PDF Spec Download URL
            </h3>
            <p className="text-xs text-slate-400">
              Attach a downloadable PDF or Notion export for interviewers per PRD Section 5.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://..."
                value={formData.pdf_url}
                onChange={(e) => handleFieldChange('pdf_url', e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
              />
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pick</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => handleFieldChange('pdf_url', url)}
        allowedTypes="pdf"
      />
    </div>
  );
};
