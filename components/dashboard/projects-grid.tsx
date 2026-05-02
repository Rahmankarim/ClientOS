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
  priority: string;
  dueDate?: string;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/30';
      case 'medium':
        return 'bg-primary/10 text-primary border border-primary/30';
      case 'low':
        return 'bg-green-500/10 text-green-500 border border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground border border-border/30';
    }
  };

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
                  {project.status}
                </Badge>
                <Badge className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </Badge>
              </div>
              {project.dueDate && (
                <div className="border-t border-border/30 pt-2">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Due: {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
