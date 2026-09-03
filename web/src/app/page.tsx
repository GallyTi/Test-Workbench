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
  BookOpen,
  Layers,
  Users,
  Target,
  BarChart3,
  Flame,
  Check,
  XCircle,
  Clock,
  CircleDashed,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, activeProject, setActiveProject } = useAppStore();
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all projects and initial data
  useEffect(() => {
    api
      .get('/projects')
      .then((res: any) => {
        setAllProjects(res || []);
        if (res?.length > 0 && !activeProject) {
          setActiveProject(res[0]);
        }
      })
      .catch(() => {});

    if (user?.role === 'ADMIN') {
      api
        .get('/users/pending')
        .then((res: any) => {
          setPendingUsersCount(Array.isArray(res) ? res.length : 0);
        })
        .catch(() => {});
    }
  }, [user]);

  // Fetch active project's epics, runs, bottlenecks, and test cases
  useEffect(() => {
    if (activeProject) {
      setLoading(true);
      Promise.all([
        api.get(`/projects/${activeProject.id}/epics`).catch(() => []),
        api.get(`/test-runs/project/${activeProject.id}`).catch(() => []),
        api.get(`/timers/admin/bottlenecks/project/${activeProject.id}`).catch(() => null),
        api.get('/audit-logs?limit=5').catch(() => []),
        api.get(`/projects/${activeProject.id}/test-cases`).catch(() => []),
      ]).then(([epicsRes, runsRes, bottleRes, logsRes, casesRes]: [any, any, any, any, any]) => {
        setEpics(epicsRes || []);
        setRuns(runsRes || []);
        setBottlenecks(bottleRes);
        setAuditLogs(logsRes || []);
        setTestCases(casesRes || []);
        setLoading(false);
      });
    }
  }, [activeProject]);

  // Calculate overall metrics
  const totalCases = testCases.length;
  let allSteps: any[] = [];
  testCases.forEach((tc) => {
    if (tc.steps && Array.isArray(tc.steps)) {
      allSteps.push(...tc.steps);
    }
  });

  const totalSteps = allSteps.length;
  const passedSteps = allSteps.filter((s) => s.status === 'PASSED').length;
  const failedSteps = allSteps.filter((s) => s.status === 'FAILED').length;
  const inProgressSteps = allSteps.filter((s) => s.status === 'IN_PROGRESS').length;
  const untestedSteps = allSteps.filter((s) => s.status === 'UNTESTED' || !s.status).length;

  const passedPct = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;
  const failedPct = totalSteps > 0 ? Math.round((failedSteps / totalSteps) * 100) : 0;
  const inProgressPct = totalSteps > 0 ? Math.round((inProgressSteps / totalSteps) * 100) : 0;
  const untestedPct =
    totalSteps > 0 ? Math.max(0, 100 - passedPct - failedPct - inProgressPct) : 100;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* 1. Hero Welcome & Project Selector Banner */}
      <Card variant="bento" className="p-6 sm:p-8 bg-zinc-950/80 border-white/15 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="glass" className="text-[10px] font-mono uppercase tracking-wider text-blue-400 border-blue-500/30">
                <Sparkles className="w-3 h-3 text-blue-400 mr-1" />
                {activeProject?.key || 'RITS'} • Integračný Prehľad
              </Badge>
              <Badge variant="outline" className="text-[10px] text-zinc-300">
                UAT & Release 2026
              </Badge>
              {pendingUsersCount > 0 && user?.role === 'ADMIN' && (
                <Link href="/admin/users">
                  <Badge variant="destructive" className="text-[10px] animate-pulse cursor-pointer">
                    ⚠️ {pendingUsersCount} čaká na schválenie
                  </Badge>
                </Link>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {activeProject ? activeProject.name : 'RITS & HIVE2 Workbench'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Centrálny monitorovací dashboard pre testovacie scenáre POS, DOMS, SSR settlementu a SAP integrácií s evidenciou dôkazových fotografií a Confluence dokumentáciou.
              </p>
            </div>

            {/* Switch Project pills */}
            {allProjects.length > 1 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-zinc-500">Zmeniť projekt:</span>
                <div className="flex flex-wrap gap-1.5">
                  {allProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveProject(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                        activeProject?.id === p.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/docs">
              <Button variant="outline" size="default" className="text-xs border-white/15">
                <BookOpen className="w-4 h-4 mr-1.5 text-blue-400" /> Dokumentácia
              </Button>
            </Link>
            <Link href="/excel-import">
              <Button variant="outline" size="default" className="text-xs border-white/15">
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-amber-400" /> Importovať Excel
              </Button>
            </Link>
            <Link href="/test-runs">
              <Button variant="default" size="default" className="text-xs font-semibold shadow-lg shadow-blue-600/25">
                <PlayCircle className="w-4 h-4 mr-1.5" /> Spustiť Test Run
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 2. Key Status Metrics Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Success Rate */}
        <Card variant="interactive" className="p-5 bg-zinc-950/60 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Úspešnosť Testov</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{passedPct}%</span>
            <span className="text-xs text-emerald-400 font-mono">({passedSteps} z {totalSteps})</span>
          </div>
          <div className="mt-3 w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden flex">
            <div style={{ width: `${passedPct}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${failedPct}%` }} className="bg-rose-500 h-full" />
            <div style={{ width: `${inProgressPct}%` }} className="bg-amber-500 h-full" />
          </div>
        </Card>

        {/* Metric 2: Epics and Sub-epics */}
        <Card variant="interactive" className="p-5 bg-zinc-950/60 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Epicy & Oblasti</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{epics.length}</span>
            <span className="text-xs text-zinc-400 font-mono">aktívnych epicov</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            {totalCases} testovacích scenárov v katalógu
          </p>
        </Card>

        {/* Metric 3: Active Test Runs */}
        <Card variant="interactive" className="p-5 bg-zinc-950/60 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Testovacie Behy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{runs.length}</span>
            <span className="text-xs text-blue-400 font-mono">
              ({runs.filter((r) => r.status === 'IN_PROGRESS').length} beží)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Priebežná tímová exekúcia testerov
          </p>
        </Card>

        {/* Metric 4: Bottlenecks & SLA Alerts */}
        <Card variant="interactive" className="p-5 bg-zinc-950/60 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">SLA Úzke Miesta</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {bottlenecks?.bottlenecks?.length || 0}
            </span>
            <span className="text-xs text-amber-400 font-mono">zdržaní</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Kroky vyžadujúce pozornosť lead-a
          </p>
        </Card>
      </div>

      {/* 3. Main Breakdown: Epics, Sub-Epics and Success Percentages */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" /> Prehľad Epicov a Stav Úspešnosti
            </h2>
            <p className="text-xs text-zinc-400">
              Rozpad funkčných oblastí projektu (WET, DRY, POS, SSR, SAP) a percentuálny progres testovania.
            </p>
          </div>

          <Link href="/test-cases">
            <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300">
              Zobraziť všetky v katalógu <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {epics.length === 0 ? (
          <Card variant="glass" className="p-8 text-center bg-zinc-950/40 border-white/10 space-y-3">
            <Target className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">V tomto projekte zatiaľ nie sú vytvorené žiadne Epicy.</p>
            <Link href="/excel-import">
              <Button size="sm" variant="outline" className="text-xs">
                Importovať testy a epicy z Excelu
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {epics.map((epic) => {
              // Collect all test cases under this epic (directly and via suites)
              const epicCases: any[] = [];
              if (epic.testCases) epicCases.push(...epic.testCases);
              if (epic.suites) {
                epic.suites.forEach((s: any) => {
                  if (s.testCases) epicCases.push(...s.testCases);
                });
              }

              // Collect all steps in this epic
              const epicSteps: any[] = [];
              epicCases.forEach((c) => {
                if (c.steps) epicSteps.push(...c.steps);
              });

              const eTotal = epicSteps.length;
              const ePassed = epicSteps.filter((s) => s.status === 'PASSED').length;
              const eFailed = epicSteps.filter((s) => s.status === 'FAILED').length;
              const eInProgress = epicSteps.filter((s) => s.status === 'IN_PROGRESS').length;
              const eUntested = epicSteps.filter((s) => s.status === 'UNTESTED' || !s.status).length;

              const ePassedPct = eTotal > 0 ? Math.round((ePassed / eTotal) * 100) : 0;
              const eFailedPct = eTotal > 0 ? Math.round((eFailed / eTotal) * 100) : 0;
              const eInProgPct = eTotal > 0 ? Math.round((eInProgress / eTotal) * 100) : 0;
              const eUntestedPct = eTotal > 0 ? Math.max(0, 100 - ePassedPct - eFailedPct - eInProgPct) : 100;

              return (
                <Card
                  key={epic.id}
                  variant="glass"
                  className="p-5 space-y-4 bg-zinc-950/70 border-white/10 hover:border-white/20 transition-all shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{epic.code}</span>
                        {epic.suites && epic.suites.length > 0 && (
                          <Badge variant="outline" className="text-[10px] text-zinc-400">
                            {epic.suites.length} sub-epicov
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{epic.title}</h3>
                      {epic.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">{epic.description}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-white font-mono">{ePassedPct}%</div>
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Úspešnosť</div>
                    </div>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden flex">
                      <div
                        style={{ width: `${ePassedPct}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                        title={`Passed: ${ePassed} (${ePassedPct}%)`}
                      />
                      <div
                        style={{ width: `${eFailedPct}%` }}
                        className="bg-rose-500 transition-all duration-500"
                        title={`Failed: ${eFailed} (${eFailedPct}%)`}
                      />
                      <div
                        style={{ width: `${eInProgPct}%` }}
                        className="bg-amber-500 transition-all duration-500"
                        title={`In Progress: ${eInProgress} (${eInProgPct}%)`}
                      />
                      <div
                        style={{ width: `${eUntestedPct}%` }}
                        className="bg-zinc-700 transition-all duration-500"
                        title={`Untested: ${eUntested} (${eUntestedPct}%)`}
                      />
                    </div>

                    {/* Legend counts */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" /> {ePassed} Úspešných
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <XCircle className="w-3 h-3" /> {eFailed} Zlyhaných
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3" /> {eInProgress} V riešení
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <CircleDashed className="w-3 h-3" /> {eUntested} Čakajúcich
                      </span>
                    </div>
                  </div>

                  {/* Sub-epics listing pills if present */}
                  {epic.suites && epic.suites.length > 0 && (
                    <div className="pt-2 border-t border-white/[0.08] flex flex-wrap gap-1.5">
                      {epic.suites.map((suite: any) => (
                        <span
                          key={suite.id}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-zinc-300"
                        >
                          {suite.title} ({suite.testCases?.length || 0} testov)
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Bottom Grid: Active Runs and Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Runs */}
        <Card variant="glass" className="p-6 space-y-4 bg-zinc-950/60 border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-400" /> Najnovšie Testovacie Behy
            </h3>
            <Link href="/test-runs" className="text-xs text-blue-400 hover:text-blue-300">
              Všetky behy →
            </Link>
          </div>

          <div className="space-y-2">
            {runs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center font-mono">Žiadne testovacie behy</p>
            ) : (
              runs.slice(0, 4).map((run) => (
                <Link
                  key={run.id}
                  href={`/test-runs/${run.id}`}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-between transition-colors block"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">{run.title}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Vytvoril: {run.createdBy?.fullName || 'Tester'}
                    </div>
                  </div>
                  <Badge
                    variant={run.status === 'COMPLETED' ? 'success' : 'warning'}
                    className="text-[10px] font-mono"
                  >
                    {run.status}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Right: Recent Audit Activities */}
        <Card variant="glass" className="p-6 space-y-4 bg-zinc-950/60 border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" /> Nedávna Aktivita & Audit Trail
            </h3>
            <Link href="/audit-logs" className="text-xs text-blue-400 hover:text-blue-300">
              Celý audit log →
            </Link>
          </div>

          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center font-mono">Žiadne zaznamenané akcie</p>
            ) : (
              auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-zinc-200 block truncate">{log.action}</span>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      {log.user?.fullName || 'Systém'} • {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                    {log.entityType}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
