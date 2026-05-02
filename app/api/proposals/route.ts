import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const proposalMilestoneSchema = z.object({
  title: z.string().min(2),
  dueDate: z.string().optional().default(''),
  deliverables: z.array(z.string()).default([]),
});

const proposalCreateSchema = z.object({
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  title: z.string().min(2),
  deliverables: z.array(z.string()).default([]),
  milestones: z.array(proposalMilestoneSchema).default([]),
  status: z.enum(['draft', 'sent']).optional().default('draft'),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    await connectToDatabase();

    const proposals = await Proposal.find({
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(proposals);
  } catch (error) {
    console.error('Proposals GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const payload = proposalCreateSchema.parse(await request.json());
    await connectToDatabase();

    const proposal = await Proposal.create({
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      title: payload.title,
      deliverables: payload.deliverables,
      milestones: payload.milestones,
      status: payload.status,
    });

    return Response.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid proposal payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Proposals POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}