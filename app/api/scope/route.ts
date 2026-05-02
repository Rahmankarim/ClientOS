import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import type { Collection, ObjectId } from 'mongodb'

interface ScopeItem {
  _id?: ObjectId
  projectId: string
  title: string
  description: string
  estimatedHours: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const db = (await connectToDatabase()).connection.db
    const scopeItems = await (db.collection('scopeItems') as Collection<ScopeItem>)
      .find({ projectId })
      .toArray()

    return NextResponse.json(scopeItems)
  } catch (error) {
    console.error('Error fetching scope items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, title, description, estimatedHours } = body

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = (await connectToDatabase()).connection.db
    const result = await (db.collection('scopeItems') as Collection<ScopeItem>).insertOne({
      projectId,
      title,
      description: description || '',
      estimatedHours: estimatedHours || 0,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({ 
      _id: result.insertedId, 
      projectId,
      title,
      description,
      estimatedHours,
      status: 'pending',
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error creating scope item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
