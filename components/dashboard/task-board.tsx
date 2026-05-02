'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'

interface Task {
  _id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export function TaskBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newTaskTitle,
          description: '',
          status: 'todo',
          priority: 'medium',
        }),
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks([...tasks, newTask])
        setNewTaskTitle('')
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t))
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks(tasks.filter(t => t._id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const priorityColor = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    done: tasks.filter(t => t.status === 'done'),
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>

  const columnConfig = {
    todo: { title: 'To Do', color: 'from-muted to-muted/50', icon: '📋' },
    'in-progress': { title: 'In Progress', color: 'from-primary/20 to-primary/10', icon: '⚙️' },
    done: { title: 'Done', color: 'from-green-500/20 to-green-500/10', icon: '✓' }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border border-red-500/30'
      case 'medium':
        return 'bg-primary/10 text-primary border border-primary/30'
      case 'low':
        return 'bg-muted text-muted-foreground border border-border/30'
      default:
        return 'bg-muted text-muted-foreground border border-border/30'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Tasks</h2>
        <p className="text-muted-foreground text-sm">Manage and track your project tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['todo', 'in-progress', 'done'] as const).map((status) => {
          const config = columnConfig[status]
          const columnTasks = tasks.filter((t) => t.status === status)

          return (
            <div key={status} className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r ${config.color} border border-border/50`}>
                <span className="text-lg">{config.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{config.title}</h3>
                  <p className="text-xs text-muted-foreground">{columnTasks.length} tasks</p>
                </div>
              </div>

              <div className="space-y-3 min-h-96">
                {columnTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="p-4 cursor-grab active:cursor-grabbing border border-border/50 hover:border-primary/50 hover:shadow-md transition-all bg-card/50 hover:bg-card group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-foreground text-sm leading-tight flex-1 line-clamp-2">
                        {task.title}
                      </h4>
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <Badge className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </Card>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>

              {status === 'todo' && (
                <div className="flex gap-2 justify-end">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTask()
                      }
                    }}
                    placeholder="Add new task..."
                    className="flex-1 px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                  <Button
                    onClick={addTask}
                    size="sm"
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          className="flex-1 px-3 py-2 border border-border rounded-md"
        />
        <Button onClick={addTask}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(columns).map(([status, statusTasks]) => (
          <Card key={status} className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-4 capitalize">
              {status.replace('-', ' ')} ({statusTasks.length})
            </h3>
            <div className="space-y-3">
              {statusTasks.map((task) => (
                <Card
                  key={task._id}
                  className="p-3 bg-card border-2 border-transparent hover:border-primary transition cursor-move"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    </div>
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3 gap-2">
                    <Badge className={priorityColor[task.priority]}>
                      {task.priority}
                    </Badge>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task._id, e.target.value as Task['status'])}
                      className="text-xs px-2 py-1 border border-border rounded"
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
