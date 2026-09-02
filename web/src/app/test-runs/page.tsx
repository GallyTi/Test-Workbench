'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  PlayCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Play,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TestRunsPage() {
  const { activeProject } = useAppStore();
  const [runs, setRuns] = useState<any[]>([]);
  const [availableTestCases, setAvailableTestCases] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [environment, setEnvironment] = useState('STAGING');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuns = () => {
    if (activeProject) {
      api
        .get(`/test-runs/project/${activeProject.id}`)
        .then((res: any) => setRuns(res || []))
        .catch(() => {});
      api
        .get(`/projects/${activeProject.id}/test-cases`)
        .then((res: any) => setAvailableTestCases(res || []))
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [activeProject]);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCaseIds.length === 0) {
      alert('Vyberte aspoň jeden testovací scenár');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/test-runs/project/${activeProject!.id}`, {
        title,
        environment,
        testCaseIds: selectedCaseIds,
      });
      setShowCreateModal(false);
      setTitle('');
      setSelectedCaseIds([]);
      fetchRuns();
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa vytvoriť testovací beh');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCaseIds.length === availableTestCases.length) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(availableTestCases.map((tc) => tc.id));
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="glass" className="text-[10px] font-mono">
              EXEKÚCIA TESTOV
            </Badge>
            <span className="text-xs text-zinc-500">{runs.length} testovacích behov</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <PlayCircle className="w-6 h-6 text-zinc-300" />
            Testovacie Behy (Test Runs)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Spúšťanie integračných balíkov, tímová exekúcia krokov v reálnom čase a meranie SLA časovačov.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="default" size="default">
          <Plus className="w-4 h-4 mr-1" /> Spustiť Nový Run
        </Button>
      </div>

      {/* Runs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {runs.map((run) => (
          <Card
            key={run.id}
            variant="glass"
            className="p-5 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {run.environment}
                </Badge>
                <Badge
                  variant={run.status === 'COMPLETED' ? 'success' : 'info'}
                  className="text-[10px]"
                >
                  {run.status}
                </Badge>
              </div>

              <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-white transition-colors">
                {run.title}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                Vytvoril: {run.createdBy?.fullName || 'Test Lead'} •{' '}
                {new Date(run.createdAt).toLocaleDateString('sk-SK')}
              </p>

              {/* Progress Box */}
              <div className="mt-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Priebeh úspešnosti</span>
                  <span className="text-white font-mono font-medium">
                    {run.stats.progressPercentage}%
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-white/[0.04]">
                  <div
                    className="bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${run.stats.progressPercentage}%` }}
                  />
                  {run.stats.failedSteps > 0 && (
                    <div
                      className="bg-rose-500 rounded-full transition-all duration-500 ml-0.5"
                      style={{
                        width: `${(run.stats.failedSteps / (run.stats.totalSteps || 1)) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 pt-0.5">
                  <span>
                    {run.stats.totalTestCases} scenárov ({run.stats.totalSteps} krokov)
                  </span>
                  {run.stats.failedSteps > 0 && (
                    <span className="text-rose-400 font-medium">
                      {run.stats.failedSteps} chýb
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link href={`/test-runs/${run.id}`} className="mt-5 block">
              <Button variant="outline" className="w-full justify-between group-hover:border-white/30">
                <span>Otvoriť Exekúciu</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Modal: Create Run */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h2 className="text-base font-semibold text-white">
                Spustenie Testovacieho Behu
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRun} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Názov testovacieho behu
                </label>
                <Input
                  required
                  placeholder="napr. Release 2.5 - WET & POS Matrix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Cieľové Prostredie
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 h-10 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="STAGING">STAGING</option>
                  <option value="DEV">DEV</option>
                  <option value="PROD">PROD</option>
                  <option value="QA">QA</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Vybrané Scenáre ({selectedCaseIds.length}/{availableTestCases.length})
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-400 hover:underline font-medium"
                  >
                    {selectedCaseIds.length === availableTestCases.length
                      ? 'Odznačiť všetky'
                      : 'Označiť všetky'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/[0.08] rounded-xl p-2 bg-white/[0.02]">
                  {availableTestCases.map((tc) => (
                    <label
                      key={tc.id}
                      className="flex items-center gap-2 p-2 hover:bg-white/[0.05] rounded-lg cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCaseIds.includes(tc.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCaseIds([...selectedCaseIds, tc.id]);
                          else setSelectedCaseIds(selectedCaseIds.filter((id) => id !== tc.id));
                        }}
                        className="rounded bg-black border-white/[0.2] text-blue-600"
                      />
                      <span className="font-mono font-semibold text-blue-400">{tc.code}</span>
                      <span className="text-zinc-300 truncate">{tc.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default" disabled={loading}>
                  {loading ? 'Vytváram...' : 'Spustiť Test Run'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
