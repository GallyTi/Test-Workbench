'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Bell,
  LogOut,
  Layers,
  ShieldCheck,
  Menu,
  X,
  PlayCircle,
  FileSpreadsheet,
  Network,
  ClockAlert,
  FileUp,
  Bug,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const NAV_LINKS = [
  { href: '/', label: 'Prehľad' },
  { href: '/test-runs', label: 'Test Behy', badge: 'Live' },
  { href: '/test-cases', label: 'Katalóg Testov' },
  { href: '/excel-import', label: 'Excel Import' },
  { href: '/graph', label: 'Arch. Graf' },
  { href: '/admin/bottlenecks', label: 'SLA Časovače' },
  { href: '/bugs', label: 'Defekty' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, activeProject, setActiveProject, activeTimer } = useAppStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api
        .get('/projects')
        .then((res: any) => {
          setProjects(res);
          if (res.length > 0 && !activeProject) {
            setActiveProject(res[0]);
          }
        })
        .catch(() => {});

      api
        .get('/notifications/my')
        .then((res: any) => {
          setUnreadNotifications(res.filter((n: any) => !n.isRead));
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rits_access_token');
    localStorage.removeItem('rits_user');
    router.push('/login');
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-3 px-4 sm:px-6">
      <div className="max-w-6xl xl:max-w-7xl mx-auto">
        <nav className="h-14 backdrop-blur-2xl bg-black/60 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-2xl px-4 flex items-center justify-between transition-all duration-300">
          {/* Brand Logo & Project Selector */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold tracking-tight text-white group"
            >
              <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/20 p-1 flex items-center justify-center transition-all group-hover:bg-white/[0.15] group-hover:border-white/40 shadow-sm">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-zinc-100 hidden sm:inline-block">
                RITS <span className="text-zinc-500 font-normal">Workbench</span>
              </span>
            </Link>

            {/* Project Select */}
            {projects.length > 0 && (
              <div className="relative flex items-center">
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => {
                    const found = projects.find((p) => p.id === e.target.value);
                    if (found) setActiveProject(found);
                  }}
                  className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-zinc-300 text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-white/20 font-medium cursor-pointer transition-all appearance-none pr-6"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-200">
                      {p.key}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                    isActive
                      ? 'text-white bg-white/[0.1] shadow-sm border border-white/[0.12]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                  )}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Active Stopwatch Pill */}
            {activeTimer && (
              <Link
                href={`/test-runs/${activeTimer.stepExecutionId}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-medium animate-pulse hover:bg-emerald-500/20 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline">Časovač</span>
                <span>({activeTimer.testCaseCode})</span>
              </Link>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all relative"
                title="Notifikácie"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-black animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl p-4 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 border border-white/[0.1]">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <span className="font-semibold text-xs text-zinc-200">Upozornenia</span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {unreadNotifications.length} nových
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto mt-2 space-y-1.5 pr-1">
                    {unreadNotifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">
                        Žiadne nové upozornenia
                      </p>
                    ) : (
                      unreadNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className="p-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl text-xs cursor-pointer transition-colors"
                        >
                          <p className="font-medium text-zinc-200">{n.title}</p>
                          <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-zinc-200 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono font-medium">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Odhlásiť sa"
                  className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="glass">
                  Prihlásiť
                </Button>
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 glass-panel rounded-2xl p-3 space-y-1 animate-in fade-in slide-in-from-top-2 border border-white/[0.1]">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <Badge variant="success" className="text-[9px] py-0 px-1.5">
                    {link.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
