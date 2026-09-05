'use client';

import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, Calendar, HardDrive, AlertCircle } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/api';

interface PhotoViewerModalProps {
  isOpen: boolean;
  attachment: {
    id?: string;
    fileName?: string;
    downloadUrl?: string;
    fileSizeBytes?: number | string;
    createdAt?: string;
  } | null;
  onClose: () => void;
}

export function PhotoViewerModal({ isOpen, attachment, onClose }: PhotoViewerModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [attachment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !attachment) return null;

  const mediaUrl = resolveAttachmentUrl(attachment);
  const fileName = attachment.fileName || 'fotografia.png';

  const formatFileSize = (bytes?: number | string) => {
    if (!bytes) return 'Neznáma veľkosť';
    const num = Number(bytes);
    if (num > 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`;
    if (num > 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${num} B`;
  };

  const formattedDate = attachment.createdAt
    ? new Date(attachment.createdAt).toLocaleString('sk-SK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-xs sm:text-sm font-mono text-white truncate">
            {fileName}
          </h3>
          <div className="flex flex-wrap items-center gap-2.5 text-[10px] sm:text-[11px] text-zinc-400 font-mono mt-0.5">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" /> {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-zinc-500" /> {formatFileSize(attachment.fileSizeBytes)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <a
            href={mediaUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Stiahnuť originál
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        className="relative max-w-5xl w-full max-h-[78vh] sm:max-h-[82vh] overflow-auto flex items-center justify-center p-2 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {imgError ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-xs text-zinc-300">Fotografiu sa nepodarilo načítať priamo v prehliadači.</p>
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-blue-400 underline font-mono"
            >
              Otvoriť súbor v novom okne
            </a>
          </div>
        ) : (
          <img
            src={mediaUrl}
            alt={fileName}
            onError={() => setImgError(true)}
            className="max-h-[72vh] sm:max-h-[78vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
          />
        )}
      </div>
    </div>
  );
}
