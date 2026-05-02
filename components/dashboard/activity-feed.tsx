'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, MessageSquare, CheckCircle, Zap } from 'lucide-react'
import useSWR from 'swr'

interface Activity {
  _id: string
  projectId: string
  userId: string
  userName: string
  userImage?: string
  type: 'comment' | 'task_update' | 'scope_change' | 'project_update'
  description: string
  metadata?: Record<string, any>
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ActivityFeed({ projectId }: { projectId: string }) {
  const { data: activities, isLoading } = useSWR(
    `/api/activities?projectId=${projectId}&limit=10`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4" />
      case 'task_update':
        return <CheckCircle className="w-4 h-4" />
      case 'scope_change':
        return <Zap className="w-4 h-4" />
      case 'project_update':
        return <Users className="w-4 h-4" />
      default:
        return null
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-100 text-blue-800'
      case 'task_update':
        return 'bg-green-100 text-green-800'
      case 'scope_change':
        return 'bg-yellow-100 text-yellow-800'
      case 'project_update':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading activity...</div>
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <Zap className="w-4 h-4" />
        Recent Activity
      </h3>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse border border-border/50" />
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 text-sm">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {activity.userName}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(activity.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  )
}
