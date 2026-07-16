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
  Image as ImageIcon,
  Loader2,
  UploadCloud,
} from 'lucide-react';

export const EditWorkPage = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('saved'); // saved, saving, unsaved, error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('core'); // core, narrative, metrics, links, seo
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    type: 'product_case_study',
    status: 'draft',
    featured: false,
    sort_order: 0,
    role: '',
    timeline: '',
    team: '',
    domain: '',
    problem: '',
    approach: '',
    outcome: '',
    metrics: [], // array of { label, value, qualifier }
    tools: [], // array of strings
    tags: [], // array of strings
    cover_image: '',
    gallery: [],
    live_url: '',
    repo_url: '',
    prototype_url: '',
    prd_url: '',
    seo_title: '',
    seo_description: '',
  });

  const [toolsInput, setToolsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const initialMount = useRef(true);
  const autosaveTimeout = useRef(null);

  const fetchCaseStudy = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/work/${id}?admin=true`).catch(async () => {
        // Fallback if ID is slug or admin lookup required
        const allRes = await api.get('/admin/work?limit=100');
        const match = (allRes.data?.data || []).find((c) => c.id === id || c.slug === id);
        if (match) return { data: { success: true, data: match } };
        throw new Error('Case study not found');
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setFormData({
          title: item.title || '',
          slug: item.slug || '',
          summary: item.summary || '',
          type: item.type || 'product_case_study',
          status: item.status || 'draft',
          featured: Boolean(item.featured),
          sort_order: Number(item.sort_order || 0),
          role: item.role || '',
          timeline: item.timeline || '',
          team: item.team || '',
          domain: item.domain || '',
          problem: item.problem || '',
          approach: item.approach || '',
          outcome: item.outcome || '',
          metrics: Array.isArray(item.metrics) ? item.metrics : [],
          tools: Array.isArray(item.tools) ? item.tools : [],
          tags: Array.isArray(item.tags) ? item.tags : [],
          cover_image: item.cover_image || '',
          gallery: Array.isArray(item.gallery) ? item.gallery : [],
          live_url: item.live_url || '',
          repo_url: item.repo_url || '',
          prototype_url: item.prototype_url || '',
          prd_url: item.prd_url || '',
          seo_title: item.seo_title || '',
          seo_description: item.seo_description || '',
        });
        setToolsInput((item.tools || []).join(', '));
        setTagsInput((item.tags || []).join(', '));
        setLastSavedAt(item.updated_at || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch case study:', err);
      setError('Could not load case study details.');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchCaseStudy();
  }, [fetchCaseStudy]);

  // Handle auto-slug generation on title change if slug is empty or in new state
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

  // Debounced Autosave for existing items in draft status
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
        await api.put(`/admin/work/${id}`, formData);
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
    if (!formData.summary || formData.summary.trim().length < 10) {
      alert('Summary must be at least 10 characters (elevator pitch).');
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
      if (targetStatus) {
        payload.status = targetStatus;
      }

      // Convert comma-separated string tools and tags if user typed
      if (typeof toolsInput === 'string') {
        payload.tools = toolsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (typeof tagsInput === 'string') {
        payload.tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }

      let res;
      if (isNew) {
        res = await api.post('/admin/work', payload);
      } else {
        res = await api.put(`/admin/work/${id}`, payload);
      }

      if (res.data?.success) {
        setAutosaveStatus('saved');
        setLastSavedAt(new Date().toISOString());
        if (isNew && res.data.data?.id) {
          navigate(`/admin/work/edit/${res.data.data.id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err?.response?.data?.error || 'Failed to save case study.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics dynamic operations
  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, { label: 'New Metric', value: '+0%', qualifier: 'actual' }],
    }));
    setAutosaveStatus('unsaved');
  };

  const updateMetric = (index, field, value) => {
    setFormData((prev) => {
      const nextMetrics = [...prev.metrics];
      nextMetrics[index] = { ...nextMetrics[index], [field]: value };
      return { ...prev, metrics: nextMetrics };
    });
    setAutosaveStatus('unsaved');
  };

  const removeMetric = (index) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
    setAutosaveStatus('unsaved');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="font-mono text-xs uppercase text-slate-400">
          Loading Case Study Editor...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar with Back, Title & Actions */}
      <div className="sticky top-2 z-20 flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/work"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {isNew ? 'Create Case Study' : formData.title || 'Edit Case Study'}
              </h1>
              {!isNew && <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />}
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              Slug: <span className="text-indigo-400">/{formData.slug || 'untitled'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formData.slug && formData.status === 'published' && (
            <a
              href={`/work/${formData.slug}`}
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
            <span>Publish Now</span>
          </button>

          {formData.status !== 'archived' && !isNew && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('archived')}
              className="rounded-xl border border-transparent bg-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800">
        {[
          { id: 'core', label: '1. Core Metadata' },
          { id: 'narrative', label: '2. Problem & Approach' },
          { id: 'metrics', label: `3. Evidence & Metrics (${formData.metrics.length})` },
          { id: 'links', label: '4. Tools, Tags & Links' },
          { id: 'seo', label: '5. Media & SEO' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 font-mono text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'border-indigo-500 bg-indigo-500/5 text-white'
                : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Core Metadata */}
      {activeTab === 'core' && (
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="border-b border-slate-800 pb-2 font-mono text-sm uppercase tracking-wider text-slate-400">
            Primary Case Study Identification & Role Split
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Case Study Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WhatsApp Group Event Coordinator"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                URL Slug <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="whatsapp-group-event-coordinator"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
              Elevator Pitch Summary (140-180 chars) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Concise 1-2 sentence problem overview and specific business/user outcome..."
              value={formData.summary}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="shipped_project">Shipped Project</option>
                <option value="product_case_study">Product Case Study</option>
                <option value="program_case_study">Program Case Study</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Sort Order Priority
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleFieldChange('sort_order', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleFieldChange('featured', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span>Featured on Home Page</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                My Role
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Product Manager"
                value={formData.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Timeline / Duration
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 2025 - 4 Months"
                value={formData.timeline}
                onChange={(e) => handleFieldChange('timeline', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Team & Collaborators
              </label>
              <input
                type="text"
                placeholder="e.g. 4 Engineers, 1 Product Designer"
                value={formData.team}
                onChange={(e) => handleFieldChange('team', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Domain
              </label>
              <input
                type="text"
                placeholder="e.g. Messaging & Social, Fintech"
                value={formData.domain}
                onChange={(e) => handleFieldChange('domain', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Problem & Approach Narrative */}
      {activeTab === 'narrative' && (
        <div className="space-y-6">
          <div>
            <MarkdownEditor
              label="The Opportunity & Problem Framing (State clearly: How might we...)"
              required={true}
              value={formData.problem}
              onChange={(val) => handleFieldChange('problem', val)}
              onSave={() => handleSave('draft')}
              autosaveStatus={autosaveStatus}
              lastSavedAt={lastSavedAt}
              minHeight="320px"
              placeholder="### Observed Problem&#10;Users currently experience heavy notification fatigue..."
            />
          </div>

          <div>
            <MarkdownEditor
              label="My Role, Constraints & Decision Trade-offs"
              required={true}
              value={formData.approach}
              onChange={(val) => handleFieldChange('approach', val)}
              onSave={() => handleSave('draft')}
              autosaveStatus={autosaveStatus}
              lastSavedAt={lastSavedAt}
              minHeight="320px"
              placeholder="### Option A vs Option B&#10;We evaluated building an in-chat bot versus a dedicated event modal..."
            />
          </div>

          <div>
            <MarkdownEditor
              label="Outcome, Delivery Metrics & Learnings"
              required={true}
              value={formData.outcome}
              onChange={(val) => handleFieldChange('outcome', val)}
              onSave={() => handleSave('draft')}
              autosaveStatus={autosaveStatus}
              lastSavedAt={lastSavedAt}
              minHeight="320px"
              placeholder="### Key Takeaways&#10;1. Reducing friction by 2 taps improved conversion by 18%..."
            />
          </div>
        </div>
      )}

      {/* Tab 3: Evidence & Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                Quantitative Evidence Strip
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Add structured quantitative highlights shown prominently on the case study card and
                detail page.
              </p>
            </div>
            <button
              type="button"
              onClick={addMetric}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Add Metric</span>
            </button>
          </div>

          {formData.metrics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center font-mono text-sm text-slate-500">
              No metrics added yet. Click &quot;Add Metric&quot; to define quantitative proof
              points.
            </div>
          ) : (
            <div className="space-y-3">
              {formData.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-950 p-4 md:grid-cols-12"
                >
                  <div className="md:col-span-4">
                    <label className="mb-1 block font-mono text-[10px] uppercase text-slate-400">
                      Label / Metric Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reduction in message clutter"
                      value={metric.label || ''}
                      onChange={(e) => updateMetric(idx, 'label', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block font-mono text-[10px] uppercase text-slate-400">
                      Value (Big Stat)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. -42% or 1.8M"
                      value={metric.value || ''}
                      onChange={(e) => updateMetric(idx, 'value', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold text-indigo-400"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="mb-1 block font-mono text-[10px] uppercase text-slate-400">
                      Qualifier / Source
                    </label>
                    <select
                      value={metric.qualifier || 'actual'}
                      onChange={(e) => updateMetric(idx, 'qualifier', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    >
                      <option value="actual">Actual (Shipped metric)</option>
                      <option value="estimated">Estimated / Hypothesis</option>
                      <option value="learning">Qualitative Learning</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-5 md:col-span-1 md:pt-0">
                    <button
                      type="button"
                      onClick={() => removeMetric(idx)}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-900 hover:text-rose-400"
                      title="Remove Metric"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Tools, Tags & Links */}
      {activeTab === 'links' && (
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid grid-cols-1 gap-6 border-b border-slate-800 pb-6 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Tools & Methodologies (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Figma, Mixpanel, User Interviews, Zod, Jira"
                value={toolsInput}
                onChange={(e) => {
                  setToolsInput(e.target.value);
                  setAutosaveStatus('unsaved');
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Displayed as methodology pills on the case study header.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Discovery & Skill Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Discovery, PRD, Analytics, Delivery, B2C"
                value={tagsInput}
                onChange={(e) => {
                  setTagsInput(e.target.value);
                  setAutosaveStatus('unsaved');
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Used for filtering on the public /work grid.
              </p>
            </div>
          </div>

          <h3 className="font-mono text-sm uppercase tracking-wider text-white">
            External Live Evidence & GitHub Links
          </h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Live Deployed URL
              </label>
              <input
                type="url"
                placeholder="https://myproject.com"
                value={formData.live_url}
                onChange={(e) => handleFieldChange('live_url', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={formData.repo_url}
                onChange={(e) => handleFieldChange('repo_url', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Figma / Prototype URL
              </label>
              <input
                type="url"
                placeholder="https://figma.com/file/..."
                value={formData.prototype_url}
                onChange={(e) => handleFieldChange('prototype_url', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                Linked PRD Spec URL / Slug
              </label>
              <input
                type="text"
                placeholder="/prds/whatsapp-group-coordinator-prd"
                value={formData.prd_url}
                onChange={(e) => handleFieldChange('prd_url', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Media & SEO */}
      {activeTab === 'seo' && (
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase text-slate-300">
              Cover Image Asset
            </label>
            <div className="flex items-center gap-4">
              {formData.cover_image ? (
                <div className="group relative h-28 w-48 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <img
                    src={formData.cover_image}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('cover_image', '')}
                    className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-950/80 text-xs font-medium text-rose-400 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex h-28 w-48 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 text-slate-500">
                  <ImageIcon className="mb-1 h-6 w-6 opacity-50" />
                  <span className="text-[11px]">No image selected</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or choose from library"
                  value={formData.cover_image}
                  onChange={(e) => handleFieldChange('cover_image', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
                >
                  <UploadCloud className="h-4 w-4 text-indigo-400" />
                  <span>Browse Media Library</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-6">
            <h3 className="font-mono text-sm uppercase tracking-wider text-white">
              Search Engine Optimization (SEO)
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                  Meta Title
                </label>
                <input
                  type="text"
                  placeholder={formData.title || 'Case study title'}
                  value={formData.seo_title}
                  onChange={(e) => handleFieldChange('seo_title', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  placeholder={formData.summary || 'Summary description for Google search results'}
                  value={formData.seo_description}
                  onChange={(e) => handleFieldChange('seo_description', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal Picker */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => handleFieldChange('cover_image', url)}
        allowedTypes="image"
      />
    </div>
  );
};
