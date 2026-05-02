import { authOptions } from '@/lib/auth'
import { scopeCheck } from '@/lib/ai'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

const payloadSchema = z.object({
  originalBrief: z.string().min(10),
  newRequest: z.string().min(3),
})

const responseSchema = z.object({
  isInScope: z.boolean(),
  reason: z.string(),
  suggestedResponse: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'agency') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = payloadSchema.parse(await request.json())
    const result = await scopeCheck(payload)
    const validated = responseSchema.parse(result)

    return Response.json(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid payload', issues: error.flatten() }, { status: 400 })
    }

    console.error('Scope check error:', error)
    return Response.json({ error: 'Failed to run scope check' }, { status: 500 })
  }
}