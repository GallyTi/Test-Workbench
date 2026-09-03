'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Paperclip,
  MessageSquare,
  Bug,
  Send,
  Upload,
  User,
  Image as ImageIcon,
  Link2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Maximize2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CommentThread } from '@/components/ui/CommentThread';
import { MediaViewerModal } from '@/components/ui/MediaViewerModal';
import { Film } from 'lucide-react';

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testCaseId } = use(params);
  const router = useRouter();
  const { user, activeProject } = useAppStore();

  const [testCase, setTestCase] = useState<any>(null);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [allTestCases, setAllTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded steps map (which steps are accordion opened)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  // Cross-connection modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetCaseId, setTargetCaseId] = useState('');
  const [linkType, setLinkType] = useState('DEPENDS_ON');

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Media (comments & attachments per step)
  const [stepComments, setStepComments] = useState<Record<string, any[]>>({});
  const [stepAttachments, setStepAttachments] = useState<Record<string, any[]>>({});
  const [uploadingForStep, setUploadingForStep] = useState<string | null>(null);

  // Lightbox modal state
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Multi-file upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetStepId, setUploadTargetStepId] = useState<string | null>(null);

  const fetchTestCase = async () => {
    try {
      const res: any = await api.get(`/projects/${activeProject?.id || 'RITS'}/test-cases/${testCaseId}`);
      setTestCase(res);

      // Default expand the first step
      if (res.steps?.length > 0 && Object.keys(expandedSteps).length === 0) {
        setExpandedSteps({ [res.steps[0].id]: true });
      }

      // Fetch comments & attachments for all steps
      if (res.steps) {
        res.steps.forEach((step: any) => {
          loadStepMedia(step.id);
        });
      }
    } catch (err) {
      console.error('Chyba načítania testu:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStepMedia = async (stepId: string) => {
    try {
      const [comms, atts]: [any, any] = await Promise.all([
        api.get(`/comments/TEST_CASE_STEP/${stepId}`).catch(() => []),
        api.get(`/attachments/TEST_CASE_STEP/${stepId}`).catch(() => []),
      ]);
      setStepComments((prev) => ({ ...prev, [stepId]: comms || [] }));
      setStepAttachments((prev) => ({ ...prev, [stepId]: atts || [] }));
    } catch {}
  };

  useEffect(() => {
    fetchTestCase();

    if (activeProject) {
      api.get(`/users`).then((res: any) => setProjectUsers(res || [])).catch(() => {});
      api.get(`/projects/${activeProject.id}/test-cases`).then((res: any) => setAllTestCases(res || [])).catch(() => {});
    }

    const socket = getSocket();
    socket.on('step_updated', (data: any) => {
      if (data.testCaseId === testCaseId) {
        fetchTestCase();
      }
    });

    return () => {
      socket.off('step_updated');
    };
  }, [testCaseId, activeProject]);

  // Global Ctrl+V Screenshot Paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Find first expanded step or first step
      const targetStep =
        Object.keys(expandedSteps).find((k) => expandedSteps[k]) ||
        testCase?.steps?.[0]?.id;

      if (!targetStep) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const formData = new FormData();
            formData.append('file', file, `screenshot_step_${Date.now()}.png`);
            try {
              await api.post(`/attachments/TEST_CASE_STEP/${targetStep}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              loadStepMedia(targetStep);
            } catch (err) {
              console.error('Chyba pri nahrávaní screenshotu:', err);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [expandedSteps, testCase]);

  const toggleStepAccordion = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const expandAllSteps = () => {
    const allExpanded: Record<string, boolean> = {};
    testCase?.steps?.forEach((s: any) => {
      allExpanded[s.id] = true;
    });
    setExpandedSteps(allExpanded);
  };

  const collapseAllSteps = () => {
    setExpandedSteps({});
  };

  // Clipboard Ctrl+V handler for screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const expandedStepId = Object.keys(expandedSteps).find((k) => expandedSteps[k]);
      if (!expandedStepId) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setUploadingForStep(expandedStepId);
            const formData = new FormData();
            formData.append('file', file, `screenshot_proof_${Date.now()}.png`);
            try {
              await api.post(`/attachments/TEST_CASE_STEP/${expandedStepId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              await loadStepMedia(expandedStepId);
            } catch (err) {
              console.error('Chyba pri vkladaní screenshotu zo schránky:', err);
            } finally {
              setUploadingForStep(null);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [expandedSteps]);

  const handleUpdateStep = async (
    stepId: string,
    updates: { status?: string; actualResult?: string; assignedToId?: string; requiresProofPhoto?: boolean }
  ) => {
    // Ak krok vyžaduje povinnú fotku a tester ho označuje ako PASSED, overiť či existuje príloha
    const step = testCase?.steps?.find((s: any) => s.id === stepId);
    const isRequired = updates.requiresProofPhoto !== undefined ? updates.requiresProofPhoto : step?.requiresProofPhoto;
    if (isRequired && updates.status === 'PASSED') {
      const attCount = stepAttachments[stepId]?.length || 0;
      if (attCount === 0) {
        alert(
          '⚠️ POZOR: Pre tento testovací krok je nastavená POVINNÁ FOTOGRAFIA / SCREENSHOT ako dôkaz (Proof)!\n\nPred označením kroku za PASSED musíte nahrať aspoň jednu fotografiu (použite tlačidlo "Pridať Foto" alebo vložte screenshot zo schránky stlačením Ctrl+V).'
        );
        return;
      }
    }

    try {
      await api.patch(`/projects/${activeProject?.id || 'RITS'}/test-cases/steps/${stepId}`, updates);
      await fetchTestCase();
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa aktualizovať krok');
    }
  };

  // Multi-file upload handler
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadTargetStepId) return;

    setUploadingForStep(uploadTargetStepId);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        await api.post(`/attachments/TEST_CASE_STEP/${uploadTargetStepId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await loadStepMedia(uploadTargetStepId);
    } catch (err) {
      console.error('Chyba nahrávania súborov:', err);
    } finally {
      setUploadingForStep(null);
      setUploadTargetStepId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset entire scenario
  const handleResetScenario = async () => {
    setResetting(true);
    try {
      await api.post(`/projects/${activeProject?.id || 'RITS'}/test-cases/${testCaseId}/reset`);
      setShowResetModal(false);
      await fetchTestCase();
    } catch (err: any) {
      alert(err.message || 'Chyba resetovania scenára');
    } finally {
      setResetting(false);
    }
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCaseId) return;

    try {
      await api.post(`/projects/${activeProject?.id || 'RITS'}/test-cases/${testCaseId}/relationships`, {
        targetCaseId,
        linkType,
      });
      setShowLinkModal(false);
      setTargetCaseId('');
      fetchTestCase();
    } catch (err: any) {
      alert(err.message || 'Chyba pri vytváraní prepojenia');
    }
  };

  const handleDeleteRelationship = async (relId: string) => {
    try {
      await api.delete(`/projects/${activeProject?.id || 'RITS'}/test-cases/relationships/${relId}`);
      fetchTestCase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const parseStepData = (rawTestData?: string) => {
    if (!rawTestData) return null;
    try {
      return JSON.parse(rawTestData);
    } catch {
      return { raw: rawTestData };
    }
  };

  if (loading || !testCase) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-xs font-mono">Načítavam testovací scenár...</p>
      </div>
    );
  }

  const passedCount = testCase.steps?.filter((s: any) => s.status === 'PASSED').length || 0;
  const failedCount = testCase.steps?.filter((s: any) => s.status === 'FAILED').length || 0;
  const blockedCount = testCase.steps?.filter((s: any) => s.status === 'BLOCKED').length || 0;
  const totalCount = testCase.steps?.length || 0;
  const progressPct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 max-w-[1680px] w-full mx-auto">
      {/* Hidden Multi-file input (Images, Videos, Docs) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMultiFileUpload}
        accept="image/*,video/*,.pdf,.doc,.docx"
        multiple
        className="hidden"
      />

      {/* Lightbox / Video Player & Full-Size Modal */}
      <MediaViewerModal
        isOpen={!!selectedPhoto}
        attachment={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />

      {/* Top Header Card with High-Contrast Accents */}
      <Card variant="glass" className="p-6 border-white/15 shadow-2xl bg-zinc-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/test-cases">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Katalóg
                </Button>
              </Link>
              {testCase.epic && (
                <>
                  <span className="text-zinc-600">/</span>
                  <span className="text-xs font-mono text-blue-300">
                    {testCase.epic.code}
                  </span>
                </>
              )}
              {testCase.suite && (
                <>
                  <span className="text-zinc-600">/</span>
                  <span className="text-xs font-medium text-purple-300">
                    {testCase.suite.title}
                  </span>
                </>
              )}
              <span className="text-zinc-600">/</span>
              <span className="font-mono font-bold text-blue-400 text-xs px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                {testCase.code}
              </span>
              <Badge
                variant={
                  testCase.priority === 'CRITICAL'
                    ? 'danger'
                    : testCase.priority === 'HIGH'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {testCase.priority}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {testCase.testType}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {testCase.title}
            </h1>
            {testCase.description && (
              <p className="text-xs text-zinc-400 mt-1">{testCase.description}</p>
            )}
          </div>

          {/* Quick Metrics & Reset Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Stats Box */}
            <div className="p-3 bg-black/50 border border-white/[0.08] rounded-xl text-left sm:text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-medium block">
                Úspešnosť Krokov
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-white font-mono">
                  {passedCount} / {totalCount} ({progressPct}%)
                </span>
                {failedCount > 0 && (
                  <span className="text-xs text-rose-400 font-mono font-bold">
                    • {failedCount} FAILED
                  </span>
                )}
                {blockedCount > 0 && (
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    • {blockedCount} BLOCKED
                  </span>
                )}
              </div>
            </div>

            {/* Reset Entire Scenario Button */}
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowResetModal(true)}
              className="h-10 text-xs border-rose-500/40 text-rose-300 hover:bg-rose-500/10 hover:border-rose-500 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> Zresetovať Celý Scenár
            </Button>
          </div>
        </div>

        {/* Preconditions snippet */}
        {testCase.preconditions && (
          <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block mb-1">
              Predpoklady Scenára (Preconditions)
            </span>
            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {testCase.preconditions}
            </p>
          </div>
        )}

        {/* Cross-Connections Bar (Prepojené testovacie scenáre) */}
        <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 font-mono">
              <Link2 className="w-3.5 h-3.5 text-blue-400" /> Prepojené Scenáre:
            </span>

            {testCase.outgoingLinks?.length === 0 && testCase.incomingLinks?.length === 0 && (
              <span className="text-xs text-zinc-500 italic">Žiadne prepojenia</span>
            )}

            {testCase.outgoingLinks?.map((rel: any) => (
              <div
                key={rel.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono"
              >
                <span>{rel.linkType}:</span>
                <Link href={`/test-cases/${rel.targetCase.id}`} className="font-bold hover:underline">
                  {rel.targetCase.code}
                </Link>
                <button
                  onClick={() => handleDeleteRelationship(rel.id)}
                  className="text-zinc-500 hover:text-rose-400 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {testCase.incomingLinks?.map((rel: any) => (
              <div
                key={rel.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono"
              >
                <span>Link od {rel.sourceCase.code} ({rel.linkType})</span>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLinkModal(true)}
            className="h-7 text-xs px-2.5"
          >
            <Plus className="w-3 h-3 mr-1" /> Prepojiť so scenárom
          </Button>
        </div>
      </Card>

      {/* Steps Section Header & Accordion Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-wide">
            Testovacie Kroky ({totalCount})
          </span>
          <span className="text-xs text-zinc-400">
            • Kliknutím na riadok krok otvoríte alebo zatvoríte
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={expandAllSteps}
            className="h-7 text-xs px-2.5 text-zinc-300 hover:text-white"
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1" /> Rozbaliť všetky
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={collapseAllSteps}
            className="h-7 text-xs px-2.5 text-zinc-300 hover:text-white"
          >
            <ChevronUp className="w-3.5 h-3.5 mr-1" /> Zbaliť všetky
          </Button>
        </div>
      </div>

      {/* Structured Accordion List of Test Steps */}
      <div className="space-y-3">
        {testCase.steps?.map((step: any) => {
          const extra = parseStepData(step.testData);
          const comments = stepComments[step.id] || [];
          const attachments = stepAttachments[step.id] || [];
          const isExpanded = !!expandedSteps[step.id];

          // Format last update timestamp if available
          const updatedTimestamp = step.updatedAt
            ? new Date(step.updatedAt).toLocaleString('sk-SK', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          return (
            <div
              key={step.id}
              className={`rounded-2xl transition-all duration-200 border ${
                isExpanded
                  ? 'border-blue-500/40 bg-zinc-950 shadow-xl shadow-blue-500/10'
                  : 'border-white/[0.1] hover:border-white/20 bg-zinc-950/60'
              }`}
            >
              {/* Step Summary Row (Accordion Header) */}
              <div
                onClick={() => toggleStepAccordion(step.id)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Step Number Badge */}
                  <span className="font-mono font-bold text-xs text-blue-400 px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 rounded-lg shrink-0">
                    #{step.stepNumber}
                  </span>

                  {/* Action Summary Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-xl">
                        {step.action}
                      </span>

                      {extra?.transactionCode && (
                        <Badge variant="purple" className="font-mono text-[10px] py-0 px-1.5">
                          {extra.transactionCode}
                        </Badge>
                      )}

                      {extra?.userRole && (
                        <span className="text-[10px] text-zinc-400 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">
                          {extra.userRole}
                        </span>
                      )}
                    </div>

                    {/* Subline with Date, Assignee, Photo & Comment count */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-mono">
                      {step.assignedTo ? (
                        <span className="text-blue-300 flex items-center gap-1 font-medium">
                          <User className="w-3 h-3" /> {step.assignedTo.fullName}
                        </span>
                      ) : (
                        <span>Nepriradené</span>
                      )}

                      {attachments.length > 0 && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> {attachments.length} foto
                        </span>
                      )}

                      {comments.length > 0 && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {comments.length} správ
                        </span>
                      )}

                      {step.requiresProofPhoto && (
                        <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px]">
                          📷 Povinná fotka
                        </span>
                      )}

                      {updatedTimestamp && (
                        <span className="text-zinc-500">Zmenené: {updatedTimestamp}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side of header: Status Badge & Chevron */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <Badge
                    variant={
                      step.status === 'PASSED'
                        ? 'success'
                        : step.status === 'FAILED'
                        ? 'danger'
                        : step.status === 'BLOCKED'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="font-mono text-xs px-2.5 py-0.5"
                  >
                    {step.status}
                  </Badge>

                  <div className="p-1 rounded-lg bg-white/[0.04] text-zinc-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Step Expanded Content */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-white/[0.06] space-y-4 animate-in fade-in duration-200">
                  {/* Status Toggle Buttons */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-400">Zmeniť stav:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStep(step.id, { status: 'PASSED' })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          step.status === 'PASSED'
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400 font-bold'
                            : 'bg-white/[0.04] text-zinc-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-white/[0.06]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStep(step.id, { status: 'FAILED' })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          step.status === 'FAILED'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-1 ring-rose-400 font-bold'
                            : 'bg-white/[0.04] text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 border border-white/[0.06]'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> FAILED
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStep(step.id, { status: 'BLOCKED' })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          step.status === 'BLOCKED'
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 ring-1 ring-amber-400 font-bold'
                            : 'bg-white/[0.04] text-zinc-300 hover:text-amber-400 hover:bg-amber-500/10 border border-white/[0.06]'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> BLOCKED
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStep(step.id, { status: 'UNTESTED' })}
                        className={`px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                          step.status === 'UNTESTED'
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Reset
                      </button>
                    </div>

                    {/* Step Assignee Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Priradený tester:</span>
                      <select
                        value={step.assignedToId || ''}
                        onChange={(e) => handleUpdateStep(step.id, { assignedToId: e.target.value })}
                        className="bg-zinc-900 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="">-- Nepriradené --</option>
                        {projectUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Admin Toggle for Required Proof Photo */}
                    {(user?.role === 'ADMIN' || user?.role === 'TEST_LEAD') && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStep(step.id, { requiresProofPhoto: !step.requiresProofPhoto })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                          step.requiresProofPhoto
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white hover:bg-white/10'
                        }`}
                        title="Admin prepínač: Vyžadovať povinnú fotografiu pred označením kroku za PASSED"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {step.requiresProofPhoto ? '📷 Povinná fotka: ZAPNUTÁ' : '📷 Povinná fotka: Vypnutá'}
                      </button>
                    )}
                  </div>

                  {/* Action & Expected Result Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Akcia / Činnosť
                      </span>
                      <p className="text-xs text-zinc-100 font-medium leading-relaxed whitespace-pre-wrap">
                        {step.action}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/30">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Očakávaný Výsledok
                      </span>
                      <p className="text-xs text-emerald-200 font-medium leading-relaxed whitespace-pre-wrap">
                        {step.expectedResult}
                      </p>
                    </div>
                  </div>

                  {/* Enterprise Payload & Document Number */}
                  {extra && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {extra.executedBy && (
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Vykonávateľ:</span>
                          <span className="text-zinc-300 font-medium">{extra.executedBy}</span>
                        </div>
                      )}
                      {extra.documentNumber && (
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Číslo dokladu:</span>
                          <span className="font-mono text-blue-400 font-semibold">{extra.documentNumber}</span>
                        </div>
                      )}
                      {extra.inputData && (
                        <div className="sm:col-span-3">
                          <span className="text-zinc-500 text-[10px] block">Vstupné dáta (Payload):</span>
                          <pre className="font-mono text-[11px] text-zinc-300 bg-black/60 p-2 rounded-lg mt-1 overflow-x-auto whitespace-pre-wrap">
                            {extra.inputData}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actual Result Input & Multi-Photo Upload */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Reálna odpoveď testera / Overený výsledok:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        defaultValue={step.actualResult || ''}
                        onBlur={(e) => handleUpdateStep(step.id, { actualResult: e.target.value })}
                        placeholder="Zadajte skutočný výsledok, číslo dokladu alebo správu zo systému..."
                        className="h-9 text-xs bg-zinc-900 border-white/20"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUploadTargetStepId(step.id);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingForStep === step.id}
                        className="h-9 shrink-0 text-xs border-white/20 hover:border-blue-400 font-semibold"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        {uploadingForStep === step.id ? 'Nahrávam...' : 'Pridať Viac Fotografií'}
                      </Button>
                    </div>
                  </div>

                  {/* Photos, Screenshots & Videos Gallery with Lightbox Player */}
                  {attachments.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Dôkazy, Fotografie & Videá ({attachments.length}):
                        </span>
                        <span className="text-[10px] text-zinc-500">Kliknite pre prehratie / zväčšenie</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {attachments.map((att: any) => {
                          const isVid =
                            att.mimeType?.startsWith('video/') ||
                            /\.(mp4|webm|ogg|mov|mkv|avi)$/i.test(att.fileName);

                          return (
                            <div
                              key={att.id}
                              onClick={() => setSelectedPhoto(att)}
                              className="group relative p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-all shadow-md overflow-hidden flex flex-col items-center text-center"
                            >
                              <div className="w-full h-24 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center mb-1.5 relative">
                                {isVid ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-blue-400 relative">
                                    <Film className="w-8 h-8 opacity-70 group-hover:scale-110 transition-transform" />
                                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-blue-600/80 text-[9px] font-bold text-white font-mono flex items-center gap-0.5">
                                      ▶ VIDEO
                                    </span>
                                  </div>
                                ) : (
                                  <img
                                    src={att.downloadUrl}
                                    alt={att.fileName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-300 truncate w-full">
                                {att.fileName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Discord Reactions & Rich Comment Thread */}
                  <div className="pt-3 border-t border-white/[0.08]">
                    <CommentThread
                      targetType="TEST_CASE_STEP"
                      targetId={step.id}
                      comments={comments}
                      projectUsers={projectUsers}
                      onRefresh={() => loadStepMedia(step.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Cross-Connection (Prepojenie so scenárom) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl space-y-4 bg-zinc-950 border-white/20">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" /> Prepojiť Testovací Scenár
            </h2>

            <form onSubmit={handleCreateRelationship} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Cieľový Scenár
                </label>
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 h-10 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Vyberte scenár --</option>
                  {allTestCases
                    .filter((tc) => tc.id !== testCaseId)
                    .map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.code} • {tc.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Typ Prepojenia (Vzťah)
                </label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 h-10 text-xs text-white focus:outline-none"
                >
                  <option value="DEPENDS_ON">Závisí na (Depends on)</option>
                  <option value="BLOCKS">Blokuje (Blocks)</option>
                  <option value="RELATED">Súvisiaci (Related to)</option>
                  <option value="FOLLOWS">Nadväzuje na (Follows)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <Button type="button" variant="ghost" onClick={() => setShowLinkModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default">
                  Uložiť Prepojenie
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Reset Entire Scenario Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl space-y-4 bg-zinc-950 border-rose-500/40">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 text-rose-400">
              <RotateCcw className="w-5 h-5" /> Zresetovať Celý Scenár?
            </h2>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Naozaj si prajete resetovať všetky kroky tohto scenára na stav{' '}
              <strong className="text-white font-mono">UNTESTED</strong>? Všetky reálne odpovede a
              priradené stavy budú vyčistené, aby ste mohli spustiť nový testovací cyklus.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
              >
                Zrušiť
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetScenario}
                disabled={resetting}
              >
                {resetting ? 'Resetujem...' : 'Potvrdiť Reset'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
