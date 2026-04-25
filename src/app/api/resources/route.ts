import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type ResourceRecord = {
  id: string
  title: string
  description: string
  type: string
  topic: string
  difficulty: string
  platform: string
  instructor: string | null
  duration: string | null
  rating: number | null
  price: string
  language: string
  url: string
  thumbnail: string | null
  tags: string[]
  created_at: string
}

type BookmarkRecord = {
  resource_id: string | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUUID(session.user.id)) {
      return NextResponse.json(
        { error: 'Invalid session. Please sign in again.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')?.trim()
    const type = searchParams.get('type')?.trim()
    const search = searchParams.get('search')?.trim()
    const bookmarkedOnly = searchParams.get('bookmarked') === 'true'

    let resourcesQuery = supabaseAdmin
      .from('resources')
      .select('*')
      .order('rating', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (topic) {
      resourcesQuery = resourcesQuery.ilike('topic', `%${topic}%`)
    }

    if (type && type !== 'all') {
      resourcesQuery = resourcesQuery.eq('type', type.toUpperCase())
    }

    if (search) {
      resourcesQuery = resourcesQuery.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,topic.ilike.%${search}%,platform.ilike.%${search}%`
      )
    }

    const [{ data: resourcesData, error: resourcesError }, { data: bookmarksData, error: bookmarksError }] =
      await Promise.all([
        resourcesQuery,
        supabaseAdmin
          .from('bookmarks')
          .select('resource_id')
          .eq('user_id', session.user.id)
          .not('resource_id', 'is', null),
      ])

    if (resourcesError) {
      throw resourcesError
    }

    if (bookmarksError) {
      throw bookmarksError
    }

    const bookmarkIds = new Set(
      ((bookmarksData ?? []) as BookmarkRecord[])
        .map((bookmark) => bookmark.resource_id)
        .filter((resourceId): resourceId is string => Boolean(resourceId))
    )

    const resources = ((resourcesData ?? []) as ResourceRecord[])
      .map((resource) => ({
        ...resource,
        bookmarked: bookmarkIds.has(resource.id),
      }))
      .filter((resource) => !bookmarkedOnly || resource.bookmarked)

    return NextResponse.json({
      resources,
      filters: {
        topic: topic ?? '',
        type: type ?? 'all',
        search: search ?? '',
        bookmarked: bookmarkedOnly,
      },
    })
  } catch (error: unknown) {
    console.error('Resources fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}
