'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  BookOpen,
  FileText,
  Trash2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PageNode {
  id: string;
  title: string;
  icon: string;
  slug: string;
  parentPageId?: string | null;
  children?: PageNode[];
}

interface DocTreeSidebarProps {
  spaces: any[];
  currentSpace: any;
  onSelectSpace: (spaceId: string) => void;
  currentPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onCreatePage: (parentPageId?: string) => void;
  onCreateSpace: () => void;
  onDeletePage?: (pageId: string) => void;
}

export function DocTreeSidebar({
  spaces,
  currentSpace,
  onSelectSpace,
  currentPageId,
  onSelectPage,
  onCreatePage,
  onCreateSpace,
  onDeletePage,
}: DocTreeSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (nodes: PageNode[], depth = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className={`space-y-0.5 ${depth > 0 ? 'ml-3 pl-2 border-l border-white/[0.08]' : ''}`}>
        {nodes
          .filter((node) =>
            !searchQuery
              ? true
              : node.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((node) => {
            const hasChildren = node.children && node.children.length > 0;
            const isCollapsed = !!collapsedNodes[node.id];
            const isSelected = node.id === currentPageId;

            return (
              <div key={node.id} className="space-y-0.5">
                <div
                  onClick={() => onSelectPage(node.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-600/25 text-blue-300 font-semibold border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={(e) => toggleCollapse(node.id, e)}
                        className="p-0.5 hover:text-white text-zinc-500 rounded transition-colors shrink-0"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0" />
                    )}

                    <span className="text-sm shrink-0">{node.icon || '📄'}</span>
                    <span className="truncate">{node.title}</span>
                  </div>

                  {/* Quick Action Hover: Add Child Page */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePage(node.id);
                      }}
                      title="Pridať podstránku"
                      className="p-1 hover:bg-white/15 rounded text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3 text-blue-400" />
                    </button>
                  </div>
                </div>

                {/* Render child pages if not collapsed */}
                {hasChildren && !isCollapsed && renderTree(node.children!, depth + 1)}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="w-72 bg-zinc-950/80 border-r border-white/10 p-3.5 flex flex-col h-full shrink-0 select-none">
      {/* Space Switcher Dropdown */}
      <div className="pb-3 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">
            Dokumentačný Priestor
          </span>
          <button
            type="button"
            onClick={onCreateSpace}
            title="Vytvoriť nový priestor"
            className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Nový
          </button>
        </div>

        <select
          value={currentSpace?.id || ''}
          onChange={(e) => onSelectSpace(e.target.value)}
          className="w-full bg-zinc-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
        >
          {spaces.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.icon} {sp.name} ({sp.key})
            </option>
          ))}
        </select>
      </div>

      {/* Search Input in Space */}
      <div className="py-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            placeholder="Hľadať stránku v priestore..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Pages Tree Header */}
      <div className="flex items-center justify-between pb-1 text-[11px] font-semibold text-zinc-400 font-mono">
        <span className="flex items-center gap-1.5">
          <FolderTree className="w-3.5 h-3.5 text-blue-400" /> Strom Stránok ({currentSpace?.totalPagesCount || 0})
        </span>
        <button
          type="button"
          onClick={() => onCreatePage(undefined)}
          title="Pridať hlavnú stránku"
          className="text-blue-400 hover:text-blue-300 p-1 hover:bg-white/10 rounded"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Foldable Tree Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-1">
        {currentSpace?.pagesTree ? (
          renderTree(currentSpace.pagesTree)
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500 italic">
            Žiadne stránky. Kliknite na "+" a vytvorte prvú stránku.
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="pt-3 border-t border-white/10">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCreatePage(undefined)}
          className="w-full h-8 text-xs border-white/15 hover:border-blue-400 text-zinc-300 font-semibold"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-blue-400" /> Pridať Novú Stránku
        </Button>
      </div>
    </div>
  );
}
