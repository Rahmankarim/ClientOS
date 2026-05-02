'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users } from 'lucide-react'
import useSWR from 'swr'

interface Comment {
  _id: string
  projectId: string
  content: string
  userName: string
  userImage?: string
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function CollaborationPanel({ projectId }: { projectId: string }) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: comments, mutate: mutateComments } = useSWR(
    `/api/comments?projectId=${projectId}`,
    fetcher,
    { refreshInterval: 3000 }
  )

  const addComment = async () => {
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content: comment,
        }),
      })

      if (res.ok) {
        setComment('')
        mutateComments()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <Users className="w-4 h-4" />
        Team Chat
      </h3>

      {/* Comments List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {comments && comments.length > 0 ? (
          comments.map((c) => (
            <div
              key={c._id}
              className="p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/50 transition-colors"
            >
              <div className="flex items-start gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs flex-shrink-0">
                  {c.userName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{c.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground line-clamp-3 ml-8">
                {c.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No messages yet</p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addComment()
              }
            }}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button
            onClick={addComment}
            disabled={isSubmitting || !comment.trim()}
            size="sm"
            className="gap-1"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
