'use client';

import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface UserProfile {
  full_name: string;
  username: string;
  hr_rank: string;
}

type NavItem = {
  name: string;
  href: string;
  icon: ReactNode;
  allowedRoles?: string[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, username, hr_rank')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    };
    
    fetchProfile();
  }, []);

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      name: 'Application',
      href: '/applications',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      name: 'Reinstatement',
      href: '/reinstatement',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      name: 'Trainings',
      href: '/trainings',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      name: 'Supervision',
      href: '/supervision',
      allowedRoles: ['Commander', 'Assistant Commander', 'Supervisor'],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 15.75c0 3-3.75 6-7.5 6s-7.5-3-7.5-6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-3 3m0 0l3 3m-3-3h-12" />
        </svg>
      ),
    },
    {
      name: 'BBCode Previewer',
      href: '/bbcode-previewer',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75l3 3-3 3m-10.5 0l-3-3 3-3M9 18h6" />
        </svg>
      ),
    },
    {
      name: 'Employee Profile',
      href: '/employee-profile',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="flex flex-col w-64 bg-card border-r border-border">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">HR</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            HR Templates
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => {
            if (!item.allowedRoles) return true;
            if (!profile?.hr_rank) return false;
            return item.allowedRoles.includes(profile.hr_rank);
          })
          .map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
        
        {profile && (profile.hr_rank === 'Commander' || profile.hr_rank === 'Assistant Commander') && (
          <>
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Tools
              </p>
            </div>
            <Link
              href="/view-scores"
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                pathname === '/view-scores'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
              View Scores
            </Link>

            <Link
              href="/view-activities"
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                pathname === '/view-activities'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18m16.5-18v18M3.75 12h16.5M3.75 7.5h16.5M3.75 16.5h16.5" />
                </svg>
              </span>
              View Activities
            </Link>
            <Link
              href="/view-members"
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                pathname === '/view-members'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </span>
              View Members
            </Link>
            <Link
              href="/commander/create-account"
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                pathname === '/commander/create-account'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              </span>
              Create Account
            </Link>

            <Link
              href="/commander/bbc-templates"
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                pathname === '/commander/bbc-templates'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </span>
              BBC Templates
            </Link>

            <Link
              href="/commander/markdown-logs"
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                pathname === '/commander/markdown-logs'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h9m-9 3h6m-6 3h3M6 21h12a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v13.5A2.25 2.25 0 006 21z" />
                </svg>
              </span>
              Markdown Logs
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {profile ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.hr_rank || ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
