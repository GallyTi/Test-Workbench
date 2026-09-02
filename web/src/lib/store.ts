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

interface AppState {
  user: User | null;
  activeProject: { id: string; key: string; name: string } | null;
  activeTimer: ActiveTimer | null;
  setUser: (user: User | null) => void;
  setActiveProject: (project: { id: string; key: string; name: string } | null) => void;
  setActiveTimer: (timer: ActiveTimer | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: typeof window !== 'undefined' && localStorage.getItem('rits_user')
    ? JSON.parse(localStorage.getItem('rits_user')!)
    : null,
  activeProject: null,
  activeTimer: null,
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
}));
