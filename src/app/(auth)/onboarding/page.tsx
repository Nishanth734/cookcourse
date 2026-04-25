'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, ArrowLeft, Target, BookOpen, TrendingUp, Briefcase, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const popularTopics = [
  'DSA', 'Web Development', 'Python', 'Java', 'Data Science',
  'System Design', 'DevOps', 'React', 'Machine Learning', 'Cybersecurity',
  'Mobile Development', 'Cloud Computing', 'Database Management', 'API Development'
]

function normalizeTopicToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function resolvePopularTopic(value: string) {
  const normalized = normalizeTopicToken(value)
  if (!normalized) {
    return ''
  }

  const exact = popularTopics.find((topic) => normalizeTopicToken(topic) === normalized)
  if (exact) {
    return exact
  }

  const fuzzy = popularTopics.find((topic) => {
    const candidate = normalizeTopicToken(topic)
    return candidate.includes(normalized) || normalized.includes(candidate)
  })

  return fuzzy ?? value.trim()
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTopic = useMemo(
    () => resolvePopularTopic(searchParams.get('topic')?.trim() ?? ''),
    [searchParams]
  )
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => ({
    goal: '',
    topics: preselectedTopic ? [preselectedTopic] : [] as string[],
    skillLevel: '',
    targetCompanies: [] as string[],
    studyHours: 2,
    timeline: ''
  }))

  const goals = [
    { id: 'job', label: 'Get a Job', icon: Briefcase, description: 'Land your dream tech job' },
    { id: 'internship', label: 'Get an Internship', icon: Target, description: 'Start your career journey' },
    { id: 'skills', label: 'Learn New Skills', icon: BookOpen, description: 'Level up your knowledge' },
    { id: 'placement', label: 'Placement Prep', icon: TrendingUp, description: 'Ace campus placements' }
  ]

  useEffect(() => {
    if (!preselectedTopic) {
      return
    }

    setFormData((previous) => {
      if (previous.topics.includes(preselectedTopic)) {
        return previous
      }

      return {
        ...previous,
        topics: [preselectedTopic, ...previous.topics].slice(0, 5),
      }
    })
  }, [preselectedTopic])

  const skillLevels = [
    { id: 'BEGINNER', label: 'Beginner', description: 'Just starting out' },
    { id: 'INTERMEDIATE', label: 'Intermediate', description: 'Some experience' },
    { id: 'ADVANCED', label: 'Advanced', description: 'Looking to master' }
  ]

  const topCompanies = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple',
    'Adobe', 'Atlassian', 'TCS', 'Infosys', 'Wipro',
    'Accenture', 'Deloitte', 'Startup', 'Other'
  ]

  const handleTopicToggle = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }))
  }

  const handleCompanyToggle = (company: string) => {
    setFormData(prev => ({
      ...prev,
      targetCompanies: prev.targetCompanies.includes(company)
        ? prev.targetCompanies.filter(c => c !== company)
        : [...prev.targetCompanies, company]
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Save onboarding data to user profile
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Kick off dynamic generation using onboarding answers (best effort).
        const primaryTopic = formData.topics[0]
        await Promise.allSettled([
          primaryTopic
            ? fetch('/api/roadmap/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  topic: primaryTopic,
                  skillLevel: formData.skillLevel,
                  targetCompany: formData.targetCompanies[0] || null,
                  timeline: formData.timeline || null,
                  dailyHours: formData.studyHours,
                }),
              })
            : Promise.resolve(null),
          fetch('/api/quizzes', { cache: 'no-store' }),
          fetch('/api/coding/problems', { cache: 'no-store' }),
          fetch('/api/projects', { cache: 'no-store' }),
        ])

        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.goal !== ''
      case 2: return formData.topics.length > 0
      case 3: return formData.skillLevel !== ''
      case 4: return formData.targetCompanies.length > 0
      case 5: return formData.studyHours > 0
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">CourseCook</span>
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'gradient-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-gray-600">
          Step {step} of 5
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Goal */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">What&apos;s your goal?</h1>
              <p className="text-lg text-gray-600 mb-8">Choose what you want to achieve with CourseCook</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setFormData(prev => ({ ...prev, goal: goal.id }))}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      formData.goal === goal.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <goal.icon className={`w-8 h-8 mb-3 ${
                      formData.goal === goal.id ? 'text-indigo-600' : 'text-gray-600'
                    }`} />
                    <div className="font-semibold text-gray-900 mb-1">{goal.label}</div>
                    <div className="text-sm text-gray-600">{goal.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Topics */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">What do you want to learn?</h1>
              <p className="text-lg text-gray-600 mb-8">Select one or more topics you&apos;re interested in</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicToggle(topic)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.topics.includes(topic)
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{topic}</div>
                    {formData.topics.includes(topic) && (
                      <CheckCircle className="w-4 h-4 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Skill Level */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">What&apos;s your current skill level?</h1>
              <p className="text-lg text-gray-600 mb-8">This helps us create the right learning path for you</p>

              <div className="space-y-4">
                {skillLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setFormData(prev => ({ ...prev, skillLevel: level.id }))}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      formData.skillLevel === level.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Target Companies */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Which companies are you targeting?</h1>
              <p className="text-lg text-gray-600 mb-8">Select companies you&apos;d like to prepare for</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {topCompanies.map((company) => (
                  <button
                    key={company}
                    onClick={() => handleCompanyToggle(company)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.targetCompanies.includes(company)
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{company}</div>
                    {formData.targetCompanies.includes(company) && (
                      <CheckCircle className="w-4 h-4 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 5: Study Time */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">How much time can you dedicate daily?</h1>
              <p className="text-lg text-gray-600 mb-8">This helps us create a realistic study plan</p>

              <div className="bg-white p-8 rounded-xl border-2 border-gray-200">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-indigo-600 mb-2">
                    {formData.studyHours}
                  </div>
                  <div className="text-xl text-gray-600">hours per day</div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={formData.studyHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, studyHours: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>1 hour</span>
                  <span>4 hours</span>
                  <span>8 hours</span>
                </div>

                <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
                  <div className="font-semibold text-indigo-900 mb-1">💡 Recommendation</div>
                  <div className="text-sm text-indigo-700">
                    {formData.studyHours <= 2 && 'Consistent daily practice is key. Even 1-2 hours can lead to great progress!'}
                    {formData.studyHours > 2 && formData.studyHours <= 4 && 'Great commitment! This pace will help you progress quickly.'}
                    {formData.studyHours > 4 && 'Intensive preparation! You\'ll be job-ready in no time.'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-8 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 px-8 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Your Roadmap...' : 'Get Started'}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
