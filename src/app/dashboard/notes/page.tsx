'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'

type NoteType = 'SUMMARY' | 'CHEAT_SHEET' | 'FLASHCARD' | 'CUSTOM' | 'AI_GENERATED'

type NoteItem = {
  id: string
  title: string
  topic: string
  content: string
  type: NoteType
  isImportant: boolean
  revisionCount: number
  lastRevised: string | null
  createdAt?: string
  updatedAt?: string
}

type ApiError = {
  error?: string
}

type NoteFormState = {
  title: string
  topic: string
  content: string
  type: NoteType
  isImportant: boolean
}

const emptyForm: NoteFormState = {
  title: '',
  topic: '',
  content: '',
  type: 'CUSTOM',
  isImportant: false,
}

const noteTypes: NoteType[] = ['CUSTOM', 'SUMMARY', 'CHEAT_SHEET', 'FLASHCARD', 'AI_GENERATED']

function formatDate(value: string | null) {
  if (!value) {
    return 'Not revised yet'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [search, setSearch] = useState('')
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [form, setForm] = useState<NoteFormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [revisingId, setRevisingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  )

  function syncFormFromNote(note: NoteItem | null) {
    if (note) {
      setForm({
        title: note.title,
        topic: note.topic,
        content: note.content,
        type: note.type,
        isImportant: note.isImportant,
      })
      setSelectedNoteId(note.id)
      return
    }

    setSelectedNoteId(null)
    setForm(emptyForm)
  }

  useEffect(() => {
    let active = true

    async function loadNotes() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (search.trim()) {
          params.set('search', search.trim())
        }
        if (showImportantOnly) {
          params.set('important', 'true')
        }

        const response = await fetch(`/api/notes?${params.toString()}`, {
          cache: 'no-store',
        })
        const data = (await response.json()) as { notes?: NoteItem[] } & ApiError

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch notes')
        }

        if (active) {
          const nextNotes = data.notes ?? []
          setNotes(nextNotes)
          setSelectedNoteId((previous) =>
            previous && nextNotes.some((note) => note.id === previous)
              ? previous
              : nextNotes[0]?.id ?? null
          )
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch notes')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadNotes()
    }, 150)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [search, showImportantOnly])

  async function refreshNotesAndSelect(noteId?: string) {
    const response = await fetch('/api/notes', { cache: 'no-store' })
    const data = (await response.json()) as { notes?: NoteItem[] } & ApiError

    if (!response.ok) {
      throw new Error(data.error || 'Failed to refresh notes')
    }

    const nextNotes = data.notes ?? []
    setNotes(nextNotes)
    const nextSelectedNote =
      (noteId ? nextNotes.find((note) => note.id === noteId) : null) ?? nextNotes[0] ?? null
    syncFormFromNote(nextSelectedNote)
  }

  function handleNewNote() {
    syncFormFromNote(null)
  }

  async function handleSaveNote() {
    try {
      setSaving(true)
      setError('')

      const payload = {
        title: form.title,
        topic: form.topic,
        content: form.content,
        type: form.type,
        isImportant: form.isImportant,
      }

      const isEditing = Boolean(selectedNoteId)
      const response = await fetch(
        isEditing ? `/api/notes/${selectedNoteId}` : '/api/notes',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = (await response.json()) as { note?: NoteItem } & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save note')
      }

      const returnedNoteId = data.note?.id ?? selectedNoteId ?? undefined
      await refreshNotesAndSelect(returnedNoteId)
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  async function handleReviseNote(noteId: string) {
    try {
      setRevisingId(noteId)
      setError('')

      const response = await fetch(`/api/notes/${noteId}/revise`, {
        method: 'POST',
      })
      const data = (await response.json()) as { note?: NoteItem } & ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revise note')
      }

      await refreshNotesAndSelect(noteId)
    } catch (reviseError: unknown) {
      setError(reviseError instanceof Error ? reviseError.message : 'Failed to revise note')
    } finally {
      setRevisingId(null)
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      setDeletingId(noteId)
      setError('')

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      const data = (await response.json()) as ApiError

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note')
      }

      await refreshNotesAndSelect()
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete note')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes & Revision</h1>
          <p className="text-gray-600">Create notes, edit them, and track every revision from one place.</p>
        </div>
        <button
          onClick={handleNewNote}
          className="flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col gap-3">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-600 focus:outline-none"
                />
              </label>
              <button
                onClick={() => setShowImportantOnly((previous) => !previous)}
                className={`self-start rounded-lg px-4 py-2 font-medium transition ${
                  showImportantOnly ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Important Only
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl bg-white p-8 border border-gray-200 flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading notes...</span>
            </div>
          ) : notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note, index) => (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => syncFormFromNote(note)}
                  className={`text-left bg-white rounded-xl p-5 border transition ${
                    selectedNoteId === note.id
                      ? 'border-indigo-500 shadow-md'
                      : 'border-gray-200 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <FileText className="w-7 h-7 text-indigo-600" />
                    <div className="flex items-center gap-2">
                      {note.isImportant && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded font-semibold">
                        {note.type}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{note.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{note.content}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Tag className="w-4 h-4" />
                    <span>{note.topic}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Revised {note.revisionCount} times</span>
                    <span>{formatDate(note.lastRevised)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-8 border border-dashed border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h2>
              <p className="text-gray-600">Create your first note to start building a revision library.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedNoteId ? 'Edit Note' : 'Create Note'}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedNoteId
                  ? 'Update the note and mark it revised when you review it.'
                  : 'Write a new note, summary, or cheat sheet.'}
              </p>
            </div>
            {selectedNote && (
              <div className="text-right text-sm text-gray-500">
                <div>{selectedNote.revisionCount} revisions</div>
                <div>{formatDate(selectedNote.lastRevised)}</div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                placeholder="Arrays - key ideas"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Topic</span>
              <input
                value={form.topic}
                onChange={(event) => setForm((previous) => ({ ...previous, topic: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                placeholder="DSA"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Type</span>
              <select
                value={form.type}
                onChange={(event) => setForm((previous) => ({ ...previous, type: event.target.value as NoteType }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
              >
                {noteTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 mt-7">
              <input
                type="checkbox"
                checked={form.isImportant}
                onChange={(event) => setForm((previous) => ({ ...previous, isImportant: event.target.checked }))}
              />
              <span className="text-sm font-medium text-gray-700">Mark as important</span>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-gray-700">Content</span>
            <textarea
              value={form.content}
              onChange={(event) => setForm((previous) => ({ ...previous, content: event.target.value }))}
              rows={14}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
              placeholder="Write your note, summary, patterns, or revision bullets here..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleSaveNote()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {selectedNoteId ? 'Save Changes' : 'Create Note'}
            </button>

            {selectedNoteId && (
              <button
                onClick={() => void handleReviseNote(selectedNoteId)}
                disabled={revisingId === selectedNoteId}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {revisingId === selectedNoteId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
                Mark Revised
              </button>
            )}

            {selectedNoteId && (
              <button
                onClick={() => void handleDeleteNote(selectedNoteId)}
                disabled={deletingId === selectedNoteId}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {deletingId === selectedNoteId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            )}

            {!selectedNoteId && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-700">
                <Sparkles className="w-4 h-4" />
                New notes become revision-ready immediately.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
