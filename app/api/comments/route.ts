import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import type { Collection } from 'mongodb'

interface Comment {
  _id?: string
  projectId: string
  userId: string
  userName: string
  userImage?: string
  content: string
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
    const comments = await (db.collection('comments') as Collection<Comment>)
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json(comments.reverse())
  } catch (error) {
    console.error('Error fetching comments:', error)
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
    const { projectId, content } = body

    if (!projectId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = (await connectToDatabase()).connection.db
    const comment: Comment = {
      projectId,
      userId: session.user.email,
      userName: session.user.name || 'Unknown',
      userImage: session.user.image,
      content,
      createdAt: new Date(),
    }

    const result = await (db.collection('comments') as Collection<Comment>).insertOne(comment)

    return NextResponse.json({ _id: result.insertedId, ...comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
