'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  CheckCircle,
  Code,
  Loader2,
  Play,
  Trophy,
} from 'lucide-react'

type CodingProblem = {
  id: string
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  description: string
  examples: Array<{
    input: string
    output: string
    explanation?: string
  }>
  constraints: string
  hints: string[]
  editorial?: string | null
  testCases?: Array<{
    input: string
    output: string
  }>
  companyTags: string[]
  acceptanceRate?: number | null
  submissions: number
  solved: boolean
}

type CodingStats = {
  problemsSolved: number
  acceptanceRate: number
  totalSubmissions: number
}

type SubmissionResult = {
  status: string
  feedback: string
}

type ApiError = {
  error?: string
}

const starterTemplates: Record<string, string> = {
  javascript: `function solve(input) {
  // Write your solution here
  return input;
}`,
  python: `def solve(input):
    # Write your solution here
    return input`,
}

export default function CodingPage() {
  const [problems, setProblems] = useState<CodingProblem[]>([])
  const [stats, setStats] = useState<CodingStats>({
    problemsSolved: 0,
    acceptanceRate: 0,
    totalSubmissions: 0,
  })
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript')
  const [code, setCode] = useState(starterTemplates.javascript)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === selectedProblemId) ?? null,
    [problems, selectedProblemId]
  )

  function resetEditor(nextLanguage: 'javascript' | 'python') {
    setCode(starterTemplates[nextLanguage])
    setSubmissionResult(null)
  }

  const loadProblems = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/coding/problems', { cache: 'no-store' })
      const data = (await response.json()) as {
        problems?: CodingProblem[]
        stats?: CodingStats
      } & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch coding problems')
      }

      const nextProblems = data.problems ?? []
      setProblems(nextProblems)
      setStats(
        data.stats ?? {
          problemsSolved: 0,
          acceptanceRate: 0,
          totalSubmissions: 0,
        }
      )
      setSelectedProblemId((previous) => {
        const nextSelectedId =
          previous && nextProblems.some((problem) => problem.id === previous)
            ? previous
            : nextProblems[0]?.id ?? null

        if (nextSelectedId !== previous) {
          resetEditor(language)
        }

        return nextSelectedId
      })
    } catch (fetchError: unknown) {
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to fetch coding problems'
      )
    } finally {
      setLoading(false)
    }
  }, [language])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProblems()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadProblems])

  async function handleSubmit() {
    if (!selectedProblem) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSubmissionResult(null)

      const response = await fetch(`/api/coding/problems/${selectedProblem.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
        }),
      })

      const data = (await response.json()) as SubmissionResult & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit solution')
      }

      setSubmissionResult({
        status: data.status,
        feedback: data.feedback,
      })
      await loadProblems()
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to submit solution'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coding Arena</h1>
          <p className="text-gray-600">Solve live problems, submit code, and track acceptance.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-indigo-600 mb-1">{stats.problemsSolved}</div>
          <div className="text-sm text-gray-600">Problems Solved</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.acceptanceRate}%</div>
          <div className="text-sm text-gray-600">Acceptance Rate</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-amber-600 mb-1">{stats.totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 border border-gray-200 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading coding problems...</span>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Problem</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Difficulty</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem, index) => (
                    <motion.tr
                      key={problem.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => {
                        setSelectedProblemId(problem.id)
                        resetEditor(language)
                      }}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        selectedProblemId === problem.id ? 'bg-indigo-50/60' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        {problem.solved ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{problem.title}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            problem.difficulty === 'EASY'
                              ? 'bg-emerald-50 text-emerald-600'
                              : problem.difficulty === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{problem.submissions}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {selectedProblem ? (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedProblem.title}</h2>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedProblem.topic} • {selectedProblem.companyTags.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={language}
                      onChange={(event) => {
                        const nextLanguage = event.target.value as 'javascript' | 'python'
                        setLanguage(nextLanguage)
                        resetEditor(nextLanguage)
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                    </select>
                    <button
                      onClick={() => void handleSubmit()}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Submit
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Problem</h3>
                    <p className="text-gray-700">{selectedProblem.description}</p>
                  </section>

                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Examples</h3>
                    <div className="space-y-3">
                      {selectedProblem.examples.map((example, index) => (
                        <div key={`${selectedProblem.id}-example-${index}`} className="rounded-lg bg-gray-50 p-4 text-sm">
                          <div><span className="font-medium">Input:</span> {example.input}</div>
                          <div><span className="font-medium">Output:</span> {example.output}</div>
                          {example.explanation && (
                            <div><span className="font-medium">Explanation:</span> {example.explanation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Constraints</h3>
                    <p className="text-sm text-gray-700">{selectedProblem.constraints}</p>
                  </section>

                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Hints</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {selectedProblem.hints.map((hint) => (
                        <li key={hint}>• {hint}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Code</h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <Editor
                        height="420px"
                        language={language === 'javascript' ? 'javascript' : 'python'}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value ?? '')}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          tabSize: 2,
                          wordWrap: 'on',
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                        }}
                      />
                    </div>
                  </section>

                  {selectedProblem.testCases && selectedProblem.testCases.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-900 mb-2">Visible Test Cases</h3>
                      <div className="space-y-2">
                        {selectedProblem.testCases.map((testCase, index) => (
                          <div key={`${selectedProblem.id}-test-${index}`} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                            <div><span className="font-medium">Input:</span> {testCase.input}</div>
                            <div><span className="font-medium">Expected:</span> {testCase.output}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {submissionResult && (
                    <section
                      className={`rounded-xl p-4 border ${
                        submissionResult.status === 'ACCEPTED'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold mb-2">
                        {submissionResult.status === 'ACCEPTED' ? (
                          <Trophy className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Code className="w-5 h-5 text-amber-600" />
                        )}
                        <span>{submissionResult.status}</span>
                      </div>
                      <p className="text-sm text-gray-700">{submissionResult.feedback}</p>
                    </section>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-gray-600">
                Select a problem to start solving.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
