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
    <div className="animate-fadeIn bg-background fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="border-border bg-card shadow-soft flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border md:flex-row">
        {/* Left/Top Preview Area */}
        <div className="border-border bg-background group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden border-b p-6 md:w-1/2 md:border-b-0 md:border-r">
          {isImg ? (
            <img
              src={asset.url}
              alt={asset.alt_text || asset.original_name}
              className="border-border bg-card shadow-soft max-h-[380px] w-auto rounded-2xl border object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-emerald-400">
              <FileText className="mb-4 h-20 w-20 animate-pulse opacity-90" />
              <h4 className="max-w-xs truncate text-base font-bold text-white">
                {asset.original_name}
              </h4>
              <span className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-wider">
                PDF Specification
              </span>
            </div>
          )}

          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-card text-foreground hover:bg-secondary absolute left-4 top-4 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
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
                  <span className="border-border bg-secondary text-foreground rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
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
                className="text-muted-foreground hover:bg-secondary shrink-0 rounded-xl p-1.5 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Storage Metadata Telemetry */}
            <div className="border-border bg-background text-muted-foreground grid grid-cols-2 gap-3 rounded-2xl border p-3.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Folder className="text-primary h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-muted-foreground text-[10px] uppercase">Folder</div>
                  <div className="text-foreground truncate capitalize">
                    {asset.folder || 'general'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <div className="text-muted-foreground text-[10px] uppercase">File Size</div>
                  <div className="text-foreground">{formatFileSize(asset.size_bytes)}</div>
                </div>
              </div>

              <div className="border-border col-span-2 flex items-center gap-2 border-t pt-1">
                <Calendar className="h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <span className="text-muted-foreground mr-1 text-[10px] uppercase">
                    Uploaded:
                  </span>
                  <span className="text-foreground">
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
              <label className="text-foreground block font-mono text-xs font-bold uppercase tracking-wider">
                Alt Text / SEO Description
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe image for screen readers & SEO index..."
                  className="border-border bg-background focus:border-primary/40 flex-1 rounded-xl border px-3.5 py-2 text-xs text-white transition-colors focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white shadow-md transition-all disabled:opacity-50"
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
              <label className="text-muted-foreground mb-1 block font-mono text-[10px] uppercase tracking-wider">
                Supabase Storage Bucket Path
              </label>
              <div className="border-border bg-background text-muted-foreground select-all break-all rounded-xl border p-2.5 font-mono text-[11px]">
                {asset.storage_path || `assets/${asset.folder || 'general'}/${asset.filename}`}
              </div>
            </div>
          </div>

          {/* Action Footer buttons */}
          <div className="border-border flex items-center justify-between gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow-md transition-all ${
                copied
                  ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                  : 'bg-secondary text-foreground hover:bg-secondary'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied CDN URL!' : 'Copy Asset URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(`Permanently delete"${asset.original_name}"from cloud storage?`)
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
