'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, MessageSquare, Plus, Sparkles, ThumbsUp, TrendingUp, Users, type LucideIcon } from 'lucide-react'

type CommunityPost = {
  id: string
  user_id: string
  authorName: string
  avatar: string
  title: string
  content: string
  likes: number
  commentsCount: number
  time: string
  topic: string
  type: string
}

type ApiError = { error?: string }

export default function CommunityPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [upvotingId, setUpvotingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('Interview Prep')
  const [type, setType] = useState('DISCUSSION')

  useEffect(() => {
    let active = true

    async function loadPosts() {
      try {
        setLoading(true)
        const response = await fetch('/api/community', { cache: 'no-store' })
        const data = (await response.json()) as { posts?: CommunityPost[] } & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load community posts')
        }

        if (active) {
          setPosts(data.posts ?? [])
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load community posts')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPosts()

    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => ({
    members: 2847,
    discussions: posts.length,
    weekly: posts.filter((post) => post.type !== 'NOTE_SHARE').length,
  }), [posts])

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !content.trim()) return

    try {
      setPosting(true)
      setError('')

      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, topic, type }),
      })

      const data = (await response.json()) as { post?: CommunityPost } & ApiError
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post')
      }

      if (data.post) {
        setPosts((previous) => [
          {
            ...data.post,
            authorName: session?.user?.name || 'You',
            avatar: (session?.user?.name || 'Y').charAt(0).toUpperCase(),
            likes: 0,
            commentsCount: 0,
            time: 'Just now',
          },
          ...previous,
        ])
      }

      setTitle('')
      setContent('')
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  async function handleUpvote(postId: string) {
    try {
      setUpvotingId(postId)
      const response = await fetch(`/api/community/${postId}/upvote`, { method: 'POST' })
      const data = (await response.json()) as ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upvote post')
      }

      setPosts((previous) => previous.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
    } catch (upvoteError: unknown) {
      setError(upvoteError instanceof Error ? upvoteError.message : 'Failed to upvote post')
    } finally {
      setUpvotingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
          <p className="text-gray-600">A cleaner, more professional discussion space for career prep and peer support</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard icon={Users} value={metrics.members} label="Active members" tone="from-indigo-500 to-purple-600" />
        <MetricCard icon={MessageSquare} value={metrics.discussions} label="Live discussions" tone="from-emerald-500 to-teal-600" />
        <MetricCard icon={TrendingUp} value={metrics.weekly} label="Weekly activity" tone="from-amber-500 to-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleCreatePost} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Create a post</h2>
          </div>

          <div className="grid gap-4">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="Share your question, insight, or win..." className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
              <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500">
                <option value="DISCUSSION">Discussion</option>
                <option value="QUESTION">Question</option>
                <option value="NOTE_SHARE">Note share</option>
                <option value="TIPS">Tips</option>
                <option value="DOUBT">Doubt</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={posting} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Publish
          </button>
        </form>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading community feed...</span>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white">
                    {post.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                      <span className="text-sm text-gray-500">{post.time}</span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{post.topic}</span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{post.type}</span>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h4>
                    <p className="text-gray-700 mb-4 leading-7">{post.content}</p>

                    <div className="flex flex-wrap items-center gap-5">
                      <button onClick={() => void handleUpvote(post.id)} disabled={upvotingId === post.id} className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition disabled:opacity-60">
                        {upvotingId === post.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <ThumbsUp className="w-5 h-5" />}
                        <span>{post.likes}</span>
                      </button>
                      <button className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition">
                        <MessageSquare className="w-5 h-5" />
                        <span>{post.commentsCount} Comments</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">
              No posts yet. Start the conversation with the form on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: number; label: string; tone: string }) {
  return (
    <div className={`rounded-2xl bg-linear-to-br ${tone} p-6 text-white shadow-lg`}>
      <Icon className="w-8 h-8 mb-3" />
      <div className="text-3xl font-bold mb-1">{value.toLocaleString()}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  )
}
