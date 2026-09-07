'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Milestone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  Layers,
  Flag,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Fuel,
  ShoppingCart,
  Car,
  Compass,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { exportToCsv } from '@/lib/export-csv';

interface ReleaseMilestone {
  id: string;
  releaseTag: string;
  name: string;
  targetDate: string;
  goNoGoDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  markets: string[];
  requiredBadges: ('wet SeS' | 'dry SeS' | 'service SeS' | 'highway SeS')[];
  description: string;
  progressPercent: number;
  streamLead: string;
  deliverables: string[];
}

const MILESTONES: ReleaseMilestone[] = [
  {
    id: 'M-2026-01',
    releaseTag: 'Release 2.4 (Pilot)',
    name: 'Pilotné Nasadenie na 3 Staniciach v SR',
    targetDate: '2026-04-15',
    goNoGoDate: '2026-04-10',
    status: 'COMPLETED',
    markets: ['SK'],
    requiredBadges: ['wet SeS', 'dry SeS'],
    description: 'Pilotná verzia na vybraných diaľničných staniciach D1 Zeleneč a Červeník.',
    progressPercent: 100,
    streamLead: 'Timo & Michal',
    deliverables: ['Stabilita IFSF výdaja palív', 'Fiškalizácia eKasa v2', 'MOL Move načítanie'],
  },
  {
    id: 'M-2026-02',
    releaseTag: 'Release 2.5 (Core Rollout)',
    name: 'Hromadný Rollout Slovensko & Česko',
    targetDate: '2026-07-01',
    goNoGoDate: '2026-06-25',
    status: 'IN_PROGRESS',
    markets: ['SK', 'CZ'],
    requiredBadges: ['wet SeS', 'dry SeS', 'service SeS'],
    description: 'Nasadenie na 240 staniciach Slovnaft a MOL Česká republika vrátane OPT automatov.',
    progressPercent: 78,
    streamLead: 'Tomáš Vítek & Ondro',
    deliverables: ['DOMS 5000 aktualizácia', 'EET CZ daňová podpora', 'Istobal umývacie kódy'],
  },
  {
    id: 'M-2026-03',
    releaseTag: 'Release 2.6 (Romania & Poland)',
    name: 'Medzinárodná Integrácia Rumunsko & Poľsko',
    targetDate: '2026-10-15',
    goNoGoDate: '2026-10-01',
    status: 'PLANNED',
    markets: ['RO', 'PL'],
    requiredBadges: ['wet SeS', 'dry SeS', 'service SeS', 'highway SeS'],
    description: 'Plná certifikácia ANAF (Rumunsko) a Online Kasa (Poľsko) s integráciou Un-Doi a FORTUNA.',
    progressPercent: 35,
    streamLead: 'Filip & Zuzka',
    deliverables: ['ANAF XML reporting A4200', 'Un-Doi platby faktúr', 'SAP IS-Oil Sybase sync'],
  },
  {
    id: 'M-2026-04',
    releaseTag: 'Release 2026.UAT (Highway 24/7)',
    name: 'Plná Certifikácia Highway SeS (Všetky Streamy)',
    targetDate: '2026-12-15',
    goNoGoDate: '2026-12-01',
    status: 'PLANNED',
    markets: ['SK', 'CZ', 'RO', 'PL'],
    requiredBadges: ['wet SeS', 'dry SeS', 'service SeS', 'highway SeS'],
    description: 'Záverečná verifikácia pre prevádzku bez ľudského zásahu (24/7 OPT, autonómne strediská).',
    progressPercent: 20,
    streamLead: 'Steering Committee',
    deliverables: ['Zero showstoppers policy', 'Audit trail compliance', 'SLA < 15 minút obnovenie'],
  },
];

