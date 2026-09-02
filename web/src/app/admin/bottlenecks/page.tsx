'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatSeconds } from '@/lib/utils';
import { ClockAlert, AlertTriangle, UserCheck, ShieldAlert, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';

export default function AdminBottlenecksPage() {
  const { activeProject } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProject) {
      setLoading(true);
      api
        .get(`/timers/admin/bottlenecks/project/${activeProject.id}`)
        .then((res: any) => setData(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeProject]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="glass" className="text-[10px] font-mono">
            SLA ANALÝZA
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ClockAlert className="w-6 h-6 text-zinc-300" />
          SLA Časovače & Bottleneck Analýza
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Admin report: Kto ako dlho robí, na koho sa čaká a ktoré testovacie kroky zdržujú release cyklus.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="glass" className="p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
              Čakajúce Kroky (In Progress)
            </span>
            <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {data?.pendingStepsCount || 0}
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
              Blokované Kroky (Blocked)
            </span>
            <div className="text-2xl font-bold text-rose-400 tracking-tight mt-0.5">
              {data?.blockedStepsCount || 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Tester Workload & SLA Breakdown */}
      <Card variant="glass" className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-zinc-400" />
          Prehľad Testerov: Na koho sa čaká & Odpracovaný čas
        </h2>

        <div className="border border-white/[0.08] rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/[0.04] text-zinc-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3">Tester</th>
                <th className="p-3">Email</th>
                <th className="p-3">Čakajúce</th>
                <th className="p-3">Blokované</th>
                <th className="p-3">Odmeraný čas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data?.testerBottlenecks?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">
                    Žiadne aktívne zdržania.
                  </td>
                </tr>
              ) : (
                data?.testerBottlenecks?.map((t: any) => (
                  <tr key={t.userId} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-zinc-200">{t.fullName}</td>
                    <td className="p-3 text-zinc-500 font-mono text-[11px]">{t.email}</td>
                    <td className="p-3 font-mono font-semibold text-amber-400">
                      {t.activePendingCount} krokov
                    </td>
                    <td className="p-3 font-mono font-semibold text-rose-400">
                      {t.blockedCount} krokov
                    </td>
                    <td className="p-3 font-mono font-semibold text-zinc-300">
                      {formatSeconds(t.totalLoggedSeconds)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Critical Pending Steps List */}
      <Card variant="glass" className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Zoznam Kritických Zdržaní
        </h2>

        <div className="divide-y divide-white/[0.04] text-xs">
          {data?.criticalPendingSteps?.map((step: any) => (
            <div
              key={step.stepExecutionId}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-blue-400">
                    {step.testCaseCode}
                  </span>
                  <span className="font-mono text-zinc-500">#{step.stepNumber}</span>
                  <Badge
                    variant={step.status === 'BLOCKED' ? 'danger' : 'warning'}
                    className="text-[9px] py-0 px-1.5"
                  >
                    {step.status}
                  </Badge>
                </div>
                <p className="text-zinc-200 mt-1 font-medium">{step.action}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-right">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-medium block">
                    Zodpovedný
                  </span>
                  <span className="font-medium text-zinc-300">{step.assignedTo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-medium block">
                    Strávený čas
                  </span>
                  <span className="font-mono text-zinc-300 font-semibold">
                    {formatSeconds(step.totalDurationSeconds)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
