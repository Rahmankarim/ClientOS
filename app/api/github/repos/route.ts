import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import GitHubRepository from '@/models/GitHubRepository'
import Project from '@/models/Project'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { z } from 'zod'

const githubRepoSchema = z.object({
  projectId: z.string(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  url: z.string().url().optional(),
})

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

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

    const repos = await GitHubRepository.find({ projectId: project._id }).sort({ createdAt: -1 }).lean()
    return Response.json(repos)
  } catch (error) {
    console.error('Error fetching GitHub repos:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized()
    }

    const body = githubRepoSchema.parse(await request.json())
    if (!mongoose.Types.ObjectId.isValid(body.projectId)) {
      return Response.json({ error: 'Invalid projectId' }, { status: 400 })
    }

    await connectToDatabase()

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(body.projectId),
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean()

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const repo = await GitHubRepository.findOneAndUpdate(
      {
        projectId: project._id,
        owner: body.owner.trim(),
        repo: body.repo.trim(),
      },
      {
        projectId: project._id,
        owner: body.owner.trim(),
        repo: body.repo.trim(),
        url: body.url || `https://github.com/${body.owner.trim()}/${body.repo.trim()}`,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return Response.json(repo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid payload', issues: error.flatten() }, { status: 400 })
    }

    console.error('Error linking GitHub repo:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
