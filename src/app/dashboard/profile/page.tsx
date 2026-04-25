'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Briefcase, Edit2, Loader2, Mail, Sparkles, X } from 'lucide-react'

type ProfileResponse = {
  user: {
    id: string
    email: string
    name: string
    avatar?: string | null
    bio?: string | null
    college?: string | null
    graduationYear?: number | null
    targetRole?: string | null
    targetCompanies: string[]
    skillLevel?: string | null
    dailyStudyHours?: number | null
    role?: string | null
  }
  profile: {
    current_topic?: string | null
    progress?: { goal?: string; topics?: string[]; timeline?: string }
    weak_topics?: string[]
    strong_topics?: string[]
    readiness_scores?: Record<string, number> | null
    total_study_hours?: number
    consistency_streak?: number
    badges?: string[]
  } | null
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<ProfileResponse['user'] | null>(null)
  const [profileMeta, setProfileMeta] = useState<ProfileResponse['profile'] | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        setLoading(true)
        const response = await fetch('/api/profile', { cache: 'no-store' })
        const data = (await response.json()) as ProfileResponse & { error?: string }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile')
        }

        if (active) {
          setProfile(data.user)
          setProfileMeta(data.profile)
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load profile')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [])

  const name = profile?.name || session?.user?.name || 'Learner'
  const email = profile?.email || session?.user?.email || 'No email available'
  const displayBio = profile?.bio || 'Aspiring software engineer building career readiness with CourseCook.'
  const skills = profileMeta?.strong_topics?.length ? profileMeta.strong_topics : ['JavaScript', 'React', 'Node.js', 'Python', 'SQL']
  const sessionDailyStudyHours = (session?.user as { dailyStudyHours?: number } | undefined)?.dailyStudyHours

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Your verified account details and preparation profile</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          {editing ? (
            <>
              <X className="w-5 h-5" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your profile...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-indigo-600 shadow-lg">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Verified Google profile
                </div>
                <h2 className="text-3xl font-bold">{name}</h2>
                <p className="text-white/90 max-w-2xl">{displayBio}</p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-white/90">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" />{email}</span>
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" />{profile?.targetRole || session?.user?.role || 'Learner'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">Email</div>
                <div className="font-semibold text-gray-900 break-all">{email}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">College</div>
                <div className="font-semibold text-gray-900">{profile?.college || 'Not added yet'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">Target role</div>
                <div className="font-semibold text-gray-900">{profile?.targetRole || 'Not set'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">Study hours/day</div>
                <div className="font-semibold text-gray-900">{profile?.dailyStudyHours || sessionDailyStudyHours || 2} hrs</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Career Snapshot</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Skill Level</div>
                    <div className="font-semibold text-gray-900">{profile?.skillLevel || 'Intermediate'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Graduation</div>
                    <div className="font-semibold text-gray-900">{profile?.graduationYear || 'TBD'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Weak areas</div>
                    <div className="font-semibold text-gray-900">{profileMeta?.weak_topics?.length ? profileMeta.weak_topics.join(', ') : 'No weak areas yet'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-500 mb-1">Streak</div>
                    <div className="font-semibold text-gray-900">{profileMeta?.consistency_streak || 0} days</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Skills & Focus</h3>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill) => (
                    <span key={skill} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Current topic</div>
                  <div className="font-semibold text-gray-900">{profileMeta?.current_topic || 'No active roadmap yet'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
