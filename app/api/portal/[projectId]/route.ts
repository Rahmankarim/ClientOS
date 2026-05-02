import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import ActivityFeed from '@/models/ActivityFeed';
import Deliverable from '@/models/Deliverable';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

function parseMilestoneFeedback(content: string) {
  const match = content.match(/^\[milestone:([a-fA-F0-9]{24})\]\s*(.+)$/s);
  if (!match) {
    return null;
  }

  return {
    milestoneId: match[1],
    message: match[2].trim(),
  };
}

function userCanAccessProject(params: {
  sessionRole: string;
  sessionWorkspaceId: string | null;
  sessionUserId: string;
  sessionEmail: string;
  projectWorkspaceId: string;
  projectClientUserId: string | null;
  projectClientEmail: string;
}) {
  if (params.sessionRole === 'agency') {
    return params.sessionWorkspaceId === params.projectWorkspaceId;
  }

  return (
    params.sessionUserId === params.projectClientUserId ||
    params.sessionEmail.toLowerCase() === params.projectClientEmail.toLowerCase()
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return unauthorized();
    }

    const { projectId } = await params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    await connectToDatabase();

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const allowed = userCanAccessProject({
      sessionRole: session.user.role,
      sessionWorkspaceId: session.user.workspaceId,
      sessionUserId: session.user.id,
      sessionEmail: session.user.email,
      projectWorkspaceId: project.workspaceId.toString(),
      projectClientUserId: project.clientUserId ? project.clientUserId.toString() : null,
      projectClientEmail: project.clientEmail,
    });

    if (!allowed) {
      return unauthorized();
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const [milestones, activityFeed, deliverables] = await Promise.all([
      Milestone.find({ projectId: projectObjectId }).sort({ order: 1, createdAt: 1 }).lean(),
      ActivityFeed.find({ projectId: projectObjectId, isVisibleToClient: true }).sort({ createdAt: -1 }).limit(100).lean(),
      Deliverable.find({ projectId: projectObjectId }).sort({ uploadedAt: -1 }).lean(),
    ]);

    const completedMilestones = milestones.filter((milestone) => milestone.status === 'completed').length;
    const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

    const feedbackByMilestone = Object.fromEntries(milestones.map((milestone) => [milestone._id.toString(), [] as Array<{ id: string; message: string; createdAt: string }>]));

    for (const item of activityFeed) {
      if (item.type !== 'client_feedback') {
        continue;
      }

      const parsedFeedback = parseMilestoneFeedback(item.content);
      if (!parsedFeedback) {
        continue;
      }

      if (!feedbackByMilestone[parsedFeedback.milestoneId]) {
        feedbackByMilestone[parsedFeedback.milestoneId] = [];
      }

      feedbackByMilestone[parsedFeedback.milestoneId].push({
        id: item._id.toString(),
        message: parsedFeedback.message,
        createdAt: item.createdAt.toISOString(),
      });
    }

    const safeActivity = activityFeed
      .filter((item) => item.type !== 'client_feedback')
      .map((item) => ({
        id: item._id.toString(),
        type: item.type,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
      }));

    const safeMilestones = milestones.map((milestone) => ({
      id: milestone._id.toString(),
      title: milestone.title,
      dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null,
      status: milestone.status,
      order: milestone.order,
      feedback: feedbackByMilestone[milestone._id.toString()] || [],
    }));

    const safeDeliverables = deliverables.map((deliverable) => ({
      id: deliverable._id.toString(),
      title: deliverable.title,
      url: deliverable.url,
      uploadedAt: deliverable.uploadedAt.toISOString(),
    }));

    return Response.json({
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        status: project.status,
        deadline: project.deadline ? project.deadline.toISOString() : null,
        clientName: project.clientName,
        progressPercent,
      },
      milestones: safeMilestones,
      activityFeed: safeActivity,
      deliverables: safeDeliverables,
    });
  } catch (error) {
    console.error('Portal data GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}