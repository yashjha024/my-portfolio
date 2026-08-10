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
  const [sectionsMode, setSectionsMode] = useState('canonical'); // 'canonical' | 'json' | 'custom_array'
  const [sectionsJsonInput, setSectionsJsonInput] = useState(
    '{\n"requirements": [],\n"goals": [],\n"nonGoals": [],\n"metrics": [],\n"releaseGates": []\n}'
  );
  const [jsonError, setJsonError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    stage: 'In Development',
    visibility: 'unlisted',
    status: 'draft',
    context: '',
    sections: {
      requirements: [],
      goals: [],
      nonGoals: [],
      metrics: [],
      releaseGates: [],
    },
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
        let loadedSections = item.sections;

        // Coerce to canonical object if it's missing or an array
        if (
          !loadedSections ||
          typeof loadedSections !== 'object' ||
          Array.isArray(loadedSections)
        ) {
          loadedSections = {
            requirements: [],
            goals: [],
            nonGoals: [],
            metrics: [],
            releaseGates: [],
          };
        } else {
          // Ensure keys exist
          loadedSections = {
            requirements: Array.isArray(loadedSections.requirements)
              ? loadedSections.requirements
              : [],
            goals: Array.isArray(loadedSections.goals) ? loadedSections.goals : [],
            nonGoals: Array.isArray(loadedSections.nonGoals) ? loadedSections.nonGoals : [],
            metrics: Array.isArray(loadedSections.metrics) ? loadedSections.metrics : [],
            releaseGates: Array.isArray(loadedSections.releaseGates)
              ? loadedSections.releaseGates
              : [],
            ...loadedSections,
          };
        }

        setFormData({
          title: item.title || '',
          slug: item.slug || '',
          stage: item.stage || 'In Development',
          visibility: item.visibility || 'unlisted',
          status: item.status || 'draft',
          context: item.context || '',
          sections: loadedSections,
          pdf_url: item.pdf_url || '',
          related_case_study_id: item.related_case_study_id || '',
        });
        setSectionsJsonInput(JSON.stringify(loadedSections, null, 2));
        setSectionsMode('canonical');
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
    setSectionsJsonInput(value);
    setAutosaveStatus('unsaved');
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        handleFieldChange('sections', parsed);
        setJsonError(null);
      } else {
        setJsonError('PRD sections must be a valid JSON object or array.');
      }
    } catch {
      setJsonError('Typing JSON... (Must be valid JSON before saving)');
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
        if (sectionsMode === 'json') {
          try {
            JSON.parse(sectionsJsonInput);
          } catch {
            return; // Don't autosave while JSON is malformed
          }
        }
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
  }, [formData, id, isNew, sectionsMode, sectionsJsonInput]);

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
    if (sectionsMode === 'json') {
      try {
        const parsed = JSON.parse(sectionsJsonInput);
        if (!parsed || typeof parsed !== 'object') {
          alert('PRD sections JSON must evaluate to a JSON object or array.');
          return false;
        }
      } catch {
        alert(
          'PRD sections contains JSON syntax errors. Please check your formatting before saving.'
        );
        return false;
      }
    }
    return true;
  };

  const handleSave = async (targetStatus = null) => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      const payload = { ...formData };
      if (sectionsMode === 'json') {
        payload.sections = JSON.parse(sectionsJsonInput);
      }
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
    if (!Array.isArray(formData.sections)) {
      setFormData((prev) => ({
        ...prev,
        sections: [
          {
            title: 'Section 1: Core Functional Requirements',
            content: '### Requirements Table\n- [ ] User can authenticate effortlessly...',
          },
        ],
      }));
      setSectionsMode('custom_array');
      setAutosaveStatus('unsaved');
      return;
    }
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
    if (!Array.isArray(formData.sections)) return;
    setFormData((prev) => {
      const list = [...prev.sections];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, sections: list };
    });
    setAutosaveStatus('unsaved');
  };

  const removeSection = (index) => {
    if (!Array.isArray(formData.sections)) return;
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
    setAutosaveStatus('unsaved');
  };

  const addCanonicalListItem = (key) => {
    const currentObj = Array.isArray(formData.sections) ? {} : { ...formData.sections };
    const currentList = Array.isArray(currentObj[key]) ? [...currentObj[key]] : [];
    currentList.push(
      key === 'metrics' ? { label: 'Metric Name', target: '+15%' } : 'New item specification'
    );
    currentObj[key] = currentList;
    setFormData((prev) => ({ ...prev, sections: currentObj }));
    setSectionsJsonInput(JSON.stringify(currentObj, null, 2));
    setAutosaveStatus('unsaved');
  };

  const updateCanonicalListItem = (key, idx, val) => {
    const currentObj = Array.isArray(formData.sections) ? {} : { ...formData.sections };
    const currentList = Array.isArray(currentObj[key]) ? [...currentObj[key]] : [];
    currentList[idx] = val;
    currentObj[key] = currentList;
    setFormData((prev) => ({ ...prev, sections: currentObj }));
    setSectionsJsonInput(JSON.stringify(currentObj, null, 2));
    setAutosaveStatus('unsaved');
  };

  const removeCanonicalListItem = (key, idx) => {
    const currentObj = Array.isArray(formData.sections) ? {} : { ...formData.sections };
    const currentList = Array.isArray(currentObj[key]) ? [...currentObj[key]] : [];
    currentList.splice(idx, 1);
    currentObj[key] = currentList;
    setFormData((prev) => ({ ...prev, sections: currentObj }));
    setSectionsJsonInput(JSON.stringify(currentObj, null, 2));
    setAutosaveStatus('unsaved');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-muted-foreground font-mono text-xs uppercase">
          Loading PRD Editor...
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
            to="/admin/prds"
            className="text-muted-foreground hover:bg-secondary rounded-xl p-2 transition-colors hover:text-white"
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
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
              Slug: <span className="text-emerald-400">/{formData.slug || 'untitled'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formData.slug && (
            <button
              type="button"
              onClick={async () => {
                if (formData.status === 'published' && formData.visibility === 'public') {
                  window.open(`/prds/${formData.slug}`, '_blank');
                  return;
                }
                if (!id) {
                  alert('Please save the draft before previewing.');
                  return;
                }
                try {
                  const res = await api.post(`/prds/${id}/preview-token`);
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
              <span>
                {formData.status === 'published' && formData.visibility === 'public'
                  ? 'Preview'
                  : 'Preview Draft'}
              </span>
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
            className="shadow-soft flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
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
          <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                PRD Document Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WhatsApp Group Event Coordinator PRD v1.2"
                value={formData.title}
                onChange={handleTitleChange}
                className="border-border bg-background w-full rounded-xl border px-4 py-2.5 text-base font-bold text-white focus:border-emerald-500 focus:outline-none"
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
            <div className="border-border bg-card flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                  Structured Specification Sections
                </h3>
                <p className="text-muted-foreground text-xs">
                  Switch between Canonical Lists, Custom Sections Array, or Raw JSON Spec Editor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSectionsMode('canonical')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    sectionsMode === 'canonical'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-secondary text-foreground hover:bg-secondary'
                  }`}
                >
                  Canonical Lists
                </button>
                <button
                  type="button"
                  onClick={() => setSectionsMode('custom_array')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    sectionsMode === 'custom_array'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-secondary text-foreground hover:bg-secondary'
                  }`}
                >
                  Custom Array
                </button>
                <button
                  type="button"
                  onClick={() => setSectionsMode('json')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    sectionsMode === 'json'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-secondary text-foreground hover:bg-secondary'
                  }`}
                >
                  Raw JSON
                </button>
              </div>
            </div>

            {sectionsMode === 'canonical' && (
              <div className="border-border bg-card space-y-6 rounded-2xl border p-6">
                {['requirements', 'goals', 'nonGoals', 'releaseGates'].map((key) => {
                  const items = Array.isArray(formData.sections?.[key])
                    ? formData.sections[key]
                    : [];
                  return (
                    <div
                      key={key}
                      className="border-border space-y-3 border-b pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <label className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                          {key === 'nonGoals'
                            ? 'Explicit Non-Goals'
                            : key === 'releaseGates'
                              ? 'Release Gates & Quality Checklists'
                              : key}
                        </label>
                        <button
                          type="button"
                          onClick={() => addCanonicalListItem(key)}
                          className="bg-secondary hover:bg-secondary flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-emerald-300"
                        >
                          <Plus className="h-3 w-3" /> Add {key} item
                        </button>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-muted-foreground text-xs italic">No {key} added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((itemVal, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={
                                  typeof itemVal === 'string' ? itemVal : JSON.stringify(itemVal)
                                }
                                onChange={(e) => updateCanonicalListItem(key, idx, e.target.value)}
                                className="border-border bg-background flex-1 rounded-xl border px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeCanonicalListItem(key, idx)}
                                className="text-muted-foreground hover:bg-background rounded-lg p-2 hover:text-rose-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {sectionsMode === 'custom_array' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addSection}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Custom Section</span>
                  </button>
                </div>
                {Array.isArray(formData.sections) && formData.sections.length > 0 ? (
                  formData.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="border-border bg-card space-y-3 rounded-2xl border p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder="Section Title e.g. 1. Functional Requirements Table"
                          value={sec.title || ''}
                          onChange={(e) => updateSection(idx, 'title', e.target.value)}
                          className="border-border bg-background flex-1 rounded-xl border px-4 py-2 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="text-muted-foreground hover:bg-background rounded-xl p-2 transition-colors hover:text-rose-400"
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
                ) : (
                  <div className="border-border bg-card text-muted-foreground rounded-2xl border border-dashed p-12 text-center font-mono text-sm">
                    No custom specification sections added yet. Click &quot;Add Custom Section&quot;
                    to begin.
                  </div>
                )}
              </div>
            )}

            {sectionsMode === 'json' && (
              <div className="space-y-2">
                <textarea
                  rows={18}
                  value={sectionsJsonInput}
                  onChange={(event) => handleSectionsJsonChange(event.target.value)}
                  className="border-border bg-background w-full rounded-2xl border p-4 font-mono text-xs leading-relaxed text-white focus:border-emerald-500 focus:outline-none"
                  aria-label="Structured PRD sections as JSON"
                />
                {jsonError ? (
                  <p className="font-mono text-xs text-amber-400">{jsonError}</p>
                ) : (
                  <p className="font-mono text-xs text-emerald-400">Valid JSON object.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Configuration Column */}
        <div className="space-y-6">
          <div className="border-border bg-card space-y-5 rounded-2xl border p-6">
            <h3 className="border-border text-foreground border-b pb-2 font-mono text-sm uppercase tracking-wider">
              PRD Metadata & Lifecycle
            </h3>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Development Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => handleFieldChange('stage', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="In Development">In Development</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Shipped">Shipped / Launched</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Access Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => handleFieldChange('visibility', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="public">Public (Indexed & Searchable)</option>
                <option value="unlisted">Unlisted (Accessible via direct link)</option>
                <option value="private">Private (Admin & Authenticated team only)</option>
              </select>
              <p className="text-muted-foreground mt-1 text-[10px]">
                {formData.visibility === 'public' &&
                  'Visible on the public PRD library index page.'}
                {formData.visibility === 'unlisted' &&
                  'Not listed on public page, but link works for interviewers.'}
                {formData.visibility === 'private' && 'Requires admin login to access or view.'}
              </p>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Publish Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
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
                className="border-border bg-background w-full rounded-xl border px-3 py-2 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PDF Download Attachment */}
          <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
            <h3 className="border-border text-foreground border-b pb-2 font-mono text-sm uppercase tracking-wider">
              PDF Spec Download URL
            </h3>
            <p className="text-muted-foreground text-xs">
              Attach a downloadable PDF or Notion export for interviewers per PRD Section 5.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://..."
                value={formData.pdf_url}
                onChange={(e) => handleFieldChange('pdf_url', e.target.value)}
                className="border-border bg-background flex-1 rounded-xl border px-3 py-2 font-mono text-xs text-white"
              />
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
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
