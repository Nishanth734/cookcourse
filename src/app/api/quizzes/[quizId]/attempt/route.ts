import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { QuizQuestion } from '@/types'

type QuizRecord = {
  id: string
  topic: string
  questions: QuizQuestion[]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quizId } = await params
    const body = await request.json()
    const answers = body?.answers as Record<string, number> | undefined
    const timeTaken = Number(body?.timeTaken ?? 0)

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('id, topic, questions')
      .eq('id', quizId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const quiz = data as QuizRecord
    const questions = Array.isArray(quiz.questions) ? quiz.questions : []
    const correctCount = questions.reduce((total, question) => {
      return total + (answers[question.id] === question.correctAnswer ? 1 : 0)
    }, 0)

    const score = questions.length > 0 ? Number(((correctCount / questions.length) * 100).toFixed(2)) : 0

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        user_id: session.user.id,
        quiz_id: quizId,
        score,
        answers,
        time_taken: timeTaken,
      })
      .select()
      .single()

    if (attemptError) {
      throw attemptError
    }

    const topic = quiz.topic || 'General'
    const weakDelta = score < 70 ? [topic] : []
    const strongDelta = score >= 85 ? [topic] : []
    const inferredMinutes = Math.max(6, questions.length * 2)

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('weak_topics, strong_topics, total_study_hours')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const existingWeak = Array.isArray(profile?.weak_topics) ? profile!.weak_topics : []
    const existingStrong = Array.isArray(profile?.strong_topics) ? profile!.strong_topics : []
    const nextWeak = Array.from(new Set([...existingWeak, ...weakDelta])).slice(0, 12)
    const nextStrong = Array.from(new Set([...existingStrong, ...strongDelta])).slice(0, 12)
    const nextHours = Number(profile?.total_study_hours ?? 0) + inferredMinutes / 60

    await Promise.allSettled([
      supabaseAdmin
        .from('user_profiles')
        .upsert(
          {
            user_id: session.user.id,
            weak_topics: nextWeak,
            strong_topics: nextStrong,
            total_study_hours: Number(nextHours.toFixed(2)),
          },
          { onConflict: 'user_id' }
        ),
      supabaseAdmin.from('streaks').insert({
        user_id: session.user.id,
        date: new Date().toISOString().slice(0, 10),
        activity_type: 'quiz',
        count: 1,
      }),
    ])

    return NextResponse.json({
      attempt,
      score,
      correctCount,
      totalQuestions: questions.length,
      results: questions.map((question) => ({
        id: question.id,
        question: question.question,
        selectedAnswer: answers[question.id] ?? null,
        correctAnswer: question.correctAnswer,
        isCorrect: answers[question.id] === question.correctAnswer,
        explanation: question.explanation,
        options: question.options,
      })),
    })
  } catch (error: unknown) {
    console.error('Quiz attempt error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to submit quiz attempt' },
      { status: 500 }
    )
  }
}
