import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type NoteRecord = {
  id: string
  user_id: string
  topic: string
  title: string
  content: string
  type: string
  is_important: boolean
  revision_count: number
  last_revised: string | null
  created_at: string
  updated_at: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const topic = searchParams.get('topic')?.trim()
    const importantOnly = searchParams.get('important') === 'true'

    let query = supabaseAdmin
      .from('user_notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,topic.ilike.%${search}%`)
    }

    if (topic) {
      query = query.ilike('topic', `%${topic}%`)
    }

    if (importantOnly) {
      query = query.eq('is_important', true)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const notes = ((data ?? []) as NoteRecord[]).map((note) => ({
      ...note,
      isImportant: note.is_important,
      revisionCount: note.revision_count,
      lastRevised: note.last_revised,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }))

    return NextResponse.json({ notes })
  } catch (error: unknown) {
    console.error('Notes fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch notes' },
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

    const body = await request.json()
    const { title, topic, content, type = 'CUSTOM', isImportant = false } = body ?? {}

    if (!title?.trim() || !topic?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title, topic, and content are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('user_notes')
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        topic: topic.trim(),
        content: content.trim(),
        type,
        is_important: Boolean(isImportant),
        revision_count: 0,
        last_revised: null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ note: data }, { status: 201 })
  } catch (error: unknown) {
    console.error('Note creation error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to create note' },
      { status: 500 }
    )
  }
}
