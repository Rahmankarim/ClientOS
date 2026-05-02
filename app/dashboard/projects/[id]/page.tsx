'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { TaskBoard } from '@/components/dashboard/task-board'
import { ScopeManager } from '@/components/dashboard/scope-manager'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { CollaborationPanel } from '@/components/dashboard/collaboration-panel'
import { GitHubIntegration } from '@/components/dashboard/github-integration'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'scope' | 'settings'>('tasks')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setProject(data)
        }
      } catch (error) {
        console.error('Error fetching project:', error)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!project) {
    return <div className="flex items-center justify-center min-h-screen">Project not found</div>
  }

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-[6%] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[45%] -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="lift-in cosmic-panel rounded-2xl p-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <p className="mb-4 max-w-3xl text-muted-foreground">{project.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="flex gap-3 py-3">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'tasks'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('scope')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'scope'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              Scope Manager
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-3">
            <div className="lift-in" style={{ animationDelay: '60ms' }}>
              {activeTab === 'tasks' && <TaskBoard projectId={projectId} />}
            </div>
            <div className="lift-in" style={{ animationDelay: '120ms' }}>
              {activeTab === 'scope' && <ScopeManager projectId={projectId} />}
            </div>
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="cosmic-panel">
                  <CardContent className="space-y-3 p-6">
                    <h2 className="text-xl font-bold tracking-tight">Project Settings</h2>
                    <p className="text-muted-foreground">
                      Manage project integrations, repository sync, and collaboration defaults.
                    </p>
                  </CardContent>
                </Card>
                <GitHubIntegration projectId={projectId} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="cosmic-panel p-4">
              <ActivityFeed projectId={projectId} />
            </Card>
            <Card className="cosmic-panel p-4">
              <CollaborationPanel projectId={projectId} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
