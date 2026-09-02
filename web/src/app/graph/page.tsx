'use client';

import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '@/lib/api';
import { Network, Route, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ArchitectureGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sourceNode, setSourceNode] = useState('SYS_DOMS');
  const [targetNode, setTargetNode] = useState('SYS_SAP_CAR');
  const [pathResult, setPathResult] = useState<any>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    try {
      const [objsRes, relsRes]: [any, any] = await Promise.all([
        api.get('/graph/objects'),
        api.get('/graph/relationships'),
      ]);

      const initialNodes = objsRes.map((obj: any, index: number) => ({
        id: obj.objectId,
        position: { x: 80 + (index % 3) * 260, y: 60 + Math.floor(index / 3) * 160 },
        data: {
          label: (
            <div className="p-3 text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  {obj.objectType}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white/[0.08] text-zinc-300 rounded font-medium">
                  {obj.domain || 'CORE'}
                </span>
              </div>
              <div className="font-semibold text-xs text-white">{obj.name}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{obj.objectId}</div>
            </div>
          ),
          raw: obj,
        },
        style: {
          background: 'rgba(15, 15, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          minWidth: '200px',
        },
      }));

      const initialEdges = relsRes.map((rel: any) => ({
        id: rel.relationshipId,
        source: rel.sourceObjectId,
        target: rel.targetObjectId,
        label: rel.communicationType || rel.relationshipType,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#60a5fa', strokeWidth: 1.5 },
      }));

      setNodes(initialNodes);
      setEdges(initialEdges);
    } catch (err) {
      console.error('Chyba načítania grafu:', err);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleFindPath = async () => {
    setLoading(true);
    try {
      const res: any = await api.post('/graph/path', {
        source: sourceNode,
        target: targetNode,
      });
      setPathResult(res);

      if (res.found && res.nodes) {
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            style: {
              ...node.style,
              border: res.nodes.includes(node.id)
                ? '2px solid #10b981'
                : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: res.nodes.includes(node.id)
                ? '0 0 20px rgba(16,185,129,0.4)'
                : '0 10px 30px rgba(0,0,0,0.6)',
            },
          }))
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = async (_: any, node: any) => {
    setSelectedNodeData(node.data.raw);
    try {
      const impact: any = await api.get(`/graph/impact/${node.id}`);
      setImpactData(impact);
    } catch {
      setImpactData(null);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      {/* Top Query & Pathfinding Bar */}
      <Card variant="glass" className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/[0.04] border border-white/[0.08] text-zinc-200 rounded-xl">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-white">
              Architektúrny Graf & BFS Pathfinding
            </h1>
            <p className="text-[11px] text-zinc-400">
              Vizuálna topológia systémov a regresná analýza dopadu zmien na testy.
            </p>
          </div>
        </div>

        {/* Path Search Controls */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[0.08]">
          <span className="text-xs text-zinc-400 pl-2">Cesta:</span>
          <Input
            type="text"
            value={sourceNode}
            onChange={(e) => setSourceNode(e.target.value)}
            className="w-28 h-7 text-xs font-mono"
            placeholder="SYS_DOMS"
          />
          <span className="text-zinc-500 text-xs">➔</span>
          <Input
            type="text"
            value={targetNode}
            onChange={(e) => setTargetNode(e.target.value)}
            className="w-28 h-7 text-xs font-mono"
            placeholder="SYS_SAP_CAR"
          />
          <Button size="sm" variant="default" onClick={handleFindPath} disabled={loading} className="h-7 text-xs px-3">
            <Route className="w-3.5 h-3.5 mr-1" /> Nájsť Cestu
          </Button>
        </div>
      </Card>

      {/* Main Graph Split: Canvas (8 cols) + Detail & Impact (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[620px]">
        {/* Canvas */}
        <Card variant="glass" className="lg:col-span-8 p-0 overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls className="bg-black/60 border border-white/[0.1] rounded-xl text-white fill-white" />
            <MiniMap className="bg-black/80 border border-white/[0.1] rounded-xl" nodeColor="#38bdf8" />
          </ReactFlow>

          {pathResult && pathResult.found && (
            <div className="absolute top-4 left-4 z-10 glass-panel p-3 rounded-xl border border-emerald-500/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Nájdená cesta ({pathResult.pathLength} skokov)
              </div>
              <div className="font-mono text-[11px] text-zinc-300">
                {pathResult.nodes.join(' ➔ ')}
              </div>
            </div>
          )}
        </Card>

        {/* Right Detail Panel */}
        <Card variant="glass" className="lg:col-span-4 p-5 overflow-y-auto space-y-4">
          {selectedNodeData ? (
            <div>
              <div className="pb-3 border-b border-white/[0.08]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  {selectedNodeData.objectType}
                </span>
                <h2 className="text-base font-semibold text-white mt-0.5">
                  {selectedNodeData.name}
                </h2>
                <span className="text-xs text-zinc-500 font-mono">{selectedNodeData.objectId}</span>
              </div>

              {selectedNodeData.description && (
                <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                  {selectedNodeData.description}
                </p>
              )}

              {/* Regression Impact Analysis */}
              {impactData && (
                <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-purple-400" /> Regresný Dopad Zmien
                    </span>
                    <Badge variant="purple" className="text-[10px]">
                      {impactData.impactedTestCasesCount} testov
                    </Badge>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Testy, ktoré je odporúčané vykonať pri modifikácii tohto objektu:
                  </p>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {impactData.impactedTestCases?.map((tc: any) => (
                      <div
                        key={tc.testCaseId}
                        className="p-2 bg-black/40 rounded-lg border border-white/[0.06] text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-semibold text-blue-400 text-xs">
                            {tc.code}
                          </div>
                          <div className="text-[11px] text-zinc-300 truncate max-w-[180px]">
                            {tc.title}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px]">
                          {tc.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
              <Network className="w-8 h-8 text-zinc-600 mb-2" />
              Kliknite na uzol v grafe pre zobrazenie detailu, prepojení a regresného dopadu na testy.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
