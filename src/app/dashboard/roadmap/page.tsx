'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ChevronRight, Clock, Map, Play } from 'lucide-react'
import Link from 'next/link'

type Roadmap = {
  id: string
  topic: string
  phases: Array<{
    name: string
    duration: string
    subtopics: Array<{
      name: string
      status?: 'completed' | 'in-progress' | 'pending'
    }>
  }>
}

type ApiError = {
  error?: string
}

function calculatePhaseProgress(
  subtopics: Array<{ status?: 'completed' | 'in-progress' | 'pending' }>
) {
  if (subtopics.length === 0) {
    return 0
  }

  const completedCount = subtopics.filter((subtopic) => subtopic.status === 'completed').length
  return Math.round((completedCount / subtopics.length) * 100)
}

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRoadmaps() {
      try {
        setLoading(true)
        const response = await fetch('/api/roadmap/generate', { cache: 'no-store' })
        const data = (await response.json()) as {
          roadmaps?: Roadmap[]
        } & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load roadmaps')
        }

        if (active) {
          setRoadmaps(data.roadmaps ?? [])
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load roadmaps')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRoadmaps()

    return () => {
      active = false
    }
  }, [])

  const activeRoadmap = useMemo(() => roadmaps[0] ?? null, [roadmaps])

  if (loading) {
    return <div className="rounded-xl bg-white p-6 border border-gray-200 text-gray-600">Loading your roadmap...</div>
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
  }

  if (!activeRoadmap) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Roadmap</h1>
          <p className="text-gray-600">Generate a roadmap during onboarding or from the planner to see it here.</p>
        </div>
        <div className="bg-white rounded-xl p-8 border border-dashed border-gray-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No roadmap found yet</h2>
          <p className="text-gray-600 mb-4">Once a roadmap is generated, this page will update automatically with live progress.</p>
          <Link href="/dashboard/planner" className="inline-flex items-center gap-2 px-5 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition">
            Open Planner
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Roadmap</h1>
          <p className="text-gray-600">Your personalized learning path for {activeRoadmap.topic}</p>
        </div>
        <Link href="/dashboard/resources" className="flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition">
          Browse Resources
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-6">
        {activeRoadmap.phases.map((phase, index) => {
          const progress = calculatePhaseProgress(phase.subtopics)

          return (
            <motion.div
              key={`${phase.name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Map className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">{phase.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{phase.duration}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">{progress}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="gradient-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="space-y-2">
                {phase.subtopics.map((subtopic, subIndex) => {
                  const completed = subtopic.status === 'completed'

                  return (
                    <div key={`${subtopic.name}-${subIndex}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                          {subtopic.name}
                        </span>
                      </div>
                      {!completed && (
                        <Link href={`/dashboard/resources?topic=${encodeURIComponent(subtopic.name)}`} className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          Start
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
