import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function formatDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date()
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - idx))
      return d
    })

    const since = new Date(today)
    since.setDate(today.getDate() - 10)

    const [profileResult, quizAttemptsResult, codingResult, interviewsResult, streaksResult] =
      await Promise.all([
        supabaseAdmin
          .from('user_profiles')
          .select('total_study_hours, weak_topics, strong_topics')
          .eq('user_id', userId)
          .maybeSingle(),
        supabaseAdmin
          .from('quiz_attempts')
          .select('id, score, completed_at, time_taken')
          .eq('user_id', userId)
          .gte('completed_at', since.toISOString())
          .order('completed_at', { ascending: false }),
        supabaseAdmin
          .from('coding_submissions')
          .select('id, status, submitted_at')
          .eq('user_id', userId)
          .gte('submitted_at', since.toISOString())
          .order('submitted_at', { ascending: false }),
        supabaseAdmin
          .from('mock_interviews')
          .select('id, scores, created_at, status')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('streaks')
          .select('date, activity_type, count')
          .eq('user_id', userId)
          .gte('date', formatDate(days[0])),
      ])

    const totalStudyHours = Number(profileResult.data?.total_study_hours ?? 0)
    const weakTopics = Array.isArray(profileResult.data?.weak_topics) ? profileResult.data!.weak_topics : []
    const strongTopics = Array.isArray(profileResult.data?.strong_topics) ? profileResult.data!.strong_topics : []

    const quizAttempts = quizAttemptsResult.data ?? []
    const averageQuizScore =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((acc, item) => acc + Number(item.score ?? 0), 0) / quizAttempts.length)
        : 0

    const submissions = codingResult.data ?? []
    const acceptedCount = submissions.filter((item) => item.status === 'ACCEPTED').length
    const acceptanceRate = submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 100) : 0

    const interviews = interviewsResult.data ?? []
    const interviewScores = interviews
      .map((item) => (item as { scores?: { overallScore?: number } | null }).scores?.overallScore)
      .filter((score) => typeof score === 'number') as number[]
    const averageInterviewScore =
      interviewScores.length > 0
        ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
        : 0

    const streakRows = streaksResult.data ?? []
    const streakByDay = streakRows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.date)
      acc[key] = (acc[key] ?? 0) + Number(row.count ?? 0)
      return acc
    }, {})

    const weeklyActivity = days.map((d) => {
      const key = formatDate(d)
      return { day: d.toLocaleDateString('en-IN', { weekday: 'short' }), count: streakByDay[key] ?? 0 }
    })

    return NextResponse.json({
      totals: {
        totalStudyHours,
        weakTopics,
        strongTopics,
        quizAttempts: quizAttempts.length,
        codingSubmissions: submissions.length,
        interviews: interviews.length,
      },
      scores: {
        averageQuizScore,
        codingAcceptanceRate: acceptanceRate,
        averageInterviewScore,
      },
      weeklyActivity,
    })
  } catch (error: unknown) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

