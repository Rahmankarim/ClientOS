import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = (await connectToDatabase()).connection.db
    const scopeId = new ObjectId(params.id)

    const result = await db.collection('scopeItems').updateOne(
      { _id: scopeId },
      { $set: { ...body } }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Scope item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating scope item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = (await connectToDatabase()).connection.db
    const scopeId = new ObjectId(params.id)

    const result = await db.collection('scopeItems').deleteOne({ _id: scopeId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Scope item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scope item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
