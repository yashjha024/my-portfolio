import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MarkdownRenderer } from '../ui/MarkdownRenderer.jsx';
import { AutosaveIndicator } from './AutosaveIndicator.jsx';
import { MediaPickerModal } from './MediaPickerModal.jsx';
import api from '../../services/api.js';
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Code2,
  AlertCircle,
  GitBranch,
  Image as ImageIcon,
  FileText,
  Eye,
  Edit3,
  Columns,
  HelpCircle,
  X,
  UploadCloud,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const MarkdownEditor = ({
  value = '',
  onChange,
  onSave,
  autosaveStatus = 'saved',
  lastSavedAt = null,
  placeholder = 'Write or paste markdown content here... (supports tables, code blocks, callouts, and drag-and-drop uploads)',
  minHeight = '420px',
  label = null,
  required = false,
}) => {
  const [viewMode, setViewMode] = useState('split'); // 'write', 'preview', 'split'
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState('image'); // 'image' or 'pdf'
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [calloutDropdownOpen, setCalloutDropdownOpen] = useState(false);
  const [mermaidDropdownOpen, setMermaidDropdownOpen] = useState(false);
  const [codeDropdownOpen, setCodeDropdownOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadingDrop, setUploadingDrop] = useState(false);

  const textareaRef = useRef(null);

  // Automatically switch split to write/preview on narrow screens below 768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'split') {
        setViewMode('write');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Insert or wrap text at the current cursor selection
  const insertAtCursor = useCallback(
    (before, after = '', defaultText = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || defaultText;
      const replacement = `${before}${selected}${after}`;

      const newValue = value.slice(0, start) + replacement + value.slice(end);
      onChange?.(newValue);

      // Restore cursor or highlight inserted text after React re-render
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      }, 10);
    },
    [value, onChange]
  );

  // Keyboard Shortcuts Handler
  const handleKeyDown = useCallback(
    (e) => {
      // Ctrl/Cmd + S -> Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.(value, true);
        return;
      }
      // Ctrl/Cmd + B -> Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertAtCursor('**', '**', 'bold text');
        return;
      }
      // Ctrl/Cmd + I -> Italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertAtCursor('*', '*', 'italic text');
        return;
      }
      // Ctrl/Cmd + K -> Link
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        insertAtCursor('[', '](https://example.com)', 'link title');
        return;
      }
      // Ctrl/Cmd + Shift + C -> Code Block
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        insertAtCursor('```javascript\n', '\n```', '// Your code here');
        return;
      }
      // Ctrl/Cmd + Shift + T -> Table
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        insertAtCursor(
          '\n| Header 1 | Header 2 | Header 3 |\n|---|---|---|\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n',
          ''
        );
        return;
      }
      // Ctrl/Cmd + Shift + M -> Mermaid
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        insertAtCursor(
          '\n```mermaid\ngraph TD;\n User[User Action] --> System[Portfolio Service];\n System --> DB[(Supabase DB)];\n```\n',
          ''
        );
        return;
      }
    },
    [value, onSave, insertAtCursor]
  );

  // Drag and Drop Upload Handler directly onto textarea
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingDrop(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt_text', file.name.split('.')[0]);

        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && res.data?.data?.url) {
          const url = res.data.data.url;
          const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
          if (isPdf) {
            insertAtCursor(
              `\n[📄 Download Attached Specification PDF (${file.name})](${url})\n`,
              ''
            );
          } else {
            insertAtCursor(`\n![${file.name}](${url})\n`, '');
          }
        }
      }
    } catch (err) {
      console.error('Drop upload failed:', err);
      alert('Failed to upload dropped file.');
    } finally {
      setUploadingDrop(false);
    }
  };

  const handleMediaSelect = (url, asset) => {
    if (mediaPickerType === 'pdf') {
      insertAtCursor(
        `\n[📄 Download Attached Spec PDF (${asset?.original_name || 'Document'})](${url})\n`,
        ''
      );
    } else {
      insertAtCursor(`\n![${asset?.original_name || 'Illustration'}](${url})\n`, '');
    }
  };

  // Pre-configured insertion templates
  const insertCallout = (type = 'NOTE') => {
    insertAtCursor(
      `\n> [!${type}]\n> `,
      '\n',
      `Enter important ${type.toLowerCase()} details here...`
    );
    setCalloutDropdownOpen(false);
  };

  const insertMermaid = (type = 'flowchart') => {
    const templates = {
      flowchart:
        '\n```mermaid\ngraph LR;\n Client[Frontend Client] --> API[Express Gateway];\n API --> Auth[Supabase Auth];\n API --> DB[(PostgreSQL Store)];\n```\n',
      sequence:
        '\n```mermaid\nsequenceDiagram\n autonumber\n User->>+Client: Click Publish\n Client->>+API: PUT /api/admin/work/:id\n API->>+DB: Update status to published\n DB-->>-API: OK\n API-->>-Client: 200 Success\n```\n',
      erd: '\n```mermaid\nerDiagram\n USERS ||--o{ CASE_STUDIES : owns\n CASE_STUDIES ||--|{ METRICS : includes\n USERS {\n uuid id PK\n string email\n string role\n }\n```\n',
    };
    insertAtCursor(templates[type] || templates.flowchart, '');
    setMermaidDropdownOpen(false);
  };

  const insertCodeBlock = (lang = 'javascript') => {
    insertAtCursor(`\n\`\`\`${lang}\n`, '\n\`\`\`\n', '// Paste code snippet here...');
    setCodeDropdownOpen(false);
  };

  return (
    <div className="space-y-2 font-sans">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-foreground flex items-center gap-2 font-mono text-xs font-bold uppercase">
            <span>{label}</span>
            {required && <span className="text-rose-400">*</span>}
          </label>
          <div className="flex items-center gap-3 text-xs">
            <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />
            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              className="text-muted-foreground flex items-center gap-1 font-mono text-[11px] transition-colors hover:text-white"
              title="View Keyboard Shortcuts"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Editor Container */}
      <div className="border-border bg-card shadow-soft focus-within:border-primary/40 flex flex-col overflow-hidden rounded-2xl border transition-colors">
        {/* Editor Toolbar Header */}
        <div
          role="toolbar"
          aria-label="Markdown content editor toolbar"
          className="border-border bg-background sticky top-0 z-10 flex select-none flex-wrap items-center justify-between gap-2 border-b p-2"
        >
          {/* Left formatting group */}
          <div className="text-foreground flex flex-wrap items-center gap-1">
            {/* Mode Switcher Tabs */}
            <div
              role="tablist"
              className="border-border bg-card mr-2 flex items-center rounded-xl border p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'write'}
                onClick={() => setViewMode('write')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'write'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Write</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'split'}
                onClick={() => setViewMode('split')}
                className={`hidden items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all md:flex ${
                  viewMode === 'split'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'preview'}
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'preview'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <span className="bg-secondary mx-1 hidden h-5 w-px sm:inline-block" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => insertAtCursor('# ', '', 'Heading 1')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('## ', '', 'Heading 2')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('### ', '', 'Heading 3')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>

            <span className="bg-secondary mx-1 h-5 w-px" />

            {/* Basic Formatting */}
            <button
              type="button"
              onClick={() => insertAtCursor('**', '**', 'bold text')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('*', '*', 'italic text')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('`', '`', 'code')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n> ', '', 'Quote text')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </button>

            <span className="bg-secondary mx-1 h-5 w-px" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => insertAtCursor('\n- ', '', 'list item')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n1. ', '', 'numbered item')}
              className="text-foreground hover:bg-secondary rounded-lg p-1.5 transition-colors hover:text-white"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>

            <span className="bg-secondary mx-1 h-5 w-px" />

            {/* Table Insertion */}
            <button
              type="button"
              onClick={() =>
                insertAtCursor(
                  '\n| Feature | Status | Priority |\n|---|---|---|\n| Real-time Telemetry | Shipped | High |\n| Custom Layouts | In Progress | Medium |\n',
                  ''
                )
              }
              className="text-primary hover:bg-secondary hover:text-primary flex items-center gap-1 rounded-lg p-1.5 font-mono text-xs transition-colors"
              title="Insert Table (Ctrl+Shift+T)"
            >
              <TableIcon className="h-4 w-4" />
              <span className="hidden lg:inline">Table</span>
            </button>

            {/* Code Block Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCodeDropdownOpen(!codeDropdownOpen)}
                className="text-primary hover:bg-secondary hover:text-primary flex items-center gap-1 rounded-lg p-1.5 font-mono text-xs transition-colors"
                title="Insert Fenced Code Block (Ctrl+Shift+C)"
              >
                <Code2 className="h-4 w-4" />
                <span className="hidden lg:inline">Code</span>
              </button>
              {codeDropdownOpen && (
                <div className="border-border absolute left-0 top-full z-50 mt-1 w-44 space-y-0.5 rounded-xl border bg-slate-900 p-1.5 font-mono text-xs text-white shadow-xl">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                    Select Language
                  </div>
                  {['javascript', 'python', 'sql', 'json', 'bash', 'html', 'css'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => insertCodeBlock(lang)}
                      className="w-full rounded-lg px-2.5 py-1.5 text-left font-semibold capitalize text-slate-100 transition-colors hover:bg-emerald-600 hover:text-white"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Callouts Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalloutDropdownOpen(!calloutDropdownOpen)}
                className="hover:bg-secondary flex items-center gap-1 rounded-lg p-1.5 font-mono text-xs text-amber-400 transition-colors hover:text-amber-300"
                title="Insert GitHub-Style Callout Box"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="hidden lg:inline">Callout</span>
              </button>
              {calloutDropdownOpen && (
                <div className="border-border bg-card shadow-soft absolute left-0 top-full z-50 mt-1 w-48 space-y-0.5 rounded-xl border p-1.5 font-mono text-xs">
                  <div className="text-muted-foreground px-2 py-1 text-[10px] font-bold uppercase">
                    Alert Level
                  </div>
                  {[
                    { type: 'NOTE', label: 'ℹ️ Note (Info)' },
                    { type: 'TIP', label: '💡 Tip (Best Practice)' },
                    { type: 'IMPORTANT', label: '🔥 Important' },
                    { type: 'WARNING', label: '⚠️ Warning' },
                    { type: 'CAUTION', label: '🛑 Caution (Critical)' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => insertCallout(item.type)}
                      className="text-foreground hover:bg-primary w-full rounded-lg px-2.5 py-1.5 text-left transition-colors hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mermaid Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMermaidDropdownOpen(!mermaidDropdownOpen)}
                className="hover:bg-secondary flex items-center gap-1 rounded-lg p-1.5 font-mono text-xs text-violet-400 transition-colors hover:text-violet-300"
                title="Insert Mermaid Architecture Diagram (Ctrl+Shift+M)"
              >
                <GitBranch className="h-4 w-4" />
                <span className="hidden lg:inline">Mermaid</span>
              </button>
              {mermaidDropdownOpen && (
                <div className="border-border bg-card shadow-soft absolute left-0 top-full z-50 mt-1 w-52 space-y-0.5 rounded-xl border p-1.5 font-mono text-xs">
                  <div className="text-muted-foreground px-2 py-1 text-[10px] font-bold uppercase">
                    Diagram Type
                  </div>
                  {[
                    { id: 'flowchart', label: 'Flowchart Architecture' },
                    { id: 'sequence', label: 'Sequence Diagram' },
                    { id: 'erd', label: 'Entity Relationship (ERD)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => insertMermaid(item.id)}
                      className="text-foreground hover:bg-primary w-full rounded-lg px-2.5 py-1.5 text-left transition-colors hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Media Upload Group */}
          <div className="flex items-center gap-2">
            <label className="bg-secondary text-foreground hover:bg-secondary flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors">
              <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
              <span>Import .md</span>
              <input
                type="file"
                accept=".md,.markdown,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result;
                    if (typeof text === 'string') {
                      onChange?.(text);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setMediaPickerType('image');
                setMediaPickerOpen(true);
              }}
              className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors"
              title="Insert Image from Media Library"
            >
              <ImageIcon className="text-primary h-3.5 w-3.5" />
              <span>+ Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaPickerType('pdf');
                setMediaPickerOpen(true);
              }}
              className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors"
              title="Attach Downloadable PDF Spec"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>+ PDF</span>
            </button>
          </div>
        </div>

        {/* Editor & Preview Workspace Area */}
        <div
          className="divide-border relative flex flex-1 flex-col divide-y md:flex-row md:divide-x md:divide-y-0"
          style={{ minHeight }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag & Drop Upload Overlay */}
          {(isDraggingOver || uploadingDrop) && (
            <div className="animate-fadeIn border-primary/40 absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-b-2xl border-2 border-dashed bg-indigo-950/90 p-6 text-center">
              {uploadingDrop ? (
                <>
                  <Loader2 className="text-primary h-10 w-10 animate-spin" />
                  <p className="font-mono text-sm font-bold text-white">
                    Uploading & attaching files to markdown...
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="text-primary h-12 w-12 animate-bounce" />
                  <p className="text-base font-bold text-white">
                    Drop Images or PDF Specifications Here
                  </p>
                  <p className="text-primary font-mono text-xs">
                    Files will automatically upload and insert markdown links at your cursor
                    position.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Write / Editor Column */}
          {(viewMode === 'write' || viewMode === 'split') && (
            <div
              className={`flex min-w-0 flex-1 flex-col ${viewMode === 'split' ? 'md:w-1/2' : 'w-full'}`}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="bg-background text-foreground placeholder:text-muted-foreground focus:bg-background w-full flex-1 resize-y p-5 font-mono text-sm leading-relaxed transition-colors focus:outline-none"
                style={{ minHeight }}
              />
            </div>
          )}

          {/* Live Preview Column */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={`bg-background min-w-0 flex-1 overflow-y-auto p-6 ${
                viewMode === 'split' ? 'md:w-1/2' : 'w-full'
              }`}
              style={{ minHeight, maxHeight: viewMode === 'split' ? '680px' : 'none' }}
            >
              <div className="border-border text-muted-foreground mb-4 flex items-center justify-between border-b pb-3 font-mono text-xs">
                <span className="text-primary flex items-center gap-1.5 font-bold uppercase">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Real-Time Live Preview</span>
                </span>
                <span>GFM • Tables • Mermaid • Callouts</span>
              </div>
              <MarkdownRenderer content={value} />
            </div>
          )}
        </div>

        {/* Editor Status Footer */}
        <div className="border-border bg-background text-muted-foreground flex items-center justify-between border-t p-2.5 px-4 font-mono text-[11px]">
          <div className="flex items-center gap-4">
            <span>
              Lines: <strong className="text-foreground">{value.split('\n').length}</strong>
            </span>
            <span>
              Words:{' '}
              <strong className="text-foreground">
                {value.trim() ? value.trim().split(/\s+/).length : 0}
              </strong>
            </span>
            <span>
              Characters: <strong className="text-foreground">{value.length}</strong>
            </span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span>Drag & drop images/PDFs directly into editor</span>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        allowedTypes={mediaPickerType === 'pdf' ? 'pdf' : 'image'}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {shortcutsModalOpen && (
        <div className="animate-fadeIn bg-background fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="border-border bg-card shadow-soft relative w-full max-w-lg rounded-2xl border p-6">
            <div className="border-border mb-4 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <HelpCircle className="text-primary h-5 w-5" />
                <span>Editor Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="text-muted-foreground hover:bg-secondary rounded-lg p-1.5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-foreground space-y-2.5 font-mono text-xs">
              {[
                { keys: 'Ctrl / Cmd + S', action: 'Save / Trigger Autosave Immediately' },
                { keys: 'Ctrl / Cmd + B', action: 'Bold (**text**)' },
                { keys: 'Ctrl / Cmd + I', action: 'Italic (*text*)' },
                { keys: 'Ctrl / Cmd + K', action: 'Insert Hyperlink ([title](url))' },
                { keys: 'Ctrl / Cmd + Shift + C', action: 'Insert Fenced Code Block (```lang)' },
                {
                  keys: 'Ctrl / Cmd + Shift + T',
                  action: 'Insert 3x3 Table Template (| Header |)',
                },
                { keys: 'Ctrl / Cmd + Shift + M', action: 'Insert Mermaid Architecture Diagram' },
                {
                  keys: 'Drag & Drop File',
                  action: 'Uploads Image/PDF and Inserts Markdown Link at Cursor',
                },
              ].map((sc, idx) => (
                <div
                  key={idx}
                  className="border-border bg-background flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-primary font-bold">{sc.keys}</span>
                  <span className="text-muted-foreground text-right">{sc.action}</span>
                </div>
              ))}
            </div>

            <div className="border-border mt-6 border-t pt-4 text-right">
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="bg-primary hover:bg-primary/90 rounded-xl px-5 py-2 text-xs font-medium text-white"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
