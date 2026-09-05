'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Download,
  Calendar,
  HardDrive,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [attachment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
      if (e.key === '0') resetTransform();
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

  const zoomIn = () => setScale((s) => Math.min(4, Number((s + 0.25).toFixed(2))));
  const zoomOut = () =>
    setScale((s) => {
      const next = Math.max(0.5, Number((s - 0.25).toFixed(2)));
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const rotate = () => setRotation((r) => (r + 90) % 360);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetTransform();
    } else {
      setScale(2);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 text-white border-b border-white/10"
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

        {/* Zoom & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
          {!imgError && (
            <div className="flex items-center bg-zinc-900 border border-white/15 rounded-xl p-1 gap-1 shadow-lg">
              <button
                type="button"
                onClick={zoomOut}
                title="Oddialiť (-)"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetTransform}
                title="Obnoviť veľkosť (100%)"
                className="px-2 py-0.5 rounded-lg hover:bg-white/10 text-[11px] font-mono font-bold text-blue-300 transition-colors"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                title="Priblížiť (+)"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={rotate}
                title="Otočiť o 90°"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white border-l border-white/10 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

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
            title="Zavrieť (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        ref={containerRef}
        className={`relative max-w-6xl w-full flex-1 max-h-[78vh] overflow-hidden flex items-center justify-center my-auto p-2 rounded-2xl bg-zinc-950/90 border border-white/10 shadow-2xl ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
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
          <div
            className="transition-transform duration-75 origin-center flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={mediaUrl}
              alt={fileName}
              draggable={false}
              onError={() => setImgError(true)}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
            />
          </div>
        )}

        {/* Floating Zoom Hint */}
        {!imgError && scale === 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-zinc-400 font-mono">
            Koliesko myši alebo 2x klik pre priblíženie
          </div>
        )}
      </div>
    </div>
  );
}
