'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Bug, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';

export default function BugsPage() {
  const { activeProject } = useAppStore();
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProject) {
      setLoading(true);
      api
        .get(`/bugs/project/${activeProject.id}`)
        .then((res: any) => setBugs(res || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeProject]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="glass" className="text-[10px] font-mono">
            INCIDENTY
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Bug className="w-6 h-6 text-zinc-300" />
          Hlásené Defekty (Bugs)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Zoznam incidentov nahlásených priamo z testovacích krokov s kontextom.
        </p>
      </div>

      <Card variant="glass" className="p-0 overflow-hidden divide-y divide-white/[0.04]">
        {bugs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            V tomto projekte nie sú evidované žiadne aktívne chyby.
          </div>
        ) : (
          bugs.map((bug) => (
            <div
              key={bug.id}
              className="p-5 hover:bg-white/[0.02] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-400 text-xs">{bug.code}</span>
                  <Badge variant="destructive" className="text-[10px]">
                    {bug.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {bug.status}
                  </Badge>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {bug.reportedBy?.fullName} •{' '}
                  {new Date(bug.createdAt).toLocaleDateString('sk-SK')}
                </span>
              </div>

              <h3 className="font-semibold text-sm text-zinc-100">{bug.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{bug.description}</p>

              {bug.stepExecution && (
                <div className="mt-2 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.04] text-xs">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-0.5">
                    Kontext zlyhaného testu
                  </span>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="font-mono text-blue-400 font-semibold">
                      {bug.stepExecution.testCaseExecution?.testCase?.code}
                    </span>
                    <span>(Krok #{bug.stepExecution.testCaseStep?.stepNumber})</span>
                    <span className="text-zinc-500 truncate">
                      {bug.stepExecution.testCaseStep?.action}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
