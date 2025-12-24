'use client';

import Button from '@/components/Button';
import DashboardNavbar from '@/components/DashboardNavbar';
import Input from '@/components/Input';
import Sidebar from '@/components/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  lsfmd_rank: string;
  hr_rank: string;
  member_type: string;
  email: string | null;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Name editing
  const [fullName, setFullName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('You must be signed in');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, lsfmd_rank, hr_rank, member_type')
        .eq('id', user.id)
        .single();

      if (profileError) {
        toast.error('Failed to load profile');
        return;
      }

      setProfile({ ...profileData, email: user.email ?? null });
      setFullName(profileData.full_name || '');
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setUpdatingName(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be signed in');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message || 'Failed to update name');
        return;
      }

      toast.success('Name updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update name');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createSupabaseBrowserClient();

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(updateError.message || 'Failed to change password');
        return;
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Your account</p>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : (
              <>
                {/* Profile Information */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                      <input
                        type="text"
                        value={profile?.username || ''}
                        disabled
                        className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        value={profile?.email || 'N/A'}
                        disabled
                        className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>

                    <form onSubmit={handleUpdateName}>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="flex-1 h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter your full name"
                        />
                        <Button type="submit" disabled={updatingName || fullName === profile?.full_name}>
                          {updatingName ? 'Saving…' : 'Update'}
                        </Button>
                      </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">LSFMD Rank</label>
                        <input
                          type="text"
                          value={profile?.lsfmd_rank || ''}
                          disabled
                          className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Managed by commanders</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">HR Rank</label>
                        <input
                          type="text"
                          value={profile?.hr_rank || ''}
                          disabled
                          className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Managed by commanders</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Member Type</label>
                      <input
                        type="text"
                        value={profile?.member_type ? profile.member_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
                        disabled
                        className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed capitalize"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Managed by commanders</p>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />

                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />

                    <Button type="submit" disabled={changingPassword} className="w-full">
                      {changingPassword ? 'Changing Password…' : 'Change Password'}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
