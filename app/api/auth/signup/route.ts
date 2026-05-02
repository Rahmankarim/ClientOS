import { connectToDatabase } from '@/lib/mongodb';
import { hashPassword } from '@/lib/password';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());

    await connectToDatabase();

    const existingUser = await User.findOne({ email: body.email.toLowerCase() });
    if (existingUser) {
      return Response.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
      role: 'agency',
    });

    const workspace = await Workspace.create({
      name: body.workspaceName,
      ownerId: user._id,
      plan: 'free',
    });

    user.workspaceId = workspace._id;
    await user.save();

    return Response.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: workspace._id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid signup data.', issues: error.flatten() }, { status: 400 });
    }

    console.error('Signup error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}