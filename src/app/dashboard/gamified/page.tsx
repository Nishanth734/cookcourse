'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trophy, Flame, Target, Star, Gift, Sparkles, RefreshCcw, Award } from 'lucide-react'

type QuestItem = {
  id: string
  title: string
  progress: number
  total: number
  reward: string
}

type GamifiedSummary = {
  stats: {
    level: number
    xp: number
    streak: number
    badges: number
    completionRate: number
    levelProgress: number
    xpToNextLevel: number
    nextLevelXp: number
  }
  quests: QuestItem[]
  weeklyActivity: Array<{
    date: string
    label: string
    count: number
  }>
  badgesPreview: Array<{
    badge: string
    title: string
    description: string
    earnedAt: string
  }>
  updatedAt: string
  error?: string
}

const initialSummary: GamifiedSummary = {
  stats: {
    level: 1,
    xp: 0,
    streak: 0,
    badges: 0,
    completionRate: 0,
    levelProgress: 0,
    xpToNextLevel: 100,
    nextLevelXp: 100,
  },
  quests: [],
  weeklyActivity: [],
  badgesPreview: [],
  updatedAt: '',
}

export default function GamifiedLearningPage() {
  const [summary, setSummary] = useState<GamifiedSummary>(initialSummary)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadSummary(mode: 'initial' | 'refresh' = 'initial') {
    try {
      if (mode === 'initial') {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      setError('')

      const response = await fetch('/api/gamified/summary', { cache: 'no-store' })
      const data = (await response.json()) as GamifiedSummary

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load gamified summary')
      }

      setSummary(data)
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load gamified summary')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadSummary('initial')
  }, [])

  const quests = useMemo(() => summary.quests ?? [], [summary.quests])
  const weeklyActivity = useMemo(() => summary.weeklyActivity ?? [], [summary.weeklyActivity])
  const maxWeekly = useMemo(
    () => Math.max(1, ...weeklyActivity.map((item) => Number(item.count ?? 0))),
    [weeklyActivity]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gamified Learning</h1>
          <p className="text-gray-600">
            Track your level, XP, streaks, daily quests, and rewards.
          </p>
        </div>
        <button
          onClick={() => void loadSummary('refresh')}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Trophy} label="Level" value={`Lv. ${summary.stats.level}`} tone="from-indigo-500 to-purple-600" />
        <StatCard icon={Sparkles} label="Total XP" value={String(summary.stats.xp)} tone="from-emerald-500 to-teal-600" />
        <StatCard icon={Flame} label="Current Streak" value={`${summary.stats.streak} days`} tone="from-amber-500 to-orange-600" />
        <StatCard icon={Star} label="Badges" value={String(summary.stats.badges)} tone="from-fuchsia-500 to-pink-600" />
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-lg font-bold text-indigo-900">Level Progress</h2>
          <span className="text-sm font-semibold text-indigo-700">
            {summary.stats.xpToNextLevel} XP to next level
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-indigo-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${summary.stats.levelProgress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-indigo-700">
          Progress: {summary.stats.levelProgress}% • Next level at {summary.stats.nextLevelXp} XP
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Daily Quests</h2>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              Loading quest progress...
            </div>
          ) : quests.length > 0 ? (
            <div className="space-y-4">
              {quests.map((quest) => {
              const percentage = Math.min(100, Math.round((quest.progress / quest.total) * 100))

              return (
                <div key={quest.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="font-medium text-gray-900">{quest.title}</div>
                    <div className="text-sm font-semibold text-indigo-700">{quest.reward}</div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {quest.progress} / {quest.total} completed
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              No active quests right now. Add quest rules in the gamified summary API.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Rewards</h3>
            </div>
            <p className="text-sm text-gray-600">
              Quest completion rate: <span className="font-semibold text-gray-900">{summary.stats.completionRate}%</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              XP and level are live. Extend this with reward claims, streak freezes, and badge unlock modals.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-gray-900">Recent Badges</h3>
            </div>
            {summary.badgesPreview.length > 0 ? (
              <div className="space-y-3">
                {summary.badgesPreview.map((badge) => (
                  <div key={`${badge.badge}-${badge.earnedAt}`} className="rounded-lg border border-gray-200 p-3">
                    <div className="font-semibold text-gray-900">{badge.title}</div>
                    <div className="text-xs uppercase tracking-wide text-amber-700 mt-1">{badge.badge}</div>
                    {badge.description && <div className="text-sm text-gray-600 mt-1">{badge.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                No badges yet — complete quests and consistent practice to unlock achievements.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Implementation notes</h3>
            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
              <li>Current stats come from live app activity (quizzes, coding, projects, interviews).</li>
              <li>Quests are configurable in <code>/api/gamified/summary</code>.</li>
              <li>Add leaderboard once you define ranking rules.</li>
              <li>Use this as the base for rewards and badge unlock animations.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Activity</h2>
        {loading ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            Loading weekly activity...
          </div>
        ) : weeklyActivity.length > 0 ? (
          <>
            <div className="flex items-end justify-between gap-2 h-44">
              {weeklyActivity.map((item) => (
                <div key={item.date} className="flex-1">
                  <div className="h-36 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-indigo-500 transition-all"
                      style={{ height: `${(Number(item.count ?? 0) / maxWeekly) * 100}%` }}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-2">{item.label}</div>
                  <div className="text-center text-xs font-semibold text-gray-700">{item.count}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            No activity yet this week — complete one quiz/interview/coding task to start your streak graph.
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: string
}) {
  return (
    <div className={`bg-linear-to-br ${tone} rounded-xl p-6 text-white`}>
      <Icon className="w-8 h-8 mb-3" />
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  )
}
