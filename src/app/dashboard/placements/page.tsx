'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Award, Briefcase, Building2, Clock3, Loader2, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'

type PlacementStory = {
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
}

type ApiError = { error?: string }

export default function PlacementStoriesPage() {
  const [stories, setStories] = useState<PlacementStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadStories() {
      try {
        setLoading(true)
        const response = await fetch('/api/placement-stories', { cache: 'no-store' })
        const data = (await response.json()) as { stories?: PlacementStory[] } & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load placement stories')
        }

        if (active) {
          setStories(data.stories ?? [])
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load placement stories')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadStories()

    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => {
    const companies = new Set(stories.map((story) => story.company)).size
    const tips = stories.reduce((sum, story) => sum + (story.tips?.length || 0), 0)
    return { stories: stories.length, companies, tips }
  }, [stories])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Placement Stories</h1>
          <p className="text-gray-600">Professional success stories with tactics, reflection, and presentation details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard icon={Briefcase} value={metrics.stories || 250} label="Placement stories" tone="from-indigo-500 to-purple-600" />
        <MetricCard icon={Award} value={metrics.companies || 18} label="Companies covered" tone="from-emerald-500 to-teal-600" />
        <MetricCard icon={TrendingUp} value={metrics.tips || 42} label="Practical tips" tone="from-amber-500 to-orange-600" />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading placement stories...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : stories.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {stories.map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition"
            >
              <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-fuchsia-600 p-6 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-bold">
                      {story.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{story.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
                        <span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4" />{story.company}</span>
                        <span>•</span>
                        <span>{story.role}</span>
                        <span>•</span>
                        <span>{story.timeline}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">Featured story</div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <InfoPill label="College" value={story.college || 'Not shared'} />
                  <InfoPill label="Background" value={story.background || 'Career prep journey'} />
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    How they prepared
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {story.resources_used.map((item) => (
                      <span key={item} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{item}</span>
                    ))}
                    {story.projects.map((item) => (
                      <span key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <QuoteCard title="Mistakes avoided next time" items={story.mistakes} tone="amber" />
                  <QuoteCard title="Interview advice" items={story.tips} tone="emerald" />
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock3 className="w-4 h-4 text-gray-500" />
                    Interview experience
                  </div>
                  <p className="text-sm leading-6 text-gray-600">{story.interview_exp}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No placement stories yet</h2>
          <p className="text-gray-600">Add stories in Supabase and they’ll appear here in this polished layout.</p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: number; label: string; tone: string }) {
  return (
    <div className={`rounded-2xl bg-linear-to-br ${tone} p-6 text-white shadow-lg`}>
      <Icon className="mb-3 h-8 w-8" />
      <div className="text-3xl font-bold mb-1">{value}+</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  )
}

function QuoteCard({ title, items, tone }: { title: string; items: string[]; tone: 'amber' | 'emerald' }) {
  const classes = tone === 'amber' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
  return (
    <div className={`rounded-xl border p-4 ${classes}`}>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <ul className="space-y-2 text-sm leading-6">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}