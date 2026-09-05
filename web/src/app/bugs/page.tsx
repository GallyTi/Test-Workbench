'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  Bug,
  ExternalLink,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  User as UserIcon,
  Copy,
  Check,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { ReportIssueModal } from '@/components/ui/ReportIssueModal';
import { useTranslation } from '@/lib/i18n';

export default function BugsPage() {
  const { activeProject, user } = useAppStore();
  const { t } = useTranslation();

  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBugs = () => {
    if (activeProject) {
      setLoading(true);
      api
        .get(`/bugs/project/${activeProject.id}`)
        .then((res: any) => setBugs(res || []))
        .catch(() => setBugs([]))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [activeProject]);

  const handleUpdateStatus = async (bugId: string, newStatus: string) => {
    setUpdatingId(bugId);
    try {
      await api.patch(`/bugs/${bugId}`, { status: newStatus });
      setBugs((prev) =>
        prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      alert('Nepodarilo sa aktualizovať stav chyby: ' + (err.message || 'Chyba'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteBug = async (bugId: string, code: string) => {
    if (!confirm(`Naozaj chcete natrvalo vymazať defekt ${code}?`)) return;
    try {
      await api.delete(`/bugs/${bugId}`);
      setBugs((prev) => prev.filter((b) => b.id !== bugId));
    } catch (err: any) {
      alert('Nepodarilo sa vymazať defekt: ' + (err.message || 'Chyba'));
    }
  };

  const handleCopyBug = (bug: any) => {
    const md = `### 🐛 [${bug.code}] ${bug.title}
- **Stav**: ${bug.status} | **Závažnosť**: ${bug.severity}
- **Nahlásil**: ${bug.reportedBy?.fullName || 'Tester'}
- **Dátum**: ${new Date(bug.createdAt).toLocaleString('sk-SK')}
${bug.externalTicketUrl ? `- **Jira Ticket**: ${bug.externalTicketUrl}\n` : ''}
#### Popis:
${bug.description}
`;
    navigator.clipboard.writeText(md);
    setCopiedId(bug.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logic
  const filteredBugs = bugs.filter((bug) => {
    if (statusFilter !== 'ALL' && bug.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && bug.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = bug.code?.toLowerCase().includes(q);
      const matchTitle = bug.title?.toLowerCase().includes(q);
      const matchDesc = bug.description?.toLowerCase().includes(q);
      const matchJira = bug.externalTicketUrl?.toLowerCase().includes(q);
      const matchAuthor = bug.reportedBy?.fullName?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchDesc && !matchJira && !matchAuthor) {
        return false;
      }
    }
    return true;
  });

  // Metrics
  const totalBugs = bugs.length;
  const openBugs = bugs.filter((b) => b.status === 'OPEN').length;
  const inProgressBugs = bugs.filter((b) => b.status === 'IN_PROGRESS').length;
  const resolvedBugs = bugs.filter((b) => b.status === 'RESOLVED' || b.status === 'CLOSED').length;
  const criticalBugs = bugs.filter((b) => b.severity === 'CRITICAL' || b.severity === 'BLOCKER').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          fetchBugs();
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="glass" className="text-[10px] font-mono">
              INCIDENT MANAGEMENT & JIRA
            </Badge>
            <span className="text-zinc-500">•</span>
            <span className="text-[11px] font-mono text-zinc-400">
              Projekt: <strong className="text-white">{activeProject?.name || 'RITS'}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Bug className="w-7 h-7 text-rose-400" />
            Evidencia Defektov & Jira Ticketov
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Sledovanie chýb z testovania, prepojenie na reálne tikety od dodávateľov (Diebold, DOMS, SAP) a ich priebežný status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nahlásiť nový defekt / Jira</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-lg">
          <span className="text-[11px] font-mono text-zinc-400 block mb-1">Celkovo chýb</span>
          <div className="text-2xl font-bold font-mono text-white">{totalBugs}</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 shadow-lg">
          <span className="text-[11px] font-mono text-rose-300 block mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" /> Kritické / Blocker
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400">{criticalBugs}</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 shadow-lg">
          <span className="text-[11px] font-mono text-amber-300 block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Otvorené (Open)
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">{openBugs}</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 shadow-lg">
          <span className="text-[11px] font-mono text-blue-300 block mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" /> V riešení
          </span>
          <div className="text-2xl font-bold font-mono text-blue-400">{inProgressBugs}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 shadow-lg col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono text-emerald-300 block mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Vyriešené
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{resolvedBugs}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrovať podľa kódu (BUG-..., HIVE2-...), názvu, dodávateľa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Všetky stavy</option>
            <option value="OPEN">Otvorené (Open)</option>
            <option value="IN_PROGRESS">V riešení (In Progress)</option>
            <option value="RESOLVED">Vyriešené (Resolved)</option>
            <option value="CLOSED">Uzavreté (Closed)</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Všetky závažnosti</option>
            <option value="BLOCKER">🔴 Blocker</option>
            <option value="CRITICAL">🟠 Critical</option>
            <option value="MAJOR">🟡 Major</option>
            <option value="MINOR">🟢 Minor</option>
          </select>

          <button
            type="button"
            onClick={fetchBugs}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
          >
            Obnoviť
          </button>
        </div>
      </div>

      {/* Bugs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs font-mono">
            Načítavam evidenciu defektov...
          </div>
        ) : filteredBugs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-950/40 border border-white/5 space-y-2">
            <Bug className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>Žiadne defekty nezodpovedajú zvoleným filtrom.</p>
          </div>
        ) : (
          filteredBugs.map((bug) => {
            const hasJira = !!bug.externalTicketUrl;
            const jiraLink = bug.externalTicketUrl?.startsWith('http')
              ? bug.externalTicketUrl
              : `https://jira.slovnaft.sk/browse/${bug.externalTicketUrl}`;

            return (
              <div
                key={bug.id}
                className="p-5 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900/90 border border-white/10 hover:border-white/20 transition-all shadow-md space-y-3"
              >
                {/* Top Row: Code, Badges, Dates, Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-rose-400 text-sm">{bug.code}</span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                        bug.severity === 'BLOCKER'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : bug.severity === 'CRITICAL'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : bug.severity === 'MAJOR'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {bug.severity}
                    </span>

                    {/* Status Dropdown / Badge */}
                    <select
                      value={bug.status}
                      disabled={updatingId === bug.id}
                      onChange={(e) => handleUpdateStatus(bug.id, e.target.value)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold focus:outline-none cursor-pointer ${
                        bug.status === 'OPEN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : bug.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : bug.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-white/10'
                      }`}
                    >
                      <option value="OPEN" className="bg-zinc-950 text-white">OPEN (Otvorená)</option>
                      <option value="IN_PROGRESS" className="bg-zinc-950 text-white">IN_PROGRESS (V riešení)</option>
                      <option value="RESOLVED" className="bg-zinc-950 text-white">RESOLVED (Vyriešená)</option>
                      <option value="CLOSED" className="bg-zinc-950 text-white">CLOSED (Uzavretá)</option>
                    </select>

                    {/* Jira Ticket Badge with Link */}
                    {hasJira && (
                      <a
                        href={jiraLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors"
                      >
                        <span>Jira: {bug.externalTicketUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Actions & Author */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span className="hidden sm:inline">
                      {bug.reportedBy?.fullName || 'Tester'} • {new Date(bug.createdAt).toLocaleDateString('sk-SK')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyBug(bug)}
                      title="Kopírovať hlásenie pre Asistenta / AI"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    >
                      {copiedId === bug.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {user?.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBug(bug.id, bug.code)}
                        title="Vymazať defekt"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bug Title & Description */}
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">{bug.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1 whitespace-pre-line">
                    {bug.description}
                  </p>
                </div>

                {/* Linked Test Step Context */}
                {bug.stepExecution && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="font-mono text-blue-400 font-bold">
                        {bug.stepExecution.testCaseExecution?.testCase?.code || 'TC_SCENARIO'}
                      </span>
                      <span className="text-zinc-500">
                        (Krok #{bug.stepExecution.testCaseStep?.stepNumber || 1})
                      </span>
                      <span className="text-zinc-400 truncate max-w-md">
                        {bug.stepExecution.testCaseStep?.action}
                      </span>
                    </div>

                    {bug.stepExecution.testCaseExecution?.testRun && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        Beh: {bug.stepExecution.testCaseExecution.testRun.title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
