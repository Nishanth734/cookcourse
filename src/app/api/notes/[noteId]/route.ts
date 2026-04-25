import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (typeof body?.title === 'string') {
      updates.title = body.title.trim()
    }
    if (typeof body?.topic === 'string') {
      updates.topic = body.topic.trim()
    }
    if (typeof body?.content === 'string') {
      updates.content = body.content.trim()
    }
    if (typeof body?.type === 'string') {
      updates.type = body.type
    }
    if (typeof body?.isImportant === 'boolean') {
      updates.is_important = body.isImportant
    }

    const { data, error } = await supabaseAdmin
      .from('user_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ note: data })
  } catch (error: unknown) {
    console.error('Note update error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to update note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await params

    const { error } = await supabaseAdmin
      .from('user_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', session.user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Note delete error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to delete note' },
      { status: 500 }
    )
  }
}
