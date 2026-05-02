import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import GitHubRepository from '@/models/GitHubRepository'
import Project from '@/models/Project'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized()
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid repository id' }, { status: 400 })
    }

    await connectToDatabase()

    const repository = await GitHubRepository.findById(id).lean()
    if (!repository) {
      return Response.json({ error: 'Repository not found' }, { status: 404 })
    }

    const project = await Project.findOne({
      _id: repository.projectId,
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean()

    if (!project) {
      return unauthorized()
    }

    await GitHubRepository.findByIdAndDelete(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting GitHub repo:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
