import { supabaseAdmin } from '@/lib/supabase'

type ProgressRecord = Record<string, unknown> & {
  topics?: string[]
}

type ProfileRecord = {
  current_topic?: string | null
  progress?: unknown
}

function normalizeTopicForComparison(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function toTopicCase(value: string) {
  return value
    .split(' ')
    .map((word) => {
      if (!word) return word
      if (word.length <= 2) return word.toUpperCase()
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')
}

function parseProgress(progress: unknown): ProgressRecord {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    return {}
  }

  return progress as ProgressRecord
}

function dedupeTopics(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const normalized = normalizeTopicInput(value)
    if (!normalized) {
      return
    }

    const key = normalizeTopicForComparison(normalized)
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    result.push(normalized)
  })

  return result
}

export function normalizeTopicInput(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return ''
  }

  return toTopicCase(compact)
}

export async function getUserTopicContext(userId: string) {
  const [profileResult, roadmapResult] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('current_topic, progress')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('roadmaps')
      .select('topic')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileResult.error) {
    throw profileResult.error
  }

  if (roadmapResult.error) {
    throw roadmapResult.error
  }

  const profile = profileResult.data as ProfileRecord | null
  const progress = parseProgress(profile?.progress)
  const progressTopics = Array.isArray(progress.topics) ? progress.topics : []
  const latestRoadmapTopic =
    typeof roadmapResult.data?.topic === 'string' ? roadmapResult.data.topic : ''

  const topics = dedupeTopics([
    profile?.current_topic ?? '',
    ...progressTopics,
    latestRoadmapTopic,
  ]).slice(0, 8)

  return {
    activeTopic: topics[0] ?? null,
    topics,
  }
}

export async function updateUserTopicContext(userId: string, topic: string) {
  const normalizedTopic = normalizeTopicInput(topic)

  if (!normalizedTopic) {
    return getUserTopicContext(userId)
  }

  const profileResult = await supabaseAdmin
    .from('user_profiles')
    .select('current_topic, progress')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileResult.error) {
    throw profileResult.error
  }

  const profile = profileResult.data as ProfileRecord | null
  const progress = parseProgress(profile?.progress)
  const progressTopics = Array.isArray(progress.topics) ? progress.topics : []

  const topics = dedupeTopics([
    normalizedTopic,
    profile?.current_topic ?? '',
    ...progressTopics,
  ]).slice(0, 8)

  const nextProgress: ProgressRecord = {
    ...progress,
    topics,
    lastTopicUpdatedAt: new Date().toISOString(),
  }

  const { error: updateError } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        current_topic: normalizedTopic,
        progress: nextProgress,
      },
      { onConflict: 'user_id' }
    )

  if (updateError) {
    throw updateError
  }

  return {
    activeTopic: topics[0] ?? normalizedTopic,
    topics,
  }
}
