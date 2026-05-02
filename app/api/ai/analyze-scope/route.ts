import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateScopeAnalysis } from '@/lib/ai'

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

    const analysis = await generateScopeAnalysis(projectDescription)

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error generating scope analysis:', error)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
