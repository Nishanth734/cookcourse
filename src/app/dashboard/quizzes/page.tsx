'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Clock,
  HelpCircle,
  Loader2,
  Play,
  Search,
  Sparkles,
  Trophy,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

type QuizItem = {
  id: string
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  questionCount: number
  timeLimit: number | null
  questions: QuizQuestion[]
  attempts: number
  bestScore: number
}

type QuizResult = {
  score: number
  correctCount: number
  totalQuestions: number
  results: Array<{
    id: string
    question: string
    selectedAnswer: number | null
    correctAnswer: number
    isCorrect: boolean
    explanation: string
    options: string[]
  }>
}

type QuizStats = {
  completed: number
  averageScore: number
  timeSpentMinutes: number
}

type ApiError = {
  error?: string
}

type QuizzesResponse = {
  quizzes?: QuizItem[]
  stats?: QuizStats
  activeTopic?: string | null
  availableTopics?: string[]
} & ApiError

export default function QuizzesPage() {
  const searchParams = useSearchParams()
  const urlTopic = searchParams.get('topic')?.trim() ?? ''
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [stats, setStats] = useState<QuizStats>({
    completed: 0,
    averageScore: 0,
    timeSpentMinutes: 0,
  })
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeTopic, setActiveTopic] = useState('')
  const [topicFilter, setTopicFilter] = useState(urlTopic)
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL')
  const [availableTopics, setAvailableTopics] = useState<string[]>([])

  async function loadQuizzes() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/quizzes', { cache: 'no-store' })
      const data = (await response.json()) as {
        quizzes?: QuizItem[]
        stats?: QuizStats
      } & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quizzes')
      }

      setQuizzes(data.quizzes ?? [])
      setStats(data.stats ?? { completed: 0, averageScore: 0, timeSpentMinutes: 0 })
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuizzes()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  function startQuiz(quiz: QuizItem) {
    setActiveQuiz(quiz)
    setAnswers({})
    setResult(null)
    setError('')
  }

  function selectAnswer(questionId: string, optionIndex: number) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionIndex,
    }))
  }

  async function submitQuiz() {
    if (!activeQuiz) {
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`/api/quizzes/${activeQuiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          timeTaken: activeQuiz.timeLimit ?? 0,
        }),
      })

      const data = (await response.json()) as QuizResult & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quiz')
      }

      setResult({
        score: data.score,
        correctCount: data.correctCount,
        totalQuestions: data.totalQuestions,
        results: data.results,
      })
      await loadQuizzes()
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const practiceHours = useMemo(
    () => (stats.timeSpentMinutes / 60).toFixed(1),
    [stats.timeSpentMinutes]
  )

  const answeredCount = activeQuiz
    ? activeQuiz.questions.filter((question) => answers[question.id] !== undefined).length
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
          <p className="text-gray-600">Start quizzes, answer live questions, and save your results.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <Trophy className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.completed}</div>
          <div className="text-sm opacity-90">Quizzes Completed</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <TrendingUp className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.averageScore}%</div>
          <div className="text-sm opacity-90">Average Score</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <Clock className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{practiceHours}h</div>
          <div className="text-sm opacity-90">Time Spent</div>
        </div>
      </div>

      {activeQuiz ? (
        <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeQuiz.title}</h2>
              <p className="text-sm text-gray-600">
                {answeredCount}/{activeQuiz.questions.length} answered
                {activeQuiz.timeLimit ? ` • ${activeQuiz.timeLimit} min suggested` : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveQuiz(null)
                  setAnswers({})
                  setResult(null)
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
              >
                Back to Quizzes
              </button>
              <button
                onClick={() => void submitQuiz()}
                disabled={submitting || answeredCount !== activeQuiz.questions.length}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {activeQuiz.questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">{question.question}</div>
                    <div className="text-xs text-gray-500">{question.difficulty}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex

                    return (
                      <button
                        key={`${question.id}-${optionIndex}`}
                        onClick={() => selectAnswer(question.id, optionIndex)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="text-lg font-bold text-emerald-900 mb-2">
                Score: {result.score}% ({result.correctCount}/{result.totalQuestions})
              </div>
              <div className="space-y-3">
                {result.results.map((item) => (
                  <div key={item.id} className="rounded-lg bg-white p-4 border border-emerald-100">
                    <div className="flex items-start gap-2 mb-2">
                      <CheckCircle2 className={`w-5 h-5 mt-0.5 ${item.isCorrect ? 'text-emerald-600' : 'text-red-500'}`} />
                      <div>
                        <div className="font-medium text-gray-900">{item.question}</div>
                        <div className="text-sm text-gray-600">
                          Your answer: {item.selectedAnswer !== null ? item.options[item.selectedAnswer] : 'Not answered'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Correct answer: {item.options[item.correctAnswer]}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{item.explanation}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="rounded-xl bg-white p-8 border border-gray-200 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading quizzes...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                      <span>{quiz.questionCount} questions</span>
                      <span>•</span>
                      <span>{quiz.topic}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded">{quiz.difficulty}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Best Score</div>
                    <div className="text-xl font-bold text-emerald-600">{quiz.bestScore || 0}%</div>
                    <div className="text-xs text-gray-500">{quiz.attempts} attempts</div>
                  </div>
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
