import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('placement_stories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ stories: data ?? [] })
  } catch (error: unknown) {
    console.error('Placement stories fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch placement stories' },
      { status: 500 }
    )
  }
}