export default function RoadmapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');

  const filteredMilestones = MILESTONES.filter((m) => {
    if (selectedMarket === 'ALL') return true;
    return m.markets.includes(selectedMarket);
  });

  const handleExportCsv = () => {
    exportToCsv(
      `RITS_Release_Roadmap_2026_${new Date().toISOString().slice(0, 10)}`,
      [
        { header: 'ID Míľnika', accessor: 'id' },
        { header: 'Release Tag', accessor: 'releaseTag' },
        { header: 'Názov', accessor: 'name' },
        { header: 'Plánovaný Dátum', accessor: 'targetDate' },
        { header: 'GO/NO-GO Dátum', accessor: 'goNoGoDate' },
        { header: 'Status', accessor: 'status' },
        { header: 'Trhy', accessor: (m) => m.markets.join(', ') },
        { header: 'Vyžadované SeS Odznaky', accessor: (m) => m.requiredBadges.join(', ') },
        { header: 'Progres (%)', accessor: 'progressPercent' },
        { header: 'Stream Lead', accessor: 'streamLead' },
      ],
      MILESTONES
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/20 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono border-blue-400/40 text-blue-300">
                RITS STRATEGIC RELEASE PLAN 2026
              </Badge>
              <Badge variant="default" className="text-[10px] bg-blue-600">
                HARMONOGRAM MÍĽNIKOV & BRÁN
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Rocket className="w-8 h-8 text-blue-400" />
              Roadmapa Releasov & GO/NO-GO Brány SeS
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Strategický harmonogram nasadzovania novej generácie pokladničného a forecourt systému RITS pre trhy
              Slovensko, Česko, Rumunsko a Poľsko. Každý míľnik je priamo podmienený dosiahnutím príslušného SeS odznaku.
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
              Exportovať do CSV
            </Button>
            <Link href="/admin/steering-committee">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold text-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                Steering Committee Brány
              </Button>
            </Link>
          </div>
        </div>

        {/* Market Filter */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-3">
          <span className="text-xs font-mono text-slate-400 shrink-0 mr-1">Filter podľa trhu:</span>
          {['ALL', 'SK', 'CZ', 'RO', 'PL'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarket(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedMarket === m
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {m === 'ALL' ? '🌐 Všetky trhy' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Milestones Cards */}
      <div className="space-y-4">
        {filteredMilestones.map((m, index) => (
          <Card
            key={m.id}
            className={`p-6 space-y-4 transition-all hover:shadow-xl border-l-4 ${
              m.status === 'COMPLETED'
                ? 'border-l-emerald-500'
                : m.status === 'IN_PROGRESS'
                ? 'border-l-blue-500'
                : 'border-l-slate-400'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs font-bold text-blue-500 border-blue-500/30">
                    {m.releaseTag}
                  </Badge>
                  <Badge
                    variant={
                      m.status === 'COMPLETED'
                        ? 'success'
                        : m.status === 'IN_PROGRESS'
                        ? 'default'
                        : 'outline'
                    }
                    className="text-[10px] font-mono"
                  >
                    {m.status === 'COMPLETED'
                      ? 'NASADENÉ'
                      : m.status === 'IN_PROGRESS'
                      ? 'AKTÍVNE TESTOVANIE'
                      : 'PLÁNOVANÉ'}
                  </Badge>
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                    Zodpovedný: <strong>{m.streamLead}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{m.name}</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400">{m.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">GO / NO-GO Rozhodnutie</span>
                  <span className="font-mono font-bold text-xs text-rose-500">{m.goNoGoDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Dátum Nasadenia</span>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{m.targetDate}</span>
                </div>
              </div>
            </div>

            {/* Required Badges & Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Podmienené odznakmi:</span>
                  {m.requiredBadges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="outline"
                      className="text-[10px] font-mono border-amber-500/40 text-amber-500"
                    >
                      &quot;{badge}&quot;
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-zinc-400">Pripravenosť releasu:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {m.progressPercent}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    m.progressPercent === 100
                      ? 'bg-emerald-500'
                      : m.progressPercent > 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${m.progressPercent}%` }}
                />
              </div>

              {/* Deliverables checklist */}
              <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Kľúčové výstupy:</span>
                {m.deliverables.map((d, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 font-mono text-[10px]"
                  >
                    ✓ {d}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
