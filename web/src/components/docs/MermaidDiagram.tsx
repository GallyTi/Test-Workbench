'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Network, Copy, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace',
      themeVariables: {
        darkMode: true,
        background: '#090a0f',
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#60a5fa',
        lineColor: '#94a3b8',
        secondaryColor: '#8b5cf6',
        tertiaryColor: '#1e293b',
      },
    });

    const renderChart = async () => {
      if (!chart.trim()) return;
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        const { svg } = await mermaid.render(id, chart.trim());
        setSvgContent(svg);
        setError(null);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError('Neplatná syntax UML / Mermaid diagramu');
      }
    };

    renderChart();
  }, [chart]);

  const copyCode = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="my-4 p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 text-xs text-amber-300 font-mono space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <Network className="w-4 h-4" /> {error}
        </div>
        <pre className="p-3 bg-black/60 rounded-xl overflow-x-auto text-zinc-400">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-2xl bg-[#07080d] border border-white/15 overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.08] text-xs">
        <span className="font-mono font-bold text-blue-400 flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5" /> UML / Mermaid Diagram
        </span>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/50 rounded-lg border border-white/10 px-1 text-zinc-400">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              title="Oddialiť"
              className="p-1 hover:text-white"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
              title="Priblížiť"
              className="p-1 hover:text-white"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1)}
              title="Resetovať mierku"
              className="p-1 hover:text-white border-l border-white/10 ml-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/15 text-zinc-300 hover:text-white transition-colors text-[11px]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Skopírované
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Kopírovať kód
              </>
            )}
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="p-6 overflow-x-auto flex justify-center items-center min-h-[160px] transition-transform duration-200"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}
