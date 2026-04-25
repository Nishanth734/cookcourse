'use client'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, Menu, User as UserIcon, LogOut, Loader2 } from 'lucide-react'

interface NavbarProps {
  onToggleSidebar: () => void
}
type TopicContextResponse = {
  activeTopic?: string | null
  error?: string
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [activeTopic, setActiveTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadTopicContext() {
      try {
        const response = await fetch('/api/topic-context', { cache: 'no-store' })
        const data = (await response.json()) as TopicContextResponse

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load topic context')
        }

        if (!mounted) {
          return
        }

        const nextTopic = typeof data.activeTopic === 'string' ? data.activeTopic : ''
        setActiveTopic(nextTopic)
        setQuery((previous) => previous || nextTopic)
      } catch {
        // Keep the search usable even if context fetch fails.
      }
    }

    void loadTopicContext()

    return () => {
      mounted = false
    }
  }, [])

  async function handleTopicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTopic = query.trim()
    if (!nextTopic || submitting) {
      return
    }

    try {
      setSubmitting(true)
      setStatusMessage('')
      setStatusError(false)

      const response = await fetch('/api/topic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: nextTopic }),
      })

      const data = (await response.json()) as TopicContextResponse
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update topic')
      }

      const resolvedTopic =
        typeof data.activeTopic === 'string' && data.activeTopic.trim()
          ? data.activeTopic
          : nextTopic

      setActiveTopic(resolvedTopic)
      setQuery(resolvedTopic)
      setStatusMessage(`Personalization updated for ${resolvedTopic}`)

      window.dispatchEvent(
        new CustomEvent('course-topic-updated', {
          detail: { topic: resolvedTopic },
        })
      )

      await Promise.allSettled([
        fetch(`/api/quizzes?topic=${encodeURIComponent(resolvedTopic)}`, { cache: 'no-store' }),
        fetch(`/api/coding/problems?topic=${encodeURIComponent(resolvedTopic)}`, { cache: 'no-store' }),
      ])

      if (pathname !== '/dashboard/quizzes') {
        void router.prefetch(`/dashboard/quizzes?topic=${encodeURIComponent(resolvedTopic)}`)
      }

      if (pathname !== '/dashboard/interviews') {
        void router.prefetch(`/dashboard/interviews?topic=${encodeURIComponent(resolvedTopic)}`)
      }
    } catch (error: unknown) {
      setStatusError(true)
      setStatusMessage(error instanceof Error ? error.message : 'Failed to update topic')
    } finally {
      setSubmitting(false)
    }
  }

  const helperText = useMemo(() => {
    if (statusMessage) {
      return statusMessage
    }

    if (activeTopic) {
      return `Active course: ${activeTopic}`
    }

    return 'Set your active course to personalize quizzes and interviews.'
  }, [activeTopic, statusMessage])

  return (
    <header className="sticky top-0 z-40 px-6 py-4">
      <div className="glass rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/60 rounded-xl transition lg:hidden ring-soft"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <form onSubmit={handleTopicSubmit} className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Set active course (e.g., Web Development)"
                className="pl-10 pr-12 py-2.5 w-96 rounded-xl border border-white/20 bg-white/70 focus:border-indigo-300 focus:outline-none ring-soft"
              />
              <button
                type="submit"
                disabled={submitting || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-600 hover:bg-white/70 disabled:opacity-50"
                aria-label="Apply course topic"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            <div className={`mt-1 text-xs ${statusError ? 'text-red-600' : 'text-gray-500'}`}>
              {helperText}
            </div>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/60 rounded-xl transition relative ring-soft">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-white/20">
            <div className="text-right hidden md:block">
              <div className="font-semibold text-gray-900">{session?.user?.name || 'User'}</div>
              <div className="text-sm text-gray-600">{session?.user?.email}</div>
            </div>
            
            <div className="relative group">
              <button className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                {session?.user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
              </button>
              
              <div className="absolute right-0 mt-2 w-52 glass rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-2">
                  <a
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-white/60 rounded-xl mx-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Profile</span>
                  </a>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-500/10 w-[calc(100%-16px)] rounded-xl mx-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </header>
  )
}
