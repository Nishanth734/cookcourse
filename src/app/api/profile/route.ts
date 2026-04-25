import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: user, error: userError }, { data: profile, error: profileError }] =
      await Promise.all([
        supabaseAdmin
          .from('users')
          .select('id, email, name, avatar, bio, college, graduation_year, target_role, target_companies, skill_level, daily_study_hours, role')
          .eq('id', session.user.id)
          .single(),
        supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ])

    if (userError) throw userError
    if (profileError) throw profileError

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || session.user.name || user.email,
        avatar: user.avatar,
        bio: user.bio,
        college: user.college,
        graduationYear: user.graduation_year,
        targetRole: user.target_role,
        targetCompanies: user.target_companies ?? [],
        skillLevel: user.skill_level,
        dailyStudyHours: user.daily_study_hours,
        role: user.role,
      },
      profile,
    })
  } catch (error: unknown) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
