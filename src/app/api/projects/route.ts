import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateProjects } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabase'

type ProjectRecord = {
  id: string
  title: string
  description: string
  topic: string
  difficulty: string
  tech_stack: string[]
  features: string[]
  milestones: unknown
  github_structure: string | null
  deployment_guide: string | null
  resume_value: string | null
  interview_points: string[]
  created_at: string
}

type UserProjectRecord = {
  id: string
  user_id: string
  project_id: string
  status: string
  github_url: string | null
  deployed_url: string | null
  started_at: string | null
  completed_at: string | null
}

type GeneratedProjectDraft = {
  title: string
  description: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  techStack: string[]
  features: string[]
  milestones: Array<{ title: string; description: string; completed: boolean }>
  githubStructure?: string
  deploymentGuide?: string
  resumeValue?: string
  interviewPoints?: string[]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function getFallbackProjects(topic: string, targetRole: string, count: number = 3): GeneratedProjectDraft[] {
  const safeTopic = topic?.trim() || 'Web Development'
  const safeRole = targetRole?.trim() || 'Software Engineer'

  const templates: GeneratedProjectDraft[] = [
    {
      title: `${safeTopic} Interview Prep Tracker`,
      description:
        'A full-stack tracker to manage topic-wise preparation, deadlines, and interview practice consistency.',
      topic: safeTopic,
      difficulty: 'MEDIUM',
      techStack: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
      features: [
        'Topic progress dashboard',
        'Daily/weekly streak tracking',
        'Weak-topic heatmap',
        'Mock interview logs',
        'Reminder and planner integration',
      ],
      milestones: [
        { title: 'Core schema + auth', description: 'Set up auth and project data models.', completed: false },
        { title: 'Progress dashboard', description: 'Build analytics and charts for preparation.', completed: false },
        { title: 'Interview insights', description: 'Add reflection notes and recommendations.', completed: false },
      ],
      githubStructure: 'app/, components/, lib/, prisma/',
      deploymentGuide: 'Deploy on Vercel, configure Supabase env vars, run migrations.',
      resumeValue: `Designed and shipped a production-ready ${safeTopic.toLowerCase()} tracking platform for ${safeRole} preparation with analytics and workflow automation.`,
      interviewPoints: [
        'State management strategy',
        'Data modeling choices',
        'Performance optimization decisions',
        'Product thinking for learner retention',
      ],
    },
    {
      title: `${safeTopic} Problem Practice Arena`,
      description:
        'An interactive coding/problem practice platform with curated sets, attempt history, and AI hints.',
      topic: safeTopic,
      difficulty: 'HARD',
      techStack: ['Next.js', 'Node.js', 'PostgreSQL', 'Redis'],
      features: [
        'Problem playlists by difficulty',
        'Timed practice mode',
        'Submission history and score trends',
        'Hint and explanation system',
        'Leaderboard and badges',
      ],
      milestones: [
        { title: 'Problem catalog', description: 'Design schema and ingestion pipeline for problems.', completed: false },
        { title: 'Practice engine', description: 'Add timer, attempts, and scoring.', completed: false },
        { title: 'Gamification', description: 'Implement streaks, badges, and progression.', completed: false },
      ],
      githubStructure: 'app/dashboard, app/api, components/practice, lib/scoring',
      deploymentGuide: 'Use Vercel + managed Postgres; add Redis for session/timer cache.',
      resumeValue: `Built a scalable problem-practice product with analytics and gamification, improving engagement and consistency for ${safeRole} candidates.`,
      interviewPoints: [
        'Scoring algorithm design',
        'Handling race conditions in timed sessions',
        'Caching strategy and tradeoffs',
        'Measuring product engagement',
      ],
    },
    {
      title: `${safeTopic} Mock Interview Simulator`,
      description:
        'A strict-mode mock interview simulator with fullscreen monitoring, answer capture, and AI/fallback feedback.',
      topic: safeTopic,
      difficulty: 'MEDIUM',
      techStack: ['Next.js', 'TypeScript', 'Supabase', 'OpenRouter API'],
      features: [
        'Camera + microphone permission flow',
        'Fullscreen enforcement mode',
        'Question-answer workflow',
        'AI + local fallback evaluation',
        'Feedback history and progress graph',
      ],
      milestones: [
        { title: 'Interview lifecycle', description: 'Build start, question, submit, and completion states.', completed: false },
        { title: 'Evaluation pipeline', description: 'Integrate AI with resilient fallback logic.', completed: false },
        { title: 'Insights and reports', description: 'Add score trends and recommendations.', completed: false },
      ],
      githubStructure: 'app/dashboard/interviews, app/api/interviews, lib/ai',
      deploymentGuide: 'Set API keys, deploy to Vercel, verify media permission behavior in HTTPS.',
      resumeValue: `Implemented a mock interview engine with real-time scoring and resilient AI fallback to support reliable assessment workflows.`,
      interviewPoints: [
        'Media APIs in browser security model',
        'Failure handling and graceful degradation',
        'Prompt design for structured AI output',
        'Data consistency across multi-step sessions',
      ],
    },
  ]

  return templates.slice(0, Math.max(1, count))
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: user }, { data: profile }] = await Promise.all([
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

    const { data: initialUserProjects, error: userProjectsError } = await supabaseAdmin
      .from('user_projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false, nullsFirst: false })

    if (userProjectsError) throw userProjectsError

    let userProjects = initialUserProjects as UserProjectRecord[] | null

    if ((userProjects ?? []).length === 0) {
      const progress = (profile?.progress ?? {}) as { topics?: string[] } | null
      const onboardingTopics = Array.isArray(progress?.topics) ? progress!.topics!.filter(Boolean) : []
      const seedTopic = onboardingTopics[0] || 'Web Development'
      const skillLevel = user?.skill_level || 'BEGINNER'
      const targetRole = user?.target_role || 'Software Engineer'
      const targetCompanies = user?.target_companies || []

      const generated = await generateProjects(seedTopic, skillLevel, targetRole, targetCompanies, 3)
      const projectIdeas = generated.length > 0 ? generated : getFallbackProjects(seedTopic, targetRole, 3)

      if (generated.length === 0) {
        console.warn('Project generation returned empty suggestions, using fallback project ideas.')
      }

      if (projectIdeas.length > 0) {
        await Promise.all(
          projectIdeas.map(async (project) => {
            const { data: createdProject, error: projectError } = await supabaseAdmin
              .from('projects')
              .insert({
                title: project.title,
                description: project.description,
                topic: project.topic,
                difficulty: project.difficulty,
                tech_stack: project.techStack,
                features: project.features,
                milestones: project.milestones,
                github_structure: project.githubStructure ?? null,
                deployment_guide: project.deploymentGuide ?? null,
                resume_value: project.resumeValue ?? null,
                interview_points: project.interviewPoints ?? [],
              })
              .select()
              .single()

            if (projectError) {
              // Non-fatal seeding: ignore and continue.
              console.error('Project seed error:', projectError)
              return
            }

            await supabaseAdmin.from('user_projects').insert({
              user_id: session.user.id,
              project_id: createdProject.id,
              status: 'NOT_STARTED',
            })
          })
        )
      }

      const { data: seededUserProjects, error: seededUserProjectsError } = await supabaseAdmin
        .from('user_projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false, nullsFirst: false })

      if (!seededUserProjectsError) {
        userProjects = seededUserProjects as UserProjectRecord[]
      }
    }

    const projectIds = (userProjects ?? []).map((item: UserProjectRecord) => item.project_id).filter(Boolean)

    const { data: projects, error: projectsError } = projectIds.length > 0
      ? await supabaseAdmin.from('projects').select('*').in('id', projectIds)
      : { data: [], error: null }

    if (projectsError) throw projectsError

    const projectMap = new Map<string, ProjectRecord>((projects ?? []).map((project: ProjectRecord) => [project.id, project]))

    const items = (userProjects ?? []).map((userProject: UserProjectRecord) => ({
      ...userProject,
      project: projectMap.get(userProject.project_id) ?? null,
    }))

    return NextResponse.json({ projects: items })
  } catch (error: unknown) {
    console.error('Project fetch error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to fetch projects' },
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
      title,
      description,
      topic,
      difficulty = 'MEDIUM',
      techStack = [],
      features = [],
      githubUrl = null,
      deployedUrl = null,
      status = 'IN_PROGRESS',
    } = body ?? {}

    if (!title || !description || !topic) {
      return NextResponse.json(
        { error: 'Title, description, and topic are required' },
        { status: 400 }
      )
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        title,
        description,
        topic,
        difficulty,
        tech_stack: techStack,
        features,
        milestones: [],
        github_structure: null,
        deployment_guide: null,
        resume_value: null,
        interview_points: [],
      })
      .select()
      .single()

    if (projectError) throw projectError

    const { data: userProject, error: userProjectError } = await supabaseAdmin
      .from('user_projects')
      .insert({
        user_id: session.user.id,
        project_id: project.id,
        status,
        github_url: githubUrl,
        deployed_url: deployedUrl,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userProjectError) throw userProjectError

    return NextResponse.json({
      project: {
        ...userProject,
        project,
      },
    })
  } catch (error: unknown) {
    console.error('Project create error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to create project' },
      { status: 500 }
    )
  }
}
