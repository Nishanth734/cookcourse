// Roadmap Types
export interface RoadmapPhase {
  name: string
  duration: string
  subtopics: Subtopic[]
}

export interface Subtopic {
  name: string
  status: 'completed' | 'in-progress' | 'pending'
  resources?: number
  problems?: number
}

export interface RoadmapData {
  topic: string
  phases: RoadmapPhase[]
}

// Quiz Types
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface QuizData {
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  questions: QuizQuestion[]
  timeLimit?: number
}

// Resource Types
export interface Resource {
  id: string
  title: string
  description: string
  type: 'VIDEO' | 'ARTICLE' | 'COURSE' | 'PLAYLIST' | 'BOOK' | 'DOC' | 'CODING_SHEET'
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  platform: string
  instructor?: string
  duration?: string
  rating?: number
  price: 'FREE' | 'PAID' | 'FREEMIUM'
  language: string
  url: string
  thumbnail?: string
  tags: string[]
  whyRecommended?: string
}

// Interview Types
export interface InterviewQuestion {
  question: string
  expectedAnswer: string
  hints: string[]
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface InterviewFeedback {
  technicalScore: number
  communicationScore: number
  confidenceScore: number
  clarityScore: number
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  overallScore: number
}

// Project Types
export interface ProjectMilestone {
  title: string
  description: string
  completed: boolean
}

export interface ProjectData {
  id: string
  title: string
  description: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  techStack: string[]
  features: string[]
  milestones: ProjectMilestone[]
  githubStructure?: string
  deploymentGuide?: string
  resumeValue?: string
  interviewPoints: string[]
}

// Analytics Types
export interface ReadinessScores {
  jobReadiness: number
  interviewReadiness: number
  codingReadiness: number
  placementReadiness: number
}

export interface TopicMastery {
  topic: string
  masteryLevel: number
  problemsSolved: number
  quizzesCompleted: number
}

export interface ProgressStats {
  totalStudyHours: number
  resourcesCompleted: number
  quizzesAttempted: number
  problemsSolved: number
  projectsCompleted: number
  interviewsCompleted: number
  consistencyStreak: number
}

// User Types
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type UserRole = 'USER' | 'ADMIN' | 'MENTOR'

export interface UserProfile {
  id: string
  email: string
  name?: string
  role: UserRole
  avatar?: string
  bio?: string
  college?: string
  graduationYear?: number
  targetRole?: string
  targetCompanies: string[]
  skillLevel: SkillLevel
  dailyStudyHours: number
}

// Planner Types
export interface PlannerTask {
  id: string
  title: string
  description: string
  type: 'learning' | 'practice' | 'revision' | 'quiz' | 'project'
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  estimatedTime: number // in minutes
}

export interface DailyPlan {
  date: string
  tasks: PlannerTask[]
  completed: boolean
}

// Community Types
export type PostType = 'QUESTION' | 'DISCUSSION' | 'NOTE_SHARE' | 'DOUBT' | 'TIPS'

export interface CommunityPost {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  topic: string
  title: string
  content: string
  type: PostType
  upvotes: number
  comments: Comment[]
  createdAt: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

// ATS Types
export interface ATSAnalysis {
  atsScore: number
  recruiterScore: number
  keywordMatches: string[]
  missingKeywords: string[]
  readabilityScore: number
  roleAlignment: number
  recommendations: ATSRecommendation[]
}

export interface ATSRecommendation {
  type: 'keyword' | 'formatting' | 'content' | 'structure'
  priority: 'high' | 'medium' | 'low'
  description: string
  suggestion: string
}

// Coding Types
export interface CodingProblem {
  id: string
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  description: string
  examples: Array<{
    input: string
    output: string
    explanation?: string
  }>
  constraints: string
  hints: string[]
  editorial?: string
  testCases?: Array<{
    input: string
    output: string
  }>
  companyTags: string[]
  acceptanceRate?: number
}

export type SubmissionStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR'

export interface CodingSubmission {
  id: string
  problemId: string
  code: string
  language: string
  status: SubmissionStatus
  runtime?: number
  memory?: number
  submittedAt: string
}
