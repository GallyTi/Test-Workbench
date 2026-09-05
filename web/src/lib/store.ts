import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'TEST_LEAD' | 'TESTER' | 'BUSINESS_REVIEWER' | 'VIEWER';
  avatarUrl?: string;
}

export interface ActiveTimer {
  stepExecutionId: string;
  timeLogId: string;
  startedAt: string;
  stepNumber: number;
  testCaseCode: string;
  action: string;
}

export type AppTheme = 'dark' | 'light';
export type AppLang = 'sk' | 'en';

interface AppState {
  user: User | null;
  activeProject: { id: string; key: string; name: string } | null;
  activeTimer: ActiveTimer | null;
  theme: AppTheme;
  lang: AppLang;
  setUser: (user: User | null) => void;
  setActiveProject: (project: { id: string; key: string; name: string } | null) => void;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setLang: (lang: AppLang) => void;
  toggleLang: () => void;
}

const getInitialTheme = (): AppTheme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('rits_theme') as AppTheme;
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'dark';
};

const getInitialLang = (): AppLang => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('rits_lang') as AppLang;
    if (saved === 'sk' || saved === 'en') return saved;
  }
  return 'sk';
};

export const useAppStore = create<AppState>((set, get) => ({
  user:
    typeof window !== 'undefined' && localStorage.getItem('rits_user')
      ? JSON.parse(localStorage.getItem('rits_user')!)
      : null,
  activeProject: null,
  activeTimer: null,
  theme: getInitialTheme(),
  lang: getInitialLang(),

  setUser: (user) => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('rits_user', JSON.stringify(user));
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('rits_user');
      localStorage.removeItem('rits_access_token');
    }
    set({ user });
  },

  setActiveProject: (activeProject) => set({ activeProject }),
  setActiveTimer: (activeTimer) => set({ activeTimer }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rits_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rits_lang', lang);
    }
    set({ lang });
  },

  toggleLang: () => {
    const next = get().lang === 'sk' ? 'en' : 'sk';
    get().setLang(next);
  },
}));
