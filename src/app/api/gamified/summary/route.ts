import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type QuestSummary = {
  id: string
  title: string
  progress: number
  total: number
  reward: string
}

type BadgePreview = {
  badge: string
  title: string
  description: string
  earnedAt: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const todayIso = toDateOnly(now)
    const startOfToday = new Date(`${todayIso}T00:00:00.000Z`).toISOString()

    const [
      quizCountResult,
      acceptedCodingCountResult,
      completedProjectsCountResult,
      profileResult,
      achievementsCountResult,
      achievementsPreviewResult,
      interviewsTodayResult,
      quizTodayResult,
      codingAcceptedTodayResult,
      streakRowsResult,
    ] = await Promise.all([
      supabaseAdmin.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin
        .from('coding_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ACCEPTED'),
      supabaseAdmin
        .from('user_projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'COMPLETED'),
      supabaseAdmin
        .from('user_profiles')
        .select('consistency_streak')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin.from('achievements').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin
        .from('achievements')
        .select('badge, title, description, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(4),
      supabaseAdmin
        .from('mock_interviews')
        .select('responses')
        .eq('user_id', userId)
        .gte('created_at', startOfToday),
      supabaseAdmin
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', startOfToday),
      supabaseAdmin
        .from('coding_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ACCEPTED')
        .gte('submitted_at', startOfToday),
      supabaseAdmin
        .from('streaks')
        .select('date, count')
        .eq('user_id', userId)
        .gte('date', toDateOnly(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000))),
    ])

    const quizAttempts = Number(quizCountResult.count ?? 0)
    const acceptedCoding = Number(acceptedCodingCountResult.count ?? 0)
    const completedProjects = Number(completedProjectsCountResult.count ?? 0)
    const badges = Number(achievementsCountResult.count ?? 0)
    const streak = Number(profileResult.data?.consistency_streak ?? 0)

    const interviewAnswersToday = (interviewsTodayResult.data ?? []).reduce((total, interview) => {
      const responses = Array.isArray(interview.responses) ? interview.responses : []
      return total + responses.length
    }, 0)

    const quizAttemptsToday = Number(quizTodayResult.count ?? 0)
    const acceptedCodingToday = Number(codingAcceptedTodayResult.count ?? 0)

    const xp =
      quizAttempts * 30 +
      acceptedCoding * 50 +
      completedProjects * 80 +
      interviewAnswersToday * 40 +
      streak * 10

    const level = Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1)
    const currentLevelFloorXp = Math.pow(level - 1, 2) * 100
    const nextLevelXp = Math.pow(level, 2) * 100
    const xpIntoLevel = Math.max(0, xp - currentLevelFloorXp)
    const xpRange = Math.max(1, nextLevelXp - currentLevelFloorXp)
    const levelProgress = Math.min(100, Math.round((xpIntoLevel / xpRange) * 100))
    const xpToNextLevel = Math.max(0, nextLevelXp - xp)

    const quests: QuestSummary[] = [
      {
        id: 'daily-quiz-3',
        title: 'Solve 3 quiz attempts today',
        progress: Math.min(3, quizAttemptsToday),
        total: 3,
        reward: '+30 XP',
      },
      {
        id: 'daily-interview-1',
        title: 'Submit 1 interview answer today',
        progress: Math.min(1, interviewAnswersToday),
        total: 1,
        reward: '+40 XP',
      },
      {
        id: 'daily-coding-1',
        title: 'Get 1 coding submission accepted today',
        progress: Math.min(1, acceptedCodingToday),
        total: 1,
        reward: '+50 XP',
      },
    ]

    const completionRate =
      quests.length > 0
        ? Math.round(
            (quests.filter((quest) => quest.progress >= quest.total).length / quests.length) * 100
          )
        : 0

    const weeklyActivityDays = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (6 - index))
      return toDateOnly(date)
    })

    const streakMap = (streakRowsResult.data ?? []).reduce<Record<string, number>>((accumulator, row) => {
      const key = String(row.date)
      accumulator[key] = (accumulator[key] ?? 0) + Number(row.count ?? 0)
      return accumulator
    }, {})

    const weeklyActivity = weeklyActivityDays.map((date) => {
      const count = streakMap[date] ?? 0
      const label = new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-IN', {
        weekday: 'short',
      })
      return { date, label, count }
    })

    const badgesPreview: BadgePreview[] = (achievementsPreviewResult.data ?? []).map((badge) => ({
      badge: String(badge.badge ?? 'ACHIEVEMENT'),
      title: String(badge.title ?? 'Achievement unlocked'),
      description: String(badge.description ?? ''),
      earnedAt: String(badge.earned_at ?? now.toISOString()),
    }))

    return NextResponse.json({
      stats: {
        level,
        xp,
        streak,
        badges,
        completionRate,
        levelProgress,
        xpToNextLevel,
        nextLevelXp,
      },
      quests,
      weeklyActivity,
      badgesPreview,
      updatedAt: now.toISOString(),
    })
  } catch (error: unknown) {
    console.error('Gamified summary error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to load gamified summary' },
      { status: 500 }
    )
  }
}
