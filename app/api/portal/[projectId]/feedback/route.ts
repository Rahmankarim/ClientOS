import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import ActivityFeed from '@/models/ActivityFeed';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const feedbackSchema = z.object({
  milestoneId: z.string(),
  message: z.string().min(3),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return unauthorized();
    }

    const { projectId } = await params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const payload = feedbackSchema.parse(await request.json());
    if (!mongoose.Types.ObjectId.isValid(payload.milestoneId)) {
      return Response.json({ error: 'Invalid milestone id' }, { status: 400 });
    }

    await connectToDatabase();

    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const milestoneObjectId = new mongoose.Types.ObjectId(payload.milestoneId);

    const project = await Project.findById(projectObjectId).lean();
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const canComment =
      session.user.role === 'agency'
        ? session.user.workspaceId === project.workspaceId.toString()
        : session.user.id === (project.clientUserId ? project.clientUserId.toString() : null) ||
          session.user.email.toLowerCase() === project.clientEmail.toLowerCase();

    if (!canComment) {
      return unauthorized();
    }

    const milestone = await Milestone.findOne({ _id: milestoneObjectId, projectId: projectObjectId }).lean();
    if (!milestone) {
      return Response.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const feedback = await ActivityFeed.create({
      projectId: projectObjectId,
      type: 'client_feedback',
      content: `[milestone:${milestoneObjectId.toString()}] ${payload.message.trim()}`,
      isVisibleToClient: true,
    });

    return Response.json(
      {
        id: feedback._id.toString(),
        milestoneId: milestoneObjectId.toString(),
        message: payload.message.trim(),
        createdAt: feedback.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid feedback payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Portal feedback POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}