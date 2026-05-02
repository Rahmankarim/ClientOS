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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: projects, mutate: mutateProjects } = useSWR(
    status === 'authenticated' ? '/api/projects' : null,
    fetcher
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
          <div className="lift-in cosmic-panel rounded-2xl p-6 sm:p-7">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Today</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Keep every client update on track.
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Centralize projects, milestones, proposals, and AI-assisted delivery updates in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="lift-in cosmic-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tracking-tight text-foreground">{projects?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="lift-in cosmic-panel" style={{ animationDelay: '80ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tracking-tight text-primary">
                  {projects?.filter((p: any) => p.status === 'active')?.length || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="lift-in cosmic-panel" style={{ animationDelay: '160ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tracking-tight text-accent">
                  {projects?.filter((p: any) => p.status === 'scope')?.length || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="lift-in cosmic-panel" style={{ animationDelay: '240ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tracking-tight text-muted-foreground">
                  {projects?.filter((p: any) => p.status === 'completed')?.length || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Projects</h2>
              <p className="text-muted-foreground">
                Manage and track all your projects in one place
              </p>
            </div>
            {projects ? (
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
          onProjectCreated={() => mutateProjects()}
        />
      </div>
    </main>
  );
}
