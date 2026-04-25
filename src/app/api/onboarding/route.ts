import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
    const { goal, topics, skillLevel, targetCompanies, studyHours, timeline } = body

    // Update user profile with onboarding data
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: session.user.id,
        current_topic: topics[0] || null,
        progress: { goal, topics, timeline },
        weak_topics: [],
        strong_topics: [],
        readiness_scores: {
          jobReadiness: 0,
          interviewReadiness: 0,
          codingReadiness: 0,
          placementReadiness: 0
        },
        total_study_hours: 0,
        consistency_streak: 0,
        badges: []
      })

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // Update user with skill level and target companies
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        skill_level: skillLevel,
        target_companies: targetCompanies,
        daily_study_hours: studyHours,
        target_role: goal
      })
      .eq('id', session.user.id)

    if (userError) {
      console.error('User update error:', userError)
    }

    return NextResponse.json({
      message: 'Onboarding completed successfully',
      success: true
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
