import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import GitHubRepository from '@/models/GitHubRepository'
import Project from '@/models/Project'
import Milestone from '@/models/Milestone'
import Task from '@/models/Task'
import mongoose from 'mongoose'

async function fetchJsonSafely(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return Response.json({ error: 'Valid projectId is required' }, { status: 400 })
    }

    await connectToDatabase()

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(projectId),
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean()

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const repos = await GitHubRepository.find({ projectId: project._id }).lean()
    if (!repos || repos.length === 0) {
      return Response.json({ message: 'No linked repositories' })
    }

    // Use server PAT if configured, otherwise attempt unauthenticated queries
    const token = process.env.GITHUB_TOKEN || ''
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    // Ensure a milestone exists to attach tasks created from GitHub items
    let milestone = await Milestone.findOne({ projectId: project._id, title: 'GitHub Sync' }).lean()
    if (!milestone) {
      const created = await Milestone.create({
        projectId: project._id,
        title: 'GitHub Sync',
        status: 'in progress',
        order: 9999,
      })
      milestone = created.toObject()
    }

    const createdTasks: any[] = []

    for (const r of repos) {
      const owner = r.owner
      const repo = r.repo
      // fetch recent issues
      const issues = await fetchJsonSafely(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=20`, headers)
      if (!issues) continue

      for (const item of issues) {
        // Skip pull requests in issues list; we'll handle PRs separately
        if (item.pull_request) continue

        const title = `GH Issue: ${item.title}`
        // upsert task by external id stored in title+project
        const existing = await Task.findOne({ projectId: project._id, title }).lean()
        if (existing) continue

        const task = await Task.create({
          milestoneId: new mongoose.Types.ObjectId(milestone._id),
          projectId: project._id,
          title,
          assignee: item.assignee?.login || '',
          status: item.state === 'open' ? 'pending' : 'completed',
        })
        createdTasks.push(task)
      }

      // fetch pull requests (as separate endpoint)
      const prs = await fetchJsonSafely(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=20`, headers)
      if (!prs) continue

      for (const pr of prs) {
        const title = `GH PR: ${pr.title}`
        const existing = await Task.findOne({ projectId: project._id, title }).lean()
        if (existing) continue

        const task = await Task.create({
          milestoneId: new mongoose.Types.ObjectId(milestone._id),
          projectId: project._id,
          title,
          assignee: pr.user?.login || '',
          status: pr.state === 'open' ? 'in progress' : 'completed',
        })
        createdTasks.push(task)
      }
    }

    return Response.json({ success: true, created: createdTasks.length })
  } catch (error) {
    console.error('Error syncing GitHub items:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
