'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  BookOpen,
  ClipboardList,
  Users,
  History,
  Check,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useTranslation } from '@/lib/i18n';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, activeProject, setActiveProject, activeTimer, theme, toggleTheme, lang, toggleLang } = useAppStore();
  const { t } = useTranslation();

  const [projects, setProjects] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      if (user.role === 'ADMIN') {
        api
          .get('/users/pending')
          .then((res: any) => {
            setPendingCount(Array.isArray(res) ? res.length : 0);
          })
          .catch(() => {});
      }
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

  const isTestingActive =
    pathname.startsWith('/test-') || pathname.startsWith('/excel-import') || pathname.startsWith('/bugs');
  const isArchitectureActive = pathname.startsWith('/docs') || pathname.startsWith('/graph');
  const isAdminActive = pathname.startsWith('/admin') || pathname.startsWith('/audit-logs');

  return (
    <header className="sticky top-0 z-50 w-full pt-3 px-4 sm:px-6">
      <div className="max-w-[1680px] mx-auto" ref={navRef}>
        <nav className="h-14 backdrop-blur-2xl bg-black/70 border border-white/[0.12] shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] rounded-2xl px-4 flex items-center justify-between transition-all duration-300">
          {/* Left: Brand Logo & Project Selector */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold tracking-tight text-white group"
            >
              <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/20 p-1 flex items-center justify-center transition-all group-hover:bg-blue-600/30 group-hover:border-blue-400 shadow-sm">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-zinc-100 hidden sm:inline-block">
                RITS <span className="text-blue-400 font-bold">Workbench</span>
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
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/25 text-zinc-200 text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer transition-all appearance-none pr-6"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-200">
                      {p.key} ({p.name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Center: Desktop Subgrouped Navigation */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* 1. Prehľad */}
            <Link
              href="/"
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                pathname === '/'
                  ? 'text-white bg-white/[0.12] border border-white/20 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {t('nav.dashboard')}
            </Link>

            {/* 2. Testovanie & QA Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'testing' ? null : 'testing')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                  isTestingActive
                    ? 'text-white bg-blue-500/15 border border-blue-500/30 text-blue-300'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                <span>🧪 Testovanie & QA</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    openDropdown === 'testing' ? 'rotate-180' : ''
                  )}
                />
              </button>

              {openDropdown === 'testing' && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <Link
                    href="/test-cases"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold">Katalóg Testov</div>
                      <div className="text-[10px] text-zinc-500">Scenáre, Epicy a kroky</div>
                    </div>
                  </Link>

                  <Link
                    href="/test-runs"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold">Testovacie Behy</div>
                        <div className="text-[10px] text-zinc-500">Živá exekúcia testov</div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </Link>

                  <Link
                    href="/excel-import"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold">Excel Import Workbench</div>
                      <div className="text-[10px] text-zinc-500">XLSX parser & Column Mapper</div>
                    </div>
                  </Link>

                  <Link
                    href="/bugs"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Bug className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="font-semibold">Defekty & Bugy</div>
                      <div className="text-[10px] text-zinc-500">Evidencia chýb a blokácií</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Architektúra & Znalosti Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'arch' ? null : 'arch')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                  isArchitectureActive
                    ? 'text-white bg-purple-500/15 border border-purple-500/30 text-purple-300'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                <span>🏛️ Architektúra & Docs</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    openDropdown === 'arch' ? 'rotate-180' : ''
                  )}
                />
              </button>

              {openDropdown === 'arch' && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <Link
                    href="/docs"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-semibold">Confluence Dokumentácia</div>
                        <div className="text-[10px] text-zinc-500">Word editor & UML diagramy</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[9px] bg-blue-600 px-1.5 py-0">
                      Nové
                    </Badge>
                  </Link>

                  <Link
                    href="/graph"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Network className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold">Architektúrny Graf</div>
                      <div className="text-[10px] text-zinc-500">Vizualizácia prepojení systémov</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Administrácia Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'admin' ? null : 'admin')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 relative',
                  isAdminActive
                    ? 'text-white bg-zinc-800 border border-white/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                <span>🛡️ Riadenie</span>
                {pendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    openDropdown === 'admin' ? 'rotate-180' : ''
                  )}
                />
              </button>

              {openDropdown === 'admin' && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin/users"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center justify-between p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold">Schvaľovanie & Používatelia</div>
                          <div className="text-[10px] text-zinc-500">Slovnaft ID & Roly</div>
                        </div>
                      </div>
                      {pendingCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          {pendingCount}
                        </Badge>
                      )}
                    </Link>
                  )}

                  <Link
                    href="/admin/bottlenecks"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ClockAlert className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold">SLA Časovače & Úzke Miesta</div>
                      <div className="text-[10px] text-zinc-500">Monitorovanie zdržaní testerov</div>
                    </div>
                  </Link>

                  <Link
                    href="/audit-logs"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <History className="w-4 h-4 text-zinc-400" />
                    <div>
                      <div className="font-semibold">Audit Trail & História</div>
                      <div className="text-[10px] text-zinc-500">Nezmazateľné záznamy aktivít</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: Active Timer, Notifications & User Profile */}
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

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLang}
              className="px-2 py-1 rounded-xl text-xs font-mono font-bold border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08]"
              title={lang === 'sk' ? 'Prepnúť do angličtiny (Switch to English)' : 'Prepnúť do slovenčiny (Switch to Slovak)'}
            >
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <span className="uppercase text-[10px]">{lang}</span>
            </button>

            {/* Dark / Light Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title={theme === 'dark' ? 'Prepnúť na biely režim (Light mode)' : 'Prepnúť na tmavý režim (Dark mode)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-400" />
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white">Notifikácie</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {unreadNotifications.length} neprečítaných
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {unreadNotifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">Žiadne nové notifikácie</p>
                    ) : (
                      unreadNotifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex items-start justify-between gap-2 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-zinc-200">{n.title}</p>
                            <p className="text-[11px] text-zinc-400">{n.message}</p>
                          </div>
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="text-zinc-500 hover:text-emerald-400 p-1"
                            title="Označiť ako prečítané"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">{user.fullName}</div>
                  <div className="text-[10px] font-mono text-blue-400 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3" /> {user.role}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Odhlásiť sa"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="default" className="h-8 text-xs font-semibold">
                  Prihlásiť sa
                </Button>
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 bg-zinc-950/95 border border-white/15 rounded-2xl shadow-2xl space-y-3 animate-in fade-in duration-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 rounded-xl text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              Prehľad & Dashboard
            </Link>

            <div className="pt-2 border-t border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 px-2 font-bold">
                Testovanie & QA
              </span>
              <Link
                href="/test-cases"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <ClipboardList className="w-4 h-4 text-blue-400" /> Katalóg Testov
              </Link>
              <Link
                href="/test-runs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <PlayCircle className="w-4 h-4 text-emerald-400" /> Testovacie Behy
              </Link>
              <Link
                href="/excel-import"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Excel Import Workbench
              </Link>
              <Link
                href="/bugs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <Bug className="w-4 h-4 text-rose-400" /> Defekty & Bugy
              </Link>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 px-2 font-bold">
                Architektúra & Docs
              </span>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <BookOpen className="w-4 h-4 text-blue-400" /> Confluence Dokumentácia
              </Link>
              <Link
                href="/graph"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <Network className="w-4 h-4 text-purple-400" /> Architektúrny Graf
              </Link>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 px-2 font-bold">
                Administrácia
              </span>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Schvaľovanie Používateľov
                  </span>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              )}
              <Link
                href="/admin/bottlenecks"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <ClockAlert className="w-4 h-4 text-amber-400" /> SLA Časovače
              </Link>
              <Link
                href="/audit-logs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:bg-white/10"
              >
                <History className="w-4 h-4 text-zinc-400" /> Audit Trail
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
