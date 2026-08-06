import React, { useState } from 'react';
import {
  Info,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Code2,
  GitBranch,
} from 'lucide-react';

const safeContentUrl = (value) =>
  /^(https?:\/\/|\/)/i.test(value?.trim() || '') ? value.trim() : null;

// Fenced Code Block with Copy Button and Syntax Header
const CodeBlockRender = ({ language = 'text', code = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMermaid = language.toLowerCase() === 'mermaid';

  if (isMermaid) {
    return (
      <div className="border-primary/40 bg-card shadow-soft group relative my-6 overflow-x-auto rounded-2xl border p-6">
        <div className="border-border text-primary mb-4 flex items-center justify-between border-b pb-3 font-mono text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <GitBranch className="h-4 w-4" />
            <span>Mermaid Architecture Diagram</span>
          </div>
          <button
            onClick={handleCopy}
            className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Copied Spec' : 'Copy Spec'}</span>
          </button>
        </div>
        <pre className="border-border bg-background overflow-x-auto rounded-xl border p-2 font-mono text-xs leading-relaxed text-indigo-200/90 sm:text-sm">
          <code>{code.trim()}</code>
        </pre>
        <p className="text-muted-foreground mt-3 text-center font-mono text-[11px] italic">
          💡 Interactive diagram visualization rendered via system architecture tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-background shadow-soft my-6 overflow-hidden rounded-2xl border">
      <div className="border-border bg-card text-muted-foreground flex items-center justify-between border-b px-4 py-2.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Code2 className="text-primary h-4 w-4" />
          <span className="text-foreground font-semibold uppercase tracking-wider">
            {language || 'CODE'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="bg-secondary text-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="text-foreground overflow-x-auto p-4 font-mono text-xs leading-relaxed sm:text-sm">
        <pre>
          <code>{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
};

// Callout Box (GitHub Alerts & Custom Blockquotes)
const CalloutRender = ({ type = 'note', title = null, content = '' }) => {
  const calloutMap = {
    note: {
      bg: 'bg-indigo-500/10 border-primary/40 text-primary',
      icon: Info,
      iconColor: 'text-primary',
      label: 'Note',
    },
    tip: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: Lightbulb,
      iconColor: 'text-emerald-400',
      label: 'Tip & Best Practice',
    },
    important: {
      bg: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
      icon: Flame,
      iconColor: 'text-violet-400',
      label: 'Important',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      label: 'Warning',
    },
    caution: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      label: 'Caution / Critical',
    },
  };

  const config = calloutMap[type.toLowerCase()] || calloutMap.note;
  const Icon = config.icon;

  return (
    <div className={`my-6 rounded-2xl border border-l-4 p-5 ${config.bg} shadow-soft space-y-2`}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
        <span className="font-mono text-xs uppercase tracking-wide">{title || config.label}</span>
      </div>
      <div className="text-foreground/90 whitespace-pre-wrap pl-7 font-sans text-sm leading-relaxed">
        {content.trim()}
      </div>
    </div>
  );
};

// Main Markdown String Parser and Renderer
export const MarkdownRenderer = ({ content = '', className = '' }) => {
  if (!content || typeof content !== 'string') {
    return (
      <div className={`text-muted-foreground text-sm italic ${className}`}>
        No content provided...
      </div>
    );
  }

  // Parse lines into structured blocks
  const lines = content.split('\n');
  const blocks = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Block / Mermaid
    if (trimmed.startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code') {
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        const lang = trimmed.slice(3).trim() || 'text';
        currentBlock = { type: 'code', language: lang, lines: [] };
      }
      continue;
    }

    if (currentBlock && currentBlock.type === 'code') {
      currentBlock.lines.push(line);
      continue;
    }

    // 2. Callouts (> [!NOTE] or > [!TIP] etc.)
    const calloutMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
    if (calloutMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        type: 'callout',
        calloutType: calloutMatch[1].toLowerCase(),
        title: calloutMatch[2] ? calloutMatch[2].trim() : null,
        lines: [],
      };
      continue;
    }

    // Standard Blockquote or Callout continuation
    if (trimmed.startsWith('>')) {
      if (currentBlock && currentBlock.type === 'callout') {
        const textWithoutArrow = trimmed.replace(/^>\s?/, '');
        currentBlock.lines.push(textWithoutArrow);
        continue;
      }
      if (currentBlock && currentBlock.type === 'blockquote') {
        currentBlock.lines.push(trimmed.replace(/^>\s?/, ''));
        continue;
      }
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'blockquote', lines: [trimmed.replace(/^>\s?/, '')] };
      continue;
    }

    // 3. Tables (| col | col |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.lines.push(trimmed);
        continue;
      }
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'table', lines: [trimmed] };
      continue;
    }

    // 4. Headings
    if (trimmed.startsWith('#')) {
      if (currentBlock) blocks.push(currentBlock);
      const level = trimmed.match(/^#+/)[0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      blocks.push({ type: 'heading', level: Math.min(level, 6), text });
      currentBlock = null;
      continue;
    }

    // 5. Lists (- or * or 1.)
    if (/^(-|\*|\d+\.)\s+/.test(trimmed)) {
      if (currentBlock && currentBlock.type === 'list') {
        currentBlock.items.push(trimmed);
        continue;
      }
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'list', items: [trimmed] };
      continue;
    }

    // Empty line separates blocks
    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Standard Paragraph continuation or start
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.lines.push(line);
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', lines: [line] };
    }
  }

  if (currentBlock) blocks.push(currentBlock);

  // Helper to render inline markdown (bold, italic, code, links, images) inside a text segment
  const renderInline = (text) => {
    if (!text) return null;

    // Split by Markdown links/images and inline code
    const parts = [];
    let remaining = text;
    let idx = 0;

    // Simple inline processing loop
    while (remaining.length > 0) {
      // Check for image ![alt](url)
      const imgMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      // Check for link [text](url)
      const linkMatch = remaining.match(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/);
      // Check for code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Check for bold **bold**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // Check for italic *italic*
      const italicMatch = remaining.match(/\*(?!\*)([^*]+)\*/);

      // Find earliest match
      const matches = [
        { type: 'image', match: imgMatch },
        { type: 'link', match: linkMatch },
        { type: 'code', match: codeMatch },
        { type: 'bold', match: boldMatch },
        { type: 'italic', match: italicMatch },
      ]
        .filter((m) => m.match && m.match.index !== undefined)
        .sort((a, b) => a.match.index - b.match.index);

      if (matches.length === 0) {
        parts.push(<span key={idx++}>{remaining}</span>);
        break;
      }

      const first = matches[0];
      const m = first.match;
      const beforeIndex = m.index;

      if (beforeIndex > 0) {
        parts.push(<span key={idx++}>{remaining.slice(0, beforeIndex)}</span>);
      }

      if (first.type === 'image') {
        const alt = m[1];
        const url = safeContentUrl(m[2]);
        if (!url) {
          parts.push(<span key={idx++}>{m[0]}</span>);
          remaining = remaining.slice(beforeIndex + m[0].length);
          continue;
        }
        const isPdf = url.toLowerCase().endsWith('.pdf') || alt.toLowerCase().includes('pdf');

        if (isPdf) {
          parts.push(
            <a
              key={idx++}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-primary/40 text-primary hover:bg-primary/90/20 my-3 inline-flex items-center gap-2 rounded-xl border bg-indigo-500/10 px-4 py-2.5 font-mono text-xs shadow-sm transition-colors"
            >
              <FileText className="text-primary h-4 w-4" />
              <span>{alt || 'Download Attached PDF Document'}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          );
        } else {
          parts.push(
            <span key={idx++} className="my-6 block">
              <img
                src={url}
                alt={alt || 'Content image'}
                className="border-border bg-background shadow-soft mx-auto max-h-[500px] w-auto rounded-2xl border object-contain"
              />
              {alt && (
                <span className="text-muted-foreground mt-2 block text-center font-mono text-xs">
                  {alt}
                </span>
              )}
            </span>
          );
        }
      } else if (first.type === 'link') {
        const text = m[1];
        const url = safeContentUrl(m[2]);
        if (!url) {
          parts.push(<span key={idx++}>{text}</span>);
          remaining = remaining.slice(beforeIndex + m[0].length);
          continue;
        }
        const isExternal = url.startsWith('http');
        parts.push(
          <a
            key={idx++}
            href={url}
            target={isExternal ? '_blank' : '_self'}
            rel={isExternal ? 'noopener noreferrer' : ''}
            className="text-primary hover:text-primary font-medium underline underline-offset-4 transition-colors"
          >
            {text}
          </a>
        );
      } else if (first.type === 'code') {
        parts.push(
          <code
            key={idx++}
            className="border-border bg-secondary text-primary rounded border px-1.5 py-0.5 font-mono text-xs"
          >
            {m[1]}
          </code>
        );
      } else if (first.type === 'bold') {
        parts.push(
          <strong key={idx++} className="font-bold text-white">
            {m[1]}
          </strong>
        );
      } else if (first.type === 'italic') {
        parts.push(
          <em key={idx++} className="text-foreground italic">
            {m[1]}
          </em>
        );
      }

      remaining = remaining.slice(beforeIndex + m[0].length);
    }

    return parts;
  };

  return (
    <div className={`text-foreground space-y-4 font-sans text-base leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          const Tag = `h${block.level}`;
          const styles = {
            1: 'text-3xl sm:text-4xl font-bold text-white tracking-tight mt-10 mb-4 border-b border-border pb-3',
            2: 'text-2xl sm:text-3xl font-bold text-white tracking-tight mt-8 mb-3 border-b border-border pb-2',
            3: 'text-xl sm:text-2xl font-bold text-white tracking-tight mt-6 mb-2.5',
            4: 'text-lg sm:text-xl font-bold text-white mt-5 mb-2',
            5: 'text-base font-bold text-white mt-4 mb-1.5 font-mono uppercase tracking-wider',
            6: 'text-sm font-bold text-muted-foreground mt-3 mb-1 font-mono uppercase tracking-widest',
          };
          return (
            <Tag key={idx} className={styles[block.level] || styles[3]}>
              {renderInline(block.text)}
            </Tag>
          );
        }

        if (block.type === 'code') {
          return (
            <CodeBlockRender key={idx} language={block.language} code={block.lines.join('\n')} />
          );
        }

        if (block.type === 'callout') {
          return (
            <CalloutRender
              key={idx}
              type={block.calloutType}
              title={block.title}
              content={block.lines.join('\n')}
            />
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              className="border-primary/40 bg-card text-foreground my-6 space-y-1 rounded-r-2xl border-l-4 px-5 py-3.5 italic shadow-md"
            >
              {block.lines.map((l, i) => (
                <p key={i}>{renderInline(l)}</p>
              ))}
            </blockquote>
          );
        }

        if (block.type === 'table') {
          const rows = block.lines
            .map((l) =>
              l
                .slice(1, -1)
                .split('|')
                .map((cell) => cell.trim())
            )
            .filter((row) => !row.every((cell) => /^-+$/.test(cell.replace(/:/g, ''))));

          if (rows.length === 0) return null;
          const [header, ...body] = rows;

          return (
            <div
              key={idx}
              className="border-border bg-background shadow-soft my-6 overflow-x-auto rounded-2xl border"
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-border bg-card text-primary border-b font-mono text-xs uppercase tracking-wider">
                    {header.map((th, i) => (
                      <th
                        key={i}
                        className="border-border border-r px-4 py-3.5 font-bold last:border-r-0"
                      >
                        {renderInline(th)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {body.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-card transition-colors">
                      {row.map((td, cIdx) => (
                        <td
                          key={cIdx}
                          className="border-border text-foreground border-r px-4 py-3 font-sans last:border-r-0"
                        >
                          {renderInline(td)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={idx} className="my-4 space-y-2 pl-2">
              {block.items.map((item, i) => {
                const cleaned = item.replace(/^(-|\*|\d+\.)\s+/, '');
                const isOrdered = /^\d+\./.test(item);
                return (
                  <li
                    key={i}
                    className="text-foreground flex items-start gap-2.5 text-sm sm:text-base"
                  >
                    <span className="text-primary mt-0.5 shrink-0 select-none font-mono font-bold">
                      {isOrdered ? `${i + 1}.` : '•'}
                    </span>
                    <div className="flex-1">{renderInline(cleaned)}</div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Default Paragraph
        const textContent = block.lines.join(' ');
        return (
          <p key={idx} className="text-foreground my-3 text-sm leading-relaxed sm:text-base">
            {renderInline(textContent)}
          </p>
        );
      })}
    </div>
  );
};
