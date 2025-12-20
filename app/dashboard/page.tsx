'use client';

import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Navbar from '@/components/Navbar';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { useState } from 'react';

export default function Dashboard() {
  const [formData, setFormData] = useState({
    employeeName: '',
    department: '',
    position: '',
    agreeToTerms: false,
    description: '',
  });

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'it', label: 'Information Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your HR templates and documents efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Total Templates
              </h3>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-card-foreground">24</p>
            <p className="text-sm text-muted-foreground mt-2">
              +3 from last month
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Active Documents
              </h3>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-card-foreground">156</p>
            <p className="text-sm text-muted-foreground mt-2">
              +12 from last week
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Pending Reviews
              </h3>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-card-foreground">8</p>
            <p className="text-sm text-muted-foreground mt-2">
              Requires attention
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">
              Create New Document
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Employee Name"
                placeholder="Enter employee name"
                value={formData.employeeName}
                onChange={(e) =>
                  setFormData({ ...formData, employeeName: e.target.value })
                }
              />

              <Select
                label="Department"
                options={departmentOptions}
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />

              <Input
                label="Position"
                placeholder="Enter position title"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
              />

              <Textarea
                label="Description"
                placeholder="Enter document description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <Checkbox
                label="I agree to the terms and conditions"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeToTerms: e.target.checked })
                }
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary">
                  Create Document
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Employment Contract',
                  user: 'John Doe',
                  time: '2 hours ago',
                  status: 'completed',
                },
                {
                  title: 'Performance Review',
                  user: 'Jane Smith',
                  time: '5 hours ago',
                  status: 'pending',
                },
                {
                  title: 'Leave Request',
                  user: 'Mike Johnson',
                  time: '1 day ago',
                  status: 'completed',
                },
                {
                  title: 'Onboarding Checklist',
                  user: 'Sarah Williams',
                  time: '2 days ago',
                  status: 'in-progress',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {activity.user.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : activity.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View All Activity
            </Button>
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Component Showcase
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Button Variants
              </h3>
              <div className="space-y-2">
                <Button variant="primary" className="w-full">
                  Primary
                </Button>
                <Button variant="secondary" className="w-full">
                  Secondary
                </Button>
                <Button variant="outline" className="w-full">
                  Outline
                </Button>
                <Button variant="ghost" className="w-full">
                  Ghost
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Button Sizes
              </h3>
              <div className="space-y-2">
                <Button size="sm" className="w-full">
                  Small
                </Button>
                <Button size="md" className="w-full">
                  Medium
                </Button>
                <Button size="lg" className="w-full">
                  Large
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Input Types
              </h3>
              <div className="space-y-2">
                <Input placeholder="Text input" />
                <Input type="email" placeholder="Email input" />
                <Input type="password" placeholder="Password input" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Other Components
              </h3>
              <div className="space-y-3">
                <Select
                  options={[
                    { value: '1', label: 'Option 1' },
                    { value: '2', label: 'Option 2' },
                  ]}
                />
                <Checkbox label="Checkbox option" />
                <Textarea placeholder="Textarea" rows={2} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
