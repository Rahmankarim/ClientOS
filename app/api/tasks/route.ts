import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const taskCreateSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string(),
  title: z.string().min(2),
  assignee: z.string().optional(),
  status: z.enum(['pending', 'in progress', 'completed']).optional(),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const milestoneId = searchParams.get('milestoneId');

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return Response.json({ error: 'Valid projectId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(projectId),
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const filter: Record<string, unknown> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (milestoneId) {
      if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
        return Response.json({ error: 'Invalid milestoneId' }, { status: 400 });
      }
      filter.milestoneId = new mongoose.Types.ObjectId(milestoneId);
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
    return Response.json(tasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const body = taskCreateSchema.parse(await request.json());

    if (!mongoose.Types.ObjectId.isValid(body.projectId) || !mongoose.Types.ObjectId.isValid(body.milestoneId)) {
      return Response.json({ error: 'Invalid project or milestone id' }, { status: 400 });
    }

    await connectToDatabase();

    const projectObjectId = new mongoose.Types.ObjectId(body.projectId);
    const milestoneObjectId = new mongoose.Types.ObjectId(body.milestoneId);

    const project = await Project.findOne({
      _id: projectObjectId,
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const milestone = await Milestone.findOne({
      _id: milestoneObjectId,
      projectId: projectObjectId,
    }).lean();

    if (!milestone) {
      return Response.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const task = await Task.create({
      projectId: projectObjectId,
      milestoneId: milestoneObjectId,
      title: body.title,
      assignee: body.assignee || '',
      status: body.status || 'pending',
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid task payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Tasks POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
