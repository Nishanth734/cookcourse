import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateRoadmap } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { topic, skillLevel, targetCompany, timeline, dailyHours } = body

    if (!topic || !skillLevel) {
      return NextResponse.json(
        { error: 'Topic and skill level are required' },
        { status: 400 }
      )
    }

    // Generate roadmap using AI
    const roadmapData = await generateRoadmap(
      topic,
      skillLevel,
      targetCompany,
      timeline,
      dailyHours
    )

    // Save roadmap to database
    const { data: roadmap, error: createError } = await supabaseAdmin
      .from('roadmaps')
      .insert({
        user_id: session.user.id,
        topic: roadmapData.topic,
        skill_level: skillLevel,
        target_company: targetCompany || null,
        target_timeline: timeline ? new Date(timeline).toISOString() : null,
        phases: roadmapData.phases,
        status: 'ACTIVE',
      })
      .select()
      .single()

    if (createError) {
      console.error('Roadmap creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to save roadmap' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Roadmap generated successfully',
      roadmap,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate roadmap'
    console.error('Roadmap generation error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: roadmaps, error } = await supabaseAdmin
      .from('roadmaps')
      .select('*, phase_progress(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get roadmaps error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch roadmaps' },
        { status: 500 }
      )
    }

    return NextResponse.json({ roadmaps })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch roadmaps'
    console.error('Get roadmaps error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
