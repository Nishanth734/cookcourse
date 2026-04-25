import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await params

    const { data: existingNote, error: fetchError } = await supabaseAdmin
      .from('user_notes')
      .select('revision_count')
      .eq('id', noteId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_notes')
      .update({
        revision_count: Number(existingNote.revision_count ?? 0) + 1,
        last_revised: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ note: data })
  } catch (error: unknown) {
    console.error('Note revise error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to revise note' },
      { status: 500 }
    )
  }
}
