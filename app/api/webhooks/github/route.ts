import { generateGitHubClientUpdate } from '@/lib/ai'
import { verifyGitHubWebhook } from '@/lib/github'
import { connectToDatabase } from '@/lib/mongodb'
import ActivityFeed from '@/models/ActivityFeed'
import GitHubRepository from '@/models/GitHubRepository'
import Project from '@/models/Project'
import mongoose from 'mongoose'
import { z } from 'zod'

const commitSchema = z.object({
  id: z.string(),
  message: z.string(),
  url: z.string().optional().default(''),
  author: z.object({ name: z.string().optional().default('Unknown') }).optional().default({ name: 'Unknown' }),
})

const pushPayloadSchema = z.object({
  ref: z.string().optional().default(''),
  repository: z.object({
    name: z.string(),
    full_name: z.string().optional().default(''),
    owner: z.object({ login: z.string() }),
  }),
  commits: z.array(commitSchema).default([]),
  head_commit: commitSchema.optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256') || ''
    const eventType = request.headers.get('x-github-event') || ''

    if (!verifyGitHubWebhook(body, signature)) {
      return Response.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    if (eventType !== 'push') {
      return Response.json({ success: true, ignored: `Unsupported event type: ${eventType}` })
    }

    const payload = pushPayloadSchema.parse(JSON.parse(body))

    const owner = payload.repository.owner.login
    const repo = payload.repository.name

    await connectToDatabase()

    const repoConnection = await GitHubRepository.findOne({
      owner,
      repo,
    }).sort({ createdAt: -1 }).lean()

    if (!repoConnection) {
      return Response.json({ success: true, ignored: 'Repository is not linked to any project.' })
    }

    const project = await Project.findById(repoConnection.projectId).lean()
    if (!project) {
      return Response.json({ success: true, ignored: 'Linked project no longer exists.' })
    }

    const commits = payload.commits.length > 0
      ? payload.commits
      : payload.head_commit
        ? [payload.head_commit]
        : []

    if (commits.length === 0) {
      return Response.json({ success: true, ignored: 'Push event has no commits.' })
    }

    const commitSummaries = commits.map((commit) => {
      const shortSha = commit.id.slice(0, 7)
      const firstLine = commit.message.split('\n')[0]
      return `${shortSha} by ${commit.author?.name || 'Unknown'}: ${firstLine}`
    })

    let clientUpdate = ''
    try {
      clientUpdate = await generateGitHubClientUpdate({
        projectName: project.name,
        repository: `${owner}/${repo}`,
        commitCount: commits.length,
        commitSummaries,
      })
    } catch (aiError) {
      console.error('Claude webhook summarization failed:', aiError)
      clientUpdate = `Update from ${owner}/${repo}: ${commitSummaries[0]}`
    }

    const commitLinks = commits
      .filter((commit) => Boolean(commit.url))
      .slice(0, 3)
      .map((commit) => `- ${commit.id.slice(0, 7)}: ${commit.url}`)
      .join('\n')

    const formattedContent = [
      clientUpdate,
      '',
      `Repository: ${owner}/${repo}`,
      `Branch: ${payload.ref.replace('refs/heads/', '') || payload.ref}`,
      `Commits in push: ${commits.length}`,
      commitLinks ? `Links:\n${commitLinks}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const activity = await ActivityFeed.create({
      projectId: new mongoose.Types.ObjectId(project._id.toString()),
      type: 'commit',
      content: formattedContent,
      isVisibleToClient: true,
    })

    return Response.json({
      success: true,
      activityId: activity._id.toString(),
      projectId: project._id.toString(),
      repository: `${owner}/${repo}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid GitHub payload', issues: error.flatten() }, { status: 400 })
    }

    console.error('Error processing GitHub webhook:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
