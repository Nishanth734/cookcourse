import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateCodingProblems } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

type CodingProblemRecord = {
  id: string
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  description: string
  examples: Array<{ input: string; output: string; explanation?: string }>
  constraints: string
  hints: string[]
  editorial: string | null
  test_cases: Array<{ input: string; output: string }>
  hidden_test_cases: {
    requiredPatterns?: string[]
    forbiddenPatterns?: string[]
    minLength?: number
  }
  company_tags: string[]
  acceptance_rate: number | null
  created_at: string
}

type CodingSubmissionRecord = {
  id: string
  problem_id: string
  status: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function getFallbackProblems(): Omit<CodingProblemRecord, 'id' | 'created_at'>[] {
  return [
    {
      title: 'Two Sum',
      topic: 'DSA',
      difficulty: 'EASY',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'nums[0] + nums[1] == 9',
        },
      ],
      constraints: 'Use an efficient approach better than O(n^2) if possible.',
      hints: ['Think about fast lookups.', 'A hash map usually helps here.'],
      editorial: 'Store visited numbers in a map from value to index and check complement on each step.',
      test_cases: [
        { input: '[2,7,11,15], 9', output: '[0,1]' },
        { input: '[3,2,4], 6', output: '[1,2]' },
      ],
      hidden_test_cases: {
        requiredPatterns: ['map', 'target', 'return'],
        minLength: 40,
      },
      company_tags: ['Google', 'Amazon', 'Meta'],
      acceptance_rate: 84,
    },
    {
      title: 'Valid Parentheses',
      topic: 'DSA',
      difficulty: 'EASY',
      description:
        'Given a string s containing just the characters (), {}, and [], determine if the input string is valid.',
      examples: [
        {
          input: 's = "()[]{}"',
          output: 'true',
        },
      ],
      constraints: 'A valid string must close brackets in the correct order.',
      hints: ['This is a classic stack problem.', 'Push openings and pop on matching closures.'],
      editorial: 'Use a stack and a bracket map to validate closing order.',
      test_cases: [
        { input: '"()[]{}"', output: 'true' },
        { input: '"(]"', output: 'false' },
      ],
      hidden_test_cases: {
        requiredPatterns: ['stack', 'return'],
        minLength: 35,
      },
      company_tags: ['Microsoft', 'Adobe'],
      acceptance_rate: 78,
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      topic: 'DSA',
      difficulty: 'MEDIUM',
      description:
        'Given a string s, find the length of the longest substring without repeating characters.',
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The answer is "abc", with the length of 3.',
        },
      ],
      constraints: 'Aim for O(n) with a sliding window.',
      hints: ['Use two pointers.', 'Track the latest index for each character.'],
      editorial: 'Maintain a sliding window and move the left pointer when duplicates appear.',
      test_cases: [
        { input: '"abcabcbb"', output: '3' },
        { input: '"bbbbb"', output: '1' },
      ],
      hidden_test_cases: {
        requiredPatterns: ['left', 'right', 'max'],
        minLength: 45,
      },
      company_tags: ['Amazon', 'Bloomberg'],
      acceptance_rate: 61,
    },
  ]
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')?.trim()
    const difficulty = searchParams.get('difficulty')?.trim().toUpperCase()

    const [{ data: userData }, { data: profileData }] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('skill_level, target_companies, target_role')
        .eq('id', session.user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('user_profiles')
        .select('progress')
        .eq('user_id', session.user.id)
        .maybeSingle(),
    ])

    let problemsQuery = supabaseAdmin
      .from('coding_problems')
      .select('*')
      .order('created_at', { ascending: false })

    if (topic) {
      problemsQuery = problemsQuery.ilike('topic', `%${topic}%`)
    }

    if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      problemsQuery = problemsQuery.eq('difficulty', difficulty)
    }

    const [{ data: problemsData, error: problemsError }, { data: submissionsData, error: submissionsError }] =
      await Promise.all([
        problemsQuery,
        supabaseAdmin
          .from('coding_submissions')
          .select('id, problem_id, status')
          .eq('user_id', session.user.id)
          .order('submitted_at', { ascending: false }),
      ])

    if (problemsError) {
      throw problemsError
    }
    if (submissionsError) {
      throw submissionsError
    }

    let problems = (problemsData ?? []) as CodingProblemRecord[]

    if (problems.length === 0) {
      const progress = (profileData?.progress ?? {}) as { topics?: string[] } | null
      const onboardingTopics = Array.isArray(progress?.topics) ? progress!.topics!.filter(Boolean) : []
      const seedTopic = topic || onboardingTopics[0] || 'DSA'

      const generated = await generateCodingProblems(
        seedTopic,
        userData?.skill_level || 'BEGINNER',
        userData?.target_companies || [],
        4
      )

      const drafts =
        generated.length > 0
          ? generated
          : getFallbackProblems().map((problem) => ({
              ...problem,
              topic: seedTopic,
              company_tags: userData?.target_companies || problem.company_tags,
            }))

      const insertedProblems = await Promise.all(
        drafts.map(async (problem) => {
          const { data, error } = await supabaseAdmin
            .from('coding_problems')
            .insert({
              title: problem.title,
              topic: problem.topic,
              difficulty: problem.difficulty,
              description: problem.description,
              examples: problem.examples,
              constraints: problem.constraints,
              hints: problem.hints,
              editorial: problem.editorial ?? null,
              test_cases: problem.testCases ?? problem.test_cases ?? [],
              hidden_test_cases: problem.hidden_test_cases ?? { minLength: 30 },
              company_tags: problem.companyTags ?? problem.company_tags ?? [],
              acceptance_rate: problem.acceptanceRate ?? problem.acceptance_rate ?? null,
            })
            .select()
            .single()

          if (error) {
            throw error
          }

          return data as CodingProblemRecord
        })
      )

      problems = insertedProblems
    }

    const submissions = (submissionsData ?? []) as CodingSubmissionRecord[]
    const submissionsByProblem = submissions.reduce<Record<string, CodingSubmissionRecord[]>>(
      (accumulator, submission) => {
        accumulator[submission.problem_id] = [...(accumulator[submission.problem_id] ?? []), submission]
        return accumulator
      },
      {}
    )

    const acceptedCount = submissions.filter((submission) => submission.status === 'ACCEPTED').length
    const stats = {
      problemsSolved: new Set(
        submissions.filter((submission) => submission.status === 'ACCEPTED').map((submission) => submission.problem_id)
      ).size,
      acceptanceRate:
        submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 100) : 0,
      totalSubmissions: submissions.length,
    }

    return NextResponse.json({
      problems: problems.map((problem) => {
        const problemSubmissions = submissionsByProblem[problem.id] ?? []
        const solved = problemSubmissions.some((submission) => submission.status === 'ACCEPTED')

        return {
          ...problem,
          testCases: problem.test_cases,
          companyTags: problem.company_tags,
          acceptanceRate: problem.acceptance_rate,
          submissions: problemSubmissions.length,
          solved,
        }
      }),
      stats,
    })
  } catch (error: unknown) {
    console.error('Coding problems fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch coding problems' },
      { status: 500 }
    )
  }
}
