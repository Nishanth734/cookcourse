import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type CodingProblemRecord = {
  id: string
  title: string
  topic?: string | null
  hidden_test_cases: {
    requiredPatterns?: string[]
    forbiddenPatterns?: string[]
    minLength?: number
  } | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function evaluateSubmission(
  code: string,
  hiddenTestCases: CodingProblemRecord['hidden_test_cases']
) {
  const normalizedCode = code.toLowerCase()
  const requiredPatterns = hiddenTestCases?.requiredPatterns ?? []
  const forbiddenPatterns = hiddenTestCases?.forbiddenPatterns ?? []
  const minLength = hiddenTestCases?.minLength ?? 20

  if (code.trim().length < minLength) {
    return {
      status: 'WRONG_ANSWER',
      feedback: `Your solution is too short. Add more complete logic before submitting.`,
    }
  }

  const missingPattern = requiredPatterns.find(
    (pattern) => !normalizedCode.includes(pattern.toLowerCase())
  )

  if (missingPattern) {
    return {
      status: 'WRONG_ANSWER',
      feedback: `Your solution likely misses an expected idea: "${missingPattern}".`,
    }
  }

  const forbiddenPattern = forbiddenPatterns.find((pattern) =>
    normalizedCode.includes(pattern.toLowerCase())
  )

  if (forbiddenPattern) {
    return {
      status: 'WRONG_ANSWER',
      feedback: `Your solution contains a discouraged pattern: "${forbiddenPattern}".`,
    }
  }

  return {
    status: 'ACCEPTED',
    feedback: 'Submission accepted by the local validator.',
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { problemId } = await params
    const body = await request.json()
    const code = String(body?.code ?? '')
    const language = String(body?.language ?? 'javascript')

    if (!code.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data: problem, error: problemError } = await supabaseAdmin
      .from('coding_problems')
      .select('id, title, topic, hidden_test_cases')
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }

    const typedProblem = problem as CodingProblemRecord
    const evaluation = evaluateSubmission(code, typedProblem.hidden_test_cases)

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('coding_submissions')
      .insert({
        user_id: session.user.id,
        problem_id: problemId,
        code,
        language,
        status: evaluation.status,
      })
      .select()
      .single()

    if (submissionError) {
      throw submissionError
    }

    const topic = typedProblem.topic || 'DSA'
    const inferredMinutes = 10
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('weak_topics, strong_topics, total_study_hours')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const existingWeak = Array.isArray(profile?.weak_topics) ? profile!.weak_topics : []
    const existingStrong = Array.isArray(profile?.strong_topics) ? profile!.strong_topics : []
    const nextWeak =
      evaluation.status === 'ACCEPTED'
        ? existingWeak.filter((item) => item !== topic)
        : Array.from(new Set([...existingWeak, topic]))
    const nextStrong =
      evaluation.status === 'ACCEPTED'
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
        activity_type: 'coding',
        count: 1,
      }),
    ])

    return NextResponse.json({
      submission,
      status: evaluation.status,
      feedback: evaluation.feedback,
    })
  } catch (error: unknown) {
    console.error('Coding submission error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to submit solution' },
      { status: 500 }
    )
  }
}
