'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Target, Award, BarChart3, Loader2 } from 'lucide-react'

type AnalyticsResponse = {
  totals: {
    totalStudyHours: number
    weakTopics: string[]
    strongTopics: string[]
    quizAttempts: number
    codingSubmissions: number
    interviews: number
  }
  scores: {
    averageQuizScore: number
    codingAcceptanceRate: number
    averageInterviewScore: number
  }
  weeklyActivity: Array<{ day: string; count: number }>
}

type ApiError = { error?: string }

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/analytics', { cache: 'no-store' })
        const payload = (await response.json()) as AnalyticsResponse & ApiError
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load analytics')
        }
        if (active) {
          setData(payload)
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load analytics')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      active = false
    }
  }, [])

  const weeklyData = useMemo(() => data?.weeklyActivity ?? [], [data])
  const maxWeekly = useMemo(
    () => Math.max(1, ...weeklyData.map((item) => Number(item.count ?? 0))),
    [weeklyData]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your real preparation signals from quizzes, coding, and interviews</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
          <div className="text-3xl font-bold text-gray-900 mb-1">{data?.scores.averageQuizScore ?? 0}%</div>
          <div className="text-sm text-gray-600">Avg Quiz Score</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <Clock className="w-8 h-8 text-emerald-600 mb-3" />
          <div className="text-3xl font-bold text-gray-900 mb-1">{(data?.totals.totalStudyHours ?? 0).toFixed(1)}h</div>
          <div className="text-sm text-gray-600">Total Study Time</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <Target className="w-8 h-8 text-amber-600 mb-3" />
          <div className="text-3xl font-bold text-gray-900 mb-1">{data?.scores.codingAcceptanceRate ?? 0}%</div>
          <div className="text-sm text-gray-600">Coding Acceptance</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <Award className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-3xl font-bold text-gray-900 mb-1">{data?.scores.averageInterviewScore ?? 0}%</div>
          <div className="text-sm text-gray-600">Avg Interview Score</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Weekly Activity</h2>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center text-gray-600 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading analytics...</span>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2 h-64">
              {weeklyData.map((item, index) => (
                <motion.div
                  key={item.day}
                  initial={{ height: 0 }}
                  animate={{ height: `${(Number(item.count ?? 0) / maxWeekly) * 100}%` }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="flex-1 gradient-primary rounded-t-lg relative group"
                >
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition">
                    {item.count} activity
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-between mt-4">
              {weeklyData.map((item) => (
                <div key={item.day} className="flex-1 text-center text-sm text-gray-600">
                  {item.day}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

