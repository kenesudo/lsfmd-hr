'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Sidebar from '@/components/Sidebar';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Row = {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

type ApiResponse = {
  ok: boolean;
  rows: Row[];
  error?: string;
};

export default function CommanderLoginHistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRows('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRows = async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/commander/login-history?${params.toString()}`);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to load login history');
        return;
      }
      setRows(data.rows);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load login history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      const hay = `${r.full_name ?? ''} ${r.username ?? ''} ${r.ip ?? ''} ${r.user_agent ?? ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [rows, search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRows(search);
  };

  const onApplySearch = () => {
    fetchRows(search);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Commander tools</p>
              <h1 className="text-2xl font-bold text-foreground">Login History</h1>
            </div>
            <Button onClick={onRefresh} variant="outline" disabled={loading || refreshing}>
              {refreshing || loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[240px]">
                <Input
                  label="Search"
                  placeholder="Search name, username, IP, user agent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="button" onClick={onApplySearch} disabled={loading}>
                Search
              </Button>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                <p className="text-lg font-semibold text-foreground">No login events</p>
                <p className="text-sm">Try adjusting your search or refresh the list.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-3 pr-4 font-medium">Time</th>
                      <th className="py-3 pr-4 font-medium">Member</th>
                      <th className="py-3 pr-4 font-medium">IP</th>
                      <th className="py-3 font-medium">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((r) => (
                      <tr key={r.id} className="align-top">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-foreground">{r.full_name ?? 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">@{r.username ?? 'unknown'}</div>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">{r.ip ?? '—'}</td>
                        <td className="py-3">
                          <div className="text-xs text-muted-foreground break-all">{r.user_agent ?? '—'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
