'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Code,
  FileEdit,
  Flame,
  HelpCircle,
  Loader2,
  Play,
  Target,
  Users,
  BookOpen,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

type DashboardSummary = {
  readinessScores: {
    jobReadiness: number
    interviewReadiness: number
    codingReadiness: number
    placementReadiness: number
  }
  stats: {
    totalStudyHours: number
    resourcesCompleted: number
    quizzesAttempted: number
    problemsSolved: number
    projectsCompleted: number
    interviewsCompleted: number
    consistencyStreak: number
  }
  todayTasks: Array<{
    id?: string | number
    title: string
    type?: string
    completed?: boolean
    estimatedTime?: number
    time?: string
  }>
  weakAreas: string[]
  recentActivity: Array<{
    id: string
    action: string
    status: string
    time: string
  }>
  latestRoadmap: {
    topic: string
  } | null
}

type ApiError = {
  error?: string
}

type StatItemProps = {
  icon: LucideIcon
  label: string
  value: number
  color: string
}

type QuickActionCardProps = {
  icon: LucideIcon
  title: string
  description: string
  href: string
  color: string
}

const emptySummary: DashboardSummary = {
  readinessScores: {
    jobReadiness: 20,
    interviewReadiness: 20,
    codingReadiness: 20,
    placementReadiness: 20,
  },
  stats: {
    totalStudyHours: 0,
    resourcesCompleted: 0,
    quizzesAttempted: 0,
    problemsSolved: 0,
    projectsCompleted: 0,
    interviewsCompleted: 0,
    consistencyStreak: 0,
  },
  todayTasks: [],
  weakAreas: [],
  recentActivity: [],
  latestRoadmap: null,
}

function formatDateLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/dashboard/summary', { cache: 'no-store' })
        const data = (await response.json()) as DashboardSummary & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load dashboard')
        }

        if (active) {
          setSummary({ ...emptySummary, ...data })
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const roadmapTopic = summary.latestRoadmap?.topic || 'your roadmap'

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 text-white surface-hover"
        style={{
          background:
            'radial-gradient(900px 500px at 15% 20%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(900px 500px at 85% 20%, rgba(255,255,255,0.12), transparent 60%), linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="flex items-start justify-between gap-6 relative">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name || 'Learner'}!
            </h1>
            <p className="text-lg opacity-90 mb-4">
              Your preparation hub is now pulling live progress from the app.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/15">
                <Flame className="w-5 h-5 text-amber-300" />
                <span className="font-semibold">{summary.stats.consistencyStreak} day streak</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/15">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">{summary.stats.totalStudyHours} hours studied</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/roadmap"
            className="bg-white/95 text-indigo-700 px-6 py-3 rounded-2xl font-semibold hover:bg-white transition flex items-center gap-2 shadow-sm"
          >
            Continue with {roadmapTopic}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Job Readiness', score: summary.readinessScores.jobReadiness, icon: BriefcaseIcon, color: 'text-emerald-600' },
          { label: 'Interview Readiness', score: summary.readinessScores.interviewReadiness, icon: Users, color: 'text-blue-600' },
          { label: 'Coding Readiness', score: summary.readinessScores.codingReadiness, icon: Code, color: 'text-purple-600' },
          { label: 'Placement Readiness', score: summary.readinessScores.placementReadiness, icon: Target, color: 'text-amber-600' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="surface surface-hover p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <item.icon className={`w-8 h-8 ${item.color}`} />
              <div className={`text-3xl font-bold ${item.color}`}>{item.score}%</div>
            </div>
            <div className="text-sm text-gray-600 mb-2">{item.label}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full" style={{ width: `${item.score}%` }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 surface p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Today&apos;s Plan</h2>
              <p className="text-sm text-gray-600 mt-1">
                {summary.todayTasks.filter((task) => task.completed).length}/{summary.todayTasks.length} tasks completed
              </p>
            </div>
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your planner...</span>
            </div>
          ) : summary.todayTasks.length > 0 ? (
            <div className="space-y-3">
              {summary.todayTasks.map((task, index) => (
                <motion.div
                  key={task.id ?? `${task.title}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                    task.completed
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    task.completed ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                  }`}>
                    {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{task.type || 'study'}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {task.time || (task.estimatedTime ? `${task.estimatedTime} min` : 'Planned')}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
              No planner tasks yet. Add a plan to make this section fully dynamic.
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="surface p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Progress</h2>

          <div className="space-y-4">
            <StatItem icon={BookOpen} label="Resources Completed" value={summary.stats.resourcesCompleted} color="text-blue-600" />
            <StatItem icon={HelpCircle} label="Quizzes Attempted" value={summary.stats.quizzesAttempted} color="text-purple-600" />
            <StatItem icon={Code} label="Problems Solved" value={summary.stats.problemsSolved} color="text-emerald-600" />
            <StatItem icon={Target} label="Projects Completed" value={summary.stats.projectsCompleted} color="text-amber-600" />
            <StatItem icon={Users} label="Interviews Taken" value={summary.stats.interviewsCompleted} color="text-rose-600" />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link href="/dashboard/analytics" className="text-indigo-600 font-semibold flex items-center gap-2 hover:underline">
              View Detailed Analytics
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Focus Areas</h2>
          </div>

          {summary.weakAreas.length > 0 ? (
            <div className="space-y-3">
              {summary.weakAreas.map((area) => (
                <div key={area} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="font-medium text-gray-900">{area}</span>
                  <Link href={`/dashboard/resources?topic=${encodeURIComponent(area)}`} className="text-sm text-amber-600 font-semibold hover:underline">
                    Practice
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              Weak topics will appear here once the app collects quiz, coding, or interview data.
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>

          {summary.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {summary.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 font-medium">{activity.action}</div>
                    <div className="text-xs text-gray-600 mt-1">{formatDateLabel(activity.time)}</div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600">{activity.status}</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              Your latest quiz, coding, and interview activity will show up here automatically.
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard icon={Play} title="Take Daily Quiz" description="Test your knowledge" href="/dashboard/quizzes" color="from-blue-500 to-blue-600" />
          <QuickActionCard icon={Code} title="Practice Coding" description="Solve problems" href="/dashboard/coding" color="from-emerald-500 to-emerald-600" />
          <QuickActionCard icon={Users} title="Mock Interview" description="AI-powered interview" href="/dashboard/interviews" color="from-purple-500 to-purple-600" />
          <QuickActionCard icon={FileEdit} title="Build Resume" description="Create professional resume" href="/dashboard/resume" color="from-amber-500 to-amber-600" />
        </div>
      </motion.div>
    </div>
  )
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  )
}

function QuickActionCard({ icon: Icon, title, description, href, color }: QuickActionCardProps) {
  return (
    <Link href={href} className="group surface surface-hover p-4">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </Link>
  )
}

function BriefcaseIcon(props: React.ComponentProps<typeof BarChart3>) {
  return (
    <BarChart3 {...props} />
  )
}
