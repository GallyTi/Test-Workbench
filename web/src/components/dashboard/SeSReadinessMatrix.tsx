'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Fuel,
  ShoppingCart,
  Car,
  Compass,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Trophy,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SeSReadinessMatrixProps {
  testCases: any[];
  runs: any[];
  onSelectCountry?: (country: string) => void;
}

export function SeSReadinessMatrix({ testCases = [], runs = [] }: SeSReadinessMatrixProps) {
  const [selectedCountry, setSelectedCountry] = useState<'ALL' | 'SK' | 'CZ' | 'RO' | 'PL'>('ALL');
  const [activeBadgeFilter, setActiveBadgeFilter] = useState<'ALL' | 'wet' | 'dry' | 'service' | 'highway'>('ALL');

  // Countries metadata
  const COUNTRIES = [
    { code: 'ALL', name: 'Všetky trhy', flag: '🌐' },
    { code: 'SK', name: 'Slovensko (eKasa)', flag: '🇸🇰' },
    { code: 'CZ', name: 'Česko (EET)', flag: '🇨🇿' },
    { code: 'RO', name: 'Rumunsko (ANAF)', flag: '🇷🇴' },
    { code: 'PL', name: 'Poľsko (Online Kasa)', flag: '🇵🇱' },
  ];

  // Stream Owners & Responsibilities
  const STREAMS = [
    {
      code: 'WET',
      name: 'WET Stream (Palivá & DOMS)',
      owners: ['Timo', 'Tomáš Vítek'],
      color: 'blue',
      badge: 'wet SeS',
      keywords: ['WET', 'FUEL', 'DOMS', 'DISPENSER', 'PALIV', 'STOJAN', 'TANK', 'CENA', 'PRICE'],
    },
    {
      code: 'DSC_IMM',
      name: 'DSC / IMM (Sklad & Fresh Corner)',
      owners: ['Michal', 'Filip'],
      color: 'emerald',
      badge: 'dry SeS',
      keywords: ['DRY', 'SHOP', 'GASTRO', 'FRESH', 'MIGO', 'INVENTORY', 'SKLAD', 'TOVAR', 'PREDAJ'],
    },
    {
      code: 'SERVICE',
      name: 'SERVICE Stream (Umývačka & Služby)',
      owners: ['Prevádzkový tím SeS'],
      color: 'amber',
      badge: 'service SeS',
      keywords: ['WASH', 'SERVICE', 'UMYV', 'VYSAV', 'VYSÁVAČ', 'AIR', 'VODA'],
    },
    {
      code: 'FIN',
      name: 'FIN Stream (Financie & Účtovníctvo)',
      owners: ['Ondro'],
      color: 'purple',
      badge: 'highway SeS',
      keywords: ['FIN', 'PAYMENT', 'BANK', 'PLATB', 'CARD', 'KARTA', 'TAX', 'DPH', 'EKASA'],
    },
    {
      code: 'OCI_SO',
      name: 'OCI / SO (Objednávky & B2B Karty)',
      owners: ['Tomáš', 'Zuzka'],
      color: 'rose',
      badge: 'highway SeS',
      keywords: ['OCI', 'SO', 'ORDER', 'FLEET', 'B2B', 'CONTRACT', 'ZMLUV'],
    },
  ];

  // Filter test cases by selected country
  const filteredCases = testCases.filter((tc) => {
    if (selectedCountry === 'ALL') return true;
    const title = (tc.title || '').toUpperCase();
    const code = (tc.code || '').toUpperCase();
    const desc = (tc.description || '').toUpperCase();
    return title.includes(selectedCountry) || code.includes(selectedCountry) || desc.includes(selectedCountry);
  });

  // Helper to categorize tests by SeS badge
  const categorizeTest = (tc: any) => {
    const text = `${tc.code || ''} ${tc.title || ''} ${tc.description || ''} ${tc.epic?.name || ''}`.toUpperCase();

    const isWet = /WET|FUEL|DOMS|DISPENSER|PALIV|STOJAN|TANK|WAYNE|TOKHEIM|GILBARCO/.test(text);
    const isService = /WASH|UMYV|VYSAV|VYSÁVAČ|SERVICE|MAINTENANCE/.test(text);
    const isDry = /DRY|SHOP|GASTRO|FRESH|CORNER|MIGO|SKLAD|TOVAR|BARCODE|SCANNER/.test(text);

    return {
      isWet,
      isDry: isDry || (!isWet && !isService), // default to dry/pos if not purely fuel or service
      isService,
    };
  };

  // Compute test execution stats
  const allExecutions = runs.flatMap((r: any) => r.executions || []);
  const allStepExecs = allExecutions.flatMap((e: any) => e.stepExecs || []);

  const getStepStatusForTestCase = (tcId: string) => {
    const execsForTc = allExecutions.filter((e: any) => e.testCaseId === tcId);
    if (execsForTc.length === 0) return 'PENDING';
    const steps = execsForTc.flatMap((e: any) => e.stepExecs || []);
    if (steps.some((s: any) => s.status === 'FAILED')) return 'FAILED';
    if (steps.some((s: any) => s.status === 'BLOCKED')) return 'BLOCKED';
    if (steps.length > 0 && steps.every((s: any) => s.status === 'PASSED')) return 'PASSED';
    return 'IN_PROGRESS';
  };

  // Group into the 4 Badges
  const wetTests = filteredCases.filter((tc) => categorizeTest(tc).isWet);
  const dryTests = filteredCases.filter((tc) => categorizeTest(tc).isDry);
  const serviceTests = filteredCases.filter((tc) => categorizeTest(tc).isService);
  const highwayTests = filteredCases; // Highway requires all streams

  const calculateBadgeMetrics = (testsList: any[]) => {
    const total = testsList.length;
    let passed = 0;
    let showstoppers = 0;
    let pending = 0;

    testsList.forEach((tc) => {
      const st = getStepStatusForTestCase(tc.id);
      if (st === 'PASSED') passed++;
      else if (st === 'FAILED' || st === 'BLOCKED') showstoppers++;
      else pending++;
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
      remainingSteps: total - passed,
    };
  };

  const wetMetrics = calculateBadgeMetrics(wetTests);
  const dryMetrics = calculateBadgeMetrics(dryTests);
  const serviceMetrics = calculateBadgeMetrics(serviceTests);
  const highwayMetrics = calculateBadgeMetrics(highwayTests);

  const BADGES = [
    {
      id: 'wet',
      name: 'wet SeS',
      icon: Fuel,
      color: 'blue',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/40',
      bg: 'bg-blue-500/10',
      owners: 'Timo & Tomáš Vítek (WET)',
      desc: 'Palivové stojany, DOMS 5000, nádrže, príjem paliva & zmeny cien',
      metrics: wetMetrics,
      tests: wetTests,
    },
    {
      id: 'dry',
      name: 'dry SeS',
      icon: ShoppingCart,
      color: 'emerald',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      owners: 'Michal & Filip (DSC/IMM)',
      desc: 'Predajňa, Fresh Corner gastro, SAP MIGO príjem & skenovanie čiarových kódov',
      metrics: dryMetrics,
      tests: dryTests,
    },
    {
      id: 'service',
      name: 'service SeS',
      icon: Car,
      color: 'amber',
      glow: 'shadow-amber-500/20',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      owners: 'Prevádzkový tím SeS',
      desc: 'Autoumyváreň, vysávače, hustenie pneumatík, kompresor a údržba',
      metrics: serviceMetrics,
      tests: serviceTests,
    },
    {
      id: 'highway',
      name: 'highway SeS',
      icon: Compass,
      color: 'purple',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/40',
      bg: 'bg-purple-500/10',
      owners: 'Steering Committee (Ondro, Zuzka, Tomáš...)',
      desc: '24/7 diaľničná prevádzka s vysokou záťažou, B2B fleet karty & účtovníctvo',
      metrics: highwayMetrics,
      tests: highwayTests,
    },
  ];

  // Active tests to show in drill-down
  const currentBadgeObj = BADGES.find((b) => b.id === activeBadgeFilter);
  const displayedDrilldownTests = currentBadgeObj ? currentBadgeObj.tests : [];

  return (
    <div className="space-y-4">
      {/* Country Filter & Info Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-zinc-950/80 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Filter Trhu (Market Scope)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              Lokálne daňové predpisy & fiškálne systémy (eKasa, EET, ANAF, Kasa Online)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCountry(c.code as any)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
                selectedCountry === c.code
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Steering Committee Release Rule Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-purple-500/15 dark:from-amber-500/10 dark:via-zinc-950 dark:to-purple-500/10 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md dark:shadow-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              Pravidlo Steering Committee pre Otvorenie SeS
              <Badge variant="purple" className="text-[9px] font-mono">
                GO / NO-GO GATE
              </Badge>
            </h4>
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed max-w-4xl">
              Definícia úspešného testovania: <strong>0 kritických chýb</strong> a <strong>100% Passed krokov</strong>.
              Žiadny test sám o sebe nie je showstopper, ale každá chyba v ňom nájdená ním môže byť. Iný stav ide na posúdenie Steering Committee.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-black/60 border border-slate-200 dark:border-white/10 text-right">
            <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 block uppercase">Aktívne Showstoppery</span>
            <span className={`text-sm font-extrabold font-mono ${highwayMetrics.showstoppers > 0 ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {highwayMetrics.showstoppers} blokácií
            </span>
          </div>
        </div>
      </div>

      {/* 4 SeS Readiness Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {BADGES.map((b) => {
          const Icon = b.icon;
          const isSelected = activeBadgeFilter === b.id;

          return (
            <div
              key={b.id}
              onClick={() => setActiveBadgeFilter(isSelected ? 'ALL' : (b.id as any))}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
                b.metrics.isUnlocked
                  ? 'bg-emerald-500/[0.08] border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : b.metrics.showstoppers > 0
                  ? 'bg-rose-500/[0.05] border-rose-500/40 hover:border-rose-400 shadow-lg shadow-rose-500/10'
                  : 'bg-white/90 dark:bg-zinc-950/70 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Badge Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className={`p-2.5 rounded-xl ${b.bg} text-white border border-white/10`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {b.metrics.isUnlocked ? (
                    <Badge variant="success" className="text-[10px] font-mono flex items-center gap-1 shadow-md">
                      <Trophy className="w-3 h-3" /> DOSIAHNUTÝ ODZNAK
                    </Badge>
                  ) : b.metrics.showstoppers > 0 ? (
                    <Badge variant="destructive" className="text-[10px] font-mono animate-pulse">
                      🛑 {b.metrics.showstoppers} SHOWSTOPPER{b.metrics.showstoppers > 1 ? 'Y' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono text-slate-600 dark:text-zinc-400">
                      ⏳ {b.metrics.remainingSteps} do otvorenia
                    </Badge>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  &quot;{b.name}&quot;
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-snug">
                  {b.desc}
                </p>
                <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono mt-1">
                  Owner: <span className="text-slate-800 dark:text-zinc-300 font-semibold">{b.owners}</span>
                </div>
              </div>

              {/* Progress & Remaining */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 dark:text-zinc-400">Pripravenosť SeS:</span>
                  <span className={`font-bold ${b.metrics.isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-zinc-200'}`}>
                    {b.metrics.percent}% ({b.metrics.passed}/{b.metrics.total})
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.metrics.isUnlocked
                        ? 'bg-emerald-500'
                        : b.metrics.showstoppers > 0
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${b.metrics.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-500 pt-0.5">
                  <span>Chýba do otvorenia:</span>
                  <span className="text-slate-800 dark:text-zinc-300 font-semibold">
                    {b.metrics.remainingSteps === 0 ? '0 (Pripravené)' : `${b.metrics.remainingSteps} testov`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stream Ownership & Escalation Table */}
      <div className="p-4 rounded-2xl bg-white/90 dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Vlastníci Streamov & Eskalačná Matica (Stream Ownership)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
            Priamy kontakt na POs pri Showstopperoch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
          {STREAMS.map((s) => (
            <div
              key={s.code}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[9px] font-mono">
                    {s.code}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">{s.badge}</span>
                </div>
                <h5 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{s.name}</h5>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block">Zodpovední / PO:</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {s.owners.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drill-down Test Cases List (When a badge is clicked) */}
      {activeBadgeFilter !== 'ALL' && currentBadgeObj && (
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/15 shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Detail testov pre odznak: <span className="font-mono text-blue-600 dark:text-blue-400">&quot;{currentBadgeObj.name}&quot;</span>
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {displayedDrilldownTests.length} testov
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveBadgeFilter('ALL')}
              className="h-7 text-xs text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Zavrieť detail
            </Button>
          </div>

          <div className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto">
            {displayedDrilldownTests.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">
                Žiadne testovacie prípady v tejto kategórii pre vybraný trh.
              </p>
            ) : (
              displayedDrilldownTests.map((tc) => {
                const status = getStepStatusForTestCase(tc.id);
                const isShowstopper = status === 'FAILED' || status === 'BLOCKED';

                return (
                  <div
                    key={tc.id}
                    className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isShowstopper ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-300">{tc.code}</span>
                          {isShowstopper && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">
                              SHOWSTOPPER
                            </Badge>
                          )}
                        </div>
                        <p className="text-zinc-400 truncate">{tc.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          status === 'PASSED'
                            ? 'success'
                            : isShowstopper
                            ? 'destructive'
                            : 'outline'
                        }
                        className="text-[10px] font-mono"
                      >
                        {status}
                      </Badge>
                      <Link href={`/test-cases/${tc.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
