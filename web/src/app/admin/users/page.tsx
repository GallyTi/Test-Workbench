'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Search,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminUsersPage() {
  const { user } = useAppStore();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const [pending, all]: [any, any] = await Promise.all([
        api.get('/users/pending').catch(() => []),
        api.get('/users').catch(() => []),
      ]);
      setPendingUsers(Array.isArray(pending) ? pending : []);
      setAllUsers((Array.isArray(all) ? all : []).filter((u: any) => u.isApproved));
    } catch (err) {
      console.error('Chyba načítania používateľov:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string, role?: string) => {
    setActionInProgress(userId);
    try {
      await api.patch(`/users/${userId}/approve`, { role });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa schváliť používateľa');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Naozaj si prajete zamietnuť a vymazať túto registráciu?')) return;
    setActionInProgress(userId);
    try {
      await api.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa vymazať používateľa');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Nepodarilo sa zmeniť rolu');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h2 className="text-lg font-bold text-white">Prístup odmietnutý</h2>
        <p className="text-xs text-zinc-400 max-w-sm">
          Táto stránka je vyhradená iba pre administrátorov platformy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold text-blue-400 tracking-wider">
              Správa Používateľov & Oprávnení
            </span>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0 animate-pulse">
                {pendingUsers.length} čaká na schválenie
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" /> Autorizácia a Zoznam Používateľov
          </h1>
          <p className="text-xs text-zinc-400">
            Schvaľujte nové registrácie so Slovnaft ID, prideľujte systémové roly a riaďte prístupy testerov.
          </p>
        </div>
      </div>

      {/* 1. Pending Approvals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" /> Čakajúce Žiadosti o Registráciu ({pendingUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">Načítavam žiadosti...</div>
        ) : pendingUsers.length === 0 ? (
          <Card variant="glass" className="p-6 text-center text-xs text-zinc-400 bg-zinc-950/40 border-white/10">
            ✅ Všetky žiadosti o registráciu sú spracované. Žiadny používateľ nečaká na autorizáciu.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingUsers.map((pUser) => (
              <Card
                key={pUser.id}
                variant="glass"
                className="p-5 space-y-4 bg-zinc-950/80 border-amber-500/30 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{pUser.fullName}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> {pUser.email}
                    </p>
                  </div>
                  <Badge variant="warning" className="text-[10px] font-mono shrink-0">
                    Čaká
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Slovnaft ID:
                    </span>
                    <span className="font-bold text-blue-300">{pUser.slovnaftId || 'Nezadané'}</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Telefón:
                    </span>
                    <span className="font-bold text-emerald-300">{pUser.phoneNumber || 'Nezadané'}</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-500">Požadovaná rola:</span>
                    <span className="text-purple-300 font-bold">{pUser.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={actionInProgress === pUser.id}
                    onClick={() => handleApprove(pUser.id, pUser.role)}
                    className="flex-1 h-8 text-xs font-semibold shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Schváliť Prístup
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionInProgress === pUser.id}
                    onClick={() => handleReject(pUser.id)}
                    className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    title="Zamietnuť registráciu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 2. Approved Active Users Table */}
      <section className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Schválení a Aktívni Používatelia ({allUsers.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filtrovať používateľov..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <Card variant="glass" className="overflow-hidden bg-zinc-950/60 border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] font-mono font-bold text-zinc-400">
                  <th className="p-3.5">Meno a Priezvisko</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Slovnaft ID</th>
                  <th className="p-3.5">Telefón</th>
                  <th className="p-3.5">Systémová Rola</th>
                  <th className="p-3.5 text-right">Akcie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {allUsers
                  .filter((u) =>
                    !searchQuery
                      ? true
                      : u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.slovnaftId && u.slovnaftId.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-semibold text-white">{u.fullName}</td>
                      <td className="p-3.5 font-mono text-zinc-300">{u.email}</td>
                      <td className="p-3.5 font-mono text-blue-300 font-bold">{u.slovnaftId || '—'}</td>
                      <td className="p-3.5 font-mono text-zinc-400">{u.phoneNumber || '—'}</td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="TESTER">Tester</option>
                          <option value="TEST_LEAD">Test Lead</option>
                          <option value="BUSINESS_REVIEWER">Business Reviewer</option>
                          <option value="ADMIN">Administrátor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(u.id)}
                          className="h-7 px-2 text-zinc-500 hover:text-rose-400"
                          title="Odstrániť účet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
