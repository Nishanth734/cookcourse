import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getUserTopicContext, updateUserTopicContext } from '@/lib/topic-context'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getUserTopicContext(session.user.id)
    return NextResponse.json(context)
  } catch (error: unknown) {
    console.error('Topic context fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch topic context' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const topic = typeof body?.topic === 'string' ? body.topic : ''

    if (!topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const context = await updateUserTopicContext(session.user.id, topic)
    return NextResponse.json({
      message: 'Topic updated successfully',
      ...context,
    })
  } catch (error: unknown) {
    console.error('Topic context update error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to update topic context' },
      { status: 500 }
    )
  }
}
