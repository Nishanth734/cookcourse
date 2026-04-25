import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

type PlannerTask = {
  id: string
  title: string
  description: string
  type: 'learning' | 'practice' | 'revision' | 'quiz' | 'project'
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  estimatedTime: number
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function formatISODate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildSeedPlan(args: {
  topic: string
  dailyHours: number
  weakTopics: string[]
}): PlannerTask[] {
  const minutes = Math.max(30, Math.round(args.dailyHours * 60))
  const weak = args.weakTopics[0]
  const blocks: Array<Omit<PlannerTask, 'id'>> = [
    {
      title: `Roadmap deep work: ${args.topic}`,
      description: 'Pick one subtopic from your roadmap and go deep: notes + 2 exercises.',
      type: 'learning',
      completed: false,
      priority: 'high',
      estimatedTime: Math.min(90, Math.round(minutes * 0.45)),
    },
    {
      title: `Quiz sprint: ${weak ?? args.topic}`,
      description: 'Take a short quiz and review every mistake.',
      type: 'quiz',
      completed: false,
      priority: weak ? 'high' : 'medium',
      estimatedTime: Math.min(30, Math.round(minutes * 0.2)),
    },
    {
      title: 'Coding practice: 1 problem',
      description: 'Solve one coding problem and write a clean final solution.',
      type: 'practice',
      completed: false,
      priority: 'high',
      estimatedTime: Math.min(60, Math.round(minutes * 0.25)),
    },
    {
      title: 'Interview rep: 1 question',
      description: 'Answer one interview question using a structured framework (STAR / tradeoffs).',
      type: 'revision',
      completed: false,
      priority: 'medium',
      estimatedTime: Math.min(25, Math.round(minutes * 0.1)),
    },
  ]

  return blocks
    .filter((item) => item.estimatedTime >= 10)
    .map((task, index) => ({
      ...task,
      id: `task-${index + 1}`,
    }))
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || formatISODate(new Date())

    const { data, error } = await supabaseAdmin
      .from('daily_planner')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', date)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      date,
      plan: data ?? null,
      tasks: Array.isArray(data?.tasks) ? data!.tasks : [],
      completed: Boolean(data?.completed),
    })
  } catch (error: unknown) {
    console.error('Planner fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch planner' },
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

    const body = await request.json().catch(() => ({}))
    const mode = String(body?.mode ?? 'seed')
    const date = String(body?.date ?? formatISODate(new Date()))

    if (mode !== 'seed') {
      return NextResponse.json({ error: 'Unsupported planner mode' }, { status: 400 })
    }

    const existingPlanResult = await supabaseAdmin
      .from('daily_planner')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('date', date)
      .maybeSingle()

    if (existingPlanResult.error) {
      throw existingPlanResult.error
    }

    const [
      { data: user },
      { data: profile },
      { data: latestRoadmap },
    ] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('daily_study_hours')
        .eq('id', session.user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('user_profiles')
        .select('current_topic, weak_topics, progress')
        .eq('user_id', session.user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('roadmaps')
        .select('topic')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const dailyHours = Number(user?.daily_study_hours ?? 2)
    const currentTopic =
      latestRoadmap?.topic ||
      profile?.current_topic ||
      ((profile?.progress as { topics?: string[] } | null)?.topics?.[0] ?? 'DSA')

    const weakTopics = Array.isArray(profile?.weak_topics) ? profile!.weak_topics : []
    const tasks = buildSeedPlan({ topic: currentTopic, dailyHours, weakTopics })

    const writeQuery = existingPlanResult.data?.id
      ? supabaseAdmin
          .from('daily_planner')
          .update({ tasks, completed: false })
          .eq('id', existingPlanResult.data.id)
          .select()
          .single()
      : supabaseAdmin
          .from('daily_planner')
          .insert({
            user_id: session.user.id,
            date,
            tasks,
            completed: false,
          })
          .select()
          .single()

    const { data, error } = await writeQuery

    if (error) {
      throw error
    }

    return NextResponse.json({ date, plan: data, tasks })
  } catch (error: unknown) {
    console.error('Planner create error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to generate planner' },
      { status: 500 }
    )
  }
}

