'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Search,
  Filter,
  ListOrdered,
  X,
  Tag,
  Clock,
  User,
  ShieldCheck,
  Building2,
  FileCode,
  Layers,
  ChevronRight,
  FolderTree,
  Folder,
  FolderOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TestCasesPage() {
  const router = useRouter();
  const { activeProject } = useAppStore();

  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');
  const [testCases, setTestCases] = useState<any[]>([]);
  const [epicsHierarchy, setEpicsHierarchy] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateEpicModal, setShowCreateEpicModal] = useState(false);
  const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
  const [targetEpicForSuite, setTargetEpicForSuite] = useState<string>('');

  // Form state: Epic
  const [epicCode, setEpicCode] = useState('');
  const [epicTitle, setEpicTitle] = useState('');
  const [epicDesc, setEpicDesc] = useState('');

  // Form state: Sub-Epic (Suite)
  const [suiteTitle, setSuiteTitle] = useState('');
  const [suiteDesc, setSuiteDesc] = useState('');
  const [suiteEpicId, setSuiteEpicId] = useState('');

  // Form state: Test Case
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [testType, setTestType] = useState('E2E');
  const [suiteId, setSuiteId] = useState('');
  const [epicId, setEpicId] = useState('');
  const [tagsInput, setTagsInput] = useState('WET, UAT, SSR');
  const [steps, setSteps] = useState([
    { stepNumber: 1, action: '', expectedResult: '', testData: '' },
  ]);

  const fetchData = async () => {
    if (!activeProject) return;

    try {
      const [casesRes, epicsRes, projRes]: [any, any, any] = await Promise.all([
        api.get(`/projects/${activeProject.id}/test-cases`),
        api.get(`/projects/${activeProject.id}/epics`),
        api.get(`/projects/${activeProject.id}`),
      ]);

      setTestCases(casesRes || []);
      setEpicsHierarchy(epicsRes || []);
      setSuites(projRes.suites || []);
    } catch (err) {
      console.error('Chyba načítania:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeProject]);

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !epicCode || !epicTitle) return;

    try {
      await api.post(`/projects/${activeProject.id}/epics`, {
        code: epicCode.toUpperCase(),
        title: epicTitle,
        description: epicDesc,
      });
      setShowCreateEpicModal(false);
      setEpicCode('');
      setEpicTitle('');
      setEpicDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Chyba pri vytváraní Epicu');
    }
  };

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !suiteTitle) return;

    try {
      await api.post(`/projects/${activeProject.id}/suites`, {
        title: suiteTitle,
        description: suiteDesc,
        epicId: suiteEpicId || targetEpicForSuite || undefined,
      });
      setShowCreateSuiteModal(false);
      setSuiteTitle('');
      setSuiteDesc('');
      setSuiteEpicId('');
      setTargetEpicForSuite('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Chyba pri vytváraní Sub-Epicu');
    }
  };

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.post(`/projects/${activeProject.id}/test-cases`, {
        code: code.toUpperCase(),
        title,
        description,
        preconditions,
        priority,
        testType,
        suiteId: suiteId || undefined,
        epicId: epicId || undefined,
        tags,
        steps: steps.map((s, idx) => ({
          stepNumber: idx + 1,
          action: s.action,
          expectedResult: s.expectedResult,
          testData: s.testData || undefined,
        })),
      });

      setShowCreateModal(false);
      setCode('');
      setTitle('');
      setDescription('');
      setPreconditions('');
      setSteps([{ stepNumber: 1, action: '', expectedResult: '', testData: '' }]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Chyba pri vytváraní testovacieho prípadu');
    }
  };

  const addStepRow = () => {
    setSteps([
      ...steps,
      { stepNumber: steps.length + 1, action: '', expectedResult: '', testData: '' },
    ]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const filtered = steps
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(filtered);
  };

  // Filtered test cases for flat view
  const filteredCases = testCases.filter(
    (tc) =>
      tc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="glass" className="text-[10px] font-mono">
              HIERARCHICKÝ KATALÓG
            </Badge>
            <span className="text-xs text-zinc-400 font-mono">
              Projekt: <strong className="text-white">{activeProject?.name || 'RITS'}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-blue-400" />
            Epicy, Sub-Epicy & Testovacie Scenáre
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Štruktúra projektu rozdelená na funkčné oblasti (Epics), moduly (Sub-Epics) a jednotlivé scenáre.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowCreateEpicModal(true)}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-white/20 hover:border-blue-400"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-blue-400" /> Nový Epic
          </Button>

          <Button
            onClick={() => {
              setSuiteEpicId('');
              setShowCreateSuiteModal(true);
            }}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-white/20 hover:border-purple-400"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-purple-400" /> Nový Sub-Epic
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="sm"
            className="h-8 text-xs font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Nový Test Scenár
          </Button>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <Card variant="glass" className="p-3 bg-zinc-950/80 border-white/15">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`flex-1 sm:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'hierarchy'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" /> Podľa Epicov & Sub-Epicov
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`flex-1 sm:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'flat'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Plochý Zoznam ({testCases.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Filtrovať scenáre podľa kódu, názvu alebo tagu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-zinc-900 border-white/15"
            />
          </div>
        </div>
      </Card>

      {/* MODE 1: HIERARCHY VIEW (Epics -> Sub-Epics / Suites -> Test Cases) */}
      {viewMode === 'hierarchy' && (
        <div className="space-y-6">
          {epicsHierarchy.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-950/60 rounded-2xl border border-white/10">
              V tomto projekte zatiaľ nie sú evidované žiadne Epicy. Vytvorte prvý Epic pomocou tlačidla vyššie.
            </div>
          ) : (
            epicsHierarchy.map((epic) => {
              // Calculate aggregated stats for Epic
              let allCasesInEpic: any[] = [...(epic.testCases || [])];
              epic.suites?.forEach((s: any) => {
                allCasesInEpic.push(...(s.testCases || []));
              });

              const totalStepsInEpic = allCasesInEpic.reduce(
                (acc, tc) => acc + (tc.steps?.length || 0),
                0
              );
              const passedStepsInEpic = allCasesInEpic.reduce(
                (acc, tc) =>
                  acc + (tc.steps?.filter((st: any) => st.status === 'PASSED').length || 0),
                0
              );
              const progressPct =
                totalStepsInEpic > 0 ? Math.round((passedStepsInEpic / totalStepsInEpic) * 100) : 0;

              return (
                <div
                  key={epic.id}
                  className="rounded-2xl border border-white/15 bg-zinc-950/90 shadow-xl overflow-hidden"
                >
                  {/* Epic Banner Header */}
                  <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-950/40 via-zinc-900/40 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-blue-400 px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded-lg">
                          {epic.code}
                        </span>
                        <Badge variant="glass" className="text-[10px]">
                          EPIC OBLASŤ
                        </Badge>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {epic.title}
                      </h2>
                      {epic.description && (
                        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{epic.description}</p>
                      )}
                    </div>

                    {/* Epic Rollup Progress & Action */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase block">
                          Pokrok Epicu
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {allCasesInEpic.length} scenárov • {progressPct}% hotovo
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetEpicForSuite(epic.id);
                          setSuiteEpicId(epic.id);
                          setShowCreateSuiteModal(true);
                        }}
                        className="h-8 text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10 font-medium"
                      >
                        <Plus className="w-3 h-3 mr-1 text-purple-400" /> Pridať Sub-Epic
                      </Button>
                    </div>
                  </div>

                  {/* Sub-Epics (Suites) inside this Epic */}
                  <div className="p-5 space-y-5">
                    {epic.suites?.length === 0 && (!epic.testCases || epic.testCases.length === 0) ? (
                      <div className="p-6 text-center text-zinc-500 text-xs italic bg-white/[0.01] rounded-xl border border-white/[0.04]">
                        Tento Epic zatiaľ nemá žiadne Sub-Epicy ani testovacie scenáre.
                      </div>
                    ) : (
                      epic.suites?.map((suite: any) => {
                        return (
                          <div
                            key={suite.id}
                            className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 space-y-3"
                          >
                            {/* Sub-Epic Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-purple-400" />
                                <h3 className="font-semibold text-xs text-zinc-200">
                                  Sub-Epic: <span className="text-white">{suite.title}</span>
                                </h3>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                                  {suite.testCases?.length || 0} testov
                                </Badge>
                              </div>

                              {suite.description && (
                                <span className="text-[11px] text-zinc-500 truncate max-w-md hidden md:inline">
                                  {suite.description}
                                </span>
                              )}
                            </div>

                            {/* Test Scenarios Grid inside this Sub-Epic */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {suite.testCases?.length === 0 ? (
                                <div className="col-span-full p-4 text-center text-zinc-500 text-xs italic">
                                  Žiadne testy v tomto Sub-Epicu.
                                </div>
                              ) : (
                                suite.testCases?.map((tc: any) => {
                                  const stepsPassed =
                                    tc.steps?.filter((s: any) => s.status === 'PASSED').length || 0;
                                  const totalSt = tc.steps?.length || 0;

                                  return (
                                    <div
                                      key={tc.id}
                                      onClick={() => router.push(`/test-cases/${tc.id}`)}
                                      className="p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 border border-white/[0.08] hover:border-blue-500/50 cursor-pointer transition-all shadow-sm hover:shadow-blue-500/10 flex flex-col justify-between group"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="font-mono font-bold text-xs text-blue-400 group-hover:text-blue-300">
                                            {tc.code}
                                          </span>
                                          <Badge
                                            variant={
                                              tc.priority === 'CRITICAL'
                                                ? 'danger'
                                                : tc.priority === 'HIGH'
                                                ? 'warning'
                                                : 'secondary'
                                            }
                                            className="text-[9px] py-0 px-1.5"
                                          >
                                            {tc.priority}
                                          </Badge>
                                        </div>
                                        <h4 className="font-semibold text-xs text-zinc-100 group-hover:text-white line-clamp-2 leading-snug">
                                          {tc.title}
                                        </h4>
                                      </div>

                                      <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                                        <span>
                                          {stepsPassed} / {totalSt} krokov splnených
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition-transform font-semibold">
                                          Otvoriť <ChevronRight className="w-3 h-3" />
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODE 2: FLAT LIST VIEW */}
      {viewMode === 'flat' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCases.map((tc) => (
            <Card
              key={tc.id}
              variant="interactive"
              onClick={() => router.push(`/test-cases/${tc.id}`)}
              className="p-5 flex flex-col justify-between cursor-pointer group bg-zinc-950/80 border-white/15"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-400 group-hover:text-blue-300">
                      {tc.code}
                    </span>
                    <Badge
                      variant={
                        tc.priority === 'CRITICAL'
                          ? 'danger'
                          : tc.priority === 'HIGH'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px] py-0 px-2"
                    >
                      {tc.priority}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {tc.testType}
                  </Badge>
                </div>

                <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                  {tc.title}
                </h3>

                {tc.description && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {tc.description}
                  </p>
                )}

                {/* Steps snippet */}
                <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span>Kroky scenára</span>
                    <span className="font-mono text-zinc-200">{tc.steps?.length || 0} krokov</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">
                  {tc.epic ? tc.epic.code : 'Bez Epicu'}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 group-hover:border-white/30"
                >
                  <span>Otvoriť Scenár</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Vytvorenie Nového Epicu */}
      {showCreateEpicModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl space-y-4 bg-zinc-950 border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-400" /> Vytvoriť Nový Epic
              </h2>
              <button
                onClick={() => setShowCreateEpicModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEpic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Kód Epicu (napr. EPIC-WET, EPIC-POS, EPIC-ERP)
                </label>
                <Input
                  required
                  placeholder="EPIC-WET-STOCK"
                  value={epicCode}
                  onChange={(e) => setEpicCode(e.target.value)}
                  className="h-9 text-xs font-mono uppercase bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Názov Epicu (Funkčná oblasť)
                </label>
                <Input
                  required
                  placeholder="WET - Wet Stock & Delivery Confirmation"
                  value={epicTitle}
                  onChange={(e) => setEpicTitle(e.target.value)}
                  className="h-9 text-xs bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Popis cieľa a rozsahu
                </label>
                <textarea
                  rows={2}
                  value={epicDesc}
                  onChange={(e) => setEpicDesc(e.target.value)}
                  placeholder="Validácia dodávok, stornovania a integrácie s SSR..."
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowCreateEpicModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default">
                  Vytvoriť Epic
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Vytvorenie Nového Sub-Epicu (Suite) */}
      {showCreateSuiteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl space-y-4 bg-zinc-950 border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-purple-400" /> Vytvoriť Nový Sub-Epic (Suite)
              </h2>
              <button
                onClick={() => setShowCreateSuiteModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSuite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nadradený Epic
                </label>
                <select
                  value={suiteEpicId || targetEpicForSuite}
                  onChange={(e) => setSuiteEpicId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 h-9 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Bez nadradeného Epicu --</option>
                  {epicsHierarchy.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.code} • {ep.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Názov Sub-Epicu / Testovacej Sady
                </label>
                <Input
                  required
                  placeholder="WET Station Delivery & Cancellation Suite"
                  value={suiteTitle}
                  onChange={(e) => setSuiteTitle(e.target.value)}
                  className="h-9 text-xs bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Popis Sub-Epicu
                </label>
                <textarea
                  rows={2}
                  value={suiteDesc}
                  onChange={(e) => setSuiteDesc(e.target.value)}
                  placeholder="Testovacia sada pokrývajúca..."
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowCreateSuiteModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default">
                  Vytvoriť Sub-Epic
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Vytvorenie Testovacieho Prípadu */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <Card variant="glass" className="w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8 bg-zinc-950 border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" /> Nový Testovací Scenár
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestCase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Priradiť k Epicu
                  </label>
                  <select
                    value={epicId}
                    onChange={(e) => setEpicId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 h-9 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Vyberte Epic --</option>
                    {epicsHierarchy.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.code} • {ep.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Priradiť k Sub-Epicu (Suite)
                  </label>
                  <select
                    value={suiteId}
                    onChange={(e) => setSuiteId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 h-9 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Vyberte Sub-Epic --</option>
                    {suites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Kód (ID)
                  </label>
                  <Input
                    required
                    placeholder="TC_WET_912"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-9 text-xs font-mono uppercase bg-zinc-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Názov Scenára
                  </label>
                  <Input
                    required
                    placeholder="WET delivery confirmation cancelation..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Predpoklady (Preconditions)
                </label>
                <textarea
                  rows={2}
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  placeholder="Počiatočný stav stanice, nádrží alebo dokladov..."
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Steps dynamic list */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Testovacie Kroky ({steps.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addStepRow}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Pridať Krok
                  </Button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {steps.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-900/90 rounded-xl border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-400">Krok #{idx + 1}</span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(idx)}
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <Input
                        required
                        placeholder="Akcia / Čo vykonať..."
                        value={s.action}
                        onChange={(e) => updateStep(idx, 'action', e.target.value)}
                        className="h-8 text-xs bg-zinc-950"
                      />
                      <Input
                        required
                        placeholder="Očakávaný výsledok..."
                        value={s.expectedResult}
                        onChange={(e) => updateStep(idx, 'expectedResult', e.target.value)}
                        className="h-8 text-xs bg-zinc-950"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default">
                  Uložiť Scenár
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
