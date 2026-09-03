'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PlayCircle,
  FileSpreadsheet,
  Network,
  ClockAlert,
  Bug,
  History,
  FileUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Prehľad & Dashboard', icon: LayoutDashboard },
  { href: '/docs', label: 'Confluence Dokumentácia', icon: BookOpen },
  { href: '/test-cases', label: 'Katalóg Testov', icon: FileSpreadsheet },
  { href: '/test-runs', label: 'Testovacie Behy (Exec)', icon: PlayCircle },
  { href: '/excel-import', label: 'Excel Import Workbench', icon: FileUp },
  { href: '/graph', label: 'Architektúrny Graf', icon: Network },
  { href: '/admin/bottlenecks', label: 'SLA Časovače & Bottlenecks', icon: ClockAlert },
  { href: '/bugs', label: 'Hlásené Bugy & Defekty', icon: Bug },
  { href: '/audit-logs', label: 'Audit Trail & Zmeny', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#030712]/60 backdrop-blur-2xl p-4 hidden md:flex flex-col justify-between shrink-0">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          Hlavné Moduly
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-sm shadow-blue-500" />
              )}
              <Icon
                className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 text-xs backdrop-blur-xl">
        <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>RITS / HIVE2 Ready</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Real-time kolaborácia, Redis zámky krokov a prepojenie na architektúru sú aktívne.
        </p>
      </div>
    </aside>
  );
}
