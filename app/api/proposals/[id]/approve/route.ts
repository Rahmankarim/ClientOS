import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import Proposal from '@/models/Proposal';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return unauthorized();
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid proposal id' }, { status: 400 });
    }

    await connectToDatabase();

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const canApproveAsAgency =
      session.user.role === 'agency' &&
      Boolean(session.user.workspaceId) &&
      proposal.workspaceId.toString() === session.user.workspaceId;

    const canApproveAsClient =
      session.user.role === 'client' &&
      proposal.clientEmail.toLowerCase() === session.user.email.toLowerCase();

    if (!canApproveAsAgency && !canApproveAsClient) {
      return unauthorized();
    }

    if (proposal.status === 'approved') {
      const existingProject = await Project.findOne({
        workspaceId: proposal.workspaceId,
        name: proposal.title,
        clientEmail: proposal.clientEmail,
      }).lean();

      return Response.json({
        message: 'Proposal already approved',
        projectId: existingProject?._id?.toString() || null,
      });
    }

    const clientUser = await User.findOne({ email: proposal.clientEmail.toLowerCase() });

    const project = await Project.create({
      workspaceId: proposal.workspaceId,
      name: proposal.title,
      description: proposal.deliverables.join('\n'),
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      clientUserId: clientUser?._id || null,
      status: 'planning',
      githubRepo: '',
      startDate: new Date(),
      deadline: null,
    });

    if (proposal.milestones.length > 0) {
      await Milestone.insertMany(
        proposal.milestones.map((milestone, index) => ({
          projectId: project._id,
          title: milestone.title,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
          status: 'pending',
          order: index,
        }))
      );
    }

    proposal.status = 'approved';
    await proposal.save();

    return Response.json({
      message: 'Proposal approved and converted to project',
      projectId: project._id.toString(),
    });
  } catch (error) {
    console.error('Approve proposal error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}