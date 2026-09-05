'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { formatSeconds } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Paperclip,
  MessageSquare,
  Bug,
  Lock,
  Image as ImageIcon,
  Send,
  Upload,
  Layers,
  ChevronRight,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CommentThread } from '@/components/ui/CommentThread';
import { MediaViewerModal } from '@/components/ui/MediaViewerModal';
import { resolveAttachmentUrl } from '@/lib/api';

export default function TestExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testRunId } = use(params);
  const { user, activeTimer, setActiveTimer } = useAppStore();
  const [run, setRun] = useState<any>(null);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [activeLocks, setActiveLocks] = useState<Record<string, { userId: string; userName: string }>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [actualResultInput, setActualResultInput] = useState('');
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSeverity, setBugSeverity] = useState('MAJOR');
  const [loading, setLoading] = useState(false);
  const [toastNotification, setToastNotification] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => setToastNotification(null), 4000);
  };

  const fetchRun = async () => {
    try {
      const res: any = await api.get(`/test-runs/${testRunId}`);
      setRun(res);
      if (!selectedStep && res.executions?.[0]?.stepExecs?.[0]) {
        selectStep(res.executions[0].stepExecs[0], res.executions[0].testCase);
      }
    } catch (err) {
      console.error('Chyba načítania runu:', err);
    }
  };

  useEffect(() => {
    fetchRun();

    // Socket.io Real-time Setup
    const socket = getSocket();
    socket.emit('join_test_run', { testRunId });

    socket.on('step_locked', (data: any) => {
      setActiveLocks((prev) => ({
        ...prev,
        [data.stepExecutionId]: { userId: data.userId, userName: data.userName },
      }));
    });

    socket.on('step_unlocked', (data: any) => {
      setActiveLocks((prev) => {
        const next = { ...prev };
        delete next[data.stepExecutionId];
        return next;
      });
    });

    socket.on('step_updated', () => {
      fetchRun();
    });

    return () => {
      socket.off('step_locked');
      socket.off('step_unlocked');
      socket.off('step_updated');
    };
  }, [testRunId]);

  // Ctrl+V Screenshot Paste Handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.comment-thread-editor') || target?.tagName === 'TEXTAREA') {
        return;
      }

      if (!selectedStep || !user) return;
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFile = file;
            break; // Stop at first valid image to prevent duplicate paste!
          }
        }
      }

      if (imageFile) {
        e.preventDefault();
        e.stopPropagation();
        const formData = new FormData();
        formData.append('file', imageFile, `screenshot_${Date.now()}.png`);
        try {
          await api.post(`/attachments/STEP_EXECUTION/${selectedStep.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          loadStepDetails(selectedStep.id);
          showToast(`📸 Screenshot úspešne vložený k vybranému kroku!`, 'success');
        } catch (err: any) {
          console.error('Chyba pri nahrávaní screenshotu:', err);
          showToast('Chyba pri nahrávaní screenshotu: ' + (err?.message || 'Neznáma chyba'), 'error');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedStep, user]);

  const selectStep = (step: any, testCase: any) => {
    setSelectedStep({ ...step, testCase });
    setActualResultInput(step.actualResult || '');
    loadStepDetails(step.id);

    if (user) {
      const socket = getSocket();
      socket.emit('lock_step', {
        stepExecutionId: step.id,
        userId: user.id,
        userName: user.fullName,
        testRunId,
      });
    }
  };

  const loadStepDetails = (stepId: string) => {
    api.get(`/comments/STEP_EXECUTION/${stepId}`).then((res: any) => setComments(res || [])).catch(() => []);
    api.get(`/attachments/STEP_EXECUTION/${stepId}`).then((res: any) => setAttachments(res || [])).catch(() => []);
  };

  const updateStatus = async (status: string) => {
    if (!selectedStep) return;

    // Kontrola povinnej fotografie nastavenej administrátorom
    const isPhotoRequired = selectedStep.requiresProofPhoto || selectedStep.testCaseStep?.requiresProofPhoto;
    if (status === 'PASSED' && isPhotoRequired && attachments.length === 0) {
      alert(
        '⚠️ POZOR: Pre tento testovací krok je nastavená POVINNÁ FOTOGRAFIA / SCREENSHOT ako dôkaz (Proof)!\n\nPred označením kroku za PASSED musíte nahrať aspoň jednu fotografiu alebo screenshot (stlačte "Nahrať Dôkaz" alebo vložte screenshot zo schránky pomocou Ctrl+V).'
      );
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/test-runs/steps/${selectedStep.id}`, {
        status,
        actualResult: actualResultInput,
      });
      await fetchRun();
      setSelectedStep((prev: any) => ({ ...prev, status, actualResult: actualResultInput }));
    } catch (err: any) {
      alert(err.message || 'Chyba aktualizácie stavu');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!selectedStep || !user) return;
    try {
      const res: any = await api.post('/timers/start', {
        stepExecutionId: selectedStep.id,
      });
      setActiveTimer({
        stepExecutionId: selectedStep.id,
        timeLogId: res.id,
        startedAt: res.startedAt,
        stepNumber: selectedStep.testCaseStep.stepNumber,
        testCaseCode: selectedStep.testCase.code,
        action: selectedStep.testCaseStep.action,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedStep) return;

    try {
      await api.post('/comments', {
        targetType: 'STEP_EXECUTION',
        targetId: selectedStep.id,
        content: commentText,
      });
      setCommentText('');
      loadStepDetails(selectedStep.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStep) return;

    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/attachments/STEP_EXECUTION/${selectedStep.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadStepDetails(selectedStep.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStep) return;
    try {
      await api.post('/bugs', {
        projectId: run.projectId,
        stepExecutionId: selectedStep.id,
        code: `BUG-${Date.now().toString().slice(-4)}`,
        title: bugTitle,
        description: bugDesc,
        severity: bugSeverity,
      });
      setShowBugModal(false);
      setBugTitle('');
      setBugDesc('');
      await fetchRun();
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

  if (!run) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-xs font-mono">Načítavam reláciu a synchronizujem...</p>
      </div>
    );
  }

  const extra = selectedStep ? parseStepData(selectedStep.testCaseStep?.testData) : null;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      {/* Toast Feedback Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-950/95 border border-blue-500/40 text-white shadow-2xl backdrop-blur-xl font-mono text-xs">
            <span className="text-sm">📸</span>
            <span>{toastNotification.message}</span>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <Card variant="glass" className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="glass" className="text-[10px] font-mono">
                RUNNER
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {run.environment}
              </Badge>
              <Badge
                variant={run.status === 'COMPLETED' ? 'success' : 'info'}
                className="text-[10px]"
              >
                {run.status}
              </Badge>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {run.title}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Podpora <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-zinc-300 font-mono text-[10px]">Ctrl+V</kbd> pre okamžité vloženie screenshotu
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">
                Splnené
              </span>
              <span className="text-xs font-semibold text-white font-mono">
                {run.executions?.reduce(
                  (acc: number, e: any) =>
                    acc + e.stepExecs.filter((s: any) => s.status === 'PASSED').length,
                  0
                )}{' '}
                / {run.executions?.reduce((acc: number, e: any) => acc + e.stepExecs.length, 0)} krokov
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Split Workbench: Left Navigation (4 Cols), Right Step Execution (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Test Cases & Steps Tree (4 Cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-3.5 flex flex-col max-h-[750px] overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono px-2 py-1 block">
            Testovacie Scenáre & Kroky
          </span>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-1">
            {run.executions?.map((exec: any) => (
              <div
                key={exec.id}
                className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-400">
                    {exec.testCase.code}
                  </span>
                  <Badge
                    variant={
                      exec.status === 'PASSED'
                        ? 'success'
                        : exec.status === 'FAILED'
                        ? 'danger'
                        : exec.status === 'BLOCKED'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-[9px] py-0 px-1.5"
                  >
                    {exec.status}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-300 font-medium line-clamp-1">
                  {exec.testCase.title}
                </p>

                {/* Steps List */}
                <div className="space-y-1 pt-1">
                  {exec.stepExecs?.map((step: any) => {
                    const isSelected = selectedStep?.id === step.id;
                    const lock = activeLocks[step.id];
                    return (
                      <button
                        key={step.id}
                        onClick={() => selectStep(step, exec.testCase)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-white/[0.1] border border-white/20 text-white font-medium shadow-sm'
                            : 'bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="font-mono text-[11px] text-blue-400 font-semibold">
                            #{step.testCaseStep.stepNumber}
                          </span>
                          <span className="truncate text-zinc-200">{step.testCaseStep.action}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {lock && lock.userId !== user?.id && (
                            <span
                              title={`${lock.userName} práve testuje tento krok`}
                              className="text-amber-400"
                            >
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
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
                            className="text-[9px] py-0 px-1.5"
                          >
                            {step.status}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Step Workbench (8 Cols) */}
        {selectedStep ? (
          <div className="lg:col-span-8 glass-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div>
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-blue-400">
                      {selectedStep.testCase.code} • Krok #{selectedStep.testCaseStep.stepNumber}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {formatSeconds(selectedStep.durationSecs)}
                    </Badge>
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-white">
                    {selectedStep.testCase.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Admin Toggle for Required Proof Photo */}
                  {(user?.role === 'ADMIN' || user?.role === 'TEST_LEAD') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const newReq = !selectedStep.testCaseStep?.requiresProofPhoto;
                        try {
                          await api.patch(
                            `/projects/${run.projectId}/test-cases/steps/${selectedStep.testCaseStep.id}`,
                            { requiresProofPhoto: newReq }
                          );
                          setSelectedStep((prev: any) => ({
                            ...prev,
                            testCaseStep: { ...prev.testCaseStep, requiresProofPhoto: newReq },
                          }));
                        } catch (err: any) {
                          alert(err.message || 'Chyba nastavenia povinnej fotografie');
                        }
                      }}
                      className={`h-8 text-xs font-semibold border ${
                        selectedStep.testCaseStep?.requiresProofPhoto
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'border-white/15 text-zinc-400 hover:text-white'
                      }`}
                      title="Prepínač pre administrátora: Vyžadovať povinnú fotografiu ako dôkaz pred úspešným dokončením"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mr-1" />
                      {selectedStep.testCaseStep?.requiresProofPhoto
                        ? '📷 Povinná fotka: ZAP'
                        : '📷 Povinná fotka: VYP'}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant={activeTimer?.stepExecutionId === selectedStep.id ? 'destructive' : 'outline'}
                    onClick={handleStartTimer}
                    className="h-8 text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {activeTimer?.stepExecutionId === selectedStep.id ? 'Stop' : 'Stopky'}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setBugTitle(`Chyba na kroku #${selectedStep.testCaseStep.stepNumber}: ${selectedStep.testCaseStep.action.slice(0, 45)}`);
                      setShowBugModal(true);
                    }}
                    className="h-8 text-xs"
                  >
                    <Bug className="w-3.5 h-3.5 mr-1" /> Nahlásiť Bug
                  </Button>
                </div>
              </div>

              {/* Mandatory Photo Alert Banner */}
              {(selectedStep.requiresProofPhoto || selectedStep.testCaseStep?.requiresProofPhoto) && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📷</span>
                    <div>
                      <span className="font-bold block">POVINNÁ FOTOGRAFIA / SCREENSHOT AKO DÔKAZ</span>
                      <span className="text-[11px] text-zinc-400">
                        Administrátor vyžaduje aspoň jeden screenshot pred označením kroku za PASSED.
                      </span>
                    </div>
                  </div>
                  {attachments.length > 0 ? (
                    <Badge variant="success" className="text-[10px] font-mono">
                      ✓ Nahrané ({attachments.length})
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] font-mono animate-pulse">
                      Chýba fotografia
                    </Badge>
                  )}
                </div>
              )}

              {/* Bento Cards for Action, Expected, Payload */}
              <div className="grid grid-cols-1 gap-3 mt-4">
                {/* Action Card */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 font-mono">
                      Akcia (Čo vykonať)
                    </span>
                    {extra?.transactionCode && (
                      <Badge variant="purple" className="font-mono text-[10px]">
                        T-Code: {extra.transactionCode}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                    {selectedStep.testCaseStep.action}
                  </p>
                </div>

                {/* Expected Result Card */}
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 font-mono block mb-1">
                    Očakávaný Výsledok
                  </span>
                  <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                    {selectedStep.testCaseStep.expectedResult}
                  </p>
                </div>

                {/* Enterprise extra details */}
                {extra && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {extra.userRole && (
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Rola:</span>
                        <span className="font-medium text-zinc-300">{extra.userRole}</span>
                      </div>
                    )}
                    {extra.executedBy && (
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Vykonávateľ:</span>
                        <span className="font-medium text-zinc-300">{extra.executedBy}</span>
                      </div>
                    )}
                    {extra.documentNumber && (
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Číslo dokladu:</span>
                        <span className="font-mono text-blue-400 font-medium">{extra.documentNumber}</span>
                      </div>
                    )}
                    {extra.inputData && (
                      <div className="col-span-full">
                        <span className="text-zinc-500 text-[10px] block">Vstupné dáta (Payload):</span>
                        <pre className="font-mono text-[11px] text-zinc-300 bg-black/50 p-2 rounded-lg mt-1 overflow-x-auto whitespace-pre-wrap">
                          {extra.inputData}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actual Result Input & Status Buttons */}
              <div className="mt-5 space-y-2.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Reálny Výsledok / Poznámka
                </label>
                <Textarea
                  rows={2}
                  value={actualResultInput}
                  onChange={(e) => setActualResultInput(e.target.value)}
                  placeholder="Zadajte skutočný stav, vygenerovaný doklad alebo číslo overenia..."
                  className="text-xs"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <Button
                    variant="success"
                    onClick={() => updateStatus('PASSED')}
                    disabled={loading}
                    className="h-9"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PASSED
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus('FAILED')}
                    disabled={loading}
                    className="h-9"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> FAILED
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateStatus('BLOCKED')}
                    disabled={loading}
                    className="text-amber-400 h-9"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> BLOCKED
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => updateStatus('SKIPPED')}
                    disabled={loading}
                    className="h-9"
                  >
                    SKIPPED
                  </Button>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mt-5 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-zinc-400" /> Dôkazy & Screenshoty ({attachments.length})
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs px-2.5"
                  >
                    <Upload className="w-3 h-3 mr-1" /> Nahrať
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {attachments.map((att) => {
                    const isVid =
                      att.mimeType?.startsWith('video/') ||
                      /\.(mp4|webm|ogg|mov|mkv|avi)$/i.test(att.fileName);
                    const isImg =
                      att.mimeType?.startsWith('image/') ||
                      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.fileName);

                    return (
                      <div
                        key={att.id}
                        onClick={() => setSelectedMedia(att)}
                        className="group relative p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-all shadow-md overflow-hidden flex flex-col items-center text-center"
                      >
                        <div className="w-full h-20 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center mb-1.5 relative">
                          {isImg ? (
                            <img
                              src={resolveAttachmentUrl(att)}
                              alt={att.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.4';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-zinc-400">
                              <ImageIcon className="w-6 h-6 mb-1 text-blue-400" />
                              <span className="text-[9px] font-mono">{isVid ? 'VIDEO' : 'SÚBOR'}</span>
                            </div>
                          )}
                        </div>
                        <span className="truncate text-[10px] text-zinc-300 font-mono w-full">
                          {att.fileName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comments Section with Discord reactions & markdown formatting */}
              <div className="mt-5 pt-4 border-t border-white/[0.08]">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" /> Diskusia & Discord Reakcie k tomuto kroku ({comments.length})
                </span>

                <CommentThread
                  targetType="STEP_EXECUTION"
                  targetId={selectedStep.id}
                  comments={comments}
                  onRefresh={() => loadStepDetails(selectedStep.id)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
            <Layers className="w-8 h-8 text-zinc-600 mb-2" />
            Vyberte testovací krok vľavo pre zobrazenie
          </div>
        )}
      </div>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2 text-rose-400">
              <Bug className="w-4 h-4" /> Nahlásiť Defekt
            </h2>
            <form onSubmit={handleReportBug} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Názov defektu
                </label>
                <Input
                  required
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Závažnosť (Severity)
                </label>
                <select
                  value={bugSeverity}
                  onChange={(e) => setBugSeverity(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 h-9 text-xs text-white focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="BLOCKER">BLOCKER</option>
                  <option value="MAJOR">MAJOR</option>
                  <option value="MINOR">MINOR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Popis chyby a zistenia
                </label>
                <Textarea
                  rows={3}
                  required
                  value={bugDesc}
                  onChange={(e) => setBugDesc(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button type="button" variant="ghost" onClick={() => setShowBugModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="destructive">
                  Odoslať
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Lightbox / Media Viewer Modal */}
      <MediaViewerModal
        isOpen={!!selectedMedia}
        attachment={selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
}
