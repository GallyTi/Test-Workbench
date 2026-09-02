'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Film, Sparkles } from 'lucide-react';

interface GifPickerModalProps {
  isOpen: boolean;
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

interface GifItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

const CURATED_GIFS: GifItem[] = [
  // Approved / It Works
  {
    id: 'it-works-1',
    title: 'It Works! Perfect',
    url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif',
    category: 'passed',
  },
  {
    id: 'thumbs-up-1',
    title: 'Thumbs Up Approval',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    category: 'passed',
  },
  {
    id: 'leo-toast',
    title: 'Cheers Great Job',
    url: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
    category: 'passed',
  },
  {
    id: 'success-baby',
    title: 'Success Baby',
    url: 'https://media.giphy.com/media/nXxOjZrbnbRxS/giphy.gif',
    category: 'passed',
  },

  // Bugs / Failed / Mind Blown
  {
    id: 'bug-fire',
    title: 'This is Fine / Fire',
    url: 'https://media.giphy.com/media/QMHoU66sBXCAU/giphy.gif',
    category: 'bugs',
  },
  {
    id: 'mind-blown',
    title: 'Mind Blown Error',
    url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
    category: 'bugs',
  },
  {
    id: 'facepalm',
    title: 'Captain Picard Facepalm',
    url: 'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif',
    category: 'bugs',
  },
  {
    id: 'computer-smash',
    title: 'Computer Crash Break',
    url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
    category: 'bugs',
  },

  // Coding & Testing
  {
    id: 'fast-typing',
    title: 'Hacker Fast Typing',
    url: 'https://media.giphy.com/media/ule4akeXnY9Fb2nxN0/giphy.gif',
    category: 'coding',
  },
  {
    id: 'matrix-code',
    title: 'Matrix Code Rain',
    url: 'https://media.giphy.com/media/A06UFEx8jxEwU/giphy.gif',
    category: 'coding',
  },
  {
    id: 'cat-typing',
    title: 'Cat Typing Fast',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    category: 'coding',
  },

  // Waiting & Coffee
  {
    id: 'mr-bean-waiting',
    title: 'Mr Bean Waiting for Release',
    url: 'https://media.giphy.com/media/QPQ3xlJhqR1BXl89RG/giphy.gif',
    category: 'waiting',
  },
  {
    id: 'loading-spin',
    title: 'Waiting for Deploy',
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
    category: 'waiting',
  },
  {
    id: 'coffee-sip',
    title: 'Coffee While Testing',
    url: 'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif',
    category: 'waiting',
  },
];

export function GifPickerModal({ isOpen, onSelectGif, onClose }: GifPickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGifs = useMemo(() => {
    return CURATED_GIFS.filter((gif) => {
      const matchCat = activeCategory === 'all' || gif.category === activeCategory;
      const matchQuery =
        !searchQuery ||
        gif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gif.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl p-5 space-y-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Vyberte Animovaný GIF</h3>
              <p className="text-[11px] text-zinc-400">Vložte GIF priamo do diskusie k testu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Hľadať GIF (approved, bug, typing, coffee)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-white/15 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'all', label: 'Všetky GIFy' },
            { id: 'passed', label: '✅ Overené / Approved' },
            { id: 'bugs', label: '🐛 Bugy / This is Fine' },
            { id: 'coding', label: '💻 Kódenie & QA' },
            { id: 'waiting', label: '☕ Čakanie & Káva' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* GIF Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredGifs.map((gif) => (
            <div
              key={gif.id}
              onClick={() => {
                onSelectGif(gif.url);
                onClose();
              }}
              className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-purple-500/70 cursor-pointer aspect-video flex items-center justify-center transition-all shadow-md"
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-end p-2 transition-opacity">
                <span className="text-[10px] font-medium text-white truncate w-full">
                  {gif.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
