'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  X,
  Bug,
  Copy,
  Check,
  Send,
  AlertTriangle,
  ExternalLink,
  Laptop,
  Clock,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultModule?: string;
}

export function ReportIssueModal({
  isOpen,
  onClose,
  defaultTitle = '',
  defaultModule = 'Všeobecné rozhranie',
}: ReportIssueModalProps) {
  const { user, activeProject } = useAppStore();
  const { t } = useTranslation();

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER'>('MAJOR');
  const [moduleContext, setModuleContext] = useState(defaultModule);
  const [jiraKey, setJiraKey] = useState('');
  const [supplier, setSupplier] = useState('Diebold / Wincor POS');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittedBug, setSubmittedBug] = useState<any | null>(null);

  // Auto-captured environment metadata
  const [pageUrl, setPageUrl] = useState('');
  const [screenRes, setScreenRes] = useState('');
  const [userAgentInfo, setUserAgentInfo] = useState('');
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      setPageUrl(window.location.pathname + window.location.search);
      setScreenRes(`${window.innerWidth} x ${window.innerHeight}`);
      setUserAgentInfo(navigator.userAgent.includes('Windows') ? 'Windows (Desktop)' : 'Mobile/Web Client');
      setTimestamp(
        new Date().toLocaleString('sk-SK', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setSubmittedBug(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generatedCode = `BUG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const generateMarkdownReport = () => {
    return `### 🚨 Hlásenie chyby zo stránky [${generatedCode}]
- **Kto nahlásil**: ${user?.fullName || 'Neznámy používateľ'} (${user?.email || 'N/A'}, Rola: ${user?.role || 'TESTER'})
- **Projekt**: ${activeProject?.name || 'RITS'} (${activeProject?.key || 'RITS'})
- **Modul / Kontext**: ${moduleContext}
- **Aktuálna URL**: \`${pageUrl}\`
- **Čas hlásenia**: ${timestamp}
- **Prostredie**: ${userAgentInfo} | Rozlíšenie: ${screenRes}
- **Závažnosť**: ${severity}
- **Dodávateľ**: ${supplier} ${jiraKey ? `| **Jira Ticket**: \`${jiraKey}\`` : ''}

#### 📋 Názov problému:
**${title.trim() || 'Bez názvu'}**

#### 📝 Popis chyby a reprodukcia:
${description.trim() || 'Nebol zadaný podrobnejší popis.'}
`;
  };

  const handleCopyForAi = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitToBackend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Prosím, zadajte aspoň stručný názov chyby.');
      return;
    }

    setSaving(true);
    try {
      const fullDesc = `${description.trim()}\n\n[Metadata: URL=${pageUrl}, Modul=${moduleContext}, Dodávateľ=${supplier}, Jira=${jiraKey || 'N/A'}]`;
      const res: any = await api.post('/bugs', {
        projectId: activeProject?.id || 'd301b1a7-ec56-42d4-a0bf-1234567890ab',
        code: generatedCode,
        title: title.trim(),
        description: fullDesc,
        severity,
        externalTicketUrl: jiraKey
          ? (jiraKey.startsWith('http') ? jiraKey : `https://jira.slovnaft.sk/browse/${jiraKey}`)
          : undefined,
      });

      setSubmittedBug(res);
    } catch (err: any) {
      console.error('Chyba pri ukladaní chyby:', err);
      alert('Nepodarilo sa uložiť chybu do databázy: ' + (err.message || 'Chyba'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                Nahlásenie chyby alebo incidentu
                <span className="text-[11px] font-mono font-normal text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                  {generatedCode}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Možnosť okamžitého skopírovania pre AI asistenta alebo uloženia do systému & Jira.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {submittedBug ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-300">Chyba bola úspešne evidovaná!</h4>
                <p className="text-zinc-400 text-xs mt-1">
                  Kód incidentu: <span className="font-mono text-white font-bold">{submittedBug.code}</span> bol zapísaný do PostgreSQL databázy.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyForAi}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Skopírované do schránky!' : 'Kopírovať hlásenie pre Asistenta / AI'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 font-semibold transition-all"
                >
                  Zavrieť
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitToBackend} className="space-y-4">
              {/* Context Summary Bar */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    Nahlásil: <strong className="text-zinc-200">{user?.fullName || 'Neznámy'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Čas: {timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate">URL: {pageUrl}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">🖥️</span>
                  <span>Rozlíšenie: {screenRes}</span>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 block">
                  Názov chyby / incidentu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Napr. Pri kliknutí na uloženie kroku nastáva timeout..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              {/* Module, Severity & Supplier Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">Modul / Časť aplikácie</label>
                  <select
                    value={moduleContext}
                    onChange={(e) => setModuleContext(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Testovacie scenáre">Testovacie scenáre</option>
                    <option value="Exekúcia testov (Test Runs)">Exekúcia testov (Test Runs)</option>
                    <option value="Komentáre a diskusia">Komentáre a diskusia</option>
                    <option value="Confluence dokumentácia">Confluence dokumentácia</option>
                    <option value="Architektonický graf">Architektonický graf</option>
                    <option value="Excel Import">Excel Import</option>
                    <option value="Iné / Mobilné zobrazenie">Iné / Mobilné zobrazenie</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">Závažnosť (Severity)</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="BLOCKER">🔴 Blokujúca (Blocker)</option>
                    <option value="CRITICAL">🟠 Kritická (Critical)</option>
                    <option value="MAJOR">🟡 Závažná (Major)</option>
                    <option value="MINOR">🟢 Drobná (Minor)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 block">Dodávateľ systému</label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Diebold / Wincor POS">Diebold / Wincor POS</option>
                    <option value="DOMS Forecourt Controller">DOMS Controller</option>
                    <option value="SSR Integration Hub">SSR Integration Hub</option>
                    <option value="SAP ERP S/4HANA">SAP S/4HANA</option>
                    <option value="Slovnaft / MOL IT">Slovnaft / MOL IT</option>
                  </select>
                </div>
              </div>

              {/* Jira Ticket Key / URL */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Jira Ticket kód (voliteľné)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">napr. HIVE2-1042</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="HIVE2-1042 alebo odkaz na dodávateľský ticket..."
                    value={jiraKey}
                    onChange={(e) => setJiraKey(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs font-mono"
                  />
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 block">
                  Podrobný popis, kroky na reprodukciu a očakávaný výsledok
                </label>
                <textarea
                  rows={4}
                  placeholder="1. Otvoril som stránku testovacích scenárov...&#10;2. Klikol som na tlačidlo...&#10;3. Namiesto zobrazenia nastala chyba..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCopyForAi}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center justify-center gap-2 transition-all border border-white/15"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Skopírované do schránky!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                      <span>Kopírovať hlásenie pre AI / Asistenta</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {saving ? 'Ukladám...' : 'Odoslať do systému & Jira'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
