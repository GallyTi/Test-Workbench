'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Navbar } from './Navbar';
import { ActiveTimerWidget } from './ActiveTimerWidget';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('rits_access_token');
    const storedUser = localStorage.getItem('rits_user');

    if ((!user || !token || !storedUser) && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, pathname, mounted, router]);

  if (!mounted) {
    return null;
  }

  // If on login page, render full-screen login without navbar
  if (pathname === '/login') {
    return (
      <main className="relative z-10 flex-1 w-full flex items-center justify-center p-4">
        {children}
      </main>
    );
  }

  // If not authenticated and not on login, don't flash app content
  const token = typeof window !== 'undefined' ? localStorage.getItem('rits_access_token') : null;
  if (!user && !token) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-xs font-mono">Presmerovávam na prihlásenie...</p>
      </div>
    );
  }

  // Authenticated: Render Navbar + expanded 75% width canvas + timer widget
  return (
    <>
      <div className="relative z-20 w-full">
        <Navbar />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <div className="relative z-30">
        <ActiveTimerWidget />
      </div>
    </>
  );
}
