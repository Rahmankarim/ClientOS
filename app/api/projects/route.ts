import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';

const projectCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  status: z.enum(['planning', 'active', 'review', 'completed']).optional(),
  githubRepo: z.string().optional().default(''),
  startDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    await connectToDatabase();

    const projects = await Project.find({ workspaceId: session.user.workspaceId }).sort({ createdAt: -1 }).lean();
    return Response.json(projects);
  } catch (error) {
    console.error('Projects GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    const body = projectCreateSchema.parse(await request.json());

    await connectToDatabase();

    const project = await Project.create({
      workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
      name: body.name,
      description: body.description,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      status: body.status || 'planning',
      githubRepo: body.githubRepo,
      startDate: body.startDate ? new Date(body.startDate) : null,
      deadline: body.deadline ? new Date(body.deadline) : null,
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid project payload', issues: error.flatten() }, { status: 400 });
    }

    console.error('Projects POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
