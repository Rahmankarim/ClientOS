import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import type { Collection } from 'mongodb'

interface Activity {
  _id?: string
  projectId: string
  userId: string
  userName: string
  userImage?: string
  type: 'comment' | 'task_update' | 'scope_change' | 'project_update'
  description: string
  metadata?: Record<string, any>
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
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const db = (await connectToDatabase()).connection.db
    const activities = await (db.collection('activities') as Collection<Activity>)
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
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
    const { projectId, type, description, metadata } = body

    if (!projectId || !type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = (await connectToDatabase()).connection.db
    const activity: Activity = {
      projectId,
      userId: session.user.email,
      userName: session.user.name || 'Unknown',
      userImage: session.user.image,
      type,
      description,
      metadata: metadata || {},
      createdAt: new Date(),
    }

    const result = await (db.collection('activities') as Collection<Activity>).insertOne(activity)

    return NextResponse.json({ _id: result.insertedId, ...activity })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
