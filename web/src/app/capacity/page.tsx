'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Briefcase,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Fuel,
  ShoppingCart,
  Car,
  Compass,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { exportToCsv } from '@/lib/export-csv';

interface StreamMember {
  name: string;
  role: string;
  email: string;
  hoursAllocated: number;
  hoursSpent: number;
  activeTestCount: number;
  assignedShowstoppers: number;
  status: 'AVAILABLE' | 'OVERLOADED' | 'ON_LEAVE';
}

interface StreamCapacity {
  id: string;
  streamName: string;
  category: 'WET' | 'DSC_IMM' | 'SERVICE' | 'FIN' | 'OCI_SO';
  sesBadge: 'wet SeS' | 'dry SeS' | 'service SeS' | 'highway SeS';
  productOwners: string[];
  description: string;
  color: string;
  members: StreamMember[];
}

const STREAMS_CAPACITY: StreamCapacity[] = [
  {
    id: 'stream-wet',
    streamName: 'WET Stream (Palivá & DOMS)',
    category: 'WET',
    sesBadge: 'wet SeS',
    productOwners: ['Timo', 'Tomáš Vítek'],
    description: 'Fyzické testy stojanov Tokheim/Wayne, zbernica IFSF-LON, hladinomery Veeder-Root, nočný režim.',
    color: 'blue',
    members: [
      {
        name: 'Timo',
        role: 'Product Owner & Test Lead WET',
        email: 'timo@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 138,
        activeTestCount: 14,
        assignedShowstoppers: 1,
        status: 'AVAILABLE',
      },
      {
        name: 'Tomáš Vítek',
        role: 'Senior Forecourt & DOMS Specialist',
        email: 'tomas.vitek@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 152,
        activeTestCount: 11,
        assignedShowstoppers: 1,
        status: 'AVAILABLE',
      },
      {
        name: 'Peter Kováč',
        role: 'Field Hardware Tester (Čerpacie stanice)',
        email: 'peter.kovac@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 120,
        activeTestCount: 8,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
    ],
  },
  {
    id: 'stream-dry',
    streamName: 'DSC / IMM (Sklad & Fresh Corner)',
    category: 'DSC_IMM',
    sesBadge: 'dry SeS',
    productOwners: ['Michal', 'Filip'],
    description: 'Skladové hospodárstvo MIGO, gastro receptúry Fresh Corner, predaj tovaru a čiarové kódy.',
    color: 'emerald',
    members: [
      {
        name: 'Michal',
        role: 'Stream Lead DSC / Fresh Corner',
        email: 'michal@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 144,
        activeTestCount: 12,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
      {
        name: 'Filip',
        role: 'POS & Inventory Specialist',
        email: 'filip@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 168,
        activeTestCount: 9,
        assignedShowstoppers: 1,
        status: 'OVERLOADED',
      },
      {
        name: 'Elena Vargová',
        role: 'QA Engineer (Gastro & Promotions)',
        email: 'elena.vargova@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 110,
        activeTestCount: 6,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
    ],
  },
  {
    id: 'stream-service',
    streamName: 'SERVICE Stream (Umývačka & Služby)',
    category: 'SERVICE',
    sesBadge: 'service SeS',
    productOwners: ['Prevádzkový tím SeS'],
    description: 'Portálové umývačky Istobal, servisné vysávače, hustenie pneumatík a kiosk moduly.',
    color: 'amber',
    members: [
      {
        name: 'Prevádzkový tím SeS',
        role: 'Operations & Station Facility Lead',
        email: 'operations@slovnaft.sk',
        hoursAllocated: 120,
        hoursSpent: 85,
        activeTestCount: 5,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
    ],
  },
  {
    id: 'stream-fin',
    streamName: 'FIN Stream (Financie & eKasa/ANAF)',
    category: 'FIN',
    sesBadge: 'highway SeS',
    productOwners: ['Ondro'],
    description: 'Fiškálne moduly eKasa (SK), EET (CZ), ANAF (RO), bankové EFT terminály a SAP uzávierky.',
    color: 'purple',
    members: [
      {
        name: 'Ondro',
        role: 'Finance Stream Lead & Fiscal Architect',
        email: 'ondro@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 165,
        activeTestCount: 16,
        assignedShowstoppers: 2,
        status: 'OVERLOADED',
      },
      {
        name: 'Ján Molnár',
        role: 'Payment Gateway QA (Switchio / SixPay)',
        email: 'jan.molnar@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 130,
        activeTestCount: 7,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
    ],
  },
  {
    id: 'stream-oci',
    streamName: 'OCI / SO (Objednávky & B2B Karty)',
    category: 'OCI_SO',
    sesBadge: 'highway SeS',
    productOwners: ['Tomáš', 'Zuzka'],
    description: 'B2B palivové karty MOL/Slovnaft Fleet, vernostný systém Move, objednávkové zmluvy.',
    color: 'rose',
    members: [
      {
        name: 'Tomáš',
        role: 'B2B Fleet & OCI Stream Lead',
        email: 'tomas@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 140,
        activeTestCount: 10,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
      {
        name: 'Zuzka',
        role: 'Loyalty (Move) & Card Integration QA',
        email: 'zuzka@slovnaft.sk',
        hoursAllocated: 160,
        hoursSpent: 135,
        activeTestCount: 8,
        assignedShowstoppers: 0,
        status: 'AVAILABLE',
      },
    ],
  },
];

export default function CapacityPlannerPage() {
  const [selectedStream, setSelectedStream] = useState<string>('ALL');

  const filteredStreams = STREAMS_CAPACITY.filter((s) => {
    if (selectedStream === 'ALL') return true;
    return s.category === selectedStream;
  });

  const allMembers = STREAMS_CAPACITY.flatMap((s) =>
    s.members.map((m) => ({ ...m, streamName: s.streamName, badge: s.sesBadge }))
  );

  const totalAllocated = allMembers.reduce((acc, m) => acc + m.hoursAllocated, 0);
  const totalSpent = allMembers.reduce((acc, m) => acc + m.hoursSpent, 0);
  const totalShowstoppers = allMembers.reduce((acc, m) => acc + m.assignedShowstoppers, 0);

  const handleExportCsv = () => {
    exportToCsv(
      `RITS_Capacity_Planner_${new Date().toISOString().slice(0, 10)}`,
      [
        { header: 'Meno', accessor: 'name' },
        { header: 'Rola', accessor: 'role' },
        { header: 'Stream', accessor: 'streamName' },
        { header: 'SeS Odznak', accessor: 'badge' },
        { header: 'Alokované hodiny', accessor: 'hoursAllocated' },
        { header: 'Odpracované hodiny', accessor: 'hoursSpent' },
        { header: 'Vyťaženie (%)', accessor: (m) => Math.round((m.hoursSpent / m.hoursAllocated) * 100) },
        { header: 'Aktívne testy', accessor: 'activeTestCount' },
        { header: 'Priradené showstoppery', accessor: 'assignedShowstoppers' },
        { header: 'Status kapacity', accessor: 'status' },
      ],
      allMembers
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/20 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono border-purple-400/40 text-purple-300">
                TEAM RESOURCE ALLOCATION
              </Badge>
              <Badge variant="default" className="text-[10px] bg-purple-600">
                STREAM OWNERSHIP MATICA
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              Kapacitný Plánovač & Alokácia Streamov
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Prehľad personálnych kapacít, vyťaženia testerov a vlastníkov streamov (Timo & Tomáš Vítek pre WET;
              Michal & Filip pre DSC/IMM; Ondro pre FIN; Tomáš & Zuzka pre OCI/SO).
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
              Exportovať Kapacity do CSV
            </Button>
          </div>
        </div>

        {/* Global Capacity KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/10 font-mono">
          <div className="p-3 rounded-xl bg-white/5">
            <span className="text-[10px] text-slate-400 uppercase block">Celková Alokácia</span>
            <span className="text-lg font-bold text-white">{totalAllocated} hodín</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <span className="text-[10px] text-slate-400 uppercase block">Odpracované</span>
            <span className="text-lg font-bold text-blue-400">{totalSpent} hodín</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <span className="text-[10px] text-slate-400 uppercase block">Globálne Vyťaženie</span>
            <span className="text-lg font-bold text-purple-400">
              {Math.round((totalSpent / totalAllocated) * 100)}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <span className="text-[10px] text-slate-400 uppercase block">Riešené Showstoppery</span>
            <span className="text-lg font-bold text-rose-400">{totalShowstoppers} blokácií</span>
          </div>
        </div>
      </div>

      {/* Stream Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 shrink-0">Stream:</span>
        {[
          { id: 'ALL', label: 'Všetky streamy' },
          { id: 'WET', label: 'WET (Palivá & DOMS)' },
          { id: 'DSC_IMM', label: 'DSC / IMM (Fresh Corner)' },
          { id: 'SERVICE', label: 'SERVICE (Umývačka)' },
          { id: 'FIN', label: 'FIN (Financie & eKasa)' },
          { id: 'OCI_SO', label: 'OCI / SO (Fleet Karty)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedStream(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedStream === t.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stream Capacity Cards */}
      <div className="space-y-4">
        {filteredStreams.map((s) => (
          <Card key={s.id} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {s.category}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-500">
                    &quot;{s.sesBadge}&quot;
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.streamName}</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{s.description}</p>
              </div>

              <div className="text-xs font-mono text-slate-600 dark:text-zinc-300">
                <span>Vlastníci / POs: </span>
                <strong className="text-blue-600 dark:text-blue-400">{s.productOwners.join(', ')}</strong>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 font-mono text-[11px] border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Meno & Email</th>
                    <th className="py-2.5 px-3">Rola v tíme</th>
                    <th className="py-2.5 px-3">Alokované / Čerpané</th>
                    <th className="py-2.5 px-3">Vyťaženie</th>
                    <th className="py-2.5 px-3">Aktívne Testy</th>
                    <th className="py-2.5 px-3">Showstoppery</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                  {s.members.map((m, idx) => {
                    const utilPercent = Math.round((m.hoursSpent / m.hoursAllocated) * 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{m.email}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-zinc-300">{m.role}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-zinc-300">
                          {m.hoursSpent}h / {m.hoursAllocated}h
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1 w-28">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span
                                className={
                                  utilPercent > 100
                                    ? 'text-rose-500 font-bold'
                                    : utilPercent > 80
                                    ? 'text-amber-500 font-bold'
                                    : 'text-emerald-500'
                                }
                              >
                                {utilPercent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  utilPercent > 100
                                    ? 'bg-rose-500'
                                    : utilPercent > 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(utilPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-zinc-200">
                          {m.activeTestCount} testov
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {m.assignedShowstoppers > 0 ? (
                            <Badge variant="destructive" className="text-[9px]">
                              {m.assignedShowstoppers} STOPPER
                            </Badge>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              m.status === 'AVAILABLE'
                                ? 'success'
                                : m.status === 'OVERLOADED'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="text-[9px] font-mono"
                          >
                            {m.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
