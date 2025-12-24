'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type MemberType = {
  key: string;
  label: string;
  created_at: string;
  updated_at: string;
};

type SalaryRate = {
  id: string;
  member_type_key: string;
  salary_per_point: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
};

export default function CommanderSettingsPage() {
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member type form
  const [newTypeKey, setNewTypeKey] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [addingType, setAddingType] = useState(false);

  // Add salary rate form
  const [newRateMemberType, setNewRateMemberType] = useState('');
  const [newRateSalary, setNewRateSalary] = useState('');
  const [addingRate, setAddingRate] = useState(false);

  // Edit salary rate
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateSalary, setEditRateSalary] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, ratesRes] = await Promise.all([
        fetch('/api/commander/member-types'),
        fetch('/api/commander/salary-rates'),
      ]);

      const typesData = await typesRes.json();
      const ratesData = await ratesRes.json();

      if (typesData.ok) {
        setMemberTypes(typesData.member_types);
      }

      if (ratesData.ok) {
        setSalaryRates(ratesData.salary_rates);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMemberType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeKey.trim() || !newTypeLabel.trim()) {
      toast.error('Key and label are required');
      return;
    }

    setAddingType(true);
    try {
      const res = await fetch('/api/commander/member-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newTypeKey.trim(),
          label: newTypeLabel.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to add member type');
        return;
      }

      toast.success('Member type added');
      setNewTypeKey('');
      setNewTypeLabel('');
      fetchData();
    } finally {
      setAddingType(false);
    }
  };

  const handleDeleteMemberType = async (key: string) => {
    if (!confirm(`Delete member type "${key}"? This will fail if any profiles use it.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/commander/member-types/${key}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to delete member type');
        return;
      }

      toast.success('Member type deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete member type');
    }
  };

  const handleAddSalaryRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateMemberType || !newRateSalary.trim()) {
      toast.error('Member type and salary are required');
      return;
    }

    const salary = Number(newRateSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      toast.error('Invalid salary amount');
      return;
    }

    setAddingRate(true);
    try {
      const res = await fetch('/api/commander/salary-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_type_key: newRateMemberType,
          salary_per_point: salary,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to add salary rate');
        return;
      }

      toast.success('Salary rate added');
      setNewRateMemberType('');
      setNewRateSalary('');
      fetchData();
    } finally {
      setAddingRate(false);
    }
  };

  const handleUpdateSalaryRate = async (id: string) => {
    const salary = Number(editRateSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      toast.error('Invalid salary amount');
      return;
    }

    try {
      const res = await fetch(`/api/commander/salary-rates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary_per_point: salary,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to update salary rate');
        return;
      }

      toast.success('Salary rate updated');
      setEditingRateId(null);
      setEditRateSalary('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update salary rate');
    }
  };

  const handleDeleteSalaryRate = async (id: string) => {
    if (!confirm('Delete this salary rate?')) {
      return;
    }

    try {
      const res = await fetch(`/api/commander/salary-rates/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Failed to delete salary rate');
        return;
      }

      toast.success('Salary rate deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete salary rate');
    }
  };

  const getCurrentRate = (memberTypeKey: string) => {
    const rates = salaryRates.filter((r) => r.member_type_key === memberTypeKey);
    if (rates.length === 0) return null;
    return rates.sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <p className="text-sm text-muted-foreground">Commander tools</p>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading settings…</div>
            ) : (
              <>
                {/* Member Types Section */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Member Types</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage member type categories. These are used when creating accounts and determining salary rates.
                  </p>

                  <form onSubmit={handleAddMemberType} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Key (lowercase, no spaces)"
                      placeholder="e.g., part-time"
                      value={newTypeKey}
                      onChange={(e) => setNewTypeKey(e.target.value)}
                      required
                    />
                    <Input
                      label="Label"
                      placeholder="e.g., Part-time"
                      value={newTypeLabel}
                      onChange={(e) => setNewTypeLabel(e.target.value)}
                      required
                    />
                    <div className="flex items-end">
                      <Button type="submit" disabled={addingType} className="w-full">
                        {addingType ? 'Adding…' : 'Add Member Type'}
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="py-3 pr-4 font-medium">Key</th>
                          <th className="py-3 pr-4 font-medium">Label</th>
                          <th className="py-3 pr-4 font-medium">Current Rate</th>
                          <th className="py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {memberTypes.map((type) => {
                          const currentRate = getCurrentRate(type.key);
                          return (
                            <tr key={type.key}>
                              <td className="py-3 pr-4">
                                <code className="text-xs bg-muted px-2 py-1 rounded">{type.key}</code>
                              </td>
                              <td className="py-3 pr-4 font-medium text-foreground">{type.label}</td>
                              <td className="py-3 pr-4">
                                {currentRate ? (
                                  <span className="text-foreground">${currentRate.salary_per_point}/pt</span>
                                ) : (
                                  <span className="text-muted-foreground">No rate set</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMemberType(type.key)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Salary Rates Section */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Salary Rates</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure salary per point for each member type. The most recent rate is used for new activities.
                  </p>

                  <form onSubmit={handleAddSalaryRate} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Member Type</label>
                      <select
                        value={newRateMemberType}
                        onChange={(e) => setNewRateMemberType(e.target.value)}
                        className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                        required
                      >
                        <option value="">Select type</option>
                        {memberTypes.map((type) => (
                          <option key={type.key} value={type.key}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Salary per Point"
                      type="number"
                      placeholder="e.g., 350"
                      value={newRateSalary}
                      onChange={(e) => setNewRateSalary(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                    <div className="flex items-end">
                      <Button type="submit" disabled={addingRate} className="w-full">
                        {addingRate ? 'Adding…' : 'Add Salary Rate'}
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="py-3 pr-4 font-medium">Member Type</th>
                          <th className="py-3 pr-4 font-medium">Salary per Point</th>
                          <th className="py-3 pr-4 font-medium">Effective From</th>
                          <th className="py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {salaryRates.map((rate) => {
                          const memberType = memberTypes.find((t) => t.key === rate.member_type_key);
                          const isEditing = editingRateId === rate.id;

                          return (
                            <tr key={rate.id}>
                              <td className="py-3 pr-4 font-medium text-foreground">
                                {memberType?.label || rate.member_type_key}
                              </td>
                              <td className="py-3 pr-4">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editRateSalary}
                                    onChange={(e) => setEditRateSalary(e.target.value)}
                                    className="w-32 h-8 rounded-md border border-border bg-input px-2 text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="text-foreground">${rate.salary_per_point.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-xs text-muted-foreground">
                                {new Date(rate.effective_from).toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleUpdateSalaryRate(rate.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingRateId(null);
                                          setEditRateSalary('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingRateId(rate.id);
                                          setEditRateSalary(rate.salary_per_point.toString());
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSalaryRate(rate.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
