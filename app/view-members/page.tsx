'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Sidebar from '@/components/Sidebar';
import { HR_ROLES } from '@/lib/roles';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Member = {
  id: string;
  username: string;
  full_name: string;
  lsfmd_rank: string;
  hr_rank: string;
  member_type: 'part-time' | 'full-time';
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  email: string | null;
  last_sign_in_at: string | null;
  is_disabled: boolean;
};

type ApiResponse = {
  ok: boolean;
  members: Member[];
  error?: string;
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
] as const;

const LSFMD_RANKS = [
  'Paramedic',
  'Senior Paramedic',
  'Lead Paramedic',
  'Lieutenant',
  'Captain',
  'Assistant Chief',
  'Chief',
] as const;

const MEMBER_TYPES = [
  { value: 'part-time', label: 'Part-time' },
  { value: 'full-time', label: 'Full-time' },
] as const;

export default function ViewMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commander/members');
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to load members');
        return;
      }
      setMembers(data.members);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesTerm = term
        ? [member.full_name, member.username, member.email].some((value) =>
            value?.toLowerCase().includes(term),
          )
        : true;

      const matchesRole = roleFilter === 'all' ? true : member.hr_rank === roleFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? !member.is_disabled
          : member.is_disabled;

      return matchesTerm && matchesRole && matchesStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  const handleRoleChange = async (memberId: string, nextRole: string) => {
    if (updatingId) return;
    setUpdatingId(memberId);
    try {
      const res = await fetch(`/api/commander/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrRank: nextRole }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to update role');
        return;
      }
      setMembers((prev) =>
        prev.map((member) => (member.id === memberId ? { ...member, hr_rank: nextRole } : member)),
      );
      toast.success('Role updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLsfmdRankChange = async (memberId: string, nextRank: string) => {
    if (updatingId) return;
    setUpdatingId(memberId);
    try {
      const res = await fetch(`/api/commander/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lsfmdRank: nextRank }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to update LSFMD rank');
        return;
      }
      setMembers((prev) =>
        prev.map((member) => (member.id === memberId ? { ...member, lsfmd_rank: nextRank } : member)),
      );
      toast.success('LSFMD rank updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update LSFMD rank');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMemberTypeChange = async (memberId: string, nextType: 'part-time' | 'full-time') => {
    if (updatingId) return;
    setUpdatingId(memberId);
    try {
      const res = await fetch(`/api/commander/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberType: nextType }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to update member type');
        return;
      }
      setMembers((prev) =>
        prev.map((member) => (member.id === memberId ? { ...member, member_type: nextType } : member)),
      );
      toast.success('Member type updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update member type');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDisableToggle = async (member: Member) => {
    if (updatingId) return;
    const nextState = !member.is_disabled;
    setUpdatingId(member.id);
    try {
      const res = await fetch(`/api/commander/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disable: nextState }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to update status');
        return;
      }
      setMembers((prev) =>
        prev.map((item) => (item.id === member.id ? { ...item, is_disabled: nextState } : item)),
      );
      toast.success(nextState ? 'Account disabled' : 'Account enabled');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-y-auto p-4">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Commander tools</p>
                  <h1 className="text-3xl font-bold text-foreground">View Members</h1>
                </div>
                <Button onClick={handleRefresh} variant="outline" disabled={loading || refreshing}>
                  {refreshing || loading ? 'Refreshing…' : 'Refresh list'}
                </Button>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      label="Search"
                      placeholder="Search name, username, email"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-48">
                    <Select
                      label="HR Role"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      options={[{ value: 'all', label: 'All roles' }, ...HR_ROLES.map((role) => ({ value: role, label: role }))]}
                    />
                  </div>
                  <div className="w-40">
                    <Select
                      label="Status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number]['value'])}
                      options={STATUS_FILTERS.map((status) => ({ value: status.value, label: status.label }))}
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="text-sm space-y-1">
                      <div className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{members.length}</span></div>
                      <div className="text-muted-foreground">Active: <span className="font-semibold text-foreground">{members.filter((m) => !m.is_disabled).length}</span></div>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  {loading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">Loading members…</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <p className="text-lg font-semibold text-foreground">No members found</p>
                      <p className="text-sm">Adjust your filters or refresh the list.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b border-border">
                            <th className="py-3 pr-4 font-medium">Member</th>
                            <th className="py-3 pr-4 font-medium">LSFMD Rank</th>
                            <th className="py-3 pr-4 font-medium">HR Role</th>
                            <th className="py-3 pr-4 font-medium">Member Type</th>
                            <th className="py-3 pr-4 font-medium">Status</th>
                            <th className="py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredMembers.map((member) => (
                            <tr key={member.id} className="align-top">
                              <td className="py-4 pr-4">
                                <div className="font-semibold text-foreground">{member.full_name}</div>
                                <div className="text-xs text-muted-foreground">@{member.username}</div>
                                {member.email && <div className="text-xs text-muted-foreground">{member.email}</div>}
                                <div className="text-xs text-muted-foreground mt-1">
                                  Last sign-in: {member.last_sign_in_at ? new Date(member.last_sign_in_at).toLocaleString() : 'Never'}
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <select
                                  value={member.lsfmd_rank}
                                  disabled={Boolean(updatingId)}
                                  onChange={(e) => handleLsfmdRankChange(member.id, e.target.value)}
                                  className="flex h-9 w-full min-w-[140px] rounded-md border border-border bg-input px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                >
                                  {LSFMD_RANKS.map((rank) => (
                                    <option key={rank} value={rank}>
                                      {rank}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-4 pr-4">
                                <select
                                  value={member.hr_rank}
                                  disabled={Boolean(updatingId)}
                                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                  className="flex h-9 w-full min-w-[160px] rounded-md border border-border bg-input px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                >
                                  {HR_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-4 pr-4">
                                <select
                                  value={member.member_type}
                                  disabled={Boolean(updatingId)}
                                  onChange={(e) => handleMemberTypeChange(member.id, e.target.value as 'part-time' | 'full-time')}
                                  className="flex h-9 w-full min-w-[110px] rounded-md border border-border bg-input px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                >
                                  {MEMBER_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-4 pr-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${member.is_disabled ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300'}`}
                                >
                                  {member.is_disabled ? 'Disabled' : 'Active'}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex flex-col gap-2 items-end">
                                  <Button
                                    variant={member.is_disabled ? 'secondary' : 'destructive'}
                                    size="sm"
                                    disabled={Boolean(updatingId)}
                                    onClick={() => handleDisableToggle(member)}
                                  >
                                    {member.is_disabled ? 'Enable' : 'Disable'}
                                  </Button>
                                  {member.must_change_password && (
                                    <span className="text-xs text-muted-foreground">Must change password</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
