'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  PlayCircle,
  ClockAlert,
  FileSpreadsheet,
  Network,
  AlertTriangle,
  History,
  FileUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { activeProject } = useAppStore();
  const [runs, setRuns] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testCasesCount, setTestCasesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProject) {
      setLoading(true);
      Promise.all([
        api.get(`/test-runs/project/${activeProject.id}`).catch(() => []),
        api.get(`/timers/admin/bottlenecks/project/${activeProject.id}`).catch(() => null),
        api.get('/audit-logs?limit=5').catch(() => []),
        api.get(`/projects/${activeProject.id}/test-cases`).catch(() => []),
      ]).then(([runsRes, bottleRes, logsRes, casesRes]: [any, any, any, any]) => {
        setRuns((runsRes as any[]) || []);
        setBottlenecks(bottleRes);
        setAuditLogs((logsRes as any[]) || []);
        setTestCasesCount((casesRes as any[])?.length || 0);
        setLoading(false);
      });
    }
  }, [activeProject]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Hero Welcome Glass Bento Banner */}
      <Card variant="bento" className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="glass" className="text-[10px] font-mono uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-blue-400 mr-1" />
                {activeProject?.key || 'RITS'} • QA Core
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Active Matrix 2026
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {activeProject ? activeProject.name : 'Test & Architecture Graph Workbench'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Centrálna platforma pre tímovú exekúciu testovacích scenárov, SLA sledovanie zdržaní a overenie architektúrnych tokov (DOMS, SAP PO, SAP CAR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/excel-import">
              <Button variant="outline" size="default">
                <FileUp className="w-4 h-4 text-zinc-400" /> Importovať Excel
              </Button>
            </Link>
            <Link href="/test-runs">
              <Button variant="default" size="default">
                <PlayCircle className="w-4 h-4 mr-1" /> Spustiť Test Run
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 4 Bento Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: Active Test Runs */}
        <Card variant="interactive" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Testovacie Behy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {runs.length}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">aktívnych v cykle</span>
          </div>
        </Card>

        {/* Bento 2: Test Cases */}
        <Card variant="interactive" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Katalóg Scenárov</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
              {testCasesCount}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">podnikových testov</span>
          </div>
        </Card>

        {/* Bento 3: Pending QA */}
        <Card variant="interactive" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Čakajúce Kroky</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
              {bottlenecks?.pendingStepsCount || 0}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">v procese riešenia</span>
          </div>
        </Card>

        {/* Bento 4: Blocked Steps */}
        <Card variant="interactive" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Blokované Kroky</span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight">
              {bottlenecks?.blockedStepsCount || 0}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">vyžaduje zásah</span>
          </div>
        </Card>
      </div>

      {/* Main Bento Split: Live Test Execution Runs (Left 7) + Architecture & SLA (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Runs Matrix */}
        <div className="lg:col-span-7 space-y-4">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-white">
                  Aktívne Testovacie Behy (Live Runs)
                </h2>
              </div>
              <Link
                href="/test-runs"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Všetky behy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {runs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Žiadne spustené testovacie behy.
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <Link
                    key={run.id}
                    href={`/test-runs/${run.id}`}
                    className="block p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-100 group-hover:text-white transition-colors truncate">
                            {run.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {run.environment}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-zinc-500 block mt-0.5 font-mono">
                          Spustil: {run.createdBy?.fullName || 'Test Lead'}
                        </span>
                      </div>
                      <Badge
                        variant={run.status === 'COMPLETED' ? 'success' : 'info'}
                        className="shrink-0 text-[10px]"
                      >
                        {run.status}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                      <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                        <span>
                          Priebeh: <strong className="text-zinc-200">{run.stats.progressPercentage}%</strong>
                        </span>
                        <span>
                          {run.stats.passedSteps} / {run.stats.totalSteps} krokov
                          {run.stats.failedSteps > 0 && (
                            <span className="text-rose-400 font-semibold ml-1.5">
                              ({run.stats.failedSteps} chýb)
                            </span>
                          )}
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Architecture & SLA Bottlenecks */}
        <div className="lg:col-span-5 space-y-4">
          {/* Architecture Quick Link Bento */}
          <Card variant="bento" className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                  Znalostná Topológia
                </span>
                <h3 className="text-sm font-semibold text-white mt-1">
                  Architektúrny Graf & Toky
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  2D vizualizácia systémov DOMS, SAP PO, SAP CAR a BFS analýza dopadu zmien na testy.
                </p>
              </div>
              <Link href="/graph" className="shrink-0 mt-1">
                <Button variant="outline" size="sm">
                  <Network className="w-3.5 h-3.5 mr-1" /> Otvoriť
                </Button>
              </Link>
            </div>
          </Card>

          {/* Critical SLA Bottlenecks */}
          <Card variant="glass" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <ClockAlert className="w-3.5 h-3.5 text-amber-400" />
                SLA Zdržania & Čakajúce Kroky
              </h3>
              <Link
                href="/admin/bottlenecks"
                className="text-[11px] text-zinc-400 hover:text-white transition-colors"
              >
                SLA Report
              </Link>
            </div>

            <div className="space-y-2">
              {!bottlenecks?.criticalPendingSteps ||
              bottlenecks.criticalPendingSteps.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  Žiadne evidované zdržania.
                </p>
              ) : (
                bottlenecks.criticalPendingSteps.slice(0, 3).map((s: any) => (
                  <div
                    key={s.stepExecutionId}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-blue-400">
                          {s.testCaseCode}
                        </span>
                        <span className="text-zinc-500 font-mono">#{s.stepNumber}</span>
                        <Badge
                          variant={s.status === 'BLOCKED' ? 'danger' : 'warning'}
                          className="text-[9px] py-0 px-1.5"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <p className="text-zinc-300 text-[11px] truncate mt-0.5">
                        {s.action}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium shrink-0 font-mono">
                      {s.assignedTo}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Audit Trail Mini Feed */}
          <Card variant="glass" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-400" />
                Audit Trail (Zmeny)
              </h3>
              <Link
                href="/audit-logs"
                className="text-[11px] text-zinc-400 hover:text-white transition-colors"
              >
                História
              </Link>
            </div>

            <div className="space-y-2">
              {auditLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="font-medium text-zinc-200">
                      {log.user ? log.user.fullName : 'Systém'}
                    </span>
                    <span className="text-zinc-500 font-mono text-[10px] ml-1.5">
                      {log.action}
                    </span>
                    <p className="text-zinc-400 text-[11px] font-mono truncate">
                      {log.entityName}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
