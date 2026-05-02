import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTaskBreakdown } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scopeItem } = await request.json()

    if (!scopeItem) {
      return NextResponse.json({ error: 'Scope item required' }, { status: 400 })
    }

    const breakdown = await generateTaskBreakdown(scopeItem)

    return NextResponse.json({ breakdown })
  } catch (error) {
    console.error('Error generating task breakdown:', error)
    return NextResponse.json({ error: 'Failed to generate breakdown' }, { status: 500 })
  }
}
