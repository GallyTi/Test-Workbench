'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Trophy,
  Fuel,
  ShoppingCart,
  Car,
  Compass,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  Search,
  Check,
  X,
  Lock,
  Unlock,
  AlertOctagon,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { exportToCsv } from '@/lib/export-csv';

interface Waiver {
  id: string;
  testCaseCode: string;
  testCaseTitle: string;
  stream: string;
  defectReason: string;
  justification: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export default function SteeringCommitteePage() {
  const { user } = useAppStore();
  const [testCases, setTestCases] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<'ALL' | 'SK' | 'CZ' | 'RO' | 'PL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Waiver management modal
  const [waiverModalOpen, setWaiverModalOpen] = useState(false);
  const [selectedTestCaseForWaiver, setSelectedTestCaseForWaiver] = useState<any | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [waiverJustification, setWaiverJustification] = useState('');
  const [waiverExpiry, setWaiverExpiry] = useState('2026-10-31');

  // Stored approved waivers
  const [waivers, setWaivers] = useState<Waiver[]>([
    {
      id: 'WVR-2026-001',
      testCaseCode: 'TC-WET-004',
      testCaseTitle: 'Záložný offline režim výdaja pri prerušení IFSF zbernice',
      stream: 'WET',
      defectReason: 'DOMS 5000 hlási timeout pri 12 súčasných transakciách namiesto 16',
      justification: 'V prevádzke SeS sa nevyskytuje viac ako 8 stojanov súčasne v špičke. Riziko akceptované.',
      approvedBy: 'Steering Committee (Timo / Tomáš Vítek)',
      approvedAt: '2026-09-01T14:30:00Z',
      expiresAt: '2026-11-30',
      status: 'ACTIVE',
    },
    {
      id: 'WVR-2026-002',
      testCaseCode: 'TC-FIN-012',
      testCaseTitle: 'Generovanie ANAF XML súboru pre nefiskálne storná',
      stream: 'FIN',
      defectReason: 'Nesprávna štruktúra tagu <HeaderTaxRate> v Rumunsku',
      justification: 'Dodávateľ Fiscat dodá opravený firmware v2.4.1 do 14 dní.',
      approvedBy: 'Steering Committee (Ondro)',
      approvedAt: '2026-09-03T09:15:00Z',
      expiresAt: '2026-09-25',
      status: 'ACTIVE',
    },
  ]);

  useEffect(() => {
    Promise.all([
      api.get('/test-cases').catch(() => []),
      api.get('/test-runs').catch(() => []),
    ]).then(([casesRes, runsRes]) => {
      setTestCases(Array.isArray(casesRes) ? casesRes : []);
      setRuns(Array.isArray(runsRes) ? runsRes : []);
      setLoading(false);
    });
  }, []);

  // Filter test cases by selected market
  const filteredCases = testCases.filter((tc) => {
    if (selectedCountry === 'ALL') return true;
    const title = (tc.title || '').toUpperCase();
    const code = (tc.code || '').toUpperCase();
    const desc = (tc.description || '').toUpperCase();
    return title.includes(selectedCountry) || code.includes(selectedCountry) || desc.includes(selectedCountry);
  });

  // Calculate execution states
  const allExecutions = runs.flatMap((r: any) => r.executions || []);
  const getStepStatusForTestCase = (tcId: string) => {
    const execsForTc = allExecutions.filter((e: any) => e.testCaseId === tcId);
    if (execsForTc.length === 0) return 'PENDING';
    const steps = execsForTc.flatMap((e: any) => e.stepExecs || []);
    if (steps.some((s: any) => s.status === 'FAILED')) return 'FAILED';
    if (steps.some((s: any) => s.status === 'BLOCKED')) return 'BLOCKED';
    if (steps.length > 0 && steps.every((s: any) => s.status === 'PASSED')) return 'PASSED';
    return 'IN_PROGRESS';
  };

  const categorizeTest = (tc: any) => {
    const text = `${tc.code || ''} ${tc.title || ''} ${tc.description || ''} ${tc.epic?.name || ''}`.toUpperCase();
    const isWet = /WET|FUEL|DOMS|DISPENSER|PALIV|STOJAN|TANK|WAYNE|TOKHEIM|GILBARCO/.test(text);
    const isService = /WASH|UMYV|VYSAV|VYSÁVAČ|SERVICE|MAINTENANCE/.test(text);
    const isDry = /DRY|SHOP|GASTRO|FRESH|CORNER|MIGO|SKLAD|TOVAR|BARCODE|SCANNER/.test(text);
    return {
      isWet,
      isDry: isDry || (!isWet && !isService),
      isService,
    };
  };

  const calculateBadgeMetrics = (testsList: any[]) => {
    const total = testsList.length;
    let passed = 0;
    let showstoppers = 0;
    let pending = 0;

    testsList.forEach((tc) => {
      const st = getStepStatusForTestCase(tc.id);
      const isWaived = waivers.some((w) => w.testCaseCode === tc.code && w.status === 'ACTIVE');
      if (st === 'PASSED' || isWaived) {
        passed++;
      } else if (st === 'FAILED' || st === 'BLOCKED') {
        showstoppers++;
      } else {
        pending++;
      }
    });

    const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
    const isUnlocked = total > 0 && passed === total && showstoppers === 0;

    return {
      total,
      passed,
      showstoppers,
      pending,
      percent,
      isUnlocked,
      missingForOpening: total - passed,
    };
  };

  const wetTests = filteredCases.filter((tc) => categorizeTest(tc).isWet);
  const dryTests = filteredCases.filter((tc) => categorizeTest(tc).isDry);
  const serviceTests = filteredCases.filter((tc) => categorizeTest(tc).isService);
  const highwayTests = filteredCases;

  const BADGES = [
    {
      id: 'wet',
      name: 'wet SeS',
      title: 'Mokrá Čerpacia Stanica (Výdaj Palív & Bezpečnosť)',
      description: 'Základná prevádzkyschopnosť výdaja palív, komunikácia DOMS s čerpadlami a havarijné odpojenie.',
      icon: Fuel,
      color: 'blue',
      metrics: calculateBadgeMetrics(wetTests),
      tests: wetTests,
      stream: 'WET',
      owners: 'Timo, Tomáš Vítek',
    },
    {
      id: 'dry',
      name: 'dry SeS',
      title: 'Suchá Predajňa (Fresh Corner & Shop & Pokladňa)',
      description: 'Predaj tovaru, gastro prevádzka, skenovanie kódov, zľavové akcie Slovnaft Move a sklad MIGO.',
      icon: ShoppingCart,
      color: 'emerald',
      metrics: calculateBadgeMetrics(dryTests),
      tests: dryTests,
      stream: 'DSC / IMM',
      owners: 'Michal, Filip',
    },
    {
      id: 'service',
      name: 'service SeS',
      title: 'Doplnkové Služby (Autoumyváreň & Vysávače)',
      description: 'Generovanie kódov Istobal, tlakovanie pneumatík, vysávače a servisné strediská.',
      icon: Car,
      color: 'amber',
      metrics: calculateBadgeMetrics(serviceTests),
      tests: serviceTests,
      stream: 'SERVICE',
      owners: 'Prevádzkový tím SeS',
    },
    {
      id: 'highway',
      name: 'highway SeS',
      title: 'Diaľničná Stanica (Full Service 24/7 & B2B)',
      description: 'Kompletná prevádzka so všetkými modulmi, fleetovými kartami MOL/Slovnaft, eKasou a SAP ERP uzávierkami.',
      icon: Compass,
      color: 'purple',
      metrics: calculateBadgeMetrics(highwayTests),
      tests: highwayTests,
      stream: 'VŠETKY STREAMY',
      owners: 'Steering Committee / POs',
    },
  ];

  // Showstoppers across all tests
  const showstopperCases = filteredCases.filter((tc) => {
    const status = getStepStatusForTestCase(tc.id);
    const isWaived = waivers.some((w) => w.testCaseCode === tc.code && w.status === 'ACTIVE');
    return (status === 'FAILED' || status === 'BLOCKED') && !isWaived;
  });

  const handleGrantWaiver = (tc: any) => {
    setSelectedTestCaseForWaiver(tc);
    setWaiverReason(`Nájdená chyba počas exekúcie v teste ${tc.code}`);
    setWaiverJustification('');
    setWaiverModalOpen(true);
  };

  const handleSaveWaiver = () => {
    if (!selectedTestCaseForWaiver) return;

    const newWaiver: Waiver = {
      id: `WVR-2026-00${waivers.length + 1}`,
      testCaseCode: selectedTestCaseForWaiver.code,
      testCaseTitle: selectedTestCaseForWaiver.title,
      stream: categorizeTest(selectedTestCaseForWaiver).isWet ? 'WET' : 'DRY/FIN',
      defectReason: waiverReason,
      justification: waiverJustification || 'Schválené Steering Committee so zníženým rizikom.',
      approvedBy: `${user?.fullName || 'Admin'} (Steering Committee)`,
      approvedAt: new Date().toISOString(),
      expiresAt: waiverExpiry,
      status: 'ACTIVE',
    };

    setWaivers([newWaiver, ...waivers]);
    setWaiverModalOpen(false);
    setSelectedTestCaseForWaiver(null);
  };

  const handleRevokeWaiver = (id: string) => {
    setWaivers(waivers.map((w) => (w.id === id ? { ...w, status: 'REVOKED' } : w)));
  };

  const handleExportCsv = () => {
    exportToCsv(
      `Steering_Committee_SeS_Report_${selectedCountry}_${new Date().toISOString().slice(0, 10)}`,
      [
        { header: 'Kód Testu', accessor: 'code' },
        { header: 'Názov Testu', accessor: 'title' },
        { header: 'Status Exekúcie', accessor: (tc) => getStepStatusForTestCase(tc.id) },
        {
          header: 'Je Showstopper?',
          accessor: (tc) => {
            const st = getStepStatusForTestCase(tc.id);
            return st === 'FAILED' || st === 'BLOCKED' ? 'ÁNO - SHOWSTOPPER' : 'NIE';
          },
        },
        {
          header: 'Udelený Waiver?',
          accessor: (tc) => {
            const w = waivers.find((x) => x.testCaseCode === tc.code && x.status === 'ACTIVE');
            return w ? `ÁNO (${w.id})` : 'NIE';
          },
        },
      ],
      filteredCases
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-rose-950 border border-rose-500/20 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400">
                STEERING COMMITTEE GOVERNANCE
              </Badge>
              <Badge variant="default" className="text-[10px] bg-amber-600">
                GO / NO-GO ROZHODOVACÍ PORTÁL
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Scale className="w-8 h-8 text-rose-400" />
              Riadiaci Výbor & Posudzovanie SeS Brán (Steering Committee)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Definícia úspešného testovania v Slovnaft / MOL Group je{' '}
              <strong className="text-white">0 kritických chýb a 100% Passed</strong>. Každý test so zlyhaním je
              potenciálny <span className="text-rose-400 font-bold">showstopper</span> brániaci otvoreniu čerpacej
              stanice. Iný stav ako 100% Passed vyžaduje posúdenie a udelenie formálnej výnimky (waiveru) riadiacim výborom.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2 font-medium text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportovať Rozhodnutie do CSV
            </Button>
          </div>
        </div>

        {/* Market Selector Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-3">
          <span className="text-xs font-mono text-slate-400 shrink-0 mr-1">Trh:</span>
          {[
            { code: 'ALL', name: 'Všetky trhy', flag: '🌐' },
            { code: 'SK', name: 'Slovensko (eKasa)', flag: '🇸🇰' },
            { code: 'CZ', name: 'Česko (EET)', flag: '🇨🇿' },
            { code: 'RO', name: 'Rumunsko (ANAF)', flag: '🇷🇴' },
            { code: 'PL', name: 'Poľsko (Online Kasa)', flag: '🇵🇱' },
          ].map((m) => (
            <button
              key={m.code}
              onClick={() => setSelectedCountry(m.code as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                selectedCountry === m.code
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{m.flag}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4 SeS BADGES GRID WITH MISSING TESTS COUNT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            4 Úrovne SeS Pripravenosti (Koľko chýba do otvorenia stanice)
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            Kliknite na kartu odznaku pre okamžitý preklik do všetkých testov
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {BADGES.map((b) => {
            const Icon = b.icon;
            const hasShowstoppers = b.metrics.showstoppers > 0;

            return (
              <Card
                key={b.id}
                className={`p-5 space-y-4 transition-all hover:shadow-xl relative overflow-hidden group border-2 ${
                  b.metrics.isUnlocked
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : hasShowstoppers
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        b.metrics.isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : hasShowstoppers
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-extrabold uppercase tracking-wider block text-slate-900 dark:text-white">
                        &quot;{b.name}&quot;
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                        {b.stream} ({b.owners})
                      </span>
                    </div>
                  </div>

                  {b.metrics.isUnlocked ? (
                    <Badge variant="success" className="text-[10px] font-mono">
                      ODOMKNUTÝ
                    </Badge>
                  ) : hasShowstoppers ? (
                    <Badge variant="destructive" className="text-[10px] font-mono animate-pulse">
                      {b.metrics.showstoppers} STOPPER
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      PREBIEHA
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                    {b.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {b.description}
                  </p>
                </div>

                {/* Missing tests to open station KPI */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Chýba do otvorenia:</span>
                    <span
                      className={`font-mono font-extrabold text-sm ${
                        b.metrics.missingForOpening === 0
                          ? 'text-emerald-500'
                          : hasShowstoppers
                          ? 'text-rose-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {b.metrics.missingForOpening === 0
                        ? '0 (STANICA OTVORENÁ)'
                        : `${b.metrics.missingForOpening} testov`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.metrics.isUnlocked
                          ? 'bg-emerald-500'
                          : hasShowstoppers
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${b.metrics.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                    <span>Progres: {b.metrics.percent}%</span>
                    <span>
                      {b.metrics.passed} / {b.metrics.total} overených
                    </span>
                  </div>
                </div>

                {/* Click to open tests */}
                <Link href={`/test-cases?badge=${b.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold gap-1.5 border-slate-300 dark:border-white/15"
                  >
                    <span>Otvoriť všetky testy ({b.tests.length})</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SHOWSTOPPERS REQUIRING STEERING COMMITTEE ACTION */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              Aktuálne Showstoppery ({showstopperCases.length}) — Blokácie Otvorenia SeS
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Chyby v stave <span className="font-mono text-rose-500 font-bold">FAILED / BLOCKED</span>. Pre
              pokračovanie releasu musí Steering Committee chybu buď opraviť dodávateľom, alebo schváliť výnimku (Waiver).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Kritické blokácie: <strong className="text-rose-500 font-bold">{showstopperCases.length}</strong>
            </span>
          </div>
        </div>

        {showstopperCases.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Žiadne aktívne showstoppery pre vybraný trh!
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Všetky overované testy prešli alebo majú schválený formálny waiver od Steering Committee.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/[0.05]">
            {showstopperCases.map((tc) => {
              const status = getStepStatusForTestCase(tc.id);

              return (
                <div
                  key={tc.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {tc.code}
                        </span>
                        <Badge variant="destructive" className="text-[9px] font-mono">
                          SHOWSTOPPER ({status})
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {tc.epic?.name || 'Všeobecný modul'}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {tc.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {tc.description || 'Kritická chyba objavená počas exekúcie testovacieho behu.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      onClick={() => handleGrantWaiver(tc)}
                      className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-semibold"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Udeľ Waiver (Výnimku)
                    </Button>
                    <Link href={`/test-cases/${tc.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                        <span>Detail Testu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* AUDIT TRAIL OF APPROVED WAIVERS */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Evidencia Schválených Výnimiek (Waivers Audit Trail)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Právne záväzný zoznam schválených výnimiek s odôvodnením, schvaľovateľom a expiráciou.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {waivers.filter((w) => w.status === 'ACTIVE').length} AKTÍVNYCH VÝNIMIEK
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 font-mono text-[11px] border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-3">ID Waiveru</th>
                <th className="py-2.5 px-3">Kód & Názov Testu</th>
                <th className="py-2.5 px-3">Stream</th>
                <th className="py-2.5 px-3">Odôvodnenie Rizika (Justification)</th>
                <th className="py-2.5 px-3">Schválil</th>
                <th className="py-2.5 px-3">Platnosť do</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
              {waivers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {w.id}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 block">
                      {w.testCaseCode}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-xs block">
                      {w.testCaseTitle}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="outline" className="text-[9px] font-mono">
                      {w.stream}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 max-w-md text-slate-700 dark:text-zinc-300">
                    <p className="font-medium text-[11px]">{w.justification}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic mt-0.5">
                      Chyba: {w.defectReason}
                    </p>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                    {w.approvedBy}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                    {w.expiresAt}
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={w.status === 'ACTIVE' ? 'success' : 'outline'}
                      className="text-[9px] font-mono"
                    >
                      {w.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {w.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeWaiver(w.id)}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      >
                        Odvolať
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: GRANT WAIVER DIALOG */}
      {waiverModalOpen && selectedTestCaseForWaiver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Udelenie Výnimky (Steering Committee Waiver)
                </h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setWaiverModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1 font-mono">
                <span className="text-slate-400 block text-[10px]">Posudzovaný Test:</span>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {selectedTestCaseForWaiver.code} — {selectedTestCaseForWaiver.title}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Popis Zlyhania / Chyby:
                </label>
                <input
                  type="text"
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white dark:bg-black/50 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Odôvodnenie Riadiaceho Výboru (Business Justification & Mitigácia):
                </label>
                <textarea
                  rows={3}
                  value={waiverJustification}
                  onChange={(e) => setWaiverJustification(e.target.value)}
                  placeholder="Popíšte, prečo chyba neohrozuje prevádzku stanice a aké náhradné opatrenie je nasadené..."
                  className="w-full p-2 rounded-lg bg-white dark:bg-black/50 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Dátum Expirácie Výnimky:
                </label>
                <input
                  type="date"
                  value={waiverExpiry}
                  onChange={(e) => setWaiverExpiry(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white dark:bg-black/50 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setWaiverModalOpen(false)}>
                Zrušiť
              </Button>
              <Button
                size="sm"
                onClick={handleSaveWaiver}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Schváliť a Podpísať Výnimku
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
