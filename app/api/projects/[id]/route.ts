import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const projectUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  clientName: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  status: z.enum(['planning', 'active', 'review', 'completed']).optional(),
  githubRepo: z.string().optional(),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  clientUserId: z.string().nullable().optional(),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

function validateProjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const { id } = await params;
    if (!validateProjectId(id)) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    await connectToDatabase();

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(id),
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json(project);
  } catch (error) {
    console.error('Project GET by id error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const { id } = await params;
    if (!validateProjectId(id)) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const payload = projectUpdateSchema.parse(await request.json());

    await connectToDatabase();

    const updatePayload: Record<string, unknown> = { ...payload };

    if (payload.startDate !== undefined) {
      updatePayload.startDate = payload.startDate ? new Date(payload.startDate) : null;
    }

    if (payload.deadline !== undefined) {
      updatePayload.deadline = payload.deadline ? new Date(payload.deadline) : null;
    }

    if (payload.clientUserId !== undefined) {
      updatePayload.clientUserId = payload.clientUserId ? new mongoose.Types.ObjectId(payload.clientUserId) : null;
    }

    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
      },
      updatePayload,
      { new: true }
    ).lean();

    if (!updatedProject) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid project payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Project PUT error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const { id } = await params;
    if (!validateProjectId(id)) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    await connectToDatabase();

    const deletedProject = await Project.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!deletedProject) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Project DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
