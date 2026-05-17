// components/dashboard/projects-grid.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  deadline?: string | null;
  taskStats?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    completionRate: number;
  };
}

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-primary/10 text-primary border border-primary/30';
      case 'active':
      case 'in-progress':
        return 'bg-accent/10 text-accent border border-accent/30';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border border-green-500/30';
      case 'on-hold':
        return 'bg-muted text-muted-foreground border border-border/30';
      default:
        return 'bg-muted text-muted-foreground border border-border/30';
    }
  };

  const formatStatus = (status: string) => status.replace('-', ' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link key={project._id} href={`/dashboard/projects/${project._id}`}>
          <Card className="cosmic-panel h-full cursor-pointer transition-all duration-300 group hover:-translate-y-0.5 hover:border-primary/60">
            <CardHeader>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 transition-colors group-hover:from-primary/40 group-hover:to-accent/40">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              <CardTitle className="line-clamp-2 text-xl tracking-tight transition-colors group-hover:text-primary">
                {project.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-muted-foreground">
                {project.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                  {formatStatus(project.status)}
                </Badge>
                {project.taskStats && (
                  <Badge className="border border-border/30 bg-background/70 text-xs font-medium text-foreground">
                    {project.taskStats.completed}/{project.taskStats.total} tasks complete
                  </Badge>
                )}
              </div>

              {project.taskStats && project.taskStats.total > 0 && (
                <div className="space-y-2 rounded-xl border border-border/40 bg-background/50 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completion</span>
                    <span>{project.taskStats.completionRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${project.taskStats.completionRate}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-border/30 pt-2 text-xs text-muted-foreground">
                <span>{project.clientName || 'Client not set'}</span>
                {project.deadline ? (
                  <span>Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                ) : (
                  <span>No deadline</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
