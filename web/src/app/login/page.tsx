'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  Layers,
  ShieldCheck,
  Lock,
  Mail,
  User,
  CreditCard,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [slovnaftId, setSlovnaftId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('TESTER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

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
        await api.post('/auth/register', {
          email,
          password,
          fullName,
          slovnaftId,
          phoneNumber,
          role,
        });

        setRegisterSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Prihlásenie zlyhalo. Skontrolujte zadané údaje.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string, pass: string) => {
    setEmail(demoEmail);
    setPassword(pass);
  };

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center py-10 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/20 p-2 mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 backdrop-blur-xl">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            RITS Enterprise Workbench
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Integračná testovacia platforma pre systémy POS, SSR, DOMS a SAP
          </p>
        </div>

        {/* Success confirmation after registration */}
        {registerSuccess ? (
          <Card variant="glass" className="p-8 shadow-2xl space-y-5 text-center bg-zinc-950/80 border-emerald-500/30">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Registrácia bola úspešná!</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Váš účet <span className="font-semibold text-white">{fullName}</span> so Slovnaft ID{' '}
                <span className="font-mono text-blue-300 font-bold">[{slovnaftId || 'N/A'}]</span> bol vytvorený a zaradený do schvaľovacieho zoznamu administrátora.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-mono text-left">
              ℹ️ Administrátor musí váš účet schváliť skôr, než sa budete môcť prihlásiť.
            </div>

            <Button
              type="button"
              variant="default"
              onClick={() => {
                setRegisterSuccess(false);
                setIsLogin(true);
              }}
              className="w-full h-10 font-semibold"
            >
              Prejsť na prihlásenie <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Card>
        ) : (
          /* Glass Form Card */
          <Card variant="glass" className="p-6 sm:p-8 shadow-2xl bg-zinc-950/70 border-white/15">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex border-b border-white/[0.08] mb-5">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                  isLogin ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Prihlásenie
                {isLogin && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                  !isLogin ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Registrácia
                {!isLogin && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500" />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Meno a Priezvisko *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <Input
                        type="text"
                        required
                        placeholder="Peter Kováč"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 h-10 text-xs bg-black/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Slovnaft ID / Číslo karty *
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                        <Input
                          type="text"
                          required
                          placeholder="SLOVNAFT-10492"
                          value={slovnaftId}
                          onChange={(e) => setSlovnaftId(e.target.value)}
                          className="pl-9 h-10 text-xs font-mono uppercase bg-black/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Telefónne číslo *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                        <Input
                          type="tel"
                          required
                          placeholder="+421 905 123 456"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-9 h-10 text-xs font-mono bg-black/40"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  E-mailová adresa *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <Input
                    type="email"
                    required
                    placeholder="meno.priezvisko@slovnaft.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 text-xs bg-black/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Heslo *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-10 text-xs bg-black/40"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Požadovaná Systémová Rola
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.1] text-zinc-200 text-xs rounded-xl px-3 h-10 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="TESTER">Tester (Manuálne a UAT testovanie)</option>
                    <option value="TEST_LEAD">Test Lead (Riadenie scenárov a behov)</option>
                    <option value="BUSINESS_REVIEWER">Business Reviewer (Akceptácia procesov)</option>
                    <option value="VIEWER">Viewer (Iba čítanie)</option>
                  </select>
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                className="w-full h-10 mt-3 font-semibold shadow-lg shadow-blue-600/30"
                disabled={loading}
              >
                {loading
                  ? 'Spracovávam...'
                  : isLogin
                  ? 'Prihlásiť sa do systému'
                  : 'Odoslať žiadosť o registráciu'}
              </Button>
            </form>

            {/* Quick Demo Logins for Fast Access */}
            <div className="mt-6 pt-5 border-t border-white/[0.08]">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block mb-2 text-center">
                Rýchly Výber Účtu (Testovanie)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('admin@rits-workbench.local', 'AdminPassword123!')}
                  className="h-8 text-[11px] border-white/10 hover:border-blue-400 font-semibold"
                >
                  System Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('lead@rits-workbench.local', 'TesterPassword123!')}
                  className="h-8 text-[11px] border-white/10 hover:border-purple-400 font-semibold"
                >
                  Test Lead
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
