'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Layers, ShieldCheck, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('TESTER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res: any = await api.post('/auth/login', { email, password });
        localStorage.setItem('rits_access_token', res.accessToken);
        localStorage.setItem('rits_user', JSON.stringify(res.user));
        setUser(res.user);
        router.push('/');
      } else {
        const res: any = await api.post('/auth/register', {
          email,
          password,
          fullName,
          role,
        });
        localStorage.setItem('rits_access_token', res.accessToken);
        localStorage.setItem('rits_user', JSON.stringify(res.user));
        setUser(res.user);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Prihlásenie zlyhalo. Skontrolujte údaje.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string, pass: string) => {
    setEmail(demoEmail);
    setPassword(pass);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/20 p-2 mx-auto flex items-center justify-center shadow-lg shadow-black/50">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            RITS Enterprise Workbench
          </h1>
          <p className="text-xs text-zinc-400">
            Prihláste sa do testovacej a architektonickej platformy
          </p>
        </div>

        {/* Glass Form Card */}
        <Card variant="glass" className="p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex border-b border-white/[0.08] mb-5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-xs font-semibold transition-colors relative ${
                isLogin ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Prihlásenie
              {isLogin && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-xs font-semibold transition-colors relative ${
                !isLogin ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Registrácia
              {!isLogin && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Meno a Priezvisko
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <Input
                    type="text"
                    required
                    placeholder="Peter Kováč"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                E-mailová adresa
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <Input
                  type="email"
                  required
                  placeholder="admin@rits-workbench.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Heslo</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Systémová Rola
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-zinc-200 text-xs rounded-xl px-3 h-10 font-medium focus:outline-none"
                >
                  <option value="TESTER">Tester (QA)</option>
                  <option value="TEST_LEAD">Test Lead</option>
                  <option value="BUSINESS_REVIEWER">Business Reviewer</option>
                  <option value="ADMIN">Administrátor</option>
                </select>
              </div>
            )}

            <Button type="submit" variant="default" className="w-full h-10 mt-2 font-semibold" disabled={loading}>
              {loading
                ? 'Spracovávam...'
                : isLogin
                ? 'Prihlásiť sa do systému'
                : 'Vytvoriť nový účet'}
            </Button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-6 pt-5 border-t border-white/[0.08]">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block mb-2 text-center">
              Rýchly Výber Demo Účtu
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin('admin@rits-workbench.local', 'AdminPassword123!')}
                className="h-8 text-[11px]"
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin('peter.kovac@rits-workbench.local', 'TesterPassword123!')}
                className="h-8 text-[11px]"
              >
                Senior Tester
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
