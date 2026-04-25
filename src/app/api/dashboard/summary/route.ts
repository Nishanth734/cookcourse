import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type JsonRecord = Record<string, number>

type ProfileRecord = {
  total_study_hours?: number
  consistency_streak?: number
  weak_topics?: string[]
  readiness_scores?: JsonRecord | null
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

    const userId = session.user.id

    const [
      profileResult,
      roadmapsResult,
      quizAttemptsResult,
      codingSubmissionsResult,
      interviewsResult,
      userProjectsResult,
      plannerResult,
    ] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('roadmaps').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
      supabaseAdmin.from('quiz_attempts').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(10),
      supabaseAdmin.from('coding_submissions').select('*').eq('user_id', userId).order('submitted_at', { ascending: false }).limit(20),
      supabaseAdmin.from('mock_interviews').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('user_projects').select('*').eq('user_id', userId),
      supabaseAdmin.from('daily_planner').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(1),
    ])

    const profile = profileResult.data as ProfileRecord | null
    const latestRoadmap = roadmapsResult.data?.[0] ?? null
    const quizAttempts = quizAttemptsResult.data ?? []
    const codingSubmissions = codingSubmissionsResult.data ?? []
    const interviews = interviewsResult.data ?? []
    const userProjects = userProjectsResult.data ?? []
    const latestPlan = plannerResult.data?.[0] ?? null

    const interviewScores = interviews
      .map((interview) => interview.scores?.overallScore)
      .filter((score) => typeof score === 'number')

    const acceptedSubmissions = codingSubmissions.filter((submission) => submission.status === 'ACCEPTED')
    const completedProjects = userProjects.filter((project) => project.status === 'COMPLETED')
    const readinessScores = (profile?.readiness_scores as JsonRecord | null) ?? {
      jobReadiness: latestRoadmap ? 68 : 20,
      interviewReadiness: interviewScores.length > 0 ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length) : 35,
      codingReadiness: codingSubmissions.length > 0 ? Math.round((acceptedSubmissions.length / codingSubmissions.length) * 100) : 30,
      placementReadiness: completedProjects.length > 0 || interviewScores.length > 0 ? 55 : 20,
    }

    const stats = {
      totalStudyHours: Number(profile?.total_study_hours ?? 0),
      resourcesCompleted: 0,
      quizzesAttempted: quizAttempts.length,
      problemsSolved: acceptedSubmissions.length,
      projectsCompleted: completedProjects.length,
      interviewsCompleted: interviews.filter((interview) => interview.status === 'COMPLETED').length,
      consistencyStreak: profile?.consistency_streak ?? 0,
    }

    const todayTasks = Array.isArray(latestPlan?.tasks) ? latestPlan.tasks : []
    const weakAreas = Array.isArray(profile?.weak_topics) ? profile.weak_topics : []

    const recentActivity = [
      ...quizAttempts.slice(0, 3).map((attempt) => ({
        id: `quiz-${attempt.id}`,
        action: 'Completed a quiz attempt',
        status: `${Math.round(Number(attempt.score ?? 0))}%`,
        time: attempt.completed_at,
      })),
      ...codingSubmissions.slice(0, 3).map((submission) => ({
        id: `code-${submission.id}`,
        action: 'Submitted a coding problem',
        status: submission.status,
        time: submission.submitted_at,
      })),
      ...interviews.slice(0, 2).map((interview) => ({
        id: `interview-${interview.id}`,
        action: `${interview.type} interview on ${interview.topic}`,
        status: `${interview.scores?.overallScore ?? 0}%`,
        time: interview.created_at,
      })),
    ]
      .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
      .slice(0, 6)

    return NextResponse.json({
      readinessScores,
      stats,
      todayTasks,
      weakAreas,
      recentActivity,
      latestRoadmap,
    })
  } catch (error: unknown) {
    console.error('Dashboard summary error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
