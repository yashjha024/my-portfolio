import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { AutosaveIndicator } from '../../components/admin/AutosaveIndicator.jsx';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal.jsx';
import { MarkdownEditor } from '../../components/admin/MarkdownEditor.jsx';
import { useEditorSave } from '../../hooks/useEditorSave.js';
import { useUnsavedChangesGuard, useSaveShortcut } from '../../hooks/useUnsavedChangesGuard.js';
import { buildPrdPayload, describeSaveError } from '../../utils/editorPayload.js';
import {
  parseSections,
  parseSectionsJson,
  sectionsToJson,
  setProblem,
  addCanonicalItem,
  updateCanonicalItem,
  removeCanonicalItem,
  addCustomSection,
  updateCustomSection,
  removeCustomSection,
} from '../../utils/prdSections.js';
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

// Must match the prd_stage enum in supabase/migrations/20260715000001_initial_schema.sql
const PRD_STAGES = ['In Development', 'Approved', 'Archived'];
const REQUIREMENT_PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const LIST_LABELS = {
  goals: 'Goals',
  nonGoals: 'Explicit Non-Goals',
  requirements: 'Requirements',
  metrics: 'Success Metrics',
  releaseGates: 'Release Gates & Quality Checklists',
};

const inputClass =
  'border-border bg-background w-full rounded-xl border px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none';

