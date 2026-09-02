'use client';

import React, { useEffect } from 'react';
import { X, Download, ZoomIn, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PhotoViewerModalProps {
  isOpen: boolean;
  attachment: {
    id: string;
    fileName: string;
    downloadUrl: string;
    fileSizeBytes?: number | string;
    createdAt?: string;
  } | null;
  onClose: () => void;
}

export function PhotoViewerModal({ isOpen, attachment, onClose }: PhotoViewerModalProps) {
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
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between pb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-semibold text-sm font-mono text-white truncate max-w-md">
            {attachment.fileName}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-0.5">
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

        <div className="flex items-center gap-2">
          {/* Download Original Full-Size Button */}
          <a
            href={attachment.downloadUrl}
            download={attachment.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Stiahnuť Plnú Veľkosť
          </a>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-zinc-300 hover:text-white transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        className="relative max-w-5xl max-h-[82vh] overflow-auto flex items-center justify-center p-2 rounded-2xl bg-zinc-950/60 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={attachment.downloadUrl}
          alt={attachment.fileName}
          className="max-h-[78vh] w-auto object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
