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
  Zap,
  Plus,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardWidgetsConfig {
  quickAction: boolean;        // ⚡ Rýchla akcia: Pridať testovací krok & vstupné dáta
  keyMetrics: boolean;         // 📊 4 Hlavné KPI karty
  detailedProgress: boolean;   // 📈 Detailný rozpad stavov testov
  epicsBreakdown: boolean;     // 🎯 Prehľad epicov a funkčných oblastí
  activeRuns: boolean;         // ▶️ Najnovšie testovacie behy
  slaBottlenecks: boolean;     // ⏱️ SLA úzke miesta a zdržania
  auditTrail: boolean;         // 📜 Nedávna aktivita a Audit Trail
}

const DEFAULT_WIDGETS_CONFIG: DashboardWidgetsConfig = {
  quickAction: true,
  keyMetrics: true,
  detailedProgress: true,
  epicsBreakdown: true,
  activeRuns: true,
  slaBottlenecks: true,
  auditTrail: true,
};

export default function DashboardPage() {
  const { user, activeProject, setActiveProject } = useAppStore();
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dashboard customization state
  const [widgetsConfig, setWidgetsConfig] = useState<DashboardWidgetsConfig>(DEFAULT_WIDGETS_CONFIG);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Quick Action Form State
  const [qaTestCaseId, setQaTestCaseId] = useState('');
  const [qaAction, setQaAction] = useState('');
  const [qaExpectedResult, setQaExpectedResult] = useState('');
  const [qaInputData, setQaInputData] = useState('');
  const [qaRequiresPhoto, setQaRequiresPhoto] = useState(false);
  const [qaAssignee, setQaAssignee] = useState('');
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaSuccessMessage, setQaSuccessMessage] = useState<{
    text: string;
    testCaseId: string;
    testCaseCode: string;
  } | null>(null);
  const [qaErrorMessage, setQaErrorMessage] = useState('');

  // Load widget customization preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rits_dashboard_widgets');
      if (saved) {
        setWidgetsConfig({ ...DEFAULT_WIDGETS_CONFIG, ...JSON.parse(saved) });
      }
    } catch {}
  }, []);

  const updateWidgetConfig = (key: keyof DashboardWidgetsConfig, value: boolean) => {
    const updated = { ...widgetsConfig, [key]: value };
    setWidgetsConfig(updated);
    try {
      localStorage.setItem('rits_dashboard_widgets', JSON.stringify(updated));
    } catch {}
  };

  const resetWidgetsConfig = () => {
    setWidgetsConfig(DEFAULT_WIDGETS_CONFIG);
    try {
      localStorage.setItem('rits_dashboard_widgets', JSON.stringify(DEFAULT_WIDGETS_CONFIG));
    } catch {}
  };

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

    api.get('/users').then((res: any) => setProjectUsers(res || [])).catch(() => {});

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

  // Handle Quick Add Step from Dashboard
  const handleQuickAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      setQaErrorMessage('Nie je vybraný žiaden projekt.');
      return;
    }
    if (!qaTestCaseId) {
      setQaErrorMessage('Prosím vyberte testovací scenár.');
      return;
    }
    if (!qaAction.trim() || !qaExpectedResult.trim()) {
      setQaErrorMessage('Akcia a Očakávaný výsledok sú povinné.');
      return;
    }

    setQaSubmitting(true);
    setQaErrorMessage('');
    setQaSuccessMessage(null);

    try {
      await api.post(`/projects/${activeProject.id}/test-cases/${qaTestCaseId}/steps`, {
        action: qaAction.trim(),
        expectedResult: qaExpectedResult.trim(),
        testData: qaInputData.trim() || undefined,
        requiresProofPhoto: qaRequiresPhoto,
        assignedToId: qaAssignee || undefined,
      });

      const matchedCase = testCases.find((c) => c.id === qaTestCaseId);
      setQaSuccessMessage({
        text: `Krok bol úspešne pridaný do scenára ${matchedCase ? matchedCase.code : ''}!`,
        testCaseId: qaTestCaseId,
        testCaseCode: matchedCase ? matchedCase.code : 'Scenár',
      });

      // Clear input fields
      setQaAction('');
      setQaExpectedResult('');
      setQaInputData('');
      setQaRequiresPhoto(false);
      setQaAssignee('');

      // Refresh test cases data to update dashboard counters
      const casesRes: any = await api.get(`/projects/${activeProject.id}/test-cases`).catch(() => []);
      setTestCases(casesRes || []);
    } catch (err: any) {
      setQaErrorMessage(
        err?.response?.data?.message || err.message || 'Nepodarilo sa vytvoriť krok.'
      );
    } finally {
      setQaSubmitting(false);
    }
  };

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
  const blockedSteps = allSteps.filter((s) => s.status === 'BLOCKED').length;
  const blockedPct = totalSteps > 0 ? Math.round((blockedSteps / totalSteps) * 100) : 0;
  const untestedPct =
    totalSteps > 0 ? Math.max(0, 100 - passedPct - failedPct - inProgressPct - blockedPct) : 100;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-500">
      {/* 1. Hero Welcome & Project Selector Banner */}
      <Card variant="bento" className="p-5 sm:p-8 bg-zinc-950/80 border-white/15 shadow-2xl relative overflow-hidden">
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {activeProject ? activeProject.name : 'RITS & HIVE2 Workbench'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Centrálny monitorovací dashboard pre testovacie scenáre POS, DOMS, SSR settlementu a SAP integrácií s evidenciou dôkazových fotografií a Confluence dokumentáciou.
              </p>
            </div>

            {/* Switch Project pills */}
            {allProjects.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-zinc-500">Zmeniť projekt:</span>
                <div className="flex flex-wrap gap-1.5">
                  {allProjects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <Link href="/docs">
              <Button variant="outline" size="sm" className="text-xs border-white/15">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Dokumentácia
              </Button>
            </Link>
            <Link href="/excel-import">
              <Button variant="outline" size="sm" className="text-xs border-white/15">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Importovať Excel
              </Button>
            </Link>
            <Link href="/test-runs">
              <Button variant="default" size="sm" className="text-xs font-semibold shadow-lg shadow-blue-600/25">
                <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Spustiť Test Run
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Dashboard Customization Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mr-1">
            Zobrazené Bloky:
          </span>

          <button
            type="button"
            onClick={() => updateWidgetConfig('quickAction', !widgetsConfig.quickAction)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              widgetsConfig.quickAction
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
            }`}
          >
            <Zap className="w-3 h-3 text-blue-400" />
            Rýchla akcia
          </button>

          <button
            type="button"
            onClick={() => updateWidgetConfig('keyMetrics', !widgetsConfig.keyMetrics)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              widgetsConfig.keyMetrics
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            KPI Metriky
          </button>

          <button
            type="button"
            onClick={() => updateWidgetConfig('detailedProgress', !widgetsConfig.detailedProgress)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              widgetsConfig.detailedProgress
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
            }`}
          >
            <BarChart3 className="w-3 h-3 text-purple-400" />
            Rozpad stavov
          </button>

          <button
            type="button"
            onClick={() => updateWidgetConfig('epicsBreakdown', !widgetsConfig.epicsBreakdown)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              widgetsConfig.epicsBreakdown
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
            }`}
          >
            <Target className="w-3 h-3 text-amber-400" />
            Epicy
          </button>

          <button
            type="button"
            onClick={() => updateWidgetConfig('activeRuns', !widgetsConfig.activeRuns)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              widgetsConfig.activeRuns
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
            }`}
          >
            <PlayCircle className="w-3 h-3 text-sky-400" />
            Behy
          </button>

          <button
            type="button"
            onClick={() => updateWidgetConfig('auditTrail', !widgetsConfig.auditTrail)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              widgetsConfig.auditTrail
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
            }`}
          >
            <History className="w-3 h-3 text-indigo-400" />
            Audit
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomizeModal(true)}
          className="h-8 text-xs border-white/20 hover:border-blue-400 shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Prispôsobiť Prehľad
        </Button>
      </div>

      {/* 2. Quick Action Widget: Pridať Testovací Krok & Vstupné Dáta */}
      {widgetsConfig.quickAction && (
        <Card variant="bento" className="p-5 sm:p-6 bg-zinc-950/90 border-blue-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Rýchla Akcia: Pridať Testovací Krok & Vstupné Dáta
                  <Badge variant="glass" className="text-[10px] text-blue-300 font-mono">PRIAMY VSTUP</Badge>
                </h2>
                <p className="text-xs text-zinc-400">
                  Pridajte nový krok, činnosť a payload priamo z prehľadu do vybraného testovacieho scenára.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateWidgetConfig('quickAction', false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors self-start sm:self-auto"
              title="Skryť tento widget"
            >
              ✕ Skryť
            </button>
          </div>

          {/* Success Banner */}
          {qaSuccessMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{qaSuccessMessage.text}</span>
              </div>
              <Link
                href={`/test-cases/${qaSuccessMessage.testCaseId}`}
                className="font-semibold underline flex items-center gap-1 hover:text-white shrink-0 ml-2"
              >
                Otvoriť scenár {qaSuccessMessage.testCaseCode} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Error Banner */}
          {qaErrorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{qaErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handleQuickAddStep} className="mt-4 space-y-3.5">
            {/* Test Case Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Vyberte Testovací Scenár <span className="text-rose-400">*</span>
              </label>
              <select
                value={qaTestCaseId}
                onChange={(e) => setQaTestCaseId(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 h-10 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Vyberte scenár zo zoznamu ({testCases.length} k dispozícii) --</option>
                {testCases.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.code} • {tc.title} ({tc.steps?.length || 0} krokov)
                  </option>
                ))}
              </select>
            </div>

            {/* Action and Expected Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Akcia / Činnosť <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={qaAction}
                  onChange={(e) => setQaAction(e.target.value)}
                  required
                  rows={2}
                  placeholder="Popíšte činnosť (napr. Vloženie karty, stlačenie tlačidla, volanie API...)"
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Očakávaný Výsledok <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={qaExpectedResult}
                  onChange={(e) => setQaExpectedResult(e.target.value)}
                  required
                  rows={2}
                  placeholder="Čo je očakávanou reakciou systému (napr. Zobrazenie dialógu, stav 200 OK...)"
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Input Data / Payload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Vstupné dáta (Payload, parametre, testovacie hodnoty, JSON dokladu)
              </label>
              <textarea
                value={qaInputData}
                onChange={(e) => setQaInputData(e.target.value)}
                rows={2}
                placeholder='Napr. { "cardNumber": "12345678", "action": "AUTH", "amount": 100 } alebo číslo účtu/dokladu...'
                className="w-full bg-zinc-950 font-mono border border-white/20 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Assignee & Proof Photo & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Priradiť:</span>
                  <select
                    value={qaAssignee}
                    onChange={(e) => setQaAssignee(e.target.value)}
                    className="bg-zinc-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Nepriradené --</option>
                    {projectUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={qaRequiresPhoto}
                    onChange={(e) => setQaRequiresPhoto(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-900 border-white/20 text-blue-600 focus:ring-0"
                  />
                  <span>📷 Vyžadovať povinnú fotku</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={qaSubmitting}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {qaSubmitting ? 'Pridávam...' : 'Pridať Krok do Scenára'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 3. Key Status Metrics Grid (4 Cards) */}
      {widgetsConfig.keyMetrics && (
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
              <div style={{ width: `${blockedPct}%` }} className="bg-amber-600 h-full" />
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
      )}

      {/* 4. Detailed Test Status Breakdown Card */}
      {widgetsConfig.detailedProgress && (
        <Card variant="glass" className="p-5 sm:p-6 bg-zinc-950/70 border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Detailný Rozpad Stavov Testovacích Krokov
              </h3>
              <p className="text-xs text-zinc-400">
                Priebežný súhrn všetkých {totalSteps} krokov naprieč {totalCases} testovacími scenármi projektu.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Celkovo krokov: <strong className="text-white">{totalSteps}</strong>
            </span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="w-full bg-white/[0.06] rounded-full h-3 overflow-hidden flex shadow-inner">
            <div style={{ width: `${passedPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Passed: ${passedSteps}`} />
            <div style={{ width: `${failedPct}%` }} className="bg-rose-500 transition-all duration-500" title={`Failed: ${failedSteps}`} />
            <div style={{ width: `${inProgressPct}%` }} className="bg-amber-500 transition-all duration-500" title={`In Progress: ${inProgressSteps}`} />
            <div style={{ width: `${blockedPct}%` }} className="bg-orange-500 transition-all duration-500" title={`Blocked: ${blockedSteps}`} />
            <div style={{ width: `${untestedPct}%` }} className="bg-zinc-700 transition-all duration-500" title={`Untested: ${untestedSteps}`} />
          </div>

          {/* Interactive Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono block">Passed (Úspešné)</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{passedSteps}</div>
              <span className="text-[11px] text-emerald-300 font-mono">{passedPct}% z celku</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-bold uppercase text-rose-400 font-mono block">Failed (Zlyhané)</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{failedSteps}</div>
              <span className="text-[11px] text-rose-300 font-mono">{failedPct}% z celku</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono block">V Riešení</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{inProgressSteps}</div>
              <span className="text-[11px] text-amber-300 font-mono">{inProgressPct}% z celku</span>
            </div>

            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] font-bold uppercase text-orange-400 font-mono block">Blocked (Blokované)</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{blockedSteps}</div>
              <span className="text-[11px] text-orange-300 font-mono">{blockedPct}% z celku</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400 font-mono block">Neotestované</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{untestedSteps}</div>
              <span className="text-[11px] text-zinc-400 font-mono">{untestedPct}% z celku</span>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Main Breakdown: Epics, Sub-Epics and Success Percentages */}
      {widgetsConfig.epicsBreakdown && (
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
      )}

      {/* 6. Bottom Grid: Active Runs and Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Runs */}
        {widgetsConfig.activeRuns && (
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
        )}

        {/* Right: Recent Audit Activities */}
        {widgetsConfig.auditTrail && (
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
        )}
      </div>

      {/* Customize Modal Dialog */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-lg p-6 shadow-2xl space-y-5 bg-zinc-950 border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-semibold text-white">Prispôsobiť Prehľad & Štatistiky</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Vyberte si, ktoré sekcie a štatistiky chcete na hlavnej stránke vidieť. Vaše preferencie sa automaticky ukladajú do prehliadača.
            </p>

            <div className="space-y-3">
              {/* Quick Action Toggle */}
              <div
                onClick={() => updateWidgetConfig('quickAction', !widgetsConfig.quickAction)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Rýchla Akcia (Pridať Krok & Dáta)</span>
                    <span className="text-[11px] text-zinc-400">Formulár pre okamžité pridanie testovacieho kroku a payloadu</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={widgetsConfig.quickAction}
                  readOnly
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Key Metrics Toggle */}
              <div
                onClick={() => updateWidgetConfig('keyMetrics', !widgetsConfig.keyMetrics)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Hlavné KPI Metriky</span>
                    <span className="text-[11px] text-zinc-400">Karty úspešnosti, počtu epicov, aktívnych behov a SLA</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={widgetsConfig.keyMetrics}
                  readOnly
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Detailed Progress Toggle */}
              <div
                onClick={() => updateWidgetConfig('detailedProgress', !widgetsConfig.detailedProgress)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Detailný Rozpad Stavov</span>
                    <span className="text-[11px] text-zinc-400">Percentá a počty Passed, Failed, In Progress a Untested</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={widgetsConfig.detailedProgress}
                  readOnly
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Epics Breakdown Toggle */}
              <div
                onClick={() => updateWidgetConfig('epicsBreakdown', !widgetsConfig.epicsBreakdown)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Prehľad Epicov & Funkčných Oblastí</span>
                    <span className="text-[11px] text-zinc-400">Rozpad systémov a modulov s viacfarebnými progress barmi</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={widgetsConfig.epicsBreakdown}
                  readOnly
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Active Runs Toggle */}
              <div
                onClick={() => updateWidgetConfig('activeRuns', !widgetsConfig.activeRuns)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <PlayCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Najnovšie Testovacie Behy</span>
                    <span className="text-[11px] text-zinc-400">Zoznam posledných exekúcií testov</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={widgetsConfig.activeRuns}
                  readOnly
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Audit Trail Toggle */}
              <div
                onClick={() => updateWidgetConfig('auditTrail', !widgetsConfig.auditTrail)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Nedávna Aktivita & Audit Trail</span>
                    <span className="text-[11px] text-zinc-400">Záznamy posledných zmien a udalostí v systéme</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={widgetsConfig.auditTrail}
                  readOnly
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetWidgetsConfig}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Resetovať na predvolené
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowCustomizeModal(false)}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500"
              >
                Hotovo
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
