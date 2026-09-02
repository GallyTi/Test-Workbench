'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Timer, Square, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export function ActiveTimerWidget() {
  const { activeTimer, setActiveTimer } = useAppStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeTimer.startedAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  if (!activeTimer) return null;

  const handleStopTimer = async () => {
    try {
      await api.post('/timers/stop', {
        timeLogId: activeTimer.timeLogId,
        isIdle: false,
      });
      setActiveTimer(null);
    } catch (err) {
      console.error('Chyba pri zastavení časovača:', err);
    }
  };

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <Timer className="w-5 h-5 text-emerald-400" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 text-base">{timeFormatted}</span>
          <span className="text-xs text-gray-300 font-semibold">{activeTimer.testCaseCode} (Krok #{activeTimer.stepNumber})</span>
        </div>
        <p className="text-[11px] text-gray-400 max-w-[200px] truncate">{activeTimer.action}</p>
      </div>

      <Button
        size="sm"
        variant="destructive"
        onClick={handleStopTimer}
        className="h-8 px-3 text-xs rounded-lg"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        Stop
      </Button>
    </div>
  );
}
