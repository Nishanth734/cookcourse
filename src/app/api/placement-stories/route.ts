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

    // Normalize array fields that may be null from CSV imports
    const normalizedStories = (data ?? []).map((story) => ({
      ...story,
      tips: Array.isArray(story.tips) ? story.tips : [],
      resources_used: Array.isArray(story.resources_used) ? story.resources_used : [],
      projects: Array.isArray(story.projects) ? story.projects : [],
      mistakes: Array.isArray(story.mistakes) ? story.mistakes : [],
    }))

    return NextResponse.json({ stories: normalizedStories })
  } catch (error: unknown) {
    console.error('Placement stories fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch placement stories' },
      { status: 500 }
    )
  }
}
