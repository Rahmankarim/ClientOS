import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const milestoneUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(['pending', 'in progress', 'completed']).optional(),
  order: z.number().int().min(0).optional(),
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
      return Response.json({ error: 'Invalid milestone id' }, { status: 400 });
    }

    const payload = milestoneUpdateSchema.parse(await request.json());
    await connectToDatabase();

    const existingMilestone = await Milestone.findById(id).lean();
    if (!existingMilestone) {
      return Response.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const project = await Project.findOne({
      _id: existingMilestone.projectId,
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    }).lean();

    if (!project) {
      return unauthorized();
    }

    const updatePayload: Record<string, unknown> = { ...payload };
    if (payload.dueDate !== undefined) {
      updatePayload.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    }

    const milestone = await Milestone.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    return Response.json(milestone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid milestone payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Milestone PUT error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}