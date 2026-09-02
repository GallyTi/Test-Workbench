'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  Bold,
  Italic,
  List,
  Code,
  Quote,
  Smile,
  Send,
  Plus,
  AtSign,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FullEmojiPicker } from './FullEmojiPicker';
import { GifPickerModal } from './GifPickerModal';

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user?: { id: string; fullName: string };
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email?: string;
  };
  reactions?: Reaction[];
}

interface CommentThreadProps {
  targetType: string;
  targetId: string;
  comments: CommentItem[];
  projectUsers?: any[];
  onRefresh: () => void;
}

const POPULAR_REACTION_EMOJIS = ['👍', '❤️', '🔥', '🚀', '👀', '🐛', '✅', '🎉'];

// Markdown renderer for bold, italic, code, quotes, bullet points, @mentions, and inline GIFs/Images
function MarkdownRenderer({ content }: { content: string }) {
  const renderFormattedLine = (line: string, lineIdx: number) => {
    // Check if line is an image/GIF: ![alt](url)
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        <div key={lineIdx} className="my-2 max-w-sm rounded-xl overflow-hidden border border-white/15 bg-black/40 shadow-lg">
          <img
            src={imgMatch[2]}
            alt={imgMatch[1] || 'GIF'}
            className="w-full h-auto max-h-56 object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    // Bullet point line
    if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
      const cleanLine = line.replace(/^[•\-]\s*/, '');
      return (
        <li key={lineIdx} className="ml-4 list-disc text-zinc-200">
          {renderInlineFormatting(cleanLine)}
        </li>
      );
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const cleanLine = line.replace(/^>\s*/, '');
      return (
        <div
          key={lineIdx}
          className="border-l-2 border-blue-500 pl-3 my-1.5 text-zinc-300 italic bg-white/[0.02] rounded-r py-1"
        >
          {renderInlineFormatting(cleanLine)}
        </div>
      );
    }

    return (
      <div key={lineIdx} className="leading-relaxed">
        {renderInlineFormatting(line)}
      </div>
    );
  };

  const renderInlineFormatting = (text: string) => {
    // Split by bold (**text**), italic (*text*), inline code (`code`), @mentions (@Word)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|@[a-zA-Z0-9_.\-]+(?:\s[a-zA-Z0-9_.\-]+)?)/g);

    return parts.map((part, idx) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-zinc-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 bg-black/80 border border-white/20 rounded text-[11px] font-mono text-blue-300"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.2 bg-blue-500/25 text-blue-300 border border-blue-500/40 rounded font-medium text-[11px]"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const lines = content.split('\n');
  return <div className="space-y-1 text-xs">{lines.map(renderFormattedLine)}</div>;
}

export function CommentThread({
  targetType,
  targetId,
  comments,
  projectUsers = [],
  onRefresh,
}: CommentThreadProps) {
  const { user } = useAppStore();
  const [commentText, setCommentText] = useState('');
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [reactingCommentId, setReactingCommentId] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [activeHoverCommentId, setActiveHoverCommentId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorContainerRef.current && !editorContainerRef.current.contains(e.target as Node)) {
        setShowFullEmojiPicker(false);
        setShowMentionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && cursor - lastAtIdx < 20) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      if (!query.includes(' ') || query.split(' ').length <= 2) {
        setMentionFilter(query.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const insertMention = (userFullName: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const textBefore = commentText.slice(0, cursor);
    const lastAtIdx = textBefore.lastIndexOf('@');
    const textAfter = commentText.slice(cursor);

    const prefix = commentText.slice(0, lastAtIdx);
    const mentionString = `@${userFullName} `;
    const newText = prefix + mentionString + textAfter;

    setCommentText(newText);
    setShowMentionMenu(false);

    setTimeout(() => {
      el.focus();
      const newCursor = prefix.length + mentionString.length;
      el.setSelectionRange(newCursor, newCursor);
    }, 50);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = commentText.slice(start, end);

    let replacement = '';
    if (prefix === '• ') {
      replacement = `\n• ${selected || 'Položka'}`;
    } else {
      replacement = `${prefix}${selected || 'text'}${suffix}`;
    }

    const newText = commentText.slice(0, start) + replacement + commentText.slice(end);
    setCommentText(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setCommentText((prev) => prev + emoji);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = commentText.slice(0, start) + emoji + commentText.slice(end);
    setCommentText(newText);
    setShowFullEmojiPicker(false);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 50);
  };

  const insertGif = (gifUrl: string) => {
    const markdownGif = `\n![GIF](${gifUrl})\n`;
    setCommentText((prev) => prev + markdownGif);
  };

  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await api.post('/comments', {
        targetType,
        targetId,
        content: commentText,
      });
      setCommentText('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    try {
      await api.post(`/comments/${commentId}/reactions`, { emoji });
      setReactingCommentId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const groupReactions = (reactions: Reaction[] = []) => {
    const map: Record<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }> = {};
    reactions.forEach((r) => {
      if (!map[r.emoji]) {
        map[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasReacted: false };
      }
      map[r.emoji].count += 1;
      if (r.user?.fullName) {
        map[r.emoji].users.push(r.user.fullName);
      }
      if (user && r.userId === user.id) {
        map[r.emoji].hasReacted = true;
      }
    });
    return Object.values(map);
  };

  const filteredUsers = projectUsers.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(mentionFilter) ||
      u.email?.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="space-y-3 pt-1">
      {/* GIF Picker Modal */}
      <GifPickerModal
        isOpen={showGifModal}
        onSelectGif={insertGif}
        onClose={() => setShowGifModal(false)}
      />

      {/* Comments List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="text-center py-3 text-zinc-500 text-xs italic bg-white/[0.01] rounded-xl border border-white/[0.04]">
            Zatiaľ žiadne komentáre. Napíšte poznámku, pridajte GIF alebo označte kolegu.
          </div>
        ) : (
          comments.map((c) => {
            const grouped = groupReactions(c.reactions);
            const isHovered = activeHoverCommentId === c.id;

            const fullTimestamp = new Date(c.createdAt).toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={c.id}
                onMouseEnter={() => setActiveHoverCommentId(c.id)}
                onMouseLeave={() => setActiveHoverCommentId(null)}
                className="group relative p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-900/90 border border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
              >
                {/* Discord-style Hover Quick Reaction Toolbar */}
                <div
                  className={`absolute -top-3.5 right-3 bg-zinc-900 border border-white/20 rounded-full px-2 py-0.5 flex items-center gap-1.5 shadow-xl shadow-black transition-all z-20 ${
                    isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  {POPULAR_REACTION_EMOJIS.slice(0, 5).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(c.id, emoji)}
                      title={`Reagovať ${emoji}`}
                      className="hover:scale-130 transition-transform p-0.5 text-xs"
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* Plus opens Full Emoji Picker to react with ANY emoji */}
                  <div className="relative">
                    <button
                      onClick={() => setReactingCommentId(reactingCommentId === c.id ? null : c.id)}
                      className="text-zinc-400 hover:text-white p-0.5 text-xs border-l border-white/10 pl-1.5 flex items-center gap-0.5"
                      title="Vybrať akúkoľvek emoji reakciu"
                    >
                      <Plus className="w-3 h-3" />
                      <Smile className="w-3 h-3" />
                    </button>

                    {reactingCommentId === c.id && (
                      <div className="absolute right-0 top-full mt-2 z-50">
                        <FullEmojiPicker
                          title="Reagovať emotikonom"
                          onSelectEmoji={(emoji) => handleToggleReaction(c.id, emoji)}
                          onClose={() => setReactingCommentId(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Author & Full Timestamp */}
                <div className="flex items-center justify-between text-xs mb-1.5 pb-1 border-b border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">{c.author?.fullName}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({c.author?.email || 'Tester'})</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                    📅 {fullTimestamp}
                  </span>
                </div>

                {/* Comment Content with Markdown Formatting */}
                <div className="text-zinc-200 text-xs py-0.5">
                  <MarkdownRenderer content={c.content} />
                </div>

                {/* Discord-style Reaction Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-1 border-t border-white/[0.03]">
                  {grouped.map((grp) => (
                    <button
                      key={grp.emoji}
                      onClick={() => handleToggleReaction(c.id, grp.emoji)}
                      title={grp.users.join(', ')}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono transition-all ${
                        grp.hasReacted
                          ? 'bg-blue-600/30 border border-blue-500/60 text-blue-200 shadow-sm shadow-blue-500/20'
                          : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span className="text-sm leading-none">{grp.emoji}</span>
                      <span className="font-bold text-[11px]">{grp.count}</span>
                    </button>
                  ))}

                  {/* Add reaction plus button */}
                  <button
                    onClick={() => setReactingCommentId(reactingCommentId === c.id ? null : c.id)}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors"
                    title="Pridať reakciu"
                  >
                    <Plus className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rich Text Editor Box with Formatting Toolbar */}
      <div
        ref={editorContainerRef}
        className="relative p-2.5 rounded-xl bg-zinc-950/90 border border-white/[0.12] focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all space-y-2 shadow-inner"
      >
        {/* Formatting Toolbar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 text-zinc-300">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              title="Tučné písmo (Bold)"
              className="p-1 hover:bg-white/[0.1] hover:text-white rounded transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              title="Kurzíva (Italic)"
              className="p-1 hover:bg-white/[0.1] hover:text-white rounded transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('• ')}
              title="Odrážky (Bullet points)"
              className="p-1 hover:bg-white/[0.1] hover:text-white rounded transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              title="Kód (Inline code)"
              className="p-1 hover:bg-white/[0.1] hover:text-white rounded transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('> ')}
              title="Citácia (Quote)"
              className="p-1 hover:bg-white/[0.1] hover:text-white rounded transition-colors"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-px bg-white/15 mx-1" />

            {/* Quick @mention trigger button */}
            <button
              type="button"
              onClick={() => {
                setShowMentionMenu(!showMentionMenu);
                setMentionFilter('');
              }}
              title="Označiť kolegu (@mention)"
              className="p-1 hover:bg-white/[0.1] hover:text-blue-400 rounded transition-colors"
            >
              <AtSign className="w-3.5 h-3.5" />
            </button>

            {/* Full Emoji Picker Button (Akákoľvek emoji ikonka) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFullEmojiPicker(!showFullEmojiPicker)}
                title="Vybrať akúkoľvek emoji ikonku"
                className={`p-1 hover:bg-white/[0.1] rounded transition-colors ${
                  showFullEmojiPicker ? 'text-amber-400 bg-white/[0.1]' : 'hover:text-white'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
              </button>

              {/* Full Emoji Picker Popover */}
              {showFullEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <FullEmojiPicker
                    onSelectEmoji={insertEmoji}
                    onClose={() => setShowFullEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* GIF Button */}
            <button
              type="button"
              onClick={() => setShowGifModal(true)}
              title="Vložiť animovaný GIF"
              className="px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded transition-colors ml-0.5 flex items-center gap-1"
            >
              <Film className="w-3 h-3" /> GIF
            </button>
          </div>

          <span className="text-[10px] text-zinc-400 font-mono">
            Podpora <kbd className="bg-white/10 px-1 py-0.5 rounded text-white">Ctrl+Enter</kbd>
          </span>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={2}
          value={commentText}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSendComment();
            }
          }}
          placeholder="Napíšte správu, vložte GIF, emoji alebo označte @kolegu..."
          className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
        />

        {/* @Mention Dropdown Popover */}
        {showMentionMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl shadow-black overflow-hidden z-50">
            <div className="p-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Označiť člena tímu:
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-white/[0.04]">
              {filteredUsers.length === 0 ? (
                <div className="p-2.5 text-[11px] text-zinc-500 text-center">
                  Žiadny používateľ nenájdený
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => insertMention(u.fullName)}
                    className="w-full text-left p-2 hover:bg-white/[0.08] transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                        {u.fullName?.slice(0, 1) || 'U'}
                      </div>
                      <span className="text-zinc-200 font-medium">{u.fullName}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{u.role}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={() => handleSendComment()}
            className="h-7 text-xs px-3 font-semibold shadow-md"
          >
            <Send className="w-3 h-3 mr-1" /> Odoslať správu
          </Button>
        </div>
      </div>
    </div>
  );
}
