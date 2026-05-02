import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeProjectRisks } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectDescription } = await request.json()

    if (!projectDescription) {
      return NextResponse.json({ error: 'Project description required' }, { status: 400 })
    }

    const risks = await analyzeProjectRisks(projectDescription)

    return NextResponse.json({ risks })
  } catch (error) {
    console.error('Error analyzing project risks:', error)
    return NextResponse.json({ error: 'Failed to analyze risks' }, { status: 500 })
  }
}
