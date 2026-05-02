'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { AIAssistant } from './ai-assistant'

interface ScopeItem {
  _id: string
  projectId: string
  title: string
  description: string
  estimatedHours: number
  approved: boolean
  createdAt: string
}

export function ScopeManager({ projectId }: { projectId: string }) {
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    estimatedHours: 0,
  })

  useEffect(() => {
    fetchScope()
  }, [projectId])

  const fetchScope = async () => {
    try {
      const res = await fetch(`/api/scope?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setScopeItems(data)
      }
    } catch (error) {
      console.error('Error fetching scope:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!newItem.title.trim()) return

    try {
      const res = await fetch('/api/scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newItem.title,
          description: newItem.description,
          estimatedHours: newItem.estimatedHours,
        }),
      })
      if (res.ok) {
        const createdItem = await res.json()
        setScopeItems([...scopeItems, createdItem])
        setNewItem({ title: '', description: '', estimatedHours: 0 })
      }
    } catch (error) {
      console.error('Error adding scope item:', error)
    }
  }

  const approveItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/scope/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      if (res.ok) {
        setScopeItems(scopeItems.map(i => i._id === itemId ? { ...i, approved: true } : i))
      }
    } catch (error) {
      console.error('Error approving scope item:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/scope/${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        setScopeItems(scopeItems.filter(i => i._id !== itemId))
      }
    } catch (error) {
      console.error('Error deleting scope item:', error)
    }
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading scope items...</div>

  const approvedHours = scopeItems
    .filter((item) => item.approved)
    .reduce((sum, item) => sum + (item.estimatedHours || 0), 0)

  const totalHours = scopeItems.reduce((sum, item) => sum + (item.estimatedHours || 0), 0)
  const approvalRate =
    totalHours > 0 ? Math.round(((approvedHours / totalHours) * 100)) : 0

  return (
    <div className="space-y-6">
      <AIAssistant projectId={projectId} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Scope Items</h2>
            <p className="text-muted-foreground text-sm">Define and manage project deliverables</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{approvedHours}h</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">{approvalRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Scope Items List */}
        <div className="space-y-3">
          {scopeItems.length === 0 ? (
            <Card className="border border-dashed border-border/50">
              <CardContent className="pt-12 text-center pb-12">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No scope items yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Use the AI Assistant above to generate scope items automatically
                </p>
              </CardContent>
            </Card>
          ) : (
            scopeItems.map((item) => (
              <Card
                key={item._id}
                className={`p-4 border transition-all ${
                  item.approved
                    ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
                    : 'border-border/50 bg-card/50 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.approved && (
                        <Badge className="bg-green-500/10 text-green-500 border border-green-500/30 text-xs font-medium">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.estimatedHours || 0} hours
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!item.approved && (
                      <Button
                        onClick={() => approveItem(item._id)}
                        size="sm"
                        variant="outline"
                        className="gap-1 border-green-500/30 hover:border-green-500/50 hover:text-green-500"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteItem(item._id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Add New Item Form */}
        <Card className="border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Scope Item
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Title..."
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
              <textarea
                placeholder="Description..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 resize-none"
              />
              <input
                type="number"
                placeholder="Estimated hours..."
                value={newItem.estimatedHours}
                onChange={(e) => setNewItem({ ...newItem, estimatedHours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <Button
              onClick={addItem}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
