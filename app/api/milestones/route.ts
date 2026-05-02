import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const milestoneCreateSchema = z.object({
  projectId: z.string(),
  title: z.string().min(2),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'in progress', 'completed']).optional(),
  order: z.number().int().min(0).optional(),
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

    const milestones = await Milestone.find({ projectId: new mongoose.Types.ObjectId(projectId) }).sort({ order: 1, createdAt: 1 }).lean();
    return Response.json(milestones);
  } catch (error) {
    console.error('Milestones GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const body = milestoneCreateSchema.parse(await request.json());
    if (!mongoose.Types.ObjectId.isValid(body.projectId)) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    await connectToDatabase();

    const projectObjectId = new mongoose.Types.ObjectId(body.projectId);
    const project = await Project.findOne({
      _id: projectObjectId,
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    let order = body.order;
    if (order === undefined) {
      const lastMilestone = await Milestone.findOne({ projectId: projectObjectId }).sort({ order: -1 }).lean();
      order = lastMilestone ? lastMilestone.order + 1 : 0;
    }

    const milestone = await Milestone.create({
      projectId: projectObjectId,
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status || 'pending',
      order,
    });

    return Response.json(milestone, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid milestone payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Milestones POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}