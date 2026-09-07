'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Save,
  Download,
  RotateCcw,
  Square,
  Circle,
  ArrowUpRight,
  Pencil,
  Type,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { api, resolveAttachmentUrl } from '@/lib/api';

interface ImageAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    id?: string;
    fileName?: string;
    downloadUrl?: string;
  } | null;
  targetType?: string;
  targetId?: string;
  onSaved?: (newAttachment: any) => void;
}

type ToolType = 'pen' | 'arrow' | 'rect' | 'circle' | 'text';

interface Shape {
  tool: ToolType;
  color: string;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  text?: string;
  points?: { x: number; y: number }[];
}

export function ImageAnnotationModal({
  isOpen,
  onClose,
  attachment,
  targetType = 'STEP_EXECUTION',
  targetId,
  onSaved,
}: ImageAnnotationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('arrow');
  const [color, setColor] = useState('#ef4444'); // Red by default for bugs
  const [lineWidth, setLineWidth] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined enterprise colors
  const COLORS = [
    { label: 'Chyba (Červená)', hex: '#ef4444' },
    { label: 'Varovanie (Žltá)', hex: '#eab308' },
    { label: 'OK / Passed (Zelená)', hex: '#10b981' },
    { label: 'Info (Modrá)', hex: '#3b82f6' },
    { label: 'Biela', hex: '#ffffff' },
  ];

  // Quick bug text templates
  const QUICK_TEXTS = [
    'CHYBA CENY',
    'TIMEOUT / ERROR',
    'NESPRÁVNY DOKLAD',
    'DOMS OFFLINE',
    'SHOWSTOPPER',
  ];

  // Load image onto canvas when modal opens
  useEffect(() => {
    if (!isOpen || !attachment) return;
    setError(null);
    setShapes([]);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = resolveAttachmentUrl(attachment);

    img.onload = () => {
      setBaseImage(img);
    };

    img.onerror = () => {
      setError('Nepodarilo sa načítať obrázok do editora. Skontrolujte formát súboru.');
    };
  }, [isOpen, attachment]);

  // Redraw canvas whenever baseImage, shapes or currentShape change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match natural image size (capped to 1920 max)
    const maxWidth = 1200;
    const maxHeight = 750;
    let width = baseImage.width;
    let height = baseImage.height;

    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    // Draw background image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Draw all committed shapes
    [...shapes, ...(currentShape ? [currentShape] : [])].forEach((s) => {
      drawShape(ctx, s);
    });
  }, [baseImage, shapes, currentShape]);

  const drawShape = (ctx: CanvasRenderingContext2D, s: Shape) => {
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'pen' && s.points && s.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    } else if (s.tool === 'rect') {
      const w = s.endX - s.startX;
      const h = s.endY - s.startY;
      ctx.strokeRect(s.startX, s.startY, w, h);
      ctx.fillStyle = s.color + '18';
      ctx.fillRect(s.startX, s.startY, w, h);
    } else if (s.tool === 'circle') {
      const radiusX = Math.abs(s.endX - s.startX) / 2;
      const radiusY = Math.abs(s.endY - s.startY) / 2;
      const centerX = Math.min(s.startX, s.endX) + radiusX;
      const centerY = Math.min(s.startY, s.endY) + radiusY;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = s.color + '18';
      ctx.fill();
    } else if (s.tool === 'arrow') {
      drawArrow(ctx, s.startX, s.startY, s.endX, s.endY, s.size);
    } else if (s.tool === 'text' && s.text) {
      ctx.font = `bold ${Math.max(13, s.size * 5)}px "Inter", -apple-system, sans-serif`;
      const textMetrics = ctx.measureText(s.text);
      const bgPadding = 6;
      const boxHeight = Math.max(13, s.size * 5) + bgPadding * 2;
      const boxWidth = textMetrics.width + bgPadding * 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(s.startX, s.startY - boxHeight + bgPadding, boxWidth, boxHeight);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.startX, s.startY - boxHeight + bgPadding, boxWidth, boxHeight);

      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.startX + bgPadding, s.startY - 2);
    }

    ctx.restore();
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number
  ) => {
    const headLen = Math.max(12, width * 4);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle - Math.PI / 6),
      toY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLen * Math.cos(angle + Math.PI / 6),
      toY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!baseImage) return;
    const coords = getCanvasCoords(e);

    if (currentTool === 'text') {
      setTextPos(coords);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    if (currentTool === 'pen') {
      setCurrentShape({
        tool: 'pen',
        color,
        size: lineWidth,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        points: [coords],
      });
    } else {
      setCurrentShape({
        tool: currentTool,
        color,
        size: lineWidth,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentShape) return;
    const coords = getCanvasCoords(e);

    if (currentShape.tool === 'pen') {
      setCurrentShape({
        ...currentShape,
        points: [...(currentShape.points || []), coords],
      });
    } else {
      setCurrentShape({
        ...currentShape,
        endX: coords.x,
        endY: coords.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);
    setShapes((prev) => [...prev, currentShape]);
    setCurrentShape(null);
  };

  const handleCommitText = () => {
    if (!textInput.trim()) {
      setShowTextInput(false);
      return;
    }
    setShapes((prev) => [
      ...prev,
      {
        tool: 'text',
        color,
        size: lineWidth,
        startX: textPos.x,
        startY: textPos.y,
        endX: textPos.x,
        endY: textPos.y,
        text: textInput.trim(),
      },
    ]);
    setTextInput('');
    setShowTextInput(false);
  };

  const handleUndo = () => {
    setShapes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    setShapes([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `annotated_${attachment?.fileName || 'screenshot.png'}`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSaveAndAttach = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !targetId) {
      handleDownload();
      return;
    }

    setIsSaving(true);
    setError(null);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsSaving(false);
        setError('Nepodarilo sa vytvoriť obrázok.');
        return;
      }

      const file = new File(
        [blob],
        `marked_${Date.now()}_${attachment?.fileName || 'screenshot.png'}`,
        { type: 'image/png' }
      );

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res: any = await api.post(`/attachments/${targetType}/${targetId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (onSaved) {
          onSaved(res);
        }
        onClose();
      } catch (err: any) {
        console.error('Chyba pri ukladaní označenej prílohy:', err);
        setError('Chyba pri ukladaní na server: ' + (err.message || 'Neznáma chyba'));
      } finally {
        setIsSaving(false);
      }
    }, 'image/png');
  };

  if (!isOpen || !attachment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Top Toolbar */}
      <div className="w-full max-w-6xl bg-zinc-950 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              Anotátor & Zvýrazňovač Chýb
              <Badge variant="purple" className="text-[10px] font-mono">
                Visual Proof
              </Badge>
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">
              Nakreslite šípky, obdĺžniky alebo poznámky priamo na screenshot
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={shapes.length === 0}
            title="Krok späť (Ctrl+Z)"
            className="h-8 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Späť ({shapes.length})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={shapes.length === 0}
            className="h-8 text-xs text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Vyčistiť
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            className="h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Stiahnuť
          </Button>

          <Button
            size="sm"
            variant="success"
            onClick={handleSaveAndAttach}
            disabled={isSaving}
            className="h-8 text-xs shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Ukladám...' : 'Uložiť ako Dôkaz'}
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Tool Controls */}
      <div className="w-full max-w-6xl my-2 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs">
        {/* Tool selectors */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-mono text-zinc-400 mr-1.5">Nástroj:</span>
          {[
            { id: 'arrow' as ToolType, label: 'Šípka', icon: ArrowUpRight },
            { id: 'rect' as ToolType, label: 'Obdĺžnik', icon: Square },
            { id: 'circle' as ToolType, label: 'Kruh', icon: Circle },
            { id: 'pen' as ToolType, label: 'Fixa', icon: Pencil },
            { id: 'text' as ToolType, label: 'Text', icon: Type },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setCurrentTool(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentTool === t.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-mono text-zinc-400 mr-1">Farba:</span>
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setColor(c.hex)}
              title={c.label}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c.hex ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Line Thickness */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Hrúbka:</span>
          <input
            type="range"
            min={1}
            max={8}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20 accent-blue-500 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-zinc-300 w-4">{lineWidth}px</span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative max-w-6xl w-full flex-1 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl">
        {error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-xs text-zinc-300">{error}</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="rounded-lg shadow-2xl cursor-crosshair max-w-full max-h-[68vh] object-contain border border-white/5"
          />
        )}

        {/* Floating Text Note Insertion Popover */}
        {showTextInput && (
          <div
            className="absolute z-20 bg-zinc-900 border border-white/20 p-2.5 rounded-xl shadow-2xl space-y-2"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Vložiť textovú poznámku</span>
              <button
                type="button"
                onClick={() => setShowTextInput(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitText();
                if (e.key === 'Escape') setShowTextInput(false);
              }}
              placeholder="Napíšte poznámku (napr. Chybná cena)..."
              className="w-64 bg-black/70 border border-white/15 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 max-w-xs">
              {QUICK_TEXTS.map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => setTextInput(txt)}
                  className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[9px] font-mono text-zinc-300 transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setShowTextInput(false)} className="h-7 text-xs">
                Zrušiť
              </Button>
              <Button size="sm" variant="primary" onClick={handleCommitText} className="h-7 text-xs">
                <Check className="w-3.5 h-3.5 mr-1" /> Vložiť
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
