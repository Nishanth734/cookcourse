import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params

    const { data: post, error: fetchError } = await supabaseAdmin
      .from('community_posts')
      .select('upvotes')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('community_posts')
      .update({ upvotes: Number(post.upvotes ?? 0) + 1 })
      .eq('id', postId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Community upvote error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to upvote post' },
      { status: 500 }
    )
  }
}
