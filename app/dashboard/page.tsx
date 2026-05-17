// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectsGrid from '@/components/dashboard/projects-grid';
import NewProjectDialog from '@/components/dashboard/new-project-dialog';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: dashboardSummary, mutate: mutateDashboardSummary } = useSWR(
    status === 'authenticated' ? '/api/dashboard/summary' : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [router, status]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const projects = dashboardSummary?.projects || [];
  const metrics = dashboardSummary?.metrics || {
    totalProjects: 0,
    activeProjects: 0,
    reviewProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    milestoneCount: 0,
    completionRate: 0,
  };
  const recentTasks = dashboardSummary?.recentTasks || [];

  return (
    <main className="min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 -left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-56 -right-16 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="glow-ping flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Delivery Command Center</h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, {session.user?.name || session.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/proposals/new">New Proposal</Link>
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="space-y-8">
          <div className="lift-in cosmic-panel rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge className="mb-4 border border-primary/20 bg-primary/10 text-primary">Real-time workspace overview</Badge>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Today</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Keep every client update on track.
                </h2>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  Centralize projects, milestones, tasks, and AI-assisted delivery updates in one professional command center.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Projects</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{metrics.totalProjects}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Completed</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-500">{metrics.completedTasks}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Progress</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{metrics.completionRate}%</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Milestones</p>
                  <p className="mt-1 text-2xl font-bold text-accent">{metrics.milestoneCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Removed duplicate metric cards to avoid repeating counts shown above */}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="cosmic-panel lg:col-span-2">
              <CardHeader>
                <CardTitle>Live Delivery Snapshot</CardTitle>
                <CardDescription>What changed recently across your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Task completion</span>
                    <span className="font-medium text-foreground">{metrics.completionRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${metrics.completionRate}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
                    <div className="rounded-xl border border-border/40 bg-card/70 p-3">
                      <p className="text-muted-foreground">Completed</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-500">{metrics.completedTasks}</p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-card/70 p-3">
                      <p className="text-muted-foreground">In progress</p>
                      <p className="mt-1 text-lg font-semibold text-primary">{projects.reduce((sum: number, project: any) => sum + (project.taskStats?.inProgress || 0), 0)}</p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-card/70 p-3">
                      <p className="text-muted-foreground">Pending</p>
                      <p className="mt-1 text-lg font-semibold text-accent">{metrics.pendingTasks}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent Work Items</h3>
                  <div className="space-y-3">
                    {recentTasks.length > 0 ? (
                      recentTasks.map((task: any) => (
                        <div key={task._id} className="rounded-2xl border border-border/40 bg-background/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{task.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Project: {projects.find((project: any) => project._id === task.projectId)?.name || 'Unknown project'}
                              </p>
                            </div>
                            <Badge className="border border-border/30 bg-card/70 text-xs font-medium text-foreground">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent tasks yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cosmic-panel">
              <CardHeader>
                <CardTitle>Workspace Pulse</CardTitle>
                <CardDescription>Quick operational snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
                  <p className="text-muted-foreground">Milestones tracked</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{metrics.milestoneCount}</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
                  <p className="text-muted-foreground">Projects in delivery</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{metrics.activeProjects + metrics.reviewProjects}</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
                  <p className="text-muted-foreground">Tasks awaiting completion</p>
                  <p className="mt-1 text-2xl font-bold text-accent">{metrics.pendingTasks}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Projects</h2>
              <p className="text-muted-foreground">Manage and track all your projects in one place</p>
            </div>
            {dashboardSummary ? (
              projects.length > 0 ? (
                <ProjectsGrid projects={projects} />
              ) : (
                <Card className="cosmic-panel border-dashed">
                  <CardContent className="pt-12 text-center pb-12">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create your first project to get started with scope management, AI insights, and team collaboration.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Your First Project
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted/30 border border-border/50" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Project Dialog */}
        <NewProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onProjectCreated={() => {
            // refresh dashboard summary after project created
            mutateDashboardSummary();
          }}
        />
      </div>
    </main>
  );
}
