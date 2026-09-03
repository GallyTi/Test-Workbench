'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Info,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Copy,
  Check,
  Film,
  Download,
  Maximize2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { MediaViewerModal } from '@/components/ui/MediaViewerModal';

interface DocMarkdownRendererProps {
  content: string;
  onSelectTestCase?: (code: string) => void;
}

export function DocMarkdownRenderer({ content, onSelectTestCase }: DocMarkdownRendererProps) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<any | null>(null);

  if (!content) {
    return (
      <div className="py-12 text-center text-zinc-500 text-xs italic">
        Táto stránka zatiaľ nemá žiadny obsah. Kliknite na "Upraviť stránku" a začnite písať.
      </div>
    );
  }

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Helper to parse block elements
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Callouts / Alerts: :::info, :::warning, :::tip, :::danger
    const calloutMatch = line.trim().match(/^:::(info|warning|tip|danger)$/i);
    if (calloutMatch) {
      const type = calloutMatch[1].toLowerCase();
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        calloutLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::

      const config = {
        info: {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
          icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
          title: 'Informácia',
        },
        warning: {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
          title: 'Upozornenie',
        },
        tip: {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
          icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
          title: 'Tip z praxe',
        },
        danger: {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
          title: 'Kritické / Dôležité',
        },
      }[type as 'info' | 'warning' | 'tip' | 'danger'] || {
        bg: 'bg-zinc-900 border-white/10 text-zinc-300',
        icon: <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />,
        title: 'Poznámka',
      };

      blocks.push(
        <div
          key={`callout-${i}`}
          className={`my-4 p-4 rounded-xl border flex gap-3 ${config.bg} shadow-sm`}
        >
          {config.icon}
          <div className="space-y-1 flex-1 text-xs leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-[10px] block opacity-80">
              {config.title}
            </span>
            <DocMarkdownRenderer content={calloutLines.join('\n')} onSelectTestCase={onSelectTestCase} />
          </div>
        </div>
      );
      continue;
    }

    // 2. Code Block: ```language
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const fullCode = codeLines.join('\n');
      const blockIdx = i;

      blocks.push(
        <div
          key={`code-${blockIdx}`}
          className="my-4 rounded-xl overflow-hidden border border-white/15 bg-zinc-950 shadow-lg text-xs"
        >
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-white/[0.08] text-zinc-400 font-mono text-[11px]">
            <span className="uppercase font-semibold text-blue-400">{lang}</span>
            <button
              onClick={() => copyToClipboard(fullCode, blockIdx)}
              className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
            >
              {copiedCodeIdx === blockIdx ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Skopírované
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Kopírovať
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-zinc-200 font-mono text-[11.5px] leading-relaxed">
            <code>{fullCode}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 3. Tables: | Header | Header |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        const bodyLines = tableLines.slice(2); // skip separator row

        blocks.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-white/15 bg-zinc-950/60 shadow-md">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/15 bg-white/[0.04]">
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} className="p-2.5 font-bold text-white font-mono text-[11px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {bodyLines.map((rowStr, rIdx) => {
                  const cells = rowStr
                    .split('|')
                    .slice(1, -1)
                    .map((c) => c.trim());
                  return (
                    <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 text-zinc-300">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Video Embed: !video[Title](url)
    const videoMatch = line.trim().match(/^!video\[(.*?)\]\((.*?)\)$/i);
    if (videoMatch) {
      const title = videoMatch[1] || 'Video záznam';
      const url = videoMatch[2];
      blocks.push(
        <div key={`video-${i}`} className="my-4 p-3 rounded-2xl border border-white/15 bg-zinc-950 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300 pb-1 border-b border-white/[0.06]">
            <span className="font-semibold flex items-center gap-1.5 font-mono">
              <Film className="w-3.5 h-3.5 text-blue-400" /> {title}
            </span>
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Stiahnuť video
            </a>
          </div>
          <video
            src={url}
            controls
            className="w-full max-h-[420px] rounded-xl bg-black object-contain shadow-inner"
          >
            Váš prehliadač nepodporuje prehrávanie tohto videa.
          </video>
        </div>
      );
      i++;
      continue;
    }

    // 5. Image Embed: ![alt](url)
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1] || 'Obrázok';
      const url = imgMatch[2];
      blocks.push(
        <div
          key={`img-${i}`}
          onClick={() => setLightboxMedia({ fileName: alt, downloadUrl: url })}
          className="group my-4 rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 p-2 cursor-pointer hover:border-blue-500/50 transition-all shadow-md relative"
        >
          <img
            src={url}
            alt={alt}
            className="w-full max-h-[480px] object-contain rounded-xl mx-auto"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
            <span className="px-3 py-1.5 rounded-xl bg-blue-600/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <Maximize2 className="w-3.5 h-3.5" /> Kliknite pre zväčšenie
            </span>
          </div>
          {alt && alt !== 'Obrázok' && (
            <p className="text-[11px] text-zinc-400 text-center mt-1.5 font-mono italic">
              {alt}
            </p>
          )}
        </div>
      );
      i++;
      continue;
    }

    // 6. Headings (# H1, ## H2, ### H3, #### H4)
    if (line.startsWith('# ')) {
      const text = line.slice(2);
      blocks.push(
        <h1 key={`h1-${i}`} id={slugifyHeading(text)} className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-6 mb-3 pb-2 border-b border-white/[0.08]">
          {renderInline(text)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      blocks.push(
        <h2 key={`h2-${i}`} id={slugifyHeading(text)} className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight mt-5 mb-2 pb-1 border-b border-white/[0.04]">
          {renderInline(text)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      blocks.push(
        <h3 key={`h3-${i}`} id={slugifyHeading(text)} className="text-sm sm:text-base font-bold text-zinc-200 mt-4 mb-1.5">
          {renderInline(text)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      const text = line.slice(5);
      blocks.push(
        <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold text-zinc-300 uppercase tracking-wider mt-3 mb-1">
          {renderInline(text)}
        </h4>
      );
      i++;
      continue;
    }

    // 7. Divider: --- or ***
    if (/^(\-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${i}`} className="my-6 border-white/10" />);
      i++;
      continue;
    }

    // 8. Blockquote: > text
    if (line.trim().startsWith('>')) {
      const clean = line.replace(/^>\s*/, '');
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 border-l-2 border-blue-500 pl-4 py-1 text-xs text-zinc-300 italic bg-white/[0.02] rounded-r-lg"
        >
          {renderInline(clean)}
        </blockquote>
      );
      i++;
      continue;
    }

    // 9. Bullet lists: - or •
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const clean = line.replace(/^[\-•]\s*/, '');
      blocks.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-xs text-zinc-200 my-1 leading-relaxed">
          {renderInline(clean)}
        </li>
      );
      i++;
      continue;
    }

    // 10. Numbered lists: 1. text
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      blocks.push(
        <li key={`num-${i}`} className="ml-5 list-decimal text-xs text-zinc-200 my-1 leading-relaxed">
          {renderInline(numMatch[2])}
        </li>
      );
      i++;
      continue;
    }

    // 11. Empty lines
    if (!line.trim()) {
      blocks.push(<div key={`blank-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Default paragraph
    blocks.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm text-zinc-300 leading-relaxed my-1.5">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  function slugifyHeading(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  function renderInline(text: string): React.ReactNode {
    // Regex matches:
    // **bold**, *italic*, ~~strike~~, `code`, [link](url), @TC_..., [[Page Title]]
    const regex = /(\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\)|\@TC_[A-Za-z0-9_]+|\[\[.*?\]\])/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Italic
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-zinc-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      // Strikethrough
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return (
          <del key={idx} className="line-through text-zinc-500">
            {part.slice(2, -2)}
          </del>
        );
      }
      // Code
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 bg-black/80 border border-white/15 rounded text-[11px] font-mono text-blue-300"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Link [label](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = linkMatch[2];
        const isAttachment = /\.(pdf|xlsx?|docx?|csv|zip)$/i.test(href);

        if (isAttachment) {
          return (
            <a
              key={idx}
              href={href}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-blue-600/20 border border-white/15 hover:border-blue-500/50 text-blue-300 font-mono text-xs my-0.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{label}</span>
              <Download className="w-3 h-3 text-zinc-400" />
            </a>
          );
        }

        return (
          <a
            key={idx}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-0.5"
          >
            {label}
            {href.startsWith('http') && <ExternalLink className="w-2.5 h-2.5" />}
          </a>
        );
      }
      // TestCase Reference @TC_UAT_911
      if (part.startsWith('@TC_')) {
        const tcCode = part.slice(1);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectTestCase?.(tcCode)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono text-[11px] font-semibold hover:bg-blue-500/30 transition-colors"
          >
            <span>🧪 {part}</span>
          </button>
        );
      }
      // Confluence wiki link [[Page Title]]
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const pageTitle = part.slice(2, -2);
        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[11px] font-medium"
          >
            📄 {pageTitle}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  }

  return (
    <div className="space-y-1">
      {/* Lightbox Modal */}
      <MediaViewerModal
        isOpen={!!lightboxMedia}
        attachment={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
      />
      {blocks}
    </div>
  );
}
