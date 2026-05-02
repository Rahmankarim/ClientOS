import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.id) {
      return unauthorized();
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid proposal id' }, { status: 400 });
    }

    await connectToDatabase();

    const proposal = await Proposal.findById(id).lean();
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const isAgencyOwner =
      session.user.role === 'agency' &&
      Boolean(session.user.workspaceId) &&
      proposal.workspaceId.toString() === session.user.workspaceId;

    const isClientViewer =
      session.user.role === 'client' &&
      proposal.clientEmail.toLowerCase() === session.user.email.toLowerCase();

    if (!isAgencyOwner && !isClientViewer) {
      return unauthorized();
    }

    return Response.json(proposal);
  } catch (error) {
    console.error('Proposal GET by id error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}