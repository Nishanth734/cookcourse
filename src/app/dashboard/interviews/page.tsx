'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  Camera,
  Loader2,
  Mic,
  Play,
  Sparkles,
  TrendingUp,
  Video,
  ShieldAlert,
  ShieldCheck,
  Fullscreen,
  Square,
} from 'lucide-react'

type InterviewQuestion = {
  question: string
  expectedAnswer: string
  hints: string[]
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

type InterviewFeedback = {
  technicalScore: number
  communicationScore: number
  confidenceScore: number
  clarityScore: number
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
}

type InterviewHistoryItem = {
  id: string
  topic: string
  type: string
  created_at: string
  overallScore: number
  latestFeedback?: {
    strengths?: string[]
  } | null
}

type InterviewResponse = {
  interview: {
    id: string
    topic: string
    type: string
  }
  currentQuestion: InterviewQuestion
  currentQuestionIndex: number
  totalQuestions: number
}

type InterviewStats = {
  completed: number
  averageScore: number
  practiceTimeMinutes: number
}

type ApiError = {
  error?: string
}

const interviewTypes = ['TECHNICAL', 'DSA', 'HR', 'BEHAVIORAL', 'SYSTEM_DESIGN']

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function InterviewsPage() {
  const [topic, setTopic] = useState('Data Structures and Algorithms')
  const [role, setRole] = useState('Software Engineer')
  const [interviewType, setInterviewType] = useState('TECHNICAL')
  const [questionCount, setQuestionCount] = useState(5)
  const [answer, setAnswer] = useState('')
  const [currentInterview, setCurrentInterview] = useState<InterviewResponse | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [latestFeedback, setLatestFeedback] = useState<InterviewFeedback | null>(null)
  const [history, setHistory] = useState<InterviewHistoryItem[]>([])
  const [stats, setStats] = useState<InterviewStats>({
    completed: 0,
    averageScore: 0,
    practiceTimeMinutes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [strictModeActive, setStrictModeActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [violationMessage, setViolationMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const interviewStageRef = useRef<HTMLDivElement | null>(null)
  const strictModeStartedRef = useRef(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  async function attachStreamToVideo() {
    const stream = mediaStreamRef.current
    const video = videoRef.current
    if (!stream || !video) {
      return
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    try {
      await video.play()
    } catch {
      // Ignore autoplay/play failures; user can still proceed.
    }
  }

  function hasLiveMediaStream() {
    const stream = mediaStreamRef.current
    if (!stream) {
      return false
    }

    const tracks = stream.getTracks()
    return tracks.length > 0 && tracks.every((track) => track.readyState === 'live')
  }

  function cleanupRecording() {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } catch {
      // Ignore stop errors
    }
    mediaRecorderRef.current = null

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    strictModeStartedRef.current = false

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl)
      setRecordingUrl('')
    }

    recordedChunksRef.current = []
    setCameraReady(false)
    setIsRecording(false)
    
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setElapsedTime(0)
  }

  function startTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function flagViolation(message: string) {
    setViolationMessage(message)
    setError(message)
    setStrictModeActive(false)
    cleanupRecording()
    setCurrentInterview(null)
    setCurrentQuestionIndex(0)
    setAnswer('')
    setLatestFeedback(null)
  }

  async function enterFullscreen() {
    const target = interviewStageRef.current ?? document.documentElement

    if (!document.fullscreenElement && target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' as FullscreenNavigationUI })
    }
  }

  async function startStrictMonitoring() {
    try {
      setCameraError('')
      setViolationMessage('')
      setRecordingUrl('')

      if (!document.fullscreenElement) {
        await enterFullscreen()
      }
      setIsFullscreen(Boolean(document.fullscreenElement))

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera and microphone are not supported in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      })

      mediaStreamRef.current = stream
      await attachStreamToVideo()

      const preferredTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recordedChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
        recordedChunksRef.current = []
        setIsRecording(false)
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000)
      setCameraReady(true)
      setIsRecording(true)

      // Start the interview timer
      startTimer()

      setStrictModeActive(true)
    } catch (mediaError: unknown) {
      const message = mediaError instanceof Error ? mediaError.message : 'Camera and microphone access is required.'
      setCameraError(message)
      cleanupRecording()
      setStrictModeActive(false)
      throw mediaError
    }
  }

  async function handleStartInterview() {
    try {
      setStarting(true)
      setError('')
      setViolationMessage('')
      setLatestFeedback(null)
      setAnswer('')

      // Always ensure we have a live media stream before starting strict mode.
      if (!hasLiveMediaStream()) {
        cleanupRecording()
        await startStrictMonitoring()
        strictModeStartedRef.current = true
      } else {
        setCameraReady(true)
        setIsRecording(Boolean(mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive'))
        await attachStreamToVideo()
        if (!document.fullscreenElement) {
          await enterFullscreen()
        }
        setIsFullscreen(Boolean(document.fullscreenElement))
        setStrictModeActive(true)
      }

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          role,
          interviewType,
          questionCount,
        }),
      })

      const data = (await response.json()) as InterviewResponse & ApiError
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start interview')
      }

      setCurrentInterview(data)
      setCurrentQuestionIndex(data.currentQuestionIndex ?? 0)
      await loadHistory()
    } catch (startError: unknown) {
      setStrictModeActive(false)
      cleanupRecording()
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch {
          // Ignore fullscreen exit errors on failed start.
        }
      }
      setError(startError instanceof Error ? startError.message : 'Failed to start interview')
    } finally {
      setStarting(false)
    }
  }

  async function loadHistory() {
    try {
      setLoading(true)
      const response = await fetch('/api/interviews', { cache: 'no-store' })
      const data = (await response.json()) as {
        interviews?: InterviewHistoryItem[]
        stats?: InterviewStats
      } & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch interviews')
      }

      setHistory(data.interviews ?? [])
      setStats(data.stats ?? { completed: 0, averageScore: 0, practiceTimeMinutes: 0 })
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch interviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory()
    }, 0)

    const onVisibilityChange = () => {
      if (strictModeActive && document.hidden) {
        flagViolation('Interview ended: tab switching is not allowed in strict mode.')
      }
    }

    const onBlur = () => {
      if (strictModeActive) {
        flagViolation('Interview ended: leaving the interview window is not allowed.')
      }
    }

    const onFullscreenChange = () => {
      const fullscreenNow = Boolean(document.fullscreenElement)
      setIsFullscreen(fullscreenNow)

      if (strictModeActive && !fullscreenNow) {
        flagViolation('Interview ended: fullscreen mode is required throughout the session.')
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!strictModeActive) {
        return
      }

      const blockedKeys = ['F11', 'Escape']
      if (blockedKeys.includes(event.key) || (event.altKey && event.key === 'Tab')) {
        event.preventDefault()
        flagViolation('Interview ended: tab switching and fullscreen escape are disabled in strict mode.')
      }
    }

    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      window.clearTimeout(timer)

      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('keydown', onKeyDown, true)
      cleanupRecording()
    }
  }, [strictModeActive])

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
    }
  }, [recordingUrl])

  useEffect(() => {
    if (strictModeActive) {
      void attachStreamToVideo()
    }
  }, [strictModeActive, currentInterview])

  async function handleSubmitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentInterview || !answer.trim()) {
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`/api/interviews/${currentInterview.interview.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          questionIndex: currentQuestionIndex,
        }),
      })

      const data = (await response.json()) as {
        feedback: InterviewFeedback
        completed: boolean
        nextQuestionIndex: number
        nextQuestion: InterviewQuestion
      } & ApiError
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      setLatestFeedback(data.feedback)
      setAnswer('')

      if (data.completed) {
        setCurrentInterview(null)
        setCurrentQuestionIndex(0)
        setStrictModeActive(false)
        cleanupRecording()
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      } else {
        setCurrentInterview((previous) =>
          previous
            ? {
                ...previous,
                currentQuestion: data.nextQuestion,
              }
            : previous
        )
        setCurrentQuestionIndex(data.nextQuestionIndex)
      }

      await loadHistory()
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const currentQuestion = currentInterview?.currentQuestion ?? null
  const practiceHours = useMemo(
    () => (stats.practiceTimeMinutes / 60).toFixed(1),
    [stats.practiceTimeMinutes]
  )

  const strictChecklist = [
    { label: 'Camera active', ok: cameraReady },
    { label: 'Microphone active', ok: cameraReady },
    { label: 'Fullscreen locked', ok: isFullscreen },
    { label: 'Recording enabled', ok: isRecording },
  ]

  if (strictModeActive) {
    return (
      <div ref={interviewStageRef} className="fixed inset-0 z-50 bg-gray-950 text-gray-100 p-4 overflow-auto">
        {(error || cameraError || violationMessage) && (
          <div className="space-y-3 mb-4">
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
            {cameraError && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">{cameraError}</div>}
            {violationMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{violationMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Header with Timer and Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm font-semibold text-indigo-200">Strict interview live</div>
              <div className="text-gray-300 text-sm">
                {currentInterview
                  ? `Question ${currentQuestionIndex + 1} / ${currentInterview.totalQuestions} • ${currentInterview.interview.type}`
                  : `Preparing questions... • ${interviewType.replace('_', ' ')}`}
              </div>
            </div>
            {/* Timer Display */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <Clock className="w-5 h-5 text-indigo-300" />
              <span className="text-2xl font-mono font-bold text-indigo-100">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                if (document.fullscreenElement) {
                  await document.exitFullscreen()
                } else {
                  await enterFullscreen()
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-white/10 bg-white/5 text-gray-100 font-semibold hover:bg-white/10 transition"
            >
              {isFullscreen ? <Square className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>
            <button
              onClick={() => {
                setStrictModeActive(false)
                cleanupRecording()
                setCurrentInterview(null)
                setCurrentQuestionIndex(0)
                setAnswer('')
                setLatestFeedback(null)
                void (async () => {
                  if (document.fullscreenElement) {
                    await document.exitFullscreen()
                  }
                })()
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
            >
              End interview
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid gap-4 md:grid-cols-4 mb-4">
          {strictChecklist.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 flex items-center gap-3 ${
                item.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/5 text-gray-200'
              }`}
            >
              {item.ok ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Main Interview Layout: Left (Camera + Question) + Right (Answer) */}
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] h-[calc(100vh-220px)]">
          {/* Left Column: Camera (top) + Question (bottom-left) */}
          <div className="flex flex-col gap-4 h-full">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-indigo-300" />
                <span className="text-sm font-semibold text-gray-200">Camera Preview</span>
                {cameraReady && <span className="ml-auto text-xs text-emerald-400">● Live</span>}
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Mic className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Microphone active</span>
                {isRecording && <span className="ml-auto text-xs text-red-400">● Recording</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 h-[34%] min-h-55 overflow-auto">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                <span className="text-sm font-semibold text-gray-200">Question</span>
              </div>
              {currentQuestion ? (
                <>
                  <div className="text-lg font-semibold text-white leading-7">{currentQuestion.question}</div>
                  <div className="mt-3 inline-flex items-center px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium">
                    {currentQuestion.difficulty}
                  </div>
                  {currentQuestion.hints.length > 0 && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-200">
                      <div className="font-semibold text-gray-100 mb-2">Hints</div>
                      <ul className="space-y-1">
                        {currentQuestion.hints.map((hint) => (
                          <li key={hint} className="flex gap-2">
                            <span className="text-indigo-300">•</span>
                            <span>{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-gray-300">
                  Waiting for first question… AI is preparing your interview.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Answer Space */}
          <div className="h-full">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-300" />
                <span className="text-sm font-semibold text-gray-200">Your Answer</span>
              </div>
              <form onSubmit={handleSubmitAnswer} className="flex-1 flex flex-col gap-3">
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={currentQuestion ? 'Type your answer here...' : 'Answer editor is ready. It will unlock when the first question appears.'}
                  className="flex-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-100 outline-none focus:border-indigo-400 resize-none"
                  disabled={!currentInterview || !currentQuestion}
                />
                <button
                  type="submit"
                  disabled={submitting || !answer.trim() || !currentInterview || !currentQuestion}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Submit Answer
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-400">
                AI evaluates each submitted answer instantly and updates feedback after every response.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={interviewStageRef} className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mock Interviews</h1>
          <p className="text-gray-600">Strict mode keeps the interview in fullscreen, requires camera and microphone, and records the session locally.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleStartInterview}
            disabled={starting}
            className="flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
            Start Strict Interview
          </button>
          <button
            onClick={async () => {
              if (document.fullscreenElement) {
                await document.exitFullscreen()
              } else {
                await enterFullscreen()
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            {isFullscreen ? <Square className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {cameraError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {cameraError}
        </div>
      )}

      {violationMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{violationMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {strictChecklist.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 flex items-center gap-3 ${item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600'}`}
          >
            {item.ok ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-black overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-semibold">Live Proctor View</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
                {isRecording ? 'Recording' : 'Standby'}
              </span>
              <span className={`px-2 py-1 rounded-full ${strictModeActive ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}>
                {strictModeActive ? 'Strict mode on' : 'Strict mode off'}
              </span>
            </div>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video object-cover bg-black"
          />

          <div className="px-4 py-3 bg-gray-950 text-gray-200 text-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Camera {cameraReady ? 'ready' : 'waiting'}</span>
              <span>•</span>
              <span>Mic {cameraReady ? 'ready' : 'waiting'}</span>
              <span>•</span>
              <span>{isFullscreen ? 'Fullscreen locked' : 'Fullscreen not active'}</span>
            </div>
            {recordingUrl && (
              <a href={recordingUrl} download="interview-recording.webm" className="text-indigo-300 hover:text-indigo-200 font-semibold">
                Download recording
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl font-bold text-gray-900">Strict rules</h2>
            </div>

            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2"><span className="text-rose-600 font-bold">•</span> Do not switch tabs or apps during the interview.</li>
              <li className="flex items-start gap-2"><span className="text-rose-600 font-bold">•</span> Keep the browser in fullscreen from start to finish.</li>
              <li className="flex items-start gap-2"><span className="text-rose-600 font-bold">•</span> Camera and microphone stay on while the session is active.</li>
              <li className="flex items-start gap-2"><span className="text-rose-600 font-bold">•</span> The session is recorded locally as a webm file for review.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Session status</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between"><span>Fullscreen</span><span className={isFullscreen ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>{isFullscreen ? 'On' : 'Off'}</span></div>
              <div className="flex items-center justify-between"><span>Camera</span><span className={cameraReady ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>{cameraReady ? 'On' : 'Off'}</span></div>
              <div className="flex items-center justify-between"><span>Microphone</span><span className={cameraReady ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>{cameraReady ? 'On' : 'Off'}</span></div>
              <div className="flex items-center justify-between"><span>Recording</span><span className={isRecording ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>{isRecording ? 'Active' : 'Stopped'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <Mic className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.completed}</div>
          <div className="text-sm opacity-90">Interviews Completed</div>
        </div>
        <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <TrendingUp className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.averageScore}%</div>
          <div className="text-sm opacity-90">Average Score</div>
        </div>
        <div className="bg-linear-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <Clock className="w-8 h-8 mb-3" />
          <div className="text-3xl font-bold mb-1">{practiceHours}h</div>
          <div className="text-sm opacity-90">Practice Time</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Interview Setup</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Topic</span>
                <input value={topic} onChange={(event) => setTopic(event.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Role</span>
                <input value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Interview Type</span>
                <select value={interviewType} onChange={(event) => setInterviewType(event.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500">
                  {interviewTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Questions</span>
                <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500">
                  {[3, 5, 7].map((count) => (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Active Interview</h2>
                <p className="text-sm text-gray-600">
                  {currentInterview
                    ? `Question ${currentQuestionIndex + 1} of ${currentInterview.totalQuestions}`
                    : 'Start an interview to receive the first question. You can prepare your answer below.'}
                </p>
              </div>
              {currentInterview && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {currentInterview.interview.type}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm font-medium text-indigo-700 mb-2">Question</div>
                {currentQuestion ? (
                  <>
                    <p className="text-gray-900 font-medium">{currentQuestion.question}</p>
                    {currentQuestion.hints.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        Hint: {currentQuestion.hints.join(' | ')}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">
                    Waiting for first question… Click <span className="font-semibold">Start Interview</span> to begin.
                  </p>
                )}
              </div>

              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={currentQuestion ? 'Type your answer here. You can also paste a transcript from a spoken response.' : 'Answer box is ready. It will activate when the first question appears.'}
                rows={7}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!currentQuestion || !currentInterview}
              />

              <button
                type="submit"
                disabled={submitting || !answer.trim() || !currentQuestion || !currentInterview}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Submit Answer
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Feedback</h2>
            {latestFeedback ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Technical', latestFeedback.technicalScore],
                    ['Communication', latestFeedback.communicationScore],
                    ['Confidence', latestFeedback.confidenceScore],
                    ['Clarity', latestFeedback.clarityScore],
                  ].map(([label, score]) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
                      <div className="text-2xl font-bold text-gray-900">{score}%</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-700 mb-2">Strengths</div>
                  <ul className="space-y-2 text-sm text-emerald-900">
                    {latestFeedback.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="text-sm font-semibold text-amber-700 mb-2">Improvements</div>
                  <ul className="space-y-2 text-sm text-amber-900">
                    {latestFeedback.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Submit an answer to see AI feedback here. If the model is unavailable, the app falls back to local scoring so the interview still completes.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Interviews</h2>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading interview history...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map((interview, index) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-xl border border-gray-200 p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{interview.topic}</h3>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            {interview.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{formatWhen(interview.created_at)}</div>
                        <div className="text-sm text-gray-700">
                          {interview.latestFeedback?.strengths?.[0] || 'Interview completed and scored.'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">{interview.overallScore}%</div>
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Your interview history will appear here after the first session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}