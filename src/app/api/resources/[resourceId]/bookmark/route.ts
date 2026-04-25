import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resourceId } = await params
    const body = await request.json()
    const bookmarked = Boolean(body?.bookmarked)

    if (bookmarked) {
      const { error } = await supabaseAdmin.from('bookmarks').upsert(
        {
          user_id: session.user.id,
          resource_id: resourceId,
        },
        {
          onConflict: 'user_id,resource_id',
        }
      )

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabaseAdmin
        .from('bookmarks')
        .delete()
        .eq('user_id', session.user.id)
        .eq('resource_id', resourceId)

      if (error) {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      bookmarked,
    })
  } catch (error: unknown) {
    console.error('Bookmark update error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}
