'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Code, ExternalLink, Folder, Loader2, Plus, Rocket, Upload, type LucideIcon } from 'lucide-react'

type ProjectItem = {
  id: string
  status: string
  github_url: string | null
  deployed_url: string | null
  project: {
    id: string
    title: string
    description: string
    topic: string
    difficulty: string
    tech_stack: string[]
    features: string[]
    interview_points: string[]
  } | null
}

type ApiError = { error?: string }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: '',
    difficulty: 'MEDIUM',
    techStack: '',
    features: '',
    githubUrl: '',
    deployedUrl: '',
  })

  useEffect(() => {
    let active = true

    async function loadProjects() {
      try {
        setLoading(true)
        const response = await fetch('/api/projects', { cache: 'no-store' })
        const data = (await response.json()) as { projects?: ProjectItem[] } & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load projects')
        }

        if (active) {
          setProjects(data.projects ?? [])
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load projects')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => ({
    total: projects.length,
    completed: projects.filter((project) => project.status === 'COMPLETED').length,
    inProgress: projects.filter((project) => project.status === 'IN_PROGRESS').length,
  }), [projects])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          topic: form.topic,
          difficulty: form.difficulty,
          techStack: form.techStack.split(',').map((item) => item.trim()).filter(Boolean),
          features: form.features.split(',').map((item) => item.trim()).filter(Boolean),
          githubUrl: form.githubUrl || null,
          deployedUrl: form.deployedUrl || null,
          status: 'IN_PROGRESS',
        }),
      })

      const data = (await response.json()) as { project?: ProjectItem } & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save project')
      }

      if (data.project) {
        setProjects((previous) => [data.project!, ...previous])
      }

      setForm({
        title: '',
        description: '',
        topic: '',
        difficulty: 'MEDIUM',
        techStack: '',
        features: '',
        githubUrl: '',
        deployedUrl: '',
      })
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Add projects, track them like a portfolio, and present them professionally.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Done" value={stats.completed} />
          <StatCard label="Active" value={stats.inProgress} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Upload a project</h2>
          </div>

          <div className="grid gap-4">
            <input value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} placeholder="Project title" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <textarea value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} rows={4} placeholder="Short project description" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.topic} onChange={(event) => setForm((previous) => ({ ...previous, topic: event.target.value }))} placeholder="Topic" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
              <select value={form.difficulty} onChange={(event) => setForm((previous) => ({ ...previous, difficulty: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <input value={form.techStack} onChange={(event) => setForm((previous) => ({ ...previous, techStack: event.target.value }))} placeholder="Tech stack, comma separated" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={form.features} onChange={(event) => setForm((previous) => ({ ...previous, features: event.target.value }))} placeholder="Features, comma separated" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={form.githubUrl} onChange={(event) => setForm((previous) => ({ ...previous, githubUrl: event.target.value }))} placeholder="GitHub URL" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={form.deployedUrl} onChange={(event) => setForm((previous) => ({ ...previous, deployedUrl: event.target.value }))} placeholder="Deployed URL" className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500" />
          </div>

          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Save project
          </button>
        </form>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your projects...</span>
            </div>
          ) : projects.length > 0 ? (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition"
              >
                <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{project.project?.title || 'Project'}</h3>
                        <p className="text-sm text-white/85">{project.project?.topic || 'Portfolio project'} • {project.project?.difficulty || 'MEDIUM'}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{project.status}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-gray-700 leading-7">{project.project?.description || 'No description provided.'}</p>

                  <div className="flex flex-wrap gap-2">
                    {(project.project?.tech_stack || []).map((tech) => (
                      <span key={tech} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{tech}</span>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <MiniPanel title="Features" items={project.project?.features || []} />
                    <MiniPanel title="Interview points" items={project.project?.interview_points || []} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition">
                        <Code className="w-4 h-4" />
                        Code
                      </a>
                    )}
                    {project.deployed_url && (
                      <a href={project.deployed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-white hover:opacity-90 transition">
                        <ExternalLink className="w-4 h-4" />
                        Live demo
                      </a>
                    )}
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Rocket className="w-4 h-4" />
                      {project.project?.topic || 'Project'} • {project.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">
              No projects yet. Add your first one using the form on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  )
}

function MiniPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-2 text-sm font-semibold text-gray-700">{title}</div>
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm text-gray-600">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No items added yet.</p>
      )}
    </div>
  )
}
