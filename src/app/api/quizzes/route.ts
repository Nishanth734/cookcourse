import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateQuiz, getFallbackQuiz } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserTopicContext } from '@/lib/topic-context'
import { QuizData } from '@/types'

type QuizRecord = {
  id: string
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  question_count: number
  time_limit: number | null
  questions: QuizData['questions']
  is_active: boolean
  created_at: string
}

type QuizAttemptRecord = {
  id: string
  quiz_id: string
  score: number
  completed_at: string
  time_taken: number | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

async function ensureSeedQuiz(
  topic: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  questionCount: number
) {
  try {
    return await generateQuiz(topic, difficulty, questionCount)
  } catch (error) {
    console.error('Quiz generation failed, using fallback quiz:', error)
    return getFallbackQuiz(topic, difficulty, questionCount)
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedTopic = searchParams.get('topic')?.trim() ?? ''
    const fresh = searchParams.get('fresh') === 'true'
    const difficulty = (searchParams.get('difficulty')?.trim().toUpperCase() || '') as
      | 'EASY'
      | 'MEDIUM'
      | 'HARD'
      | ''
    const topicContext = await getUserTopicContext(session.user.id)
    const effectiveTopic = requestedTopic || topicContext.activeTopic || ''

    let quizzesQuery = supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (effectiveTopic) {
      quizzesQuery = quizzesQuery.ilike('topic', `%${effectiveTopic}%`)
    }

    if (difficulty) {
      quizzesQuery = quizzesQuery.eq('difficulty', difficulty)
    }

    const [{ data: quizzesData, error: quizzesError }, { data: attemptsData, error: attemptsError }] =
      await Promise.all([
        quizzesQuery,
        supabaseAdmin
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false }),
      ])

    if (quizzesError) {
      throw quizzesError
    }

    if (attemptsError) {
      throw attemptsError
    }

    let quizzes = (quizzesData ?? []) as QuizRecord[]

    if (fresh && effectiveTopic) {
      quizzes = []
    }

    if (quizzes.length === 0) {
      const seedTopics = effectiveTopic
        ? [effectiveTopic]
        : topicContext.topics.length > 0
          ? topicContext.topics.slice(0, 3)
          : ['DSA', 'Web Development', 'React']
      const generated = await Promise.all(
        seedTopics.map(async (seedTopic, index) => {
          const seedDifficulty = (difficulty || (index === 0 ? 'EASY' : 'MEDIUM')) as
            | 'EASY'
            | 'MEDIUM'
            | 'HARD'
          const quiz = await ensureSeedQuiz(seedTopic, seedDifficulty, 5)

          const { data, error } = await supabaseAdmin
            .from('quizzes')
            .insert({
              title: quiz.title,
              topic: quiz.topic,
              difficulty: quiz.difficulty,
              question_count: quiz.questions.length,
              time_limit: quiz.timeLimit ?? 10,
              questions: quiz.questions,
              is_active: true,
            })
            .select()
            .single()

          if (error) {
            throw error
          }

          return data as QuizRecord
        })
      )

      quizzes = generated
    }

    const attempts = (attemptsData ?? []) as QuizAttemptRecord[]
    const attemptsByQuizId = attempts.reduce<Record<string, QuizAttemptRecord[]>>((accumulator, attempt) => {
      accumulator[attempt.quiz_id] = [...(accumulator[attempt.quiz_id] ?? []), attempt]
      return accumulator
    }, {})

    const stats = {
      completed: attempts.length,
      averageScore:
        attempts.length > 0
          ? Math.round(attempts.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) / attempts.length)
          : 0,
      timeSpentMinutes: attempts.reduce((total, attempt) => total + Number(attempt.time_taken ?? 0), 0),
    }

    return NextResponse.json({
      quizzes: quizzes.map((quiz) => {
        const quizAttempts = attemptsByQuizId[quiz.id] ?? []
        const bestScore =
          quizAttempts.length > 0
            ? Math.max(...quizAttempts.map((attempt) => Math.round(Number(attempt.score ?? 0))))
            : 0

        return {
          ...quiz,
          questionCount: quiz.question_count,
          timeLimit: quiz.time_limit,
          attempts: quizAttempts.length,
          bestScore,
        }
      }),
      attempts,
      stats,
      activeTopic: effectiveTopic || null,
      availableTopics: topicContext.topics,
    })
  } catch (error: unknown) {
    console.error('Quiz fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}
