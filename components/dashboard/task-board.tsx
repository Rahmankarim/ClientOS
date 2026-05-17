'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Plus, RotateCw, Trash2 } from 'lucide-react'

interface Task {
  _id: string
  projectId: string
  milestoneId: string
  title: string
  assignee?: string
  status: 'pending' | 'in progress' | 'completed'
  createdAt: string
  updatedAt: string
}

interface Milestone {
  _id: string
  title: string
  status: 'pending' | 'in progress' | 'completed'
}

const statusConfig = {
  pending: {
    title: 'Queued',
    icon: Circle,
    header: 'from-muted to-muted/60',
  },
  'in progress': {
    title: 'In Progress',
    icon: RotateCw,
    header: 'from-primary/20 to-primary/10',
  },
  completed: {
    title: 'Completed',
    icon: CheckCircle2,
    header: 'from-emerald-500/20 to-emerald-500/10',
  },
} as const

export function TaskBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadBoard = async () => {
      setLoading(true)

      try {
        const [taskResponse, milestoneResponse] = await Promise.all([
          fetch(`/api/tasks?projectId=${projectId}`),
          fetch(`/api/milestones?projectId=${projectId}`),
        ])

        if (cancelled) {
          return
        }

        if (taskResponse.ok) {
          const taskData = await taskResponse.json()
          setTasks(taskData)
        }

        if (milestoneResponse.ok) {
          let milestoneData = await milestoneResponse.json()

          if (milestoneData.length === 0) {
            const createResponse = await fetch('/api/milestones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                title: 'Core Delivery',
                status: 'in progress',
              }),
            })

            if (createResponse.ok) {
              const refreshedMilestoneResponse = await fetch(`/api/milestones?projectId=${projectId}`)
              if (refreshedMilestoneResponse.ok) {
                milestoneData = await refreshedMilestoneResponse.json()
              }
            }
          }

          setMilestones(milestoneData)
          if (milestoneData.length > 0) {
            setSelectedMilestoneId((currentMilestoneId) => currentMilestoneId || milestoneData[0]._id)
          }
        }
      } catch (error) {
        console.error('Error loading task board:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBoard()

    return () => {
      cancelled = true
    }
  }, [projectId])

  const addTask = async () => {
    const milestoneId = selectedMilestoneId || milestones[0]?._id
    if (!newTaskTitle.trim() || !milestoneId) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          milestoneId,
          title: newTaskTitle,
          assignee: '',
          status: 'pending',
        }),
      })

      if (response.ok) {
        const createdTask = await response.json()
        setTasks((currentTasks) => [createdTask, ...currentTasks])
        setNewTaskTitle('')
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTasks((currentTasks) => currentTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)))
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (response.ok) {
        setTasks((currentTasks) => currentTasks.filter((task) => task._id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const summary = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === 'completed').length
    const inProgress = tasks.filter((task) => task.status === 'in progress').length
    const pending = tasks.filter((task) => task.status === 'pending').length

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [tasks])

  const columns = {
    pending: tasks.filter((task) => task.status === 'pending'),
    'in progress': tasks.filter((task) => task.status === 'in progress'),
    completed: tasks.filter((task) => task.status === 'completed'),
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="cosmic-panel rounded-2xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tasks</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Track every delivery step</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tasks are linked to milestones, so the board stays connected to project delivery.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{summary.total}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-bold text-emerald-500">{summary.completed}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">In progress</p>
              <p className="mt-1 text-2xl font-bold text-primary">{summary.inProgress}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Completion</p>
              <p className="mt-1 text-2xl font-bold text-accent">{summary.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border/40 bg-background/60 p-4 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Milestone
            </label>
            <select
              value={selectedMilestoneId}
              onChange={(event) => setSelectedMilestoneId(event.target.value)}
              className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {milestones.length === 0 ? (
                <option value="">Create a milestone first</option>
              ) : (
                milestones.map((milestone) => (
                  <option key={milestone._id} value={milestone._id}>
                    {milestone.title} ({milestone.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  addTask()
                }
              }}
              placeholder={milestones.length === 0 ? 'Create a milestone to add tasks' : 'Add a new task...'}
              disabled={milestones.length === 0}
              className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button onClick={addTask} disabled={milestones.length === 0 || !newTaskTitle.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => {
          const config = statusConfig[status]
          const Icon = config.icon
          const statusTasks = columns[status]

          return (
            <div key={status} className="space-y-4">
              <div className={`rounded-2xl border border-border/50 bg-gradient-to-br ${config.header} p-4`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 text-foreground shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{config.title}</h3>
                    <p className="text-sm text-muted-foreground">{statusTasks.length} tasks</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 min-h-96">
                {statusTasks.length > 0 ? (
                  statusTasks.map((task) => (
                    <Card
                      key={task._id}
                      className="group border border-border/50 bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{task.title}</h4>
                          {task.assignee && <p className="text-xs text-muted-foreground">Assigned to {task.assignee}</p>}
                        </div>
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge className="border border-border/30 bg-background/80 text-xs font-medium text-foreground">
                          {milestones.find((milestone) => milestone._id === task.milestoneId)?.title || 'Milestone'}
                        </Badge>
                        <select
                          value={task.status}
                          onChange={(event) => updateTaskStatus(task._id, event.target.value as Task['status'])}
                          className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          <option value="pending">Pending</option>
                          <option value="in progress">In progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 px-4 py-14 text-center text-sm text-muted-foreground">
                    No tasks in this state yet.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
