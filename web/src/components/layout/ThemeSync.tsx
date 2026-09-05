'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function ThemeSync() {
  const { theme, lang, setTheme, setLang } = useAppStore();

  useEffect(() => {
    // Initial sync from localStorage
    const savedTheme = localStorage.getItem('rits_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
    const savedLang = localStorage.getItem('rits_lang');
    if (savedLang === 'sk' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, [setTheme, setLang]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
