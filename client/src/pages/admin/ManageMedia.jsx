import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog.jsx';
import { AssetPreviewModal } from '../../components/admin/AssetPreviewModal.jsx';
import { compressImageBeforeUpload } from '../../utils/imageCompressor.js';
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Folder,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  X,
  Eye,
} from 'lucide-react';

export const ManageMediaPage = () => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [unusedOnly, setUnusedOnly] = useState(false);

  // Upload modal & compression state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('general');
  const [uploadAltText, setUploadAltText] = useState('');
  const [enableCompression, setEnableCompression] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null); // { count, origBytes, compBytes }

  const [copiedUrl, setCopiedUrl] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const fileInputRef = useRef(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        folder: folderFilter,
        unused: unusedOnly ? 'true' : 'false',
        limit: '200',
      });
      if (search.trim()) params.append('q', search.trim());
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await api.get(`/media/list?${params.toString()}`);
      if (res.data?.success) {
        setMediaList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch media assets:', err);
      setError('Could not load media items from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [typeFilter, folderFilter, unusedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedia();
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files || (e.dataTransfer ? e.dataTransfer.files : null);
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      let origTotal = 0;
      let compTotal = 0;
      let count = 0;

      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        origTotal += rawFile.size;

        // Apply client-side compression if enabled and image
        let targetFile = rawFile;
        if (enableCompression && rawFile.type.startsWith('image/')) {
          const compResult = await compressImageBeforeUpload(rawFile, {
            quality: 0.82,
            outputFormat: 'image/webp',
          });
          targetFile = compResult.file;
          compTotal += compResult.compressedSize;
        } else {
          compTotal += rawFile.size;
        }

        const formData = new FormData();
        formData.append('file', targetFile);
        formData.append('alt_text', uploadAltText || rawFile.name.split('.')[0] || 'Media asset');
        formData.append('folder', selectedFolder);

        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && res.data?.data) {
          setMediaList((prev) => [res.data.data, ...prev]);
          count++;
        }
      }

      setUploadStats({
        count,
        origBytes: origTotal,
        compBytes: compTotal,
        savedPercent: origTotal > 0 ? ((1 - compTotal / origTotal) * 100).toFixed(1) : 0,
      });

      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadStats(null);
        setUploadAltText('');
      }, 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err?.response?.data?.error || 'Failed to upload one or more files.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (url, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const confirmDelete = (item, e) => {
    if (e) e.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/media/${itemToDelete.id}`);
      if (res.data?.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== itemToDelete.id));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete media asset.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleBatchDeleteUnused = async () => {
    const unusedItems = mediaList.filter((m) => !m.is_used);
    if (unusedItems.length === 0) return;

    if (
      !window.confirm(
        `Permanently delete ${unusedItems.length} unused/orphaned files from cloud storage? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setBatchDeleting(true);
      for (const item of unusedItems) {
        await api.delete(`/media/${item.id}`).catch(() => null);
      }
      setMediaList((prev) => prev.filter((m) => m.is_used));
      alert(`Successfully deleted ${unusedItems.length} orphaned files.`);
    } catch (err) {
      console.error('Batch delete error:', err);
      alert('Completed with partial errors.');
    } finally {
      setBatchDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const folders = [
    { id: 'all', label: 'All Folders', icon: Layers },
    { id: 'case-studies', label: 'Case Studies', icon: Folder },
    { id: 'thinking', label: 'Thinking Articles', icon: Folder },
    { id: 'prds', label: 'PRD Specifications', icon: Folder },
    { id: 'diagrams', label: 'Architecture Diagrams', icon: Folder },
    { id: 'general', label: 'General / Uncategorized', icon: Folder },
  ];

  const totalAssetsCount = mediaList.length;
  const unusedAssetsCount = mediaList.filter((m) => !m.is_used).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400 shadow-lg shadow-amber-500/5">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Media & Cloud Asset Library
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Manage cover illustrations, system diagrams, and specifications with auto-compression
              & usage tracking
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-amber-500"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload & Compress Asset</span>
        </button>
      </div>

      {/* Unused File Detection Telemetry Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:flex-row">
        <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="uppercase text-slate-500">Total Inventory:</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-bold text-white">
              {totalAssetsCount} files
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="uppercase text-slate-500">Active in Content:</span>
            <span className="flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> {totalAssetsCount - unusedAssetsCount} files
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="uppercase text-slate-500">Orphaned / Unused:</span>
            <span className="flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {unusedAssetsCount} files
            </span>
          </div>
        </div>

        <div className="flex w-full items-center gap-2.5 md:w-auto">
          <button
            type="button"
            onClick={() => setUnusedOnly(!unusedOnly)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
              unusedOnly
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{unusedOnly ? 'Showing Unused Only' : 'Filter Unused Assets'}</span>
          </button>

          {unusedAssetsCount > 0 && (
            <button
              type="button"
              disabled={batchDeleting}
              onClick={handleBatchDeleteUnused}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-600/10 px-3 py-2 text-xs font-medium text-rose-400 transition-all hover:bg-rose-600 hover:text-white disabled:opacity-50"
              title="Delete all orphaned/unused files across all folders"
            >
              {batchDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Clean Up Unused ({unusedAssetsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Folders Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-1 font-mono text-xs">
        {folders.map((f) => {
          const Icon = f.icon;
          const isActive = folderFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFolderFilter(f.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 font-bold transition-all ${
                isActive
                  ? 'border-indigo-500/40 bg-indigo-600/15 text-indigo-300 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex-row">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search filename or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 text-sm text-white transition-colors placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </form>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All File Types</option>
              <option value="image">Images (PNG/JPG/WEBP)</option>
              <option value="pdf">PDF Specifications</option>
            </select>
          </div>

          <button
            onClick={fetchMedia}
            className="rounded-xl bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700"
            title="Refresh Library"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Asset Grid */}
      {loading && mediaList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <span className="font-mono text-xs uppercase text-slate-400">
            Loading Media Inventory...
          </span>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <h3 className="mb-1 text-base font-bold text-white">No Assets Found</h3>
          <p className="mx-auto mb-6 max-w-sm text-xs text-slate-400">
            No files match your current folder or search criteria. Click below to upload assets.
          </p>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload New Asset</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {mediaList.map((item) => {
            const isImg = item.type === 'image' || /\.(png|jpe?g|webp|svg|gif)$/i.test(item.url);
            const isCopied = copiedUrl === item.url;

            return (
              <div
                key={item.id}
                onClick={() => setPreviewAsset(item)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg transition-all hover:-translate-y-1 hover:border-indigo-500/50"
              >
                {/* Usage Status Tag */}
                <div className="absolute left-2.5 top-2.5 z-10">
                  {item.is_used ? (
                    <span className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 shadow backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/90 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 shadow backdrop-blur-sm">
                      <AlertTriangle className="h-3 w-3 text-amber-400" /> Unused
                    </span>
                  )}
                </div>

                {/* Thumbnail Area */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-slate-800/80 bg-slate-950">
                  {isImg ? (
                    <img
                      src={item.url}
                      alt={item.alt_text || item.original_name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-emerald-400">
                      <FileText className="mb-2 h-12 w-12 opacity-80" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider">
                        PDF Document
                      </span>
                    </div>
                  )}

                  {/* Hover Actions Overlay */}
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewAsset(item);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-slate-200 shadow backdrop-blur-sm transition-colors hover:bg-slate-800"
                      title="Inspect & Edit Alt Text"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => confirmDelete(item, e)}
                      className="rounded-lg border border-rose-500 bg-rose-600/90 p-2 text-white shadow backdrop-blur-sm transition-colors hover:bg-rose-600"
                      title="Delete Asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white" title={item.original_name}>
                      {item.original_name}
                    </p>
                    <p
                      className="mt-0.5 truncate text-[11px] italic text-slate-400"
                      title={item.alt_text}
                    >
                      Alt: {item.alt_text || 'No alt text set'}
                    </p>
                    <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate-500">
                      <span className="rounded border border-slate-800/80 bg-slate-950 px-1.5 py-0.5 capitalize text-indigo-300">
                        {item.folder || 'general'}
                      </span>
                      <span>{formatFileSize(item.size_bytes)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(item.url, e)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isCopied
                        ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied CDN URL!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload & Compression Modal */}
      {uploadModalOpen && (
        <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <UploadCloud className="h-5 w-5 text-amber-400" />
                <span>Upload & Auto-Compress Asset</span>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target Organization Folder
                </label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="case-studies">Case Studies & Projects</option>
                  <option value="thinking">Thinking Articles</option>
                  <option value="prds">PRD Specifications</option>
                  <option value="diagrams">Architecture Diagrams</option>
                  <option value="general">General / Uncategorized</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Default Alt Text / SEO Description (Optional)
                </label>
                <input
                  type="text"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder="e.g. WhatsApp Group Event Coordinator Architecture Diagram"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Compression Toggle Box */}
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Sliders className="h-4 w-4" />
                    <span>Enable Client-Side Compression</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={enableCompression}
                    onChange={(e) => setEnableCompression(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-800 bg-slate-900 text-amber-600 focus:ring-0"
                  />
                </label>
                <p className="font-sans text-[11px] leading-relaxed text-slate-400">
                  Automatically resizes high-resolution PNG/JPG images and converts them to
                  optimized WebP format (up to 75-80% smaller) inside the browser before uploading
                  to cloud storage.
                </p>
              </div>

              {/* Upload Drop/File Selector Area */}
              <div className="pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  id="modal-asset-upload"
                />
                <label
                  htmlFor="modal-asset-upload"
                  className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 px-6 py-10 transition-all hover:border-amber-500 hover:bg-amber-500/10 ${
                    uploading ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                      <span className="font-mono text-sm font-bold text-white">
                        Processing, compressing & uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-12 w-12 animate-bounce text-amber-400" />
                      <span className="text-base font-bold text-white">
                        Click or Drop Images/PDFs Here
                      </span>
                      <span className="font-mono text-xs text-amber-300/80">
                        Supports PNG, JPG, WEBP, SVG & PDF Specs
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Live Savings Badge */}
              {uploadStats && (
                <div className="animate-fadeIn space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 font-mono text-xs text-emerald-300">
                  <div className="flex items-center justify-between font-bold">
                    <span>🎉 Uploaded {uploadStats.count} files successfully!</span>
                    <span>Saved {uploadStats.savedPercent}% bandwidth</span>
                  </div>
                  <div className="text-[11px] text-emerald-400/80">
                    Original: {formatFileSize(uploadStats.origBytes)} → Compressed:{' '}
                    {formatFileSize(uploadStats.compBytes)}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 text-right">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Preview & Alt Text Inspector Modal */}
      <AssetPreviewModal
        isOpen={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
        onUpdate={(updated) => {
          setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          setPreviewAsset(updated);
        }}
        onDelete={(deleted) => {
          setMediaList((prev) => prev.filter((m) => m.id !== deleted.id));
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Media Asset"
        description={
          itemToDelete
            ? `Are you sure you want to permanently delete "${itemToDelete.original_name}"? Any case study or article embedding this URL will display a broken image link.`
            : 'Are you sure?'
        }
        confirmText="Delete Asset"
        loading={deleting}
      />
    </div>
  );
};
