import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database types helper
export type Tables = {
  users: {
    id: string
    email: string
    name: string | null
    password: string
    role: 'USER' | 'ADMIN' | 'MENTOR'
    avatar: string | null
    bio: string | null
    college: string | null
    graduation_year: number | null
    target_role: string | null
    target_companies: string[]
    skill_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    daily_study_hours: number
    created_at: string
    updated_at: string
  }
  user_profiles: {
    id: string
    user_id: string
    current_topic: string | null
    progress: unknown
    weak_topics: string[]
    strong_topics: string[]
    readiness_scores: unknown
    total_study_hours: number
    consistency_streak: number
    badges: string[]
  }
  roadmaps: {
    id: string
    user_id: string
    topic: string
    skill_level: string
    target_company: string | null
    target_timeline: string | null
    phases: unknown
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
    created_at: string
  }
  resources: {
    id: string
    title: string
    description: string
    type: string
    topic: string
    difficulty: string
    platform: string
    instructor: string | null
    duration: string | null
    rating: number | null
    price: string
    language: string
    url: string
    thumbnail: string | null
    tags: string[]
    created_at: string
  }
  quizzes: {
    id: string
    title: string
    topic: string
    difficulty: string
    question_count: number
    time_limit: number | null
    questions: unknown
    is_active: boolean
    created_at: string
  }
  coding_problems: {
    id: string
    title: string
    topic: string
    difficulty: string
    description: string
    examples: unknown
    constraints: string
    hints: string[]
    editorial: string | null
    test_cases: unknown
    hidden_test_cases: unknown
    company_tags: string[]
    acceptance_rate: number | null
    created_at: string
  }
  projects: {
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
  placement_stories: {
    id: string
    name: string
    company: string
    role: string
    college: string | null
    background: string | null
    timeline: string
    resources_used: string[]
    projects: string[]
    mistakes: string[]
    interview_exp: string
    tips: string[]
    image_url: string | null
    created_at: string
  }
}