export const EditPrdPage = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [caseStudyOptions, setCaseStudyOptions] = useState([]);

  // Sections: one model holding canonical lists and custom sections side by side
  const [sectionsModel, setSectionsModel] = useState(() => parseSections(null));
  const [sectionsView, setSectionsView] = useState('canonical'); // 'canonical' | 'custom' | 'json'
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    stage: 'In Development',
    visibility: 'unlisted',
    status: 'draft',
    context: '',
    pdf_url: '',
    related_case_study_id: '',
  });

  // Latest editor state for the save controller (timers fire after renders, never with stale data)
  const latestRef = useRef({});
  latestRef.current = { formData, sectionsModel, sectionsView, jsonText };

  const editorSave = useEditorSave({
    prepare: ({ status }) => {
      const latest = latestRef.current;
      return buildPrdPayload(
        latest.formData,
        {
          model: latest.sectionsModel,
          jsonMode: latest.sectionsView === 'json',
          jsonText: latest.jsonText,
        },
        { status }
      );
    },
    persist: async (payload) => {
      const res = isNew
        ? await api.post('/admin/prds', payload)
        : await api.put(`/admin/prds/${id}`, payload);
      if (!res.data?.success)
        throw new Error(res.data?.error || 'Failed to save PRD specification.');
      return res.data.data;
    },
    // Autosave only drafts; published/archived edits go live only through an explicit Save
    canAutosave: () => !isNew && latestRef.current.formData.status === 'draft',
  });
  const saving = editorSave.state.saving;
  const autosaveStatus = editorSave.indicatorStatus;
  const lastSavedAt = editorSave.state.lastSavedAt;
  const saveError = editorSave.state.error
    ? describeSaveError(editorSave.state.error, 'Failed to save PRD specification.')
    : null;

  useUnsavedChangesGuard(editorSave.state.dirty || saving);

  const fetchPrd = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/prds/${id}`).catch(async () => {
        return api.get(`/prds/${id}`);
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        const model = parseSections(item.sections);

        setFormData({
          title: item.title || '',
          slug: item.slug || '',
          stage: item.stage || 'In Development',
          visibility: item.visibility || 'unlisted',
          status: item.status || 'draft',
          context: item.context || '',
          pdf_url: item.pdf_url || '',
          related_case_study_id: item.related_case_study_id || '',
        });
        setSectionsModel(model);
        setSectionsView(model.primaryShape === 'custom' ? 'custom' : 'canonical');
        setJsonText(sectionsToJson(model));
        setJsonError(null);
        // Loading is not an edit: establish the saved baseline without scheduling any write
        editorSave.markClean(item.updated_at || null);
      }
    } catch (err) {
      console.error('Failed to fetch PRD:', err);
      setError('Could not load PRD spec details.');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, editorSave.markClean]);

  useEffect(() => {
    fetchPrd();
  }, [fetchPrd]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/work?limit=100')
      .then((res) => {
        if (!cancelled && res.data?.success) setCaseStudyOptions(res.data.data || []);
      })
      .catch(() => {
        // The selector still shows the stored link; options are a convenience
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    editorSave.markDirty();
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    editorSave.markDirty();
  };

  const updateSections = (updater) => {
    setSectionsModel((prev) => updater(prev));
    editorSave.markDirty();
  };

  const switchSectionsView = (nextView) => {
    if (nextView === sectionsView) return;
    if (sectionsView === 'json') {
      // Leaving Raw JSON: apply it, or stay put so invalid edits are never silently discarded
      const parsed = parseSectionsJson(jsonText);
      if (parsed.error) {
        setJsonError(`${parsed.error} Fix it or undo your edits before switching views.`);
        return;
      }
      setSectionsModel(parsed.model);
    }
    if (nextView === 'json') {
      // Always start from the current structured content, never from stale JSON text
      setJsonText(sectionsToJson(sectionsModel));
      setJsonError(null);
    }
    setSectionsView(nextView);
  };

  const handleSectionsJsonChange = (value) => {
    setJsonText(value);
    editorSave.markDirty();
    const parsed = parseSectionsJson(value);
    if (parsed.error) {
      setJsonError(`${parsed.error} Saving is blocked until it is fixed.`);
    } else {
      setSectionsModel(parsed.model);
      setJsonError(null);
    }
  };

  /**
   * Save the PRD.
   * - no argument: plain Save, keeps the current publication status (new items are created as drafts)
   * - 'draft' / 'published': explicit status transition
   */
  const handleSave = async (targetStatus = null) => {
    setError(null);
    const currentStatus = latestRef.current.formData.status;
    if (
      !isNew &&
      targetStatus === 'draft' &&
      currentStatus === 'published' &&
      !window.confirm('Saving as draft will unpublish this PRD from the public site. Continue?')
    ) {
      return;
    }
    const status = targetStatus || (isNew ? 'draft' : undefined);
    const outcome = await editorSave.save(status ? { status } : {});
    if (!outcome.ok) return; // error state and message come from the save controller

    const saved = outcome.result;
    if (saved?.status) {
      latestRef.current.formData = { ...latestRef.current.formData, status: saved.status };
      setFormData((prev) => ({ ...prev, status: saved.status }));
    }
    editorSave.refreshAutosave();
    if (isNew && saved?.id) {
      navigate(`/admin/prds/edit/${saved.id}`, { replace: true });
    }
  };

  useSaveShortcut(() => handleSave());

  const handleImportMarkdown = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;
      const current = latestRef.current.formData;
      if (
        current.context.trim() &&
        !window.confirm('Importing replaces the current background context. Continue?')
      ) {
        return;
      }
      // Automatically extract title if first line starts with #
      const lines = text.split('\n');
      let extractedTitle = '';
      let bodyText = text;
      if (lines[0] && lines[0].startsWith('# ')) {
        extractedTitle = lines[0].replace(/^#\s+/, '').trim();
        bodyText = lines.slice(1).join('\n').trim();
      }
      setFormData((prev) => ({
        ...prev,
        title: extractedTitle || prev.title || file.name.replace(/\.[^/.]+$/, ''),
        context: bodyText || text,
      }));
      editorSave.markDirty();
    };
    reader.readAsText(file);
  };

  const renderCanonicalItem = (key, itemVal, idx) => {
    const update = (patch) => updateSections((m) => updateCanonicalItem(m, key, idx, patch));

    if (typeof itemVal === 'string') {
      return (
        <input
          type="text"
          value={itemVal}
          onChange={(e) => update(e.target.value)}
          aria-label={`${LIST_LABELS[key]} item ${idx + 1}`}
          className={`${inputClass} flex-1`}
        />
      );
    }

    if (!itemVal || typeof itemVal !== 'object' || Array.isArray(itemVal)) {
      return (
        <p className="text-muted-foreground flex-1 font-mono text-[11px]">
          Unsupported value — edit this item in Raw JSON.
        </p>
      );
    }

    if (key === 'requirements') {
      return (
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-12">
          <input
            type="text"
            value={itemVal.id || ''}
            onChange={(e) => update({ id: e.target.value })}
            placeholder="REQ-001"
            aria-label={`Requirement ${idx + 1} ID`}
            className={`${inputClass} font-mono md:col-span-2`}
          />
          <select
            value={itemVal.priority || ''}
            onChange={(e) => update({ priority: e.target.value })}
            aria-label={`Requirement ${idx + 1} priority`}
            className={`${inputClass} md:col-span-2`}
          >
            <option value="">—</option>
            {REQUIREMENT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={itemVal.name || itemVal.title || ''}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Requirement name"
            aria-label={`Requirement ${idx + 1} name`}
            className={`${inputClass} md:col-span-8`}
          />
          <textarea
            rows={2}
            value={itemVal.desc || itemVal.userStory || ''}
            onChange={(e) => update({ desc: e.target.value })}
            placeholder="Technical specification & acceptance criteria"
            aria-label={`Requirement ${idx + 1} specification`}
            className={`${inputClass} md:col-span-12`}
          />
        </div>
      );
    }

    if (key === 'metrics') {
      return (
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
          <input
            type="text"
            value={itemVal.name || itemVal.label || ''}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Metric name"
            aria-label={`Metric ${idx + 1} name`}
            className={inputClass}
          />
          <input
            type="text"
            value={itemVal.target || itemVal.value || ''}
            onChange={(e) => update({ target: e.target.value })}
            placeholder="Target"
            aria-label={`Metric ${idx + 1} target`}
            className={inputClass}
          />
        </div>
      );
    }

    if (key === 'releaseGates') {
      return (
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
          <input
            type="text"
            value={itemVal.name || ''}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Gate name"
            aria-label={`Release gate ${idx + 1} name`}
            className={inputClass}
          />
          <input
            type="text"
            value={itemVal.status || ''}
            onChange={(e) => update({ status: e.target.value })}
            placeholder="Status e.g. Passed"
            aria-label={`Release gate ${idx + 1} status`}
            className={inputClass}
          />
          <input
            type="text"
            value={itemVal.criteria || ''}
            onChange={(e) => update({ criteria: e.target.value })}
            placeholder="Criteria"
            aria-label={`Release gate ${idx + 1} criteria`}
            className={inputClass}
          />
        </div>
      );
    }

    // Object goals / non-goals: edit the visible text, keep any extra properties
    const textKey = ['name', 'text', 'title'].find((k) => typeof itemVal[k] === 'string') || 'text';
    return (
      <input
        type="text"
        value={itemVal[textKey] || ''}
        onChange={(e) => update({ [textKey]: e.target.value })}
        aria-label={`${LIST_LABELS[key]} item ${idx + 1}`}
        className={`${inputClass} flex-1`}
      />
    );
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

  const stageOptions = PRD_STAGES.includes(formData.stage)
    ? PRD_STAGES
    : [formData.stage, ...PRD_STAGES];
  const linkedCaseStudyMissing =
    formData.related_case_study_id &&
    !caseStudyOptions.some((cs) => cs.id === formData.related_case_study_id);

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
          <label className="bg-secondary text-foreground hover:bg-secondary flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors">
            <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
            <span>Import .md File</span>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportMarkdown(file);
                e.target.value = '';
              }}
            />
          </label>

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

          {!isNew && formData.status !== 'draft' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave()}
              title={`Save changes and keep this PRD ${formData.status} (Ctrl/Cmd+S)`}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            title={
              formData.status === 'published' ? 'Unpublish and save as draft' : 'Save as draft'
            }
            className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{formData.status === 'published' ? 'Unpublish to Draft' : 'Save Draft'}</span>
          </button>

          {formData.status !== 'published' && (
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
          )}
        </div>
      </div>

      {(error || saveError) && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || saveError}</span>
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
                onSave={() => handleSave()}
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
                  Canonical lists and custom sections are kept together; switching views never
                  discards either.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2" role="tablist">
                {[
                  { id: 'canonical', label: 'Canonical Lists' },
                  { id: 'custom', label: `Custom Sections (${sectionsModel.custom.length})` },
                  { id: 'json', label: 'Raw JSON' },
                ].map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    role="tab"
                    aria-selected={sectionsView === view.id}
                    onClick={() => switchSectionsView(view.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      sectionsView === view.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-secondary text-foreground hover:bg-secondary'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {sectionsView === 'canonical' && (
              <div className="border-border bg-card space-y-6 rounded-2xl border p-6">
                <div className="border-border space-y-2 border-b pb-5">
                  <label
                    htmlFor="prd-problem"
                    className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400"
                  >
                    Problem Statement
                  </label>
                  <textarea
                    id="prd-problem"
                    rows={3}
                    value={
                      typeof sectionsModel.canonical.problem === 'string'
                        ? sectionsModel.canonical.problem
                        : ''
                    }
                    onChange={(e) => updateSections((m) => setProblem(m, e.target.value))}
                    placeholder="Why are we building this?"
                    className={inputClass}
                  />
                </div>
                {['goals', 'nonGoals', 'requirements', 'metrics', 'releaseGates'].map((key) => {
                  const rawList = sectionsModel.canonical[key];
                  const items = Array.isArray(rawList) ? rawList : [];
                  return (
                    <div
                      key={key}
                      className="border-border space-y-3 border-b pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                          {LIST_LABELS[key]}
                        </span>
                        {Array.isArray(rawList) && (
                          <button
                            type="button"
                            onClick={() => updateSections((m) => addCanonicalItem(m, key))}
                            className="bg-secondary hover:bg-secondary flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-emerald-300"
                          >
                            <Plus className="h-3 w-3" /> Add item
                          </button>
                        )}
                      </div>
                      {!Array.isArray(rawList) ? (
                        <p className="text-muted-foreground text-xs italic">
                          This field is not a list; edit it in Raw JSON.
                        </p>
                      ) : items.length === 0 ? (
                        <p className="text-muted-foreground text-xs italic">No items added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((itemVal, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              {renderCanonicalItem(key, itemVal, idx)}
                              <button
                                type="button"
                                onClick={() =>
                                  updateSections((m) => removeCanonicalItem(m, key, idx))
                                }
                                aria-label={`Remove ${LIST_LABELS[key]} item ${idx + 1}`}
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

            {sectionsView === 'custom' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => updateSections(addCustomSection)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Custom Section</span>
                  </button>
                </div>
                {sectionsModel.custom.length > 0 ? (
                  sectionsModel.custom.map((sec, idx) => (
                    <div
                      key={idx}
                      className="border-border bg-card space-y-3 rounded-2xl border p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder="Section Title e.g. 1. Functional Requirements Table"
                          value={sec?.title || ''}
                          onChange={(e) =>
                            updateSections((m) =>
                              updateCustomSection(m, idx, { title: e.target.value })
                            )
                          }
                          aria-label={`Custom section ${idx + 1} title`}
                          className="border-border bg-background flex-1 rounded-xl border px-4 py-2 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateSections((m) => removeCustomSection(m, idx))}
                          className="text-muted-foreground hover:bg-background rounded-xl p-2 transition-colors hover:text-rose-400"
                          title="Remove Section"
                          aria-label={`Remove custom section ${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <MarkdownEditor
                        value={typeof sec === 'string' ? sec : sec?.content || ''}
                        onChange={(val) =>
                          updateSections((m) => updateCustomSection(m, idx, { content: val }))
                        }
                        onSave={() => handleSave()}
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

            {sectionsView === 'json' && (
              <div className="space-y-2">
                <textarea
                  rows={18}
                  value={jsonText}
                  onChange={(event) => handleSectionsJsonChange(event.target.value)}
                  className="border-border bg-background w-full rounded-2xl border p-4 font-mono text-xs leading-relaxed text-white focus:border-emerald-500 focus:outline-none"
                  aria-label="Structured PRD sections as JSON"
                  aria-invalid={Boolean(jsonError)}
                />
                {jsonError ? (
                  <p role="alert" className="font-mono text-xs text-amber-400">
                    {jsonError}
                  </p>
                ) : (
                  <p className="font-mono text-xs text-emerald-400">Valid JSON.</p>
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
                {stageOptions.map((stage) => (
                  <option
                    key={stage}
                    value={stage}
                    className="bg-slate-900 font-semibold text-white"
                  >
                    {stage}
                  </option>
                ))}
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
                <option value="public" className="bg-slate-900 font-semibold text-white">
                  Public (Indexed &amp; Searchable)
                </option>
                <option value="unlisted" className="bg-slate-900 font-semibold text-white">
                  Unlisted (Accessible via direct link)
                </option>
                <option value="private" className="bg-slate-900 font-semibold text-white">
                  Private (Admin &amp; Authenticated team only)
                </option>
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
              <span className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase">
                Publish Status
              </span>
              {/* Read-only: status changes only through the explicit Save Draft / Publish actions */}
              <div
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium capitalize text-white"
                aria-live="polite"
              >
                {formData.status}
              </div>
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

            <div>
              <label
                htmlFor="prd-related-case-study"
                className="text-muted-foreground mb-1.5 block font-mono text-xs uppercase"
              >
                Linked Case Study
              </label>
              <select
                id="prd-related-case-study"
                value={formData.related_case_study_id || ''}
                onChange={(e) => handleFieldChange('related_case_study_id', e.target.value)}
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-slate-900">
                  None
                </option>
                {linkedCaseStudyMissing && (
                  <option value={formData.related_case_study_id} className="bg-slate-900">
                    Current link ({formData.related_case_study_id.slice(0, 8)}…)
                  </option>
                )}
                {caseStudyOptions.map((cs) => (
                  <option key={cs.id} value={cs.id} className="bg-slate-900">
                    {cs.title} {cs.status !== 'published' ? `(${cs.status})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground mt-1 text-[10px]">
                Shown on the public PRD page only while the case study is published.
              </p>
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
