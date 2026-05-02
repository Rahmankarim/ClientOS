import { authOptions } from '@/lib/auth'
import { generateMilestonesPlan } from '@/lib/ai'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

const payloadSchema = z.object({
  projectBrief: z.string().min(10),
})

const milestoneSchema = z.object({
  title: z.string(),
  dueDate: z.string(),
  deliverables: z.array(z.string()),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'agency') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = payloadSchema.parse(await request.json())
    const milestones = await generateMilestonesPlan(payload.projectBrief)
    const validatedMilestones = z.array(milestoneSchema).parse(milestones)

    return Response.json({ milestones: validatedMilestones })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid payload', issues: error.flatten() }, { status: 400 })
    }

    console.error('Generate milestones error:', error)
    return Response.json({ error: 'Failed to generate milestones' }, { status: 500 })
  }
}