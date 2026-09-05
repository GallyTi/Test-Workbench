'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Bug,
  BookOpen,
  ClipboardList,
  PlayCircle,
  Network,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { ReportIssueModal } from '../ui/ReportIssueModal';
import { useTranslation } from '@/lib/i18n';
import { getApiBaseUrl } from '@/lib/api';

export function Footer() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { t } = useTranslation();

  const apiDocsUrl =
    typeof window !== 'undefined'
      ? `${getApiBaseUrl()}/api/docs`
      : 'http://82.38.65.67:4000/api/docs';

  return (
    <footer className="w-full mt-auto pt-10 pb-6 px-4 sm:px-6 border-t border-white/[0.08] bg-black/40 backdrop-blur-xl text-zinc-400 text-xs">
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      <div className="max-w-[1680px] mx-auto space-y-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Platform Brand & Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                RITS <span className="text-blue-400">Workbench</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Centrálna platforma pre správu testovania, manuálnu exekúciu, evidenciu defektov a architektonickú dokumentáciu integračného systému RITS & SAP ERP.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Systém v prevádzke (Online) • VPS 82.38.65.67</span>
            </div>
          </div>

          {/* Col 2: Testing Navigation */}
          <div className="space-y-2.5">
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-200 block font-mono">
              🧪 Testovanie & QA
            </span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/test-cases"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                  {t('nav.testCases')}
                </Link>
              </li>
              <li>
                <Link
                  href="/test-runs"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                  {t('nav.testRuns')}
                </Link>
              </li>
              <li>
                <Link
                  href="/bugs"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  {t('nav.bugs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/excel-import"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                  {t('nav.excelImport')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Docs */}
          <div className="space-y-2.5">
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-200 block font-mono">
              🏛️ Architektúra & Integrácie
            </span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  {t('nav.docs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/graph"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Network className="w-3.5 h-3.5 text-purple-400" />
                  {t('nav.graph')}
                </Link>
              </li>
              <li>
                <a
                  href={apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-400 font-mono"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('footer.apiDocs')} (Swagger)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Bug Reporting & Support */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-200 block font-mono">
              🚨 Podpora & Incidenty
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Našli ste chybu v testovacom kroku, nesprávne dáta alebo problém v rozhraní? Nahláste ju jedným kliknutím.
            </p>
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all text-xs"
            >
              <Bug className="w-4 h-4 text-rose-400" />
              <span>Nahlásiť chybu zo stránky</span>
            </button>
          </div>
        </div>

        {/* Bottom copyright and metadata */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>© 2026 RITS Test Workbench Platform</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> Enterprise Edition v2.4.0-prod
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>PostgreSQL 16</span>
            <span>•</span>
            <span>Redis 7</span>
            <span>•</span>
            <span>MinIO Storage</span>
            <span>•</span>
            <span>NestJS + Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
