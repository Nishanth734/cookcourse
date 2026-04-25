import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type CommunityPost = {
  id: string
  user_id: string
  topic: string
  title: string
  content: string
  type: string
  upvotes: number
  comments: unknown[] | null
  created_at: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: posts, error: postsError }, { data: users, error: usersError }] = await Promise.all([
      supabaseAdmin.from('community_posts').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('users').select('id, name, avatar'),
    ])

    if (postsError) throw postsError
    if (usersError) throw usersError

    const userMap = new Map((users ?? []).map((user) => [user.id, user]))

    const items = ((posts ?? []) as CommunityPost[]).map((post) => {
      const author = userMap.get(post.user_id)
      return {
        ...post,
        authorName: author?.name || 'Community Member',
        avatar: (author?.name || 'C').charAt(0).toUpperCase(),
        likes: post.upvotes ?? 0,
        commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
        time: post.created_at,
      }
    })

    return NextResponse.json({ posts: items })
  } catch (error: unknown) {
    console.error('Community fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch community posts' },
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
    const { title, content, topic = 'General', type = 'DISCUSSION' } = body ?? {}

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        user_id: session.user.id,
        topic,
        title,
        content,
        type,
        upvotes: 0,
        comments: [],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post: data })
  } catch (error: unknown) {
    console.error('Community create error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to create post' },
      { status: 500 }
    )
  }
}
