import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const taskUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  assignee: z.string().optional(),
  status: z.enum(['pending', 'in progress', 'completed']).optional(),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid task id' }, { status: 400 });
    }

    const payload = taskUpdateSchema.parse(await request.json());

    await connectToDatabase();

    const existingTask = await Task.findById(id).lean();
    if (!existingTask) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const project = await Project.findOne({
      _id: existingTask.projectId,
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return unauthorized();
    }

    const updatedTask = await Task.findByIdAndUpdate(id, payload, { new: true }).lean();
    return Response.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid task payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Task PUT error:', error);
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid task id' }, { status: 400 });
    }

    await connectToDatabase();

    const existingTask = await Task.findById(id).lean();
    if (!existingTask) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const project = await Project.findOne({
      _id: existingTask.projectId,
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return unauthorized();
    }

    await Task.findByIdAndDelete(id);
    return Response.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Task DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
