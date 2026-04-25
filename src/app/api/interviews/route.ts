import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateInterviewQuestions } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

type InterviewRecord = {
  id: string
  topic: string
  type: string
  created_at: string
  questions?: unknown[]
  responses?: unknown[]
  feedback?: { overallScore?: number; strengths?: string[] }[] | { overallScore?: number; strengths?: string[] } | null
  scores?: { overallScore?: number } | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function getFeedbackOverallScore(
  feedback: InterviewRecord['feedback']
) {
  if (Array.isArray(feedback)) {
    return feedback[feedback.length - 1]?.overallScore ?? 0
  }

  return feedback?.overallScore ?? 0
}

function buildStats(interviews: InterviewRecord[]) {
  const completed = interviews.length
  const practiceTimeMinutes = interviews.reduce((total, interview) => {
    const responses = Array.isArray(interview.responses) ? interview.responses : []
    return total + responses.length * 8
  }, 0)

  const scoredInterviews = interviews.filter((interview) => {
    const score = interview.scores?.overallScore ?? getFeedbackOverallScore(interview.feedback)
    return typeof score === 'number'
  })

  const averageScore =
    scoredInterviews.length > 0
      ? Math.round(
          scoredInterviews.reduce((total, interview) => {
            const score = interview.scores?.overallScore ?? getFeedbackOverallScore(interview.feedback)
            return total + score
          }, 0) / scoredInterviews.length
        )
      : 0

  return {
    completed,
    averageScore,
    practiceTimeMinutes,
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const interviews = ((data ?? []) as InterviewRecord[]).map((interview) => ({
      ...interview,
      questionCount: Array.isArray(interview.questions) ? interview.questions.length : 0,
      answerCount: Array.isArray(interview.responses) ? interview.responses.length : 0,
      overallScore:
        interview.scores?.overallScore ??
        getFeedbackOverallScore(interview.feedback) ??
        0,
      latestFeedback: Array.isArray(interview.feedback)
        ? interview.feedback[interview.feedback.length - 1] ?? null
        : interview.feedback ?? null,
    }))

    return NextResponse.json({
      interviews,
      stats: buildStats(interviews),
    })
  } catch (error: unknown) {
    console.error('Interview fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      topic = 'Technical Interview',
      interviewType = 'TECHNICAL',
      role = 'Software Engineer',
      questionCount = 5,
    } = body ?? {}

    const questions = await generateInterviewQuestions(topic, interviewType, role, questionCount)

    const basePayload = {
      user_id: session.user.id,
      type: interviewType,
      topic,
      questions,
      responses: [],
      feedback: [],
      scores: {},
    }

    let createResult = await supabaseAdmin
      .from('mock_interviews')
      .insert({
        ...basePayload,
        status: 'IN_PROGRESS',
      })
      .select()
      .single()

    if (createResult.error) {
      const message = createResult.error.message.toLowerCase()
      const statusLikelyMismatch =
        message.includes('status') ||
        message.includes('constraint') ||
        message.includes('enum')

      if (statusLikelyMismatch) {
        createResult = await supabaseAdmin
          .from('mock_interviews')
          .insert({
            ...basePayload,
            status: 'ACTIVE',
          })
          .select()
          .single()
      }

      if (createResult.error && statusLikelyMismatch) {
        createResult = await supabaseAdmin
          .from('mock_interviews')
          .insert(basePayload)
          .select()
          .single()
      }
    }

    const { data, error } = createResult

    if (error) {
      throw error
    }

    return NextResponse.json({
      interview: data,
      currentQuestion: questions[0] ?? null,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
    })
  } catch (error: unknown) {
    console.error('Interview creation error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to start interview' },
      { status: 500 }
    )
  }
}
