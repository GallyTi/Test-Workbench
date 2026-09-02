'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { History, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/audit-logs?limit=100')
      .then((res: any) => setLogs(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="glass" className="text-[10px] font-mono">
            AUDIT TRAIL
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <History className="w-6 h-6 text-zinc-300" />
          Audit Trail (História Zmien)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Nezmazateľný záznam všetkých zmien stavov a exekúcií pre enterprise audit a zhodu.
        </p>
      </div>

      <Card variant="glass" className="p-0 overflow-hidden divide-y divide-white/[0.04]">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Žiadne záznamy v audit logu.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px] font-semibold text-blue-400">
                    {log.action}
                  </Badge>
                  <span className="font-semibold text-zinc-200">{log.entityName}</span>
                  <span className="font-mono text-zinc-500 text-[10px]">ID: {log.entityId}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                  <User className="w-3 h-3 text-zinc-500" />
                  <span>
                    {log.user ? log.user.fullName : 'Systém / Automat'} ({log.user?.role || 'SYSTEM'})
                  </span>
                </div>
              </div>

              <div className="text-right text-zinc-500 text-[11px] font-mono shrink-0">
                {new Date(log.createdAt).toLocaleString('sk-SK')}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
