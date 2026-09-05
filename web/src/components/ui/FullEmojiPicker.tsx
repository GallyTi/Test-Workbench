'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface FullEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  title?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

export const ANIMATED_EMOJI_CLASSES: Record<string, string> = {
  '🔥': 'anim-emoji-flame',
  '🚀': 'anim-emoji-rocket',
  '❤️': 'anim-emoji-heart',
  '🎉': 'anim-emoji-party',
  '⚡': 'anim-emoji-zap',
  '✨': 'anim-emoji-sparkle',
  '🐛': 'anim-emoji-wiggle',
  '🤣': 'anim-emoji-bounce',
  '🥳': 'anim-emoji-party',
  '💯': 'anim-emoji-sparkle',
  '💣': 'anim-emoji-wiggle',
  '💩': 'anim-emoji-bounce',
  '👀': 'anim-emoji-wiggle',
  '☕': 'anim-emoji-flame',
  '👏': 'anim-emoji-bounce',
  '🚨': 'anim-emoji-wiggle',
  '🎯': 'anim-emoji-sparkle',
  '💡': 'anim-emoji-zap',
  '🏆': 'anim-emoji-sparkle',
};

const EMOJI_CATEGORIES: Category[] = [
  {
    id: 'animated',
    name: '✨ Animované Reakcie',
    icon: '🔥',
    emojis: [
      '🔥', '🚀', '❤️', '🎉', '⚡', '✨', '🐛', '🤣',
      '🥳', '💯', '💣', '💩', '👀', '☕', '👏', '🚨',
      '🎯', '💡', '🏆', '⭐', '🌟'
    ],
  },
  {
    id: 'testing',
    name: '🧪 IT, Vývoj & QA',
    icon: '💻',
    emojis: [
      '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📱', '📲', '💽', '💾', '💿', '📀',
      '🚀', '🛸', '🛰️', '📡', '🔋', '🪫', '🔌', '💡', '⏱️', '⏲️', '⏰',
      '🕰️', '⌛', '⏳', '⚙️', '🛠️', '🔧', '🔨', '🔩', '🗜️', '🔍', '🔎',
      '🔬', '🔭', '🧬', '🧪', '🧫', '📊', '📈', '📉', '📋', '📌', '📎',
      '📁', '📂', '🗄️', '🗃️', '🏷️', '📦', '📬', '✉️', '📧', '📨', '📤',
      '📥', '📑', '🧾', '📝', '⚡', '🛡️', '🔒', '🔓', '🔑', '🗝️'
    ],
  },
  {
    id: 'bugs',
    name: '🐛 Chyby & Incidenty',
    icon: '🐛',
    emojis: [
      '🐛', '🪲', '🐞', '🐜', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠',
      '⚠️', '🚨', '🛑', '⛔', '🚫', '🚧', '💣', '💥', '🧨', '☣️', '☢️',
      '🔥', '⚡', '🆘', '❌', '❓', '❗', '‼️', '⁉️', '☠️', '💀', '👻',
      '🩹', '🩺', '🩸', '💔', '💢', '💥', '🪓', '🧯'
    ],
  },
  {
    id: 'smileys',
    name: '😀 Smajlíky & Emócie',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹', '☺️', '😊', '😇', '🙂', '🙃',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐',
      '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😮‍💨', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
      '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '🤥', '😶', '😐',
      '😑', '🫥', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴',
      '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'
    ],
  },
  {
    id: 'gestures',
    name: '👍 Gestá & Ruky',
    icon: '👍',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🫱', '🫲', '🫳', '🫴',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁',
      '👀', '👁️', '👅', '👄', '🫦', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '🫶'
    ],
  },
  {
    id: 'status',
    name: '✅ Stavy, Odznaky & Úspech',
    icon: '✅',
    emojis: [
      '✅', '🟢', '🔴', '🟡', '🔵', '🟣', '⚪', '⚫', '🟩', '🟥', '🟨', '🟦', '🏁', '🚩', '🏆',
      '🥇', '🥈', '🥉', '🏅', '🎖️', '🎉', '🎊', '🎈', '🍾', '🥂', '🍻', '🍺', '🎯', '💯', '🆗',
      '🆙', '🆒', '🆕', '🆓', '🔘', '✨', '🌟', '💫', '⭐', '🌠', '❤️', '🧡', '💛', '💚', '💙',
      '💜', '🤎', '🖤', '🤍', '💖', '💘', '💝'
    ],
  },
  {
    id: 'nature',
    name: '🦁 Zvieratá & Symboly',
    icon: '🦊',
    emojis: [
      '🦊', '🐱', '🐶', '🦁', '🐯', '🐼', '🐨', '🐻', '🐰', '🐭', '🐹',
      '🐸', '🐵', '🐒', '🐔', '🐧', '🐦', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🦄', '🐴', '🐝', '🐢', '🐍', '🐙', '🦑', '🐬', '🐳', '🦈', '🐊',
      '🦖', '🦕', '🌸', '🌹', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳',
      '🍀', '🍁', '🍂', '🍄', '🌈', '☀️', '🌤️', '⛅', '🌧️', '⛈️', '❄️'
    ],
  },
  {
    id: 'food',
    name: '☕ Káva & Jedlo',
    icon: '☕',
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🍷', '🥂', '🥃', '🍸',
      '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🍳', '🧇', '🥞', '🥐', '🥯',
      '🥖', '🥨', '🧀', '🥗', '🥪', '🌮', '🌯', '🍫', '🍬', '🍭', '🍩',
      '🍪', '🎂', '🍰', '🧁', '🥧'
    ],
  },
];

export function FullEmojiPicker({ onSelectEmoji, onClose, title = 'Vyberte emotikon' }: FullEmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('animated');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }
    const all: string[] = [];
    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((e) => {
        all.push(e);
      });
    });
    return Array.from(new Set(all));
  }, [searchQuery]);

  return (
    <div
      className="w-84 max-w-[92vw] bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl shadow-black/80 p-3 text-white space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header & Search */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
          {title}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
        <input
          type="text"
          placeholder="Hľadať emotikon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1 text-xs bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
        />
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center gap-1 border-b border-white/[0.08] pb-1.5 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              title={cat.name}
              className={`p-1.5 rounded-lg text-sm transition-all shrink-0 flex items-center justify-center ${
                activeCategory === cat.id
                  ? 'bg-blue-600/30 border border-blue-500/50 scale-110 shadow-sm'
                  : 'opacity-70 hover:opacity-100 hover:bg-white/10'
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="max-h-56 overflow-y-auto pr-1">
        {searchQuery ? (
          <div className="grid grid-cols-7 gap-1">
            {filteredEmojis?.slice(0, 105).map((emoji, idx) => {
              const animClass = ANIMATED_EMOJI_CLASSES[emoji];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/15 rounded-lg transition-transform hover:scale-135 active:scale-95 group"
                >
                  <span className={animClass || ''}>{emoji}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {EMOJI_CATEGORIES.filter((c) => c.id === activeCategory).map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-zinc-400">
                  <span>{cat.name}</span>
                  <span className="font-mono text-zinc-500">{cat.emojis.length}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cat.emojis.map((emoji, idx) => {
                    const animClass = ANIMATED_EMOJI_CLASSES[emoji];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectEmoji(emoji)}
                        title={emoji}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/15 rounded-lg transition-transform hover:scale-135 active:scale-95 group"
                      >
                        <span className={animClass || ''}>{emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
