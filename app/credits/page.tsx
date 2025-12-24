'use client';

import DashboardNavbar from '@/components/DashboardNavbar';
import Sidebar from '@/components/Sidebar';

const teamMembers = [
  { name: 'Maku Kenesu', role: 'Developer' },
  { name: 'Oliver Blue', role: 'Tester' },
  { name: 'Jyso Blue', role: 'Tester' },
  { name: 'Max C Yamaguchi', role: 'Tester' },
  { name: 'Micky Corleone', role: 'Tester' },
  { name: 'Aritro Vercetti', role: 'Tester' },
];

export default function CreditsPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Credits</h1>
              <p className="text-muted-foreground mt-2">
                The LSFMD HR Templates system was built by the following team members.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Development Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center gap-4 p-4 bg-secondary rounded-lg border border-border"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground">
                This system streamlines HR processes for the Los Santos Fire & Medical Department, providing
                tools for applications, trainings, employee profiles, and activity tracking.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
