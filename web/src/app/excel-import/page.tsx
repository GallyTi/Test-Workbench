'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  FileUp,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Eye,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';

export default function ExcelImportPage() {
  const router = useRouter();
  const { activeProject } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jobData, setJobData] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({
    code: 'A',
    title: 'B',
    preconditions: 'C',
    stepNumber: 'D',
    action: 'E',
    expectedResult: 'F',
    testData: 'G',
  });
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post(
        `/excel-import/upload/project/${activeProject.id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setJobData(res);
      if (res.columnMappingGuess && Object.keys(res.columnMappingGuess).length > 0) {
        setMapping((prev) => ({ ...prev, ...res.columnMappingGuess }));
      }
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa nahrať Excel');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewMapping = async () => {
    if (!jobData) return;
    setLoading(true);
    try {
      const res: any = await api.post('/excel-import/preview', {
        jobId: jobData.jobId,
        columnMapping: mapping,
      });
      setPreviewRows(res.mappedPreview || []);
      setStep(3);
    } catch (err: any) {
      alert(err.message || 'Chyba pri generovaní náhľadu');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!jobData) return;
    setLoading(true);
    try {
      const res: any = await api.post('/excel-import/execute', {
        jobId: jobData.jobId,
      });
      setImportResult(res);
    } catch (err: any) {
      alert(err.message || 'Import zlyhal');
    } finally {
      setLoading(false);
    }
  };

  const availableColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="glass" className="text-[10px] font-mono">
            MIGRÁCIA DÁT
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileUp className="w-6 h-6 text-zinc-300" />
          Excel Import Workbench
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Konvertor a heuristický mapper starých tabuliek priamo do relačnej databázy.
        </p>
      </div>

      {/* Stepper Wizard */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                step >= 1 ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              1
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Nahratie súboru</p>
              <p className="text-[10px] text-zinc-500">XLSX, XLS, CSV</p>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />

          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                step >= 2 ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Mapovanie Stĺpcov</p>
              <p className="text-[10px] text-zinc-500">Heuristika</p>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />

          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                step >= 3 ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              3
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Validácia & Zápis</p>
              <p className="text-[10px] text-zinc-500">Import</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 1: Upload Box */}
      {step === 1 && (
        <Card variant="interactive" className="p-12 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.08] text-zinc-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">
            Nahrajte starý Excel s testovacími prípadmi
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
            Systém automaticky rozpozná stĺpce (ID, Akcia, Očakávaný výsledok, Dáta, Rola).
          </p>
          <Button
            size="default"
            variant="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? 'Analyzujem súbor...' : 'Vybrať XLSX / CSV zo zariadenia'}
          </Button>
        </Card>
      )}

      {/* Step 2: Visual Column Mapper */}
      {step === 2 && jobData && (
        <Card variant="glass" className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Priradenie stĺpcov: <span className="text-blue-400">{jobData.fileName}</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Skontrolujte alebo upravte stĺpce, z ktorých má systém prečítať kľúčové polia.
              </p>
            </div>
            <Badge variant="outline">{jobData.totalRows} riadkov</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'code', label: 'Kód testu (ID)', desc: 'napr. UAT_911' },
              { key: 'title', label: 'Názov testu (Title)', desc: 'Popis scenára' },
              { key: 'preconditions', label: 'Predpoklady', desc: 'Počiatočný stav' },
              { key: 'stepNumber', label: 'Číslo kroku', desc: 'Poradie 1, 2, 3...' },
              { key: 'action', label: 'Akcia / Činnosť', desc: 'Čo vykonať' },
              { key: 'expectedResult', label: 'Očakávaný výsledok', desc: 'Kritérium úspechu' },
              { key: 'testData', label: 'Vstupné dáta / Payload', desc: 'XML, JSON, hodnoty' },
            ].map((field) => (
              <div
                key={field.key}
                className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] flex items-center justify-between"
              >
                <div>
                  <label className="font-semibold text-xs text-zinc-200 block">{field.label}</label>
                  <span className="text-[10px] text-zinc-500">{field.desc}</span>
                </div>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  className="bg-black/60 border border-white/[0.1] font-mono font-bold text-xs rounded-lg px-2.5 py-1 text-white focus:outline-none"
                >
                  <option value="">-- Ignorovať --</option>
                  {availableColumns.map((c) => (
                    <option key={c} value={c}>
                      Stĺpec {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Späť
            </Button>
            <Button onClick={handlePreviewMapping} disabled={loading} variant="default">
              <Eye className="w-3.5 h-3.5 mr-1" /> Zobraziť Náhľad Dát
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Live Preview & Execute */}
      {step === 3 && (
        <Card variant="glass" className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <h2 className="text-sm font-semibold text-white">Náhľad Pred Zápisom</h2>
              <p className="text-xs text-zinc-400">
                Overte namapované riadky pred konečným importom do databázy.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setStep(2)}>
              Upraviť mapovanie
            </Button>
          </div>

          {importResult ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-emerald-300">
                Import Úspešne Dokončený!
              </h3>
              <p className="text-xs text-zinc-300">
                Bolo úspešne naimportovaných <strong>{importResult.importedCasesCount}</strong> testovacích scenárov.
              </p>
              <Button onClick={() => router.push('/test-cases')} variant="default" className="mt-2">
                Prejsť do Katalógu Testov
              </Button>
            </div>
          ) : (
            <>
              <div className="border border-white/[0.08] rounded-xl overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/[0.04] text-zinc-400 uppercase text-[10px] font-semibold sticky top-0">
                    <tr>
                      <th className="p-2.5">Riadok</th>
                      <th className="p-2.5">Kód</th>
                      <th className="p-2.5">Názov</th>
                      <th className="p-2.5">Krok</th>
                      <th className="p-2.5">Akcia</th>
                      <th className="p-2.5">Očakávaný Výsledok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {previewRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 font-mono text-zinc-500">#{r.rowIndex}</td>
                        <td className="p-2.5 font-semibold text-blue-400 font-mono">{r.code}</td>
                        <td className="p-2.5 text-zinc-200">{r.title}</td>
                        <td className="p-2.5 font-mono">#{r.stepNumber}</td>
                        <td className="p-2.5 text-zinc-300">{r.action}</td>
                        <td className="p-2.5 text-emerald-400">{r.expectedResult}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Zmeniť Mapovanie
                </Button>
                <Button onClick={handleExecuteImport} disabled={loading} variant="default">
                  {loading ? 'Importujem...' : 'Potvrdiť & Zapísať do Databázy'}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
