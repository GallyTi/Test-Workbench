'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Film,
  Paperclip,
  Upload,
  Info,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Columns,
  Eye,
  Edit3,
  Save,
  Link2,
  Sparkles,
  HelpCircle,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocMarkdownRenderer } from './DocMarkdownRenderer';

interface DocEditorProps {
  pageId: string;
  initialContent: string;
  onSave: (newContent: string, changeSummary?: string) => Promise<void>;
  onCancel?: () => void;
  allTestCases?: any[];
}

export function DocEditor({
  pageId,
  initialContent,
  onSave,
  onCancel,
  allTestCases = [],
}: DocEditorProps) {
  const [content, setContent] = useState(initialContent || '');
  const [editorMode, setEditorMode] = useState<'write' | 'split' | 'preview'>('split');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showTcMenu, setShowTcMenu] = useState(false);
  const [showMermaidMenu, setShowMermaidMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'file'>('image');

  // Handle Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, changeSummary]);

  // Handle Ctrl+V paste of images directly into editor
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await uploadAndInsertMedia(file, 'image');
          }
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
      return () => textarea.removeEventListener('paste', handlePaste);
    }
  }, [pageId]);

  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultText = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const uploadAndInsertMedia = async (file: File, type: 'image' | 'video' | 'file') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to our local backend S3/MinIO
      const res: any = await api.post(`/attachments/DOC_PAGE/${pageId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = res.downloadUrl;
      const name = res.fileName || file.name;

      if (type === 'image') {
        insertTextAtCursor(`\n![${name}](${url})\n`);
      } else if (type === 'video') {
        insertTextAtCursor(`\n!video[${name}](${url})\n`);
      } else {
        insertTextAtCursor(`\n[📎 ${name}](${url})\n`);
      }
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa nahrať súbor');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndInsertMedia(file, uploadType);
    }
  };

  const triggerUpload = (type: 'image' | 'video' | 'file') => {
    setUploadType(type);
    if (fileInputRef.current) {
      if (type === 'image') fileInputRef.current.accept = 'image/*';
      else if (type === 'video') fileInputRef.current.accept = 'video/*';
      else fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip';
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(content, changeSummary || undefined);
      setChangeSummary('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Formatting & Controls Header Toolbar */}
      <div className="p-2.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-xl flex flex-wrap items-center justify-between gap-2 text-zinc-300">
        {/* Left: Text Formatting Group */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n# ', '\n', 'Nadpis 1')}
            title="Nadpis H1"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n## ', '\n', 'Nadpis 2')}
            title="Nadpis H2"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n### ', '\n', 'Nadpis 3')}
            title="Nadpis H3"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('**', '**', 'tučný text')}
            title="Tučné písmo (Bold)"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('*', '*', 'kurzíva')}
            title="Kurzíva (Italic)"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('~~', '~~', 'prečiarknuté')}
            title="Prečiarknuté (Strikethrough)"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('`', '`', 'kód')}
            title="Inline Kód"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n- ', '', 'Položka zoznamu')}
            title="Odrážkový zoznam"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n1. ', '', 'Prvý krok')}
            title="Číslovaný zoznam"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n> ', '\n', 'Dôležitá citácia alebo poznámka')}
            title="Citácia / Blok"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n---\n')}
            title="Vodorovný oddeľovač"
            className="p-1.5 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Tables Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTableMenu(!showTableMenu)}
              title="Vložiť tabuľku"
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                showTableMenu ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline text-[11px]">Tabuľka</span>
            </button>

            {showTableMenu && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n| Stĺpec 1 | Stĺpec 2 | Stĺpec 3 |\n| :--- | :--- | :--- |\n| Hodnota A | Hodnota B | Hodnota C |\n| Hodnota D | Hodnota E | Hodnota F |\n'
                    );
                    setShowTableMenu(false);
                  }}
                  className="w-full p-2 hover:bg-emerald-500/20 text-emerald-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">1. Štandardná tabuľka</span>
                  <span className="text-[10px] text-zinc-400">Základná 3-stĺpcová tabuľka s hlavičkou</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n| Systém / Komponent | Rozhranie (Interface) | Protokol / Formát | Popis payloadu |\n| :--- | :--- | :--- | :--- |\n| POS Pokladňa | IF_RITS_001 | REST / JSON | Predaj tovaru a čerpanie |\n| DOMS Controller | IF_RITS_009 | TCP Socket | Merania stavu nádrží |\n| SAP S/4HANA | IF_RITS_SAP | RFC / IDoc | Finančné zúčtovanie (WMMBID02) |\n'
                    );
                    setShowTableMenu(false);
                  }}
                  className="w-full p-2 hover:bg-emerald-500/20 text-emerald-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">2. Tabuľka rozhraní (Interfaces)</span>
                  <span className="text-[10px] text-zinc-400">Architektúra prepojení medzi systémami</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n| Krok # | Akcia / Činnosť | Očakávaný výsledok | Skutočný výsledok | Stav |\n| :--- | :--- | :--- | :--- | :--- |\n| 1 | Spustenie čerpania na stojane #1 | Palivo vydané bez chyby | Vydané 42.50 L | PASSED |\n| 2 | Odoslanie transakcie do SSR | Kód 200 OK a vygenerované ID transakcie | 200 OK (ID 9841) | PASSED |\n| 3 | Overenie IDocu v SAP (WE02) | IDoc má status 53 (Úspešne zaúčtovaný) | Status 53 | PASSED |\n'
                    );
                    setShowTableMenu(false);
                  }}
                  className="w-full p-2 hover:bg-emerald-500/20 text-emerald-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">3. Testovacia matica (Test Matrix)</span>
                  <span className="text-[10px] text-zinc-400">Tabuľka krokov a overenia výsledkov</span>
                </button>
              </div>
            )}
          </div>

          {/* Callout Alert Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalloutMenu(!showCalloutMenu)}
              title="Vložiť informačný box (Callout)"
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                showCalloutMenu ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-[11px]">Box</span>
            </button>

            {showCalloutMenu && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor('\n:::info\n', '\n:::\n', 'Informačný oznam pre tím...');
                    setShowCalloutMenu(false);
                  }}
                  className="w-full p-1.5 hover:bg-blue-500/20 text-blue-300 text-xs rounded-lg flex items-center gap-2 text-left"
                >
                  <Info className="w-3.5 h-3.5" /> Informácia (Info)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor('\n:::warning\n', '\n:::\n', 'Upozornenie pred spustením...');
                    setShowCalloutMenu(false);
                  }}
                  className="w-full p-1.5 hover:bg-amber-500/20 text-amber-300 text-xs rounded-lg flex items-center gap-2 text-left"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Varovanie (Warning)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor('\n:::tip\n', '\n:::\n', 'Praktický tip z testovania...');
                    setShowCalloutMenu(false);
                  }}
                  className="w-full p-1.5 hover:bg-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center gap-2 text-left"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Tip (Pro-Tip)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor('\n:::danger\n', '\n:::\n', 'Kritické pravidlo: nesmie nastať...');
                    setShowCalloutMenu(false);
                  }}
                  className="w-full p-1.5 hover:bg-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2 text-left"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Kritické (Danger)
                </button>
              </div>
            )}
          </div>

          {/* Mermaid UML Diagram Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMermaidMenu(!showMermaidMenu)}
              title="Vložiť UML / Mermaid diagram"
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                showMermaidMenu ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline text-[11px]">Diagram</span>
            </button>

            {showMermaidMenu && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n```mermaid\ngraph LR\n    POS["POS / DOMS"] -->|IF_RITS_009| SSR["SSR Central Hub"]\n    SSR -->|IDoc / RFC| SAP["SAP ERP S/4HANA"]\n```\n'
                    );
                    setShowMermaidMenu(false);
                  }}
                  className="w-full p-2 hover:bg-purple-500/20 text-purple-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">1. Architektonický tok (Komunikácia)</span>
                  <span className="text-[10px] text-zinc-400">[POS] ➔ (IF_RITS_009) ➔ [SSR Hub] ➔ [SAP]</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n```mermaid\nsequenceDiagram\n    autonumber\n    actor Tester\n    participant POS as POS Pokladňa\n    participant DOMS as DOMS Controller\n    participant SSR as SSR Hub\n    participant SAP as SAP ERP S/4HANA\n    Tester->>POS: Zadanie dodávky paliva (MB01)\n    POS->>DOMS: Overenie hladiny v nádrži\n    DOMS-->>POS: Meranie sondy OK\n    POS->>SSR: IF_RITS_009 Settlement Payload\n    SSR->>SAP: IDoc WMMBID02 Účtovanie\n    SAP-->>SSR: Potvrdenie dokladu 50001829\n```\n'
                    );
                    setShowMermaidMenu(false);
                  }}
                  className="w-full p-2 hover:bg-purple-500/20 text-purple-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">2. Sekvenčný Diagram (Sequence)</span>
                  <span className="text-[10px] text-zinc-400">Kroková komunikácia medzi systémami</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n```mermaid\ngraph TD\n    A[Štart Testu] --> B{Transakcia na POS}\n    B -->|Úspešná| C[Generovanie Bločku]\n    B -->|Zlyhanie| D[Zápis Dlhovek v POS]\n    C --> E[Odoslanie do SSR]\n    D --> E\n    E --> F[Zúčtovanie v SAP ERP]\n```\n'
                    );
                    setShowMermaidMenu(false);
                  }}
                  className="w-full p-2 hover:bg-purple-500/20 text-purple-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">3. Vývojový Diagram (Flowchart)</span>
                  <span className="text-[10px] text-zinc-400">Rozhodovacie stromy a vetvenia procesov</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    insertTextAtCursor(
                      '\n```mermaid\nstateDiagram-v2\n    [*] --> Untested\n    Untested --> InProgress: Spustenie kroku\n    InProgress --> Passed: Overené bez chyby\n    InProgress --> Failed: Nájdená odchýlka\n    Failed --> BugReported: Vytvorenie defektu\n    Passed --> [*]\n```\n'
                    );
                    setShowMermaidMenu(false);
                  }}
                  className="w-full p-2 hover:bg-purple-500/20 text-purple-200 text-xs rounded-lg text-left block"
                >
                  <span className="font-bold block">4. Stavový Automat (State Machine)</span>
                  <span className="text-[10px] text-zinc-400">Životný cyklus testu a prechody stavov</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Case Link Dropdown */}
          {allTestCases.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTcMenu(!showTcMenu)}
                title="Odkaz na Testovací Scenár"
                className="p-1.5 hover:bg-white/10 hover:text-blue-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <span>🧪 @TC</span>
              </button>

              {showTcMenu && (
                <div className="absolute left-0 top-full mt-2 w-72 max-h-56 overflow-y-auto bg-zinc-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 divide-y divide-white/[0.06]">
                  <div className="p-1 text-[10px] font-bold text-zinc-400 uppercase font-mono">
                    Vložiť odkaz na test:
                  </div>
                  {allTestCases.map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => {
                        insertTextAtCursor(`@${tc.code} `);
                        setShowTcMenu(false);
                      }}
                      className="w-full p-2 hover:bg-white/[0.08] text-left text-xs transition-colors flex flex-col"
                    >
                      <span className="font-mono font-bold text-blue-400">{tc.code}</span>
                      <span className="text-[11px] text-zinc-300 truncate">{tc.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Media & Files Upload Buttons */}
          <button
            type="button"
            onClick={() => triggerUpload('image')}
            disabled={uploading}
            title="Nahrať fotku alebo screenshot"
            className="p-1.5 hover:bg-white/10 hover:text-blue-400 rounded-lg transition-colors flex items-center gap-1 text-xs"
          >
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline text-[11px]">Foto</span>
          </button>

          <button
            type="button"
            onClick={() => triggerUpload('video')}
            disabled={uploading}
            title="Nahrať video záznam obrazovky"
            className="p-1.5 hover:bg-white/10 hover:text-purple-400 rounded-lg transition-colors flex items-center gap-1 text-xs"
          >
            <Film className="w-4 h-4 text-purple-400" />
            <span className="hidden lg:inline text-[11px]">Video</span>
          </button>

          <button
            type="button"
            onClick={() => triggerUpload('file')}
            disabled={uploading}
            title="Priložiť dokument (PDF, Excel, Word)"
            className="p-1.5 hover:bg-white/10 hover:text-emerald-400 rounded-lg transition-colors flex items-center gap-1 text-xs"
          >
            <Paperclip className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline text-[11px]">Súbor</span>
          </button>

          {uploading && (
            <span className="text-xs text-blue-400 animate-pulse font-mono ml-2">
              Nahrávam do MinIO...
            </span>
          )}
        </div>

        {/* Right: View Mode & Save Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setEditorMode('write')}
              className={`p-1.5 rounded-lg transition-colors ${
                editorMode === 'write' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Iba editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('split')}
              className={`p-1.5 rounded-lg transition-colors ${
                editorMode === 'split' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Rozdelený pohľad (Split)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`p-1.5 rounded-lg transition-colors ${
                editorMode === 'preview' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Iba živý náhľad"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cancel button */}
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 text-xs text-zinc-400 hover:text-white"
            >
              Zrušiť
            </Button>
          )}

          {/* Save Button */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs font-semibold shadow-lg shadow-blue-600/30"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Ukladám...' : 'Uložiť Zmeny'}
          </Button>
        </div>
      </div>

      {/* Revision change note input */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] text-zinc-500 font-mono">Poznámka k verzii:</span>
        <input
          type="text"
          placeholder="Napr. Doplnený popis chybových kódov a diagram..."
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          className="flex-1 bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
        />
        <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline">
          Tip: <kbd className="bg-white/10 px-1 py-0.5 rounded text-zinc-400">Ctrl+S</kbd> pre rýchle uloženie
        </span>
      </div>

      {/* Main Split / Write Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[550px]">
        {/* Editor Pane */}
        {(editorMode === 'write' || editorMode === 'split') && (
          <div
            className={`flex flex-col rounded-2xl bg-zinc-950/90 border border-white/15 p-4 shadow-xl ${
              editorMode === 'write' ? 'lg:col-span-2' : ''
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 font-mono pb-2 border-b border-white/[0.06] mb-2 flex items-center justify-between">
              <span>Markdown / Word Editor</span>
              <span className="text-zinc-600">Podpora Drag & Drop obrázkov & Ctrl+V</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Názov dokumentu\n\nZačnite písať dokumentáciu..."
              className="w-full flex-1 min-h-[480px] bg-transparent text-xs sm:text-sm text-zinc-200 font-mono leading-relaxed placeholder-zinc-600 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(editorMode === 'preview' || editorMode === 'split') && (
          <div
            className={`flex flex-col rounded-2xl bg-zinc-950/60 border border-white/15 p-6 shadow-xl overflow-y-auto max-h-[620px] ${
              editorMode === 'preview' ? 'lg:col-span-2' : ''
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-400 font-mono pb-2 border-b border-white/[0.06] mb-4 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Živý Formátovaný Náhľad
            </div>
            <DocMarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
