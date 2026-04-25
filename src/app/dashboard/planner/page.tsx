'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Plus, CheckCircle, Clock, Loader2, Sparkles } from 'lucide-react'

type PlannerTask = {
  id: string
  title: string
  description: string
  type: 'learning' | 'practice' | 'revision' | 'quiz' | 'project'
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  estimatedTime: number
}

type ApiError = { error?: string }

export default function PlannerPage() {
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function loadPlan() {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/planner', { cache: 'no-store' })
      const data = (await response.json()) as { tasks?: PlannerTask[] } & ApiError
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load planner')
      }
      setTasks(data.tasks ?? [])
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load planner')
    } finally {
      setLoading(false)
    }
  }

  async function generatePlan() {
    try {
      setGenerating(true)
      setError('')
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'seed' }),
      })
      const data = (await response.json()) as { tasks?: PlannerTask[] } & ApiError
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate planner')
      }
      setTasks(data.tasks ?? [])
    } catch (genError: unknown) {
      setError(genError instanceof Error ? genError.message : 'Failed to generate planner')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlan()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks])
  const plannedMinutes = useMemo(
    () => tasks.reduce((total, task) => total + Number(task.estimatedTime ?? 0), 0),
    [tasks]
  )

  const toggleTask = (id: string) => {
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Planner</h1>
          <p className="text-gray-600">Your AI-generated plan based on your roadmap + weak areas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void generatePlan()}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate today
          </button>
          <button
            onClick={() => void loadPlan()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            <Plus className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <Calendar className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{completedCount}/{tasks.length}</div>
          <div className="text-sm opacity-90">Tasks Completed</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <Clock className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{(plannedMinutes / 60).toFixed(1)}h</div>
          <div className="text-sm opacity-90">Planned Study Time</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <CheckCircle className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{tasks.length}</div>
          <div className="text-sm opacity-90">Focus Blocks</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Tasks</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-gray-600 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your plan...</span>
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-4 p-6 hover:bg-gray-50 transition">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    task.completed
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'border-gray-300 hover:border-indigo-600'
                  }`}
                >
                  {task.completed && <CheckCircle className="w-5 h-5 text-white" />}
                </button>

                <div className="flex-1">
                  <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {task.type} • {task.estimatedTime} min
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  task.priority === 'high' ? 'bg-red-50 text-red-600' :
                  task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-gray-600">
              No plan yet. Click <span className="font-semibold">Generate today</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

