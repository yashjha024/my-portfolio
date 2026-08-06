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
    skills: [], // array of strings
    year: '',
    role_constraints: '',
    research_inputs: '',
    problem_framing: '',
    options_decision: '',
    options_tradeoffs: '',
    prd_snapshot: {},
    delivery: '',
    outcome_learning: '',
    related_work: [],
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
  const [skillsInput, setSkillsInput] = useState('');
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
          skills: Array.isArray(item.skills) ? item.skills : [],
          year: item.year ? Number(item.year) : '',
          role_constraints: item.role_constraints || item.roleConstraints || '',
          research_inputs: item.research_inputs || item.researchInputs || '',
          problem_framing: item.problem_framing || item.problemFraming || '',
          options_decision:
            item.options_decision || item.options_tradeoffs || item.optionsDecision || '',
          options_tradeoffs:
            item.options_tradeoffs || item.options_decision || item.optionsTradeoffs || '',
          prd_snapshot: item.prd_snapshot || item.prdSnapshot || {},
          delivery: item.delivery || '',
          outcome_learning: item.outcome_learning || item.outcomeLearning || '',
          related_work: Array.isArray(item.related_work || item.relatedWork)
            ? item.related_work || item.relatedWork
            : [],
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
        setSkillsInput((item.skills || []).join(', '));
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

      // Convert comma-separated string tools, tags, and skills if user typed
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
      if (typeof skillsInput === 'string') {
        payload.skills = skillsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (payload.year !== '' && payload.year !== null && payload.year !== undefined) {
        payload.year = Number(payload.year);
      } else {
        payload.year = null;
      }
      if (payload.options_tradeoffs && !payload.options_decision) {
        payload.options_decision = payload.options_tradeoffs;
      }
      if (payload.options_decision && !payload.options_tradeoffs) {
        payload.options_tradeoffs = payload.options_decision;
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
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <span className="text-muted-foreground font-mono text-xs uppercase">
          Loading Case Study Editor...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar with Back, Title & Actions */}
      <div className="border-border bg-card shadow-soft sticky top-2 z-20 flex flex-col justify-between gap-4 rounded-2xl border p-5 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/work"
            className="text-muted-foreground hover:bg-secondary rounded-xl p-2 transition-colors hover:text-white"
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
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
              Slug: <span className="text-primary">/{formData.slug || 'untitled'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formData.slug && (
            <button
              type="button"
              onClick={async () => {
                if (formData.status === 'published') {
                  window.open(`/work/${formData.slug}`, '_blank');
                  return;
                }
                if (!id) {
                  alert('Please save the draft before previewing.');
                  return;
                }
                try {
                  const res = await api.post(`/work/${id}/preview-token`);
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
            className="shadow-soft flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
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
              className="bg-secondary text-muted-foreground rounded-xl border border-transparent px-3 py-2 text-xs font-medium transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400"
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
      <div className="border-border flex gap-2 overflow-x-auto border-b">
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
                ? 'border-primary/40 bg-indigo-500/5 text-white'
                : 'text-muted-foreground hover:border-border hover:text-foreground border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Core Metadata */}
      {activeTab === 'core' && (
        <div className="border-border bg-card space-y-5 rounded-2xl border p-6">
          <h3 className="border-border text-muted-foreground border-b pb-2 font-mono text-sm uppercase tracking-wider">
            Primary Case Study Identification & Role Split
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Case Study Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WhatsApp Group Event Coordinator"
                value={formData.title}
                onChange={handleTitleChange}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                URL Slug <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="whatsapp-group-event-coordinator"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                className="border-border bg-background text-primary focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
              Elevator Pitch Summary (140-180 chars) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Concise 1-2 sentence problem overview and specific business/user outcome..."
              value={formData.summary}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              className="border-border bg-background focus:border-primary/40 w-full rounded-xl border p-4 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:outline-none"
              >
                <option value="shipped_project">Shipped Project</option>
                <option value="product_case_study">Product Case Study</option>
                <option value="program_case_study">Program Case Study</option>
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Sort Order Priority
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleFieldChange('sort_order', Number(e.target.value))}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleFieldChange('featured', e.target.checked)}
                  className="border-border bg-background h-5 w-5 rounded text-indigo-600 focus:ring-0"
                />
                <span>Featured on Home Page</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-5">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                My Role
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Product Manager"
                value={formData.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Timeline / Duration
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 2025 - 4 Months"
                value={formData.timeline}
                onChange={(e) => handleFieldChange('timeline', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Team & Collaborators
              </label>
              <input
                type="text"
                placeholder="e.g. 4 Engineers, 1 Product Designer"
                value={formData.team}
                onChange={(e) => handleFieldChange('team', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Domain
              </label>
              <input
                type="text"
                placeholder="e.g. Messaging & Social, Fintech"
                value={formData.domain}
                onChange={(e) => handleFieldChange('domain', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Year
              </label>
              <input
                type="number"
                placeholder="e.g. 2026"
                value={formData.year || ''}
                onChange={(e) => handleFieldChange('year', e.target.value)}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
              Role & Constraints
            </label>
            <textarea
              rows={3}
              placeholder="Detail your specific constraints, budget limitations, technical trade-offs, or team dynamics..."
              value={formData.role_constraints || ''}
              onChange={(e) => handleFieldChange('role_constraints', e.target.value)}
              className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
            />
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
              placeholder="### Shipped Impact&#10;Reduced drop-off by 18%..."
            />
          </div>

          <div className="border-border border-t pt-6">
            <h4 className="text-primary mb-4 font-mono text-sm uppercase tracking-wider">
              Canonical Case Study Fields (Structured Teardown / Deep Dive)
            </h4>
            <div className="space-y-6">
              <div>
                <MarkdownEditor
                  label="Research Inputs (User research, data insights, interviews)"
                  value={formData.research_inputs || ''}
                  onChange={(val) => handleFieldChange('research_inputs', val)}
                  onSave={() => handleSave('draft')}
                  autosaveStatus={autosaveStatus}
                  lastSavedAt={lastSavedAt}
                  minHeight="220px"
                  placeholder="### Discovery Findings&#10;Summarize user interviews and quantitative data inputs..."
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Problem Framing (Detailed HMW and opportunity breakdown)"
                  value={formData.problem_framing || ''}
                  onChange={(val) => handleFieldChange('problem_framing', val)}
                  onSave={() => handleSave('draft')}
                  autosaveStatus={autosaveStatus}
                  lastSavedAt={lastSavedAt}
                  minHeight="220px"
                  placeholder="### Problem Framing&#10;Why this problem matters right now..."
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Options & Trade-offs (Decision matrix and alternatives explored)"
                  value={formData.options_decision || ''}
                  onChange={(val) => {
                    handleFieldChange('options_decision', val);
                    handleFieldChange('options_tradeoffs', val);
                  }}
                  onSave={() => handleSave('draft')}
                  autosaveStatus={autosaveStatus}
                  lastSavedAt={lastSavedAt}
                  minHeight="220px"
                  placeholder="### Decision Matrix&#10;Pros and cons of each architectural choice..."
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Delivery Execution (Milestones, sprints, engineering roll-out)"
                  value={formData.delivery || ''}
                  onChange={(val) => handleFieldChange('delivery', val)}
                  onSave={() => handleSave('draft')}
                  autosaveStatus={autosaveStatus}
                  lastSavedAt={lastSavedAt}
                  minHeight="220px"
                  placeholder="### Delivery Plan&#10;Phased roll-out and quality gates..."
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Outcome & Learnings (Retrospective and post-launch insights)"
                  value={formData.outcome_learning || ''}
                  onChange={(val) => handleFieldChange('outcome_learning', val)}
                  onSave={() => handleSave('draft')}
                  autosaveStatus={autosaveStatus}
                  lastSavedAt={lastSavedAt}
                  minHeight="220px"
                  placeholder="### Key Takeaways&#10;What worked well and what we would do differently next time..."
                />
              </div>

              <div className="border-border bg-card rounded-2xl border p-5">
                <label className="text-foreground mb-2 block font-mono text-xs uppercase">
                  PRD Snapshot (JSON format)
                </label>
                <textarea
                  rows={5}
                  value={
                    typeof formData.prd_snapshot === 'string'
                      ? formData.prd_snapshot
                      : JSON.stringify(formData.prd_snapshot || {}, null, 2)
                  }
                  onChange={(e) => {
                    const textVal = e.target.value;
                    try {
                      const parsed = JSON.parse(textVal);
                      handleFieldChange('prd_snapshot', parsed);
                    } catch {
                      handleFieldChange('prd_snapshot', textVal);
                    }
                  }}
                  className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-xs text-white focus:outline-none"
                  placeholder='{"title":"Feature X PRD","status":"Shipped","key_metrics": ["Conversion +10%"]}'
                />
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Must be valid JSON when saving to canonical contract.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Evidence & Metrics */}
      {activeTab === 'metrics' && (
        <div className="border-border bg-card space-y-5 rounded-2xl border p-6">
          <div className="border-border flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-mono text-sm uppercase tracking-wider text-white">
                Quantitative Evidence Strip
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Add structured quantitative highlights shown prominently on the case study card and
                detail page.
              </p>
            </div>
            <button
              type="button"
              onClick={addMetric}
              className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Metric</span>
            </button>
          </div>

          {formData.metrics.length === 0 ? (
            <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center font-mono text-sm">
              No metrics added yet. Click &quot;Add Metric&quot; to define quantitative proof
              points.
            </div>
          ) : (
            <div className="space-y-3">
              {formData.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="border-border bg-background grid grid-cols-1 items-center gap-4 rounded-xl border p-4 md:grid-cols-12"
                >
                  <div className="md:col-span-4">
                    <label className="text-muted-foreground mb-1 block font-mono text-[10px] uppercase">
                      Label / Metric Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reduction in message clutter"
                      value={metric.label || ''}
                      onChange={(e) => updateMetric(idx, 'label', e.target.value)}
                      className="border-border bg-card w-full rounded-lg border px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-muted-foreground mb-1 block font-mono text-[10px] uppercase">
                      Value (Big Stat)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. -42% or 1.8M"
                      value={metric.value || ''}
                      onChange={(e) => updateMetric(idx, 'value', e.target.value)}
                      className="border-border bg-card text-primary w-full rounded-lg border px-3 py-1.5 font-mono text-xs font-bold"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-muted-foreground mb-1 block font-mono text-[10px] uppercase">
                      Qualifier / Source
                    </label>
                    <select
                      value={metric.qualifier || 'actual'}
                      onChange={(e) => updateMetric(idx, 'qualifier', e.target.value)}
                      className="border-border bg-card w-full rounded-lg border px-3 py-1.5 text-xs text-white"
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
                      className="text-muted-foreground hover:bg-card rounded-lg p-2 transition-colors hover:text-rose-400"
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
        <div className="border-border bg-card space-y-6 rounded-2xl border p-6">
          <div className="border-border grid grid-cols-1 gap-6 border-b pb-6 md:grid-cols-3">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
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
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Displayed as methodology pills on the case study header.
              </p>
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
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
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Used for filtering on the public /work grid.
              </p>
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Skills (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Product Strategy, User Research, Growth, SQL"
                value={skillsInput}
                onChange={(e) => {
                  setSkillsInput(e.target.value);
                  setAutosaveStatus('unsaved');
                }}
                className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Used for skill competency filtering across case studies.
              </p>
            </div>
          </div>

          <h3 className="font-mono text-sm uppercase tracking-wider text-white">
            External Live Evidence & GitHub Links
          </h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Live Deployed URL
              </label>
              <input
                type="url"
                placeholder="https://myproject.com"
                value={formData.live_url}
                onChange={(e) => handleFieldChange('live_url', e.target.value)}
                className="border-border bg-background text-primary focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={formData.repo_url}
                onChange={(e) => handleFieldChange('repo_url', e.target.value)}
                className="border-border bg-background text-primary focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Figma / Prototype URL
              </label>
              <input
                type="url"
                placeholder="https://figma.com/file/..."
                value={formData.prototype_url}
                onChange={(e) => handleFieldChange('prototype_url', e.target.value)}
                className="border-border bg-background text-primary focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                Linked PRD Spec URL / Slug
              </label>
              <input
                type="text"
                placeholder="/prds/whatsapp-group-coordinator-prd"
                value={formData.prd_url}
                onChange={(e) => handleFieldChange('prd_url', e.target.value)}
                className="border-border bg-background text-primary focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="border-border border-t pt-6">
            <h3 className="mb-3 font-mono text-sm uppercase tracking-wider text-white">
              Related Work & Case Studies (JSON Array)
            </h3>
            <textarea
              rows={4}
              value={
                typeof formData.related_work === 'string'
                  ? formData.related_work
                  : JSON.stringify(formData.related_work || [], null, 2)
              }
              onChange={(e) => {
                const textVal = e.target.value;
                try {
                  const parsed = JSON.parse(textVal);
                  handleFieldChange('related_work', parsed);
                } catch {
                  handleFieldChange('related_work', textVal);
                }
              }}
              className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-4 py-2.5 font-mono text-xs text-white focus:outline-none"
              placeholder='[{"title":"Project Y","url":"/work/project-y","relationship":"Precursor exploration"}]'
            />
          </div>
        </div>
      )}

      {/* Tab 5: Media & SEO */}
      {activeTab === 'seo' && (
        <div className="border-border bg-card space-y-6 rounded-2xl border p-6">
          <div>
            <label className="text-foreground mb-2 block font-mono text-xs uppercase">
              Cover Image Asset
            </label>
            <div className="flex items-center gap-4">
              {formData.cover_image ? (
                <div className="border-border bg-background group relative h-28 w-48 shrink-0 overflow-hidden rounded-xl border">
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
              ) : (
                <div className="border-border bg-background text-muted-foreground flex h-28 w-48 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed">
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
                  className="border-border bg-background w-full rounded-xl border px-4 py-2 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-colors"
                >
                  <UploadCloud className="text-primary h-4 w-4" />
                  <span>Browse Media Library</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-border space-y-4 border-t pt-6">
            <h3 className="font-mono text-sm uppercase tracking-wider text-white">
              Search Engine Optimization (SEO)
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                  Meta Title
                </label>
                <input
                  type="text"
                  placeholder={formData.title || 'Case study title'}
                  value={formData.seo_title}
                  onChange={(e) => handleFieldChange('seo_title', e.target.value)}
                  className="border-border bg-background w-full rounded-xl border px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-foreground mb-1.5 block font-mono text-xs uppercase">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  placeholder={formData.summary || 'Summary description for Google search results'}
                  value={formData.seo_description}
                  onChange={(e) => handleFieldChange('seo_description', e.target.value)}
                  className="border-border bg-background w-full rounded-xl border p-4 text-sm text-white"
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
