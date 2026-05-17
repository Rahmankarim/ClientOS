'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Github, Link, Trash2 } from 'lucide-react'
import useSWR from 'swr'

interface GitHubRepo {
  _id: string
  projectId: string
  owner: string
  repo: string
  url: string
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function GitHubIntegration({ projectId }: { projectId: string }) {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: repos, mutate: mutateRepos } = useSWR(
    `/api/github/repos?projectId=${projectId}`,
    fetcher
  )
  const [isSyncing, setIsSyncing] = useState(false)

  const linkRepository = async () => {
    if (!owner.trim() || !repo.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          owner,
          repo,
        }),
      })

      if (res.ok) {
        setOwner('')
        setRepo('')
        mutateRepos()
      }
    } catch (error) {
      console.error('Error linking repository:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const unlinkRepository = async (repoId: string) => {
    try {
      const res = await fetch(`/api/github/repos/${repoId}`, { method: 'DELETE' })
      if (res.ok) {
        mutateRepos()
      }
    } catch (error) {
      console.error('Error unlinking repository:', error)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <Github className="w-5 h-5" />
        <h3 className="font-semibold">GitHub Integration</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Link your GitHub repositories to sync issues and pull requests with your project scope.
      </p>

      <div className="space-y-4 mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Repository owner (e.g., facebook)"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            placeholder="Repository name (e.g., react)"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            onClick={linkRepository}
            disabled={isSubmitting || !owner.trim() || !repo.trim()}
            className="gap-2"
          >
            <Link className="w-4 h-4" />
            Link
          </Button>
        </div>
      </div>

      {repos && repos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Linked Repositories</p>
          {repos.map((r: GitHubRepo) => (
            <div
              key={r._id}
              className="flex items-center justify-between p-3 bg-white border border-border rounded-lg"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm">
                  {r.owner}/{r.repo}
                </span>
              </a>
              <button
                onClick={() => unlinkRepository(r._id)}
                className="text-muted-foreground hover:text-destructive transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              setIsSyncing(true)
              try {
                const res = await fetch('/api/github/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId }),
                })
                const json = await res.json()
                if (!res.ok) {
                  console.error('Sync failed', json)
                } else {
                  // Refresh tasks/milestones indirectly by reloading
                  mutateRepos()
                  window.location.reload()
                }
              } catch (err) {
                console.error('Error syncing GitHub:', err)
              } finally {
                setIsSyncing(false)
              }
            }}
            disabled={isSyncing || !(repos && repos.length > 0)}
            className="w-full"
          >
            {isSyncing ? 'Syncing...' : 'Sync Issues & PRs'}
          </Button>
        </div>
      </div>

      {(!repos || repos.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No repositories linked yet
        </p>
      )}
    </Card>
  )
}
