import { authOptions } from '@/lib/auth'
import { generateMilestoneClientUpdate } from '@/lib/ai'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1),
  status: z.string().min(1),
})

const payloadSchema = z.object({
  milestoneTitle: z.string().min(1),
  tasks: z.array(taskSchema).default([]),
  completionPercentage: z.number().min(0).max(100).optional(),
})

function computeCompletionPercentage(tasks: Array<{ status: string }>) {
  if (tasks.length === 0) {
    return 0
  }

  const doneCount = tasks.filter((task) => {
    const status = task.status.toLowerCase().trim()
    return status === 'completed' || status === 'done'
  }).length

  return Math.round((doneCount / tasks.length) * 100)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'agency') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = payloadSchema.parse(await request.json())
    const completionPercentage =
      payload.completionPercentage ?? computeCompletionPercentage(payload.tasks)

    const update = await generateMilestoneClientUpdate({
      milestoneTitle: payload.milestoneTitle,
      completionPercentage,
      tasks: payload.tasks,
    })

    return Response.json({ update, completionPercentage })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid payload', issues: error.flatten() }, { status: 400 })
    }

    console.error('Generate update error:', error)
    return Response.json({ error: 'Failed to generate update' }, { status: 500 })
  }
}