import React, { useState } from 'react';
import api from '../../services/api.js';
import {
  X,
  FileText,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Save,
  Loader2,
  Folder,
  Calendar,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AssetPreviewModal = ({ isOpen, onClose, asset, onUpdate, onDelete }) => {
  if (!isOpen || !asset) return null;

  const [altText, setAltText] = useState(asset.alt_text || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isImg = asset.type === 'image' || /\.(png|jpe?g|webp|svg|gif)$/i.test(asset.url);

  const handleSaveAltText = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put(`/media/${asset.id}`, { alt_text: altText });
      if (res.data?.success && res.data?.data) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        onUpdate?.(res.data.data);
      }
    } catch (err) {
      console.error('Failed to update alt text:', err);
      alert('Could not update alt text.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:flex-row">
        {/* Left/Top Preview Area */}
        <div className="group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden border-b border-slate-800 bg-slate-950 p-6 md:w-1/2 md:border-b-0 md:border-r">
          {isImg ? (
            <img
              src={asset.url}
              alt={asset.alt_text || asset.original_name}
              className="max-h-[380px] w-auto rounded-2xl border border-slate-800/80 bg-slate-900/50 object-contain shadow-xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-emerald-400">
              <FileText className="mb-4 h-20 w-20 animate-pulse opacity-90" />
              <h4 className="max-w-xs truncate text-base font-bold text-white">
                {asset.original_name}
              </h4>
              <span className="mt-1 font-mono text-xs uppercase tracking-wider text-slate-500">
                PDF Specification
              </span>
            </div>
          )}

          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-4 top-4 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm transition-colors hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Full Resolution</span>
          </a>
        </div>

        {/* Right Inspector & Metadata Area */}
        <div className="flex flex-col justify-between space-y-6 overflow-y-auto p-6 md:w-1/2">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {asset.type || 'document'}
                  </span>
                  {asset.is_used ? (
                    <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Active / Used
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      <AlertTriangle className="h-3 w-3" /> Unused / Orphaned
                    </span>
                  )}
                </div>
                <h3 className="truncate text-lg font-bold text-white" title={asset.original_name}>
                  {asset.original_name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Storage Metadata Telemetry */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800/80 bg-slate-950 p-3.5 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 shrink-0 text-indigo-400" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-500">Folder</div>
                  <div className="truncate capitalize text-slate-200">
                    {asset.folder || 'general'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-500">File Size</div>
                  <div className="text-slate-200">{formatFileSize(asset.size_bytes)}</div>
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2 border-t border-slate-800/60 pt-1">
                <Calendar className="h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <span className="mr-1 text-[10px] uppercase text-slate-500">Uploaded:</span>
                  <span className="text-slate-300">
                    {new Date(asset.created_at || Date.now()).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Alt Text Editor */}
            <form onSubmit={handleSaveAltText} className="space-y-2">
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                Alt Text / SEO Description
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe image for screen readers & SEO index..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white transition-colors focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-md transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save</span>
                </button>
              </div>
              {saveSuccess && (
                <p className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Updated alt text for accessibility and SEO.
                </p>
              )}
            </form>

            {/* Storage Path Display */}
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Supabase Storage Bucket Path
              </label>
              <div className="select-all break-all rounded-xl border border-slate-800/80 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-400">
                {asset.storage_path || `assets/${asset.folder || 'general'}/${asset.filename}`}
              </div>
            </div>
          </div>

          {/* Action Footer buttons */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow-md transition-all ${
                copied
                  ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied CDN URL!' : 'Copy Asset URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(`Permanently delete "${asset.original_name}" from cloud storage?`)
                ) {
                  onDelete?.(asset);
                  onClose();
                }
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-600/10 px-4 py-2.5 text-xs font-medium text-rose-400 transition-all hover:bg-rose-600 hover:text-white"
              title="Delete asset permanently"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
