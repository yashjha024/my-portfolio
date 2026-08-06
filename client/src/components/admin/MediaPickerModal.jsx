import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImageBeforeUpload } from '../../utils/imageCompressor.js';
import {
  X,
  UploadCloud,
  Search,
  Image as ImageIcon,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  Sliders,
  Sparkles,
  Edit2,
  Save,
} from 'lucide-react';

export const MediaPickerModal = ({ isOpen, onClose, onSelect, allowedTypes = 'all' }) => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState(null);

  // Upload modal inside picker
  const [showUploadTab, setShowUploadTab] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('general');
  const [uploadAltText, setUploadAltText] = useState('');
  const [enableCompression, setEnableCompression] = useState(true);

  // Inline alt text edit state
  const [editingAlt, setEditingAlt] = useState(false);
  const [altInput, setAltInput] = useState('');

  const fileInputRef = useRef(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        folder: folderFilter,
        unused: unusedOnly ? 'true' : 'false',
        limit: '100',
      });
      if (allowedTypes && allowedTypes !== 'all') params.append('type', allowedTypes);
      if (search.trim()) params.append('q', search.trim());

      const { data } = await api.get(`/media/list?${params.toString()}`);
      if (data?.success) {
        setMediaList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load media list:', err);
      setError('Could not load media items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, search, allowedTypes, folderFilter, unusedOnly]);

  useEffect(() => {
    if (selectedItem) {
      setAltInput(selectedItem.alt_text || '');
      setEditingAlt(false);
    }
  }, [selectedItem]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      let targetFile = file;
      if (enableCompression && file.type.startsWith('image/')) {
        const compResult = await compressImageBeforeUpload(file, {
          quality: 0.82,
          outputFormat: 'image/webp',
        });
        targetFile = compResult.file;
      }

      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('alt_text', uploadAltText || file.name.split('.')[0] || 'Media asset');
      formData.append('folder', selectedFolder);

      const { data } = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data?.success && data?.data) {
        setMediaList((prev) => [data.data, ...prev]);
        setSelectedItem(data.data);
        setShowUploadTab(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err?.response?.data?.error || 'Failed to upload media asset.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAltText = async () => {
    if (!selectedItem) return;
    try {
      const res = await api.put(`/media/${selectedItem.id}`, { alt_text: altInput });
      if (res.data?.success && res.data?.data) {
        setMediaList((prev) =>
          prev.map((m) => (m.id === selectedItem.id ? { ...m, alt_text: altInput } : m))
        );
        setSelectedItem((prev) => ({ ...prev, alt_text: altInput }));
        setEditingAlt(false);
      }
    } catch (err) {
      console.error('Failed to update alt text:', err);
      alert('Could not update alt text.');
    }
  };

  if (!isOpen) return null;

  const folders = [
    { id: 'all', label: 'All Folders' },
    { id: 'case-studies', label: 'Case Studies' },
    { id: 'thinking', label: 'Thinking Articles' },
    { id: 'prds', label: 'PRD Specs' },
    { id: 'diagrams', label: 'Diagrams' },
    { id: 'general', label: 'General' },
  ];

  return (
    <AnimatePresence>
      <div className="animate-fadeIn bg-background fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="border-border bg-card shadow-soft flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border"
        >
          {/* Modal Header */}
          <div className="border-border bg-card flex items-center justify-between border-b p-5">
            <div className="flex items-center gap-3">
              <div className="border-primary/40 text-primary rounded-xl border bg-indigo-500/10 p-2.5">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Media Library & Picker</h3>
                <p className="text-muted-foreground text-xs">
                  Select existing assets or upload with compression & SEO alt text
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUploadTab(!showUploadTab)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                  showUploadTab
                    ? 'border-amber-500 bg-amber-600 text-white'
                    : 'border-border bg-secondary text-foreground hover:bg-secondary'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>{showUploadTab ? 'Browse Inventory' : 'Upload New Asset'}</span>
              </button>

              <button
                onClick={onClose}
                className="text-muted-foreground hover:bg-secondary rounded-xl p-2 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Top Filters & Search Strip */}
          {!showUploadTab && (
            <div className="border-border bg-background flex flex-col items-center justify-between gap-3 border-b p-3.5 font-mono text-xs md:flex-row">
              <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 md:w-auto md:pb-0">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFolderFilter(f.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 font-bold transition-colors ${
                      folderFilter === f.id
                        ? 'bg-primary text-white'
                        : 'bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex w-full items-center gap-2.5 md:w-auto">
                <button
                  type="button"
                  onClick={() => setUnusedOnly(!unusedOnly)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
                    unusedOnly
                      ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300'
                      : 'bg-card text-muted-foreground'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>{unusedOnly ? 'Unused Assets Only' : 'Filter Unused'}</span>
                </button>

                <div className="relative flex-1 md:w-64">
                  <Search className="text-muted-foreground absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search filename or alt text..."
                    className="border-border bg-card focus:border-primary/40 w-full rounded-lg border py-1.5 pl-8 pr-3 font-sans text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Body (Grid OR Upload Panel) */}
          <div className="bg-background min-h-[360px] flex-1 overflow-y-auto p-4">
            {showUploadTab ? (
              <div className="mx-auto max-w-xl space-y-5 py-8">
                <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
                  <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                    Upload & Compress Asset
                  </h4>

                  <div>
                    <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                      Target Folder
                    </label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="case-studies">Case Studies & Projects</option>
                      <option value="thinking">Thinking Articles</option>
                      <option value="prds">PRD Specifications</option>
                      <option value="diagrams">Architecture Diagrams</option>
                      <option value="general">General / Uncategorized</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground mb-1 block font-mono text-xs uppercase">
                      Alt Text / SEO Description
                    </label>
                    <input
                      type="text"
                      value={uploadAltText}
                      onChange={(e) => setUploadAltText(e.target.value)}
                      placeholder="e.g. System architecture overview diagram"
                      className="border-border bg-background focus:border-primary/40 w-full rounded-xl border px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="border-border bg-background flex items-center justify-between rounded-xl border p-3.5">
                    <span className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                      <Sliders className="h-4 w-4" />
                      <span>Auto-Compress WebP (82% quality)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enableCompression}
                      onChange={(e) => setEnableCompression(e.target.checked)}
                      className="border-border bg-card h-4 w-4 rounded text-amber-600"
                    />
                  </div>

                  <label className="border-primary/40 hover:border-primary/40 hover:bg-primary/90/10 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-indigo-500/5 px-6 py-10 transition-all">
                    {uploading ? (
                      <>
                        <Loader2 className="text-primary h-8 w-8 animate-spin" />
                        <span className="font-mono text-xs font-bold text-white">
                          Compressing & Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="text-primary h-10 w-10" />
                        <span className="text-sm font-bold text-white">
                          Click or Drop File Here
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          Supports PNG, JPG, WEBP, SVG & PDF Specs
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                <span className="text-muted-foreground font-mono text-xs uppercase">
                  Loading Inventory...
                </span>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="border-border flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
                <ImageIcon className="text-muted-foreground mb-2 h-10 w-10" />
                <p className="text-sm font-bold text-white">No assets found</p>
                <p className="text-muted-foreground mb-4 mt-1 text-xs">
                  No media items match this folder or search query.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUploadTab(true)}
                  className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white shadow"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Asset</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {mediaList.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isImage =
                    item.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.filename);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-primary/40 shadow-soft bg-indigo-500/10 ring-2 ring-indigo-500/40'
                          : 'border-border bg-card hover:border-border'
                      }`}
                    >
                      <div className="border-border bg-background relative flex h-36 items-center justify-center overflow-hidden border-b">
                        {isImage ? (
                          <img
                            src={item.url}
                            alt={item.alt_text || item.original_name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-3 text-emerald-400">
                            <FileText className="mb-1 h-8 w-8" />
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                              PDF Spec
                            </span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute left-2 top-2">
                          <span className="border-border bg-card text-foreground rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
                            {item.folder || 'general'}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="animate-scaleUp bg-primary absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-2.5">
                        <div>
                          <p
                            className="truncate text-xs font-bold text-white"
                            title={item.original_name}
                          >
                            {item.original_name}
                          </p>
                          <p
                            className="text-muted-foreground mt-0.5 truncate text-[10px] italic"
                            title={item.alt_text}
                          >
                            {item.alt_text || 'No alt text'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer (Inspector & Selection Confirmation) */}
          <div className="border-border bg-card flex flex-col items-center justify-between gap-4 border-t p-4 sm:flex-row">
            <div className="w-full min-w-0 sm:w-2/3">
              {selectedItem ? (
                <div className="border-border bg-background flex items-center justify-between gap-3 rounded-xl border p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-white">
                        {selectedItem.original_name}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        (
                        {selectedItem.size_bytes
                          ? `${Math.round(selectedItem.size_bytes / 1024)} KB`
                          : 'Asset'}
                        )
                      </span>
                    </div>

                    {editingAlt ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={altInput}
                          onChange={(e) => setAltInput(e.target.value)}
                          placeholder="Alt text / SEO..."
                          className="border-border bg-card flex-1 rounded border px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleUpdateAltText}
                          className="bg-primary hover:bg-primary/90 rounded p-1 text-white"
                        >
                          <Save className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-[11px]">
                        <span>Alt: {selectedItem.alt_text || 'None'}</span>
                        <button
                          type="button"
                          onClick={() => setEditingAlt(true)}
                          className="text-primary hover:text-primary flex items-center gap-0.5 font-mono text-[10px]"
                        >
                          <Edit2 className="h-2.5 w-2.5" /> Edit Alt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground font-mono text-xs italic">
                  Click any asset above to select and preview
                </span>
              )}
            </div>

            <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="bg-secondary text-foreground hover:bg-secondary shrink-0 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedItem}
                onClick={() => {
                  if (selectedItem && onSelect) {
                    onSelect(selectedItem.url, selectedItem);
                    onClose();
                  }
                }}
                className="bg-primary shadow-soft shadow-subtle hover:bg-primary/90 shrink-0 rounded-xl px-6 py-2.5 text-xs font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
              >
                Insert Selected Asset
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
