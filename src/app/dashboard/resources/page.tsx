'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Bookmark,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Search,
  Star,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type ResourceItem = {
  id: string
  title: string
  description: string
  type: 'VIDEO' | 'ARTICLE' | 'COURSE' | 'PLAYLIST' | 'BOOK' | 'DOC' | 'CODING_SHEET'
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
  bookmarked: boolean
}

type ApiError = {
  error?: string
}

const typeFilters = [
  { label: 'All', value: 'all' },
  { label: 'Courses', value: 'COURSE' },
  { label: 'Docs', value: 'DOC' },
  { label: 'Sheets', value: 'CODING_SHEET' },
  { label: 'Videos', value: 'VIDEO' },
]

export default function ResourcesPage() {
  const searchParams = useSearchParams()
  const urlTopic = searchParams.get('topic') ?? ''

  const [resources, setResources] = useState<ResourceItem[]>([])
  const [topic, setTopic] = useState(urlTopic)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadResources() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        const activeTopic = topic.trim() || urlTopic.trim()
        if (activeTopic) {
          params.set('topic', activeTopic)
        }
        if (search.trim()) {
          params.set('search', search.trim())
        }
        if (filter !== 'all') {
          params.set('type', filter)
        }
        if (bookmarkedOnly) {
          params.set('bookmarked', 'true')
        }

        const response = await fetch(`/api/resources?${params.toString()}`, {
          cache: 'no-store',
        })
        const data = (await response.json()) as { resources?: ResourceItem[] } & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch resources')
        }

        if (active) {
          setResources(data.resources ?? [])
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch resources')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadResources()
    }, 150)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [topic, search, filter, bookmarkedOnly, urlTopic])

  async function toggleBookmark(resourceId: string, bookmarked: boolean) {
    try {
      setPendingBookmarkId(resourceId)
      setResources((previous) =>
        previous.map((resource) =>
          resource.id === resourceId ? { ...resource, bookmarked } : resource
        )
      )

      const response = await fetch(`/api/resources/${resourceId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked }),
      })

      const data = (await response.json()) as ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bookmark')
      }
    } catch (bookmarkError: unknown) {
      setResources((previous) =>
        previous.map((resource) =>
          resource.id === resourceId ? { ...resource, bookmarked: !bookmarked } : resource
        )
      )
      setError(bookmarkError instanceof Error ? bookmarkError.message : 'Failed to update bookmark')
    } finally {
      setPendingBookmarkId(null)
    }
  }

  const resultLabel = useMemo(() => {
    if (loading) {
      return 'Loading resources...'
    }
    return `${resources.length} resource${resources.length === 1 ? '' : 's'} found`
  }, [loading, resources.length])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
          <p className="text-gray-600">Live curated resources from your database, with topic filters and bookmarks.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, platform, topic..."
              className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
            />
          </label>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Filter by topic"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => setBookmarkedOnly((previous) => !previous)}
            className={`rounded-lg px-4 py-3 font-medium transition ${
              bookmarkedOnly ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Saved Only
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          {typeFilters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === item.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">{resultLabel}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 border border-gray-200 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading resources...</span>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                    {resource.type}
                  </span>
                </div>
                <button
                  onClick={() => void toggleBookmark(resource.id, !resource.bookmarked)}
                  disabled={pendingBookmarkId === resource.id}
                  className="text-gray-400 hover:text-indigo-600 transition disabled:opacity-60"
                  aria-label={resource.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {pendingBookmarkId === resource.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bookmark className={`w-5 h-5 ${resource.bookmarked ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                  )}
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.description}</p>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-700">{resource.topic}</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{resource.difficulty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{resource.rating ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{resource.duration || 'Self-paced'}</span>
                </div>
                <div>{resource.platform}{resource.instructor ? ` • ${resource.instructor}` : ''}</div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                View Resource
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-8 border border-dashed border-gray-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h2>
          <p className="text-gray-600 mb-3">
            The page is live now, but your `resources` table does not currently match the active filters.
          </p>
          <p className="text-sm text-gray-500">
            If you want, send me the resource API or dataset source next and I&apos;ll wire ingestion/population too.
          </p>
        </div>
      )}
    </div>
  )
}
