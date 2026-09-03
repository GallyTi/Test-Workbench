'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  BookOpen,
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  Share2,
  Printer,
  History,
  Calendar,
  User,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  List,
  Smile,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DocTreeSidebar } from '@/components/docs/DocTreeSidebar';
import { DocEditor } from '@/components/docs/DocEditor';
import { DocMarkdownRenderer } from '@/components/docs/DocMarkdownRenderer';
import { CommentThread } from '@/components/ui/CommentThread';
import { FullEmojiPicker } from '@/components/ui/FullEmojiPicker';

export default function DocsPage() {
  const router = useRouter();
  const { activeProject } = useAppStore();

  const [spaces, setSpaces] = useState<any[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string>('');
  const [currentSpaceData, setCurrentSpaceData] = useState<any | null>(null);

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [currentPageData, setCurrentPageData] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allTestCases, setAllTestCases] = useState<any[]>([]);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);

  // Comments for the current doc page
  const [pageComments, setPageComments] = useState<any[]>([]);

  // Modals state
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [targetParentPageId, setTargetParentPageId] = useState<string | undefined>(undefined);
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Form: Space
  const [newSpaceKey, setNewSpaceKey] = useState('');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [newSpaceIcon, setNewSpaceIcon] = useState('📚');

  // Form: Page
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageIcon, setNewPageIcon] = useState('📄');
  const [newPageTags, setNewPageTags] = useState('Prehľad, Špecifikácia');

  // Load spaces & test cases on mount
  const fetchSpaces = async () => {
    try {
      const res: any = await api.get('/docs/spaces');
      setSpaces(res || []);
      if (res?.length > 0 && !currentSpaceId) {
        setCurrentSpaceId(res[0].id);
      }
    } catch (err) {
      console.error('Chyba načítania priestorov:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaceDetails = async (spaceId: string) => {
    try {
      const res: any = await api.get(`/docs/spaces/${spaceId}`);
      setCurrentSpaceData(res);

      // Default select the first page if none selected
      if (!currentPageId && res.pagesTree?.length > 0) {
        setCurrentPageId(res.pagesTree[0].id);
      }
    } catch (err) {
      console.error('Chyba načítania stromu priestoru:', err);
    }
  };

  const fetchPageDetails = async (pageId: string) => {
    try {
      const res: any = await api.get(`/docs/pages/${pageId}`);
      setCurrentPageData(res);
      loadPageComments(pageId);
    } catch (err) {
      console.error('Chyba načítania detailu stránky:', err);
    }
  };

  const loadPageComments = async (pageId: string) => {
    try {
      const comms: any = await api.get(`/comments/DOC_PAGE/${pageId}`);
      setPageComments(comms || []);
    } catch {
      setPageComments([]);
    }
  };

  useEffect(() => {
    fetchSpaces();
    if (activeProject) {
      api.get(`/projects/${activeProject.id}/test-cases`).then((res: any) => setAllTestCases(res || [])).catch(() => {});
      api.get(`/users`).then((res: any) => setProjectUsers(res || [])).catch(() => {});
    }
  }, [activeProject]);

  useEffect(() => {
    if (currentSpaceId) {
      fetchSpaceDetails(currentSpaceId);
    }
  }, [currentSpaceId]);

  useEffect(() => {
    if (currentPageId) {
      setIsEditing(false);
      fetchPageDetails(currentPageId);
    }
  }, [currentPageId]);

  // Create Space Handler
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceKey || !newSpaceName) return;

    try {
      const res: any = await api.post('/docs/spaces', {
        key: newSpaceKey.toUpperCase(),
        name: newSpaceName,
        description: newSpaceDesc,
        icon: newSpaceIcon,
        projectId: activeProject?.id || undefined,
      });

      setShowCreateSpaceModal(false);
      setNewSpaceKey('');
      setNewSpaceName('');
      setNewSpaceDesc('');
      await fetchSpaces();
      setCurrentSpaceId(res.id);
    } catch (err: any) {
      alert(err.message || 'Chyba pri vytváraní priestoru');
    }
  };

  // Create Page Handler
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpaceId || !newPageTitle) return;

    try {
      const tags = newPageTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res: any = await api.post('/docs/pages', {
        spaceId: currentSpaceId,
        parentPageId: targetParentPageId || undefined,
        title: newPageTitle,
        icon: newPageIcon || '📄',
        tags,
        content: `# ${newPageTitle}\n\nSem napíšte obsah dokumentu...`,
      });

      setShowCreatePageModal(false);
      setNewPageTitle('');
      setTargetParentPageId(undefined);
      await fetchSpaceDetails(currentSpaceId);
      setCurrentPageId(res.id);
      setIsEditing(true); // Open in edit mode immediately
    } catch (err: any) {
      alert(err.message || 'Chyba pri vytváraní stránky');
    }
  };

  // Save Page Edits
  const handleSavePageContent = async (newContent: string, changeSummary?: string) => {
    if (!currentPageId) return;

    try {
      await api.patch(`/docs/pages/${currentPageId}`, {
        content: newContent,
        changeSummary,
      });
      await fetchPageDetails(currentPageId);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Chyba pri ukladaní dokumentu');
    }
  };

  // Update Page Icon
  const handleUpdateIcon = async (emoji: string) => {
    if (!currentPageId) return;
    try {
      await api.patch(`/docs/pages/${currentPageId}`, { icon: emoji });
      setShowEmojiPicker(false);
      await fetchPageDetails(currentPageId);
      fetchSpaceDetails(currentSpaceId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Page
  const handleDeletePage = async () => {
    if (!currentPageId) return;
    if (!confirm('Naozaj si prajete vymazať túto stránku vrátane všetkých jej podstránok?')) return;

    try {
      await api.delete(`/docs/pages/${currentPageId}`);
      setCurrentPageId(null);
      setCurrentPageData(null);
      fetchSpaceDetails(currentSpaceId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Table of Contents (TOC) generator from markdown headings
  const tableOfContents = useMemo(() => {
    if (!currentPageData?.content) return [];
    const lines = currentPageData.content.split('\n');
    const toc: { id: string; title: string; level: number }[] = [];

    lines.forEach((line: string) => {
      const h2Match = line.match(/^##\s+(.*)$/);
      const h3Match = line.match(/^###\s+(.*)$/);

      if (h2Match) {
        const title = h2Match[1].trim();
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        toc.push({ id, title, level: 2 });
      } else if (h3Match) {
        const title = h3Match[1].trim();
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        toc.push({ id, title, level: 3 });
      }
    });

    return toc;
  }, [currentPageData?.content]);

  // Reading time estimate
  const readingTime = useMemo(() => {
    if (!currentPageData?.content) return '1 min';
    const words = currentPageData.content.split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 180));
    return `${mins} min čítania`;
  }, [currentPageData?.content]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-xs font-mono">Načítavam Confluence dokumentáciu...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-4 sm:-m-6 overflow-hidden bg-black/40">
      {/* 1. Left Foldable Tree Sidebar */}
      <DocTreeSidebar
        spaces={spaces}
        currentSpace={currentSpaceData}
        onSelectSpace={(id) => {
          setCurrentSpaceId(id);
          setCurrentPageId(null);
        }}
        currentPageId={currentPageId}
        onSelectPage={(id) => setCurrentPageId(id)}
        onCreatePage={(parentPageId) => {
          setTargetParentPageId(parentPageId);
          setShowCreatePageModal(true);
        }}
        onCreateSpace={() => setShowCreateSpaceModal(true)}
      />

      {/* 2. Main Document Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#08090d]">
        {!currentPageData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
            <BookOpen className="w-12 h-12 text-blue-400/40 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Vyberte alebo vytvorte stránku</h3>
            <p className="text-xs max-w-sm text-zinc-400">
              V ľavom paneli si vyberte dokument zo stromu, alebo kliknite na "+ Pridať Novú Stránku".
            </p>
          </div>
        ) : isEditing ? (
          /* Editor Mode */
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentPageData.icon}</span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 font-mono">
                    Úprava Dokumentu
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {currentPageData.title}
                  </h2>
                </div>
              </div>
            </div>

            <DocEditor
              pageId={currentPageData.id}
              initialContent={currentPageData.content}
              onSave={handleSavePageContent}
              onCancel={() => setIsEditing(false)}
              allTestCases={allTestCases}
            />
          </div>
        ) : (
          /* Reading & Preview Mode */
          <div className="flex-1 flex flex-col">
            {/* Top Document Header Bar */}
            <div className="p-5 border-b border-white/10 bg-zinc-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 backdrop-blur-xl z-20">
              {/* Breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 font-mono">
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  {currentSpaceData?.icon} {currentSpaceData?.name}
                </span>
                {currentPageData.breadcrumbs?.map((b: any) => (
                  <React.Fragment key={b.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    <button
                      onClick={() => setCurrentPageId(b.id)}
                      className="hover:text-white transition-colors"
                    >
                      {b.icon} {b.title}
                    </button>
                  </React.Fragment>
                ))}
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-white font-medium">{currentPageData.title}</span>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Upraviť Stránku
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetParentPageId(currentPageData.id);
                    setShowCreatePageModal(true);
                  }}
                  className="h-8 text-xs border-white/15 hover:border-purple-400 text-purple-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Podstránka
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRevisionsModal(true)}
                  title="História zmien a verzií"
                  className="h-8 px-2 text-zinc-400 hover:text-white"
                >
                  <History className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.print()}
                  title="Tlačiť / Export do PDF"
                  className="h-8 px-2 text-zinc-400 hover:text-white"
                >
                  <Printer className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeletePage}
                  title="Zmazať stránku"
                  className="h-8 px-2 text-zinc-400 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Document Content + Table of Contents Layout */}
            <div className="flex-1 flex flex-col lg:flex-row p-6 md:p-10 gap-8 max-w-7xl mx-auto w-full">
              {/* Main Article Content */}
              <article className="flex-1 min-w-0 space-y-6">
                {/* Title & Metadata Header */}
                <div className="space-y-3 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {/* Emoji Icon Button (Clickable to change) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Zmeniť ikonu stránky"
                        className="text-4xl p-2 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/15 transition-transform hover:scale-110"
                      >
                        {currentPageData.icon || '📄'}
                      </button>

                      {showEmojiPicker && (
                        <div className="absolute left-0 top-full mt-2 z-50">
                          <FullEmojiPicker
                            title="Vyberte ikonu stránky"
                            onSelectEmoji={handleUpdateIcon}
                            onClose={() => setShowEmojiPicker(false)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        {currentPageData.title}
                      </h1>
                    </div>
                  </div>

                  {/* Metadata Row: Author, Updated Date, Reading Time, Tags */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      {currentPageData.author?.fullName || 'Admin'}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(currentPageData.updatedAt).toLocaleString('sk-SK', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" /> {readingTime}
                    </span>

                    {currentPageData.tags?.map((t: string) => (
                      <Badge key={t} variant="glass" className="text-[10px] py-0 px-2">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Markdown Renderer with Callouts, Videos, Tables, Photos */}
                <DocMarkdownRenderer
                  content={currentPageData.content}
                  onSelectTestCase={(code) => {
                    const found = allTestCases.find((tc) => tc.code === code);
                    if (found) router.push(`/test-cases/${found.id}`);
                    else alert(`Testovací prípad ${code} nebol nájdený`);
                  }}
                />

                {/* Sub-pages listing if this page has children */}
                {currentPageData.childPages?.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-white/10 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-purple-400" /> Vnorené Podstránky ({currentPageData.childPages.length}):
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentPageData.childPages.map((cp: any) => (
                        <div
                          key={cp.id}
                          onClick={() => setCurrentPageId(cp.id)}
                          className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cp.icon || '📄'}</span>
                            <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                              {cp.title}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Comments / Discussion Section */}
                <div className="mt-12 pt-8 border-t border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Diskusia k Dokumentu ({pageComments.length})
                  </h3>
                  <CommentThread
                    targetType="DOC_PAGE"
                    targetId={currentPageData.id}
                    comments={pageComments}
                    projectUsers={projectUsers}
                    onRefresh={() => loadPageComments(currentPageData.id)}
                  />
                </div>
              </article>

              {/* Sticky Table of Contents (TOC) */}
              {tableOfContents.length > 0 && (
                <aside className="w-64 shrink-0 hidden lg:block">
                  <div className="sticky top-24 p-4 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-xl space-y-3">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/10">
                      <List className="w-3.5 h-3.5 text-blue-400" /> Obsah Stránky (TOC)
                    </div>
                    <nav className="space-y-1 text-xs max-h-[70vh] overflow-y-auto">
                      {tableOfContents.map((item, idx) => (
                        <a
                          key={idx}
                          href={`#${item.id}`}
                          className={`block py-1 hover:text-blue-300 transition-colors truncate ${
                            item.level === 3 ? 'pl-4 text-[11px] text-zinc-500' : 'text-zinc-300 font-medium'
                          }`}
                        >
                          {item.title}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Space */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl space-y-4 bg-zinc-950 border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" /> Nový Dokumentačný Priestor
              </h2>
              <button
                onClick={() => setShowCreateSpaceModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Ikona</label>
                  <Input
                    value={newSpaceIcon}
                    onChange={(e) => setNewSpaceIcon(e.target.value)}
                    className="h-9 text-center text-lg bg-zinc-900"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Kľúč (ID)</label>
                  <Input
                    required
                    placeholder="WET-KB"
                    value={newSpaceKey}
                    onChange={(e) => setNewSpaceKey(e.target.value)}
                    className="h-9 text-xs font-mono uppercase bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Názov Priestoru
                </label>
                <Input
                  required
                  placeholder="WET Procesy & Metodika"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="h-9 text-xs bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Popis</label>
                <textarea
                  rows={2}
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="Oficiálna báza pre stáčanie, nádrže a storno..."
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowCreateSpaceModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default">
                  Vytvoriť Priestor
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Create Page */}
      {showCreatePageModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 shadow-2xl space-y-4 bg-zinc-950 border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                {targetParentPageId ? 'Nová Vnorena Podstránka' : 'Nová Hlavná Stránka'}
              </h2>
              <button
                onClick={() => setShowCreatePageModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Ikona</label>
                  <Input
                    value={newPageIcon}
                    onChange={(e) => setNewPageIcon(e.target.value)}
                    className="h-9 text-center text-lg bg-zinc-900"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Názov Stránky
                  </label>
                  <Input
                    required
                    placeholder="Napr. Postup pre stornovanie dodávky"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    className="h-9 text-xs bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Štítky (Tags)
                </label>
                <Input
                  placeholder="WET, DOMS, Dodávka"
                  value={newPageTags}
                  onChange={(e) => setNewPageTags(e.target.value)}
                  className="h-9 text-xs bg-zinc-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowCreatePageModal(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="default">
                  Vytvoriť a Otvoriť Editor
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Revisions History */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-lg p-6 shadow-2xl space-y-4 bg-zinc-950 border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" /> História Zmien & Verzií
              </h2>
              <button
                onClick={() => setShowRevisionsModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06] pr-1">
              {!currentPageData?.revisions || currentPageData.revisions.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 italic">
                  Zatiaľ žiadne predošlé verzie. Stránka je v pôvodnom stave.
                </div>
              ) : (
                currentPageData.revisions.map((rev: any) => (
                  <div key={rev.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{rev.editedBy?.fullName}</span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(rev.createdAt).toLocaleString('sk-SK')}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 italic">
                      "{rev.changeSummary || 'Úprava textu'}"
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setShowRevisionsModal(false)}>
                Zavrieť
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
