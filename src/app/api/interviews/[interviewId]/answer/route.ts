import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  evaluateInterviewResponse,
  evaluateInterviewResponseFallback,
} from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

type FeedbackItem = {
  technicalScore?: number
  communicationScore?: number
  confidenceScore?: number
  clarityScore?: number
  overallScore?: number
}

type InterviewRecord = {
  id: string
  topic: string
  questions?: Array<{ question: string }>
  responses?: unknown[]
  feedback?: FeedbackItem[]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function computeOverallScores(feedbackItems: FeedbackItem[]) {
  if (feedbackItems.length === 0) {
    return {
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      clarityScore: 0,
      overallScore: 0,
    }
  }

  const totals = feedbackItems.reduce<Required<FeedbackItem>>(
    (accumulator, item) => ({
      technicalScore: accumulator.technicalScore + (item.technicalScore ?? 0),
      communicationScore: accumulator.communicationScore + (item.communicationScore ?? 0),
      confidenceScore: accumulator.confidenceScore + (item.confidenceScore ?? 0),
      clarityScore: accumulator.clarityScore + (item.clarityScore ?? 0),
      overallScore: accumulator.overallScore + (item.overallScore ?? 0),
    }),
    {
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      clarityScore: 0,
      overallScore: 0,
    }
  )

  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, Math.round(value / feedbackItems.length)])
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { interviewId } = await params
    const body = await request.json()
    const { answer, questionIndex } = body ?? {}

    if (!answer || typeof questionIndex !== 'number') {
      return NextResponse.json(
        { error: 'Answer and question index are required' },
        { status: 400 }
      )
    }

    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('id', interviewId)
      .eq('user_id', session.user.id)
      .single()

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const typedInterview = interview as InterviewRecord
    const questions = Array.isArray(typedInterview.questions) ? typedInterview.questions : []
    const responses = Array.isArray(interview.responses) ? interview.responses : []
    const feedback = Array.isArray(typedInterview.feedback) ? typedInterview.feedback : []
    const currentQuestion = questions[questionIndex]

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Invalid question index' }, { status: 400 })
    }

    let evaluation
    try {
      evaluation = await evaluateInterviewResponse(currentQuestion.question, answer, interview.topic)
    } catch (error) {
      console.error('AI interview evaluation failed, using fallback:', error)
      evaluation = evaluateInterviewResponseFallback(currentQuestion.question, answer, interview.topic)
    }

    const nextResponses = [
      ...responses,
      {
        questionIndex,
        question: currentQuestion.question,
        answer,
        answeredAt: new Date().toISOString(),
      },
    ]

    const nextFeedback = [
      ...feedback,
      {
        questionIndex,
        question: currentQuestion.question,
        ...evaluation,
      },
    ]

    const completed = questionIndex >= questions.length - 1
    const aggregatedScores = computeOverallScores(nextFeedback)

    const updatePayloadBase = {
      responses: nextResponses,
      feedback: nextFeedback,
      scores: aggregatedScores,
    }

    const targetStatus = completed ? 'COMPLETED' : 'IN_PROGRESS'

    let updateResult = await supabaseAdmin
      .from('mock_interviews')
      .update({
        ...updatePayloadBase,
        status: targetStatus,
      })
      .eq('id', interviewId)

    if (updateResult.error) {
      const message = updateResult.error.message.toLowerCase()
      const statusLikelyMismatch =
        message.includes('status') ||
        message.includes('constraint') ||
        message.includes('enum')

      if (statusLikelyMismatch) {
        updateResult = await supabaseAdmin
          .from('mock_interviews')
          .update({
            ...updatePayloadBase,
            status: completed ? 'COMPLETED' : 'ACTIVE',
          })
          .eq('id', interviewId)
      }

      if (updateResult.error && statusLikelyMismatch) {
        updateResult = await supabaseAdmin
          .from('mock_interviews')
          .update(updatePayloadBase)
          .eq('id', interviewId)
      }
    }

    if (updateResult.error) {
      throw updateResult.error
    }

    if (completed) {
      const topic = typedInterview.topic || 'Interview'
      const inferredMinutes = Math.max(12, nextResponses.length * 8)

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('weak_topics, strong_topics, total_study_hours')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const existingWeak = Array.isArray(profile?.weak_topics) ? profile!.weak_topics : []
      const existingStrong = Array.isArray(profile?.strong_topics) ? profile!.strong_topics : []
      const nextWeak =
        aggregatedScores.overallScore < 70
          ? Array.from(new Set([...existingWeak, topic]))
          : existingWeak.filter((item) => item !== topic)
      const nextStrong =
        aggregatedScores.overallScore >= 85
          ? Array.from(new Set([...existingStrong, topic]))
          : existingStrong

      const nextHours = Number(profile?.total_study_hours ?? 0) + inferredMinutes / 60

      await Promise.allSettled([
        supabaseAdmin
          .from('user_profiles')
          .upsert(
            {
              user_id: session.user.id,
              weak_topics: nextWeak.slice(0, 12),
              strong_topics: nextStrong.slice(0, 12),
              total_study_hours: Number(nextHours.toFixed(2)),
            },
            { onConflict: 'user_id' }
          ),
        supabaseAdmin.from('streaks').insert({
          user_id: session.user.id,
          date: new Date().toISOString().slice(0, 10),
          activity_type: 'interview',
          count: 1,
        }),
      ])
    }

    return NextResponse.json({
      feedback: evaluation,
      completed,
      overallScores: aggregatedScores,
      nextQuestionIndex: completed ? null : questionIndex + 1,
      nextQuestion: completed ? null : questions[questionIndex + 1],
    })
  } catch (error: unknown) {
    console.error('Interview answer error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
