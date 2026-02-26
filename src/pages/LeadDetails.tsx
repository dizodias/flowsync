import { ArrowLeft, Edit, Edit2, Loader2, Save, Trash, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { parsePhoneNumber } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import PhoneInput from 'react-phone-number-input'
import { supabase } from '../lib/supabase'
import type { Column, Lead, Note } from '../types'

function mapRowToLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    contactName: String(row.contact_name ?? ''),
    whatsapp: String(row.whatsapp ?? ''),
    columnId: String(row.column_id ?? ''),
    createdAt: String(row.created_at ?? ''),
    order_index: typeof row.order_index === 'number' ? row.order_index : 0,
  }
}

function mapRowToColumn(row: Record<string, unknown>): Column {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    color: String(row.color ?? '#0866FF'),
    order_index: typeof row.order_index === 'number' ? row.order_index : 0,
  }
}

function mapRowToNote(row: Record<string, unknown>): Note {
  return {
    id: String(row.id),
    leadId: String(row.lead_id ?? ''),
    content: String(row.content ?? ''),
    createdAt: String(row.created_at ?? ''),
    is_deleted: row.is_deleted === true,
    is_edited: row.is_edited === true,
    original_content: row.original_content != null ? String(row.original_content) : undefined,
  }
}

function whatsappLink(number: string): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'US',
  es: 'ES',
  'pt-BR': 'BR',
  pt: 'BR',
  de: 'DE',
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  titleKey: string
  confirmKey: string
  cancelKey: string
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, titleKey, confirmKey, cancelKey }: DeleteConfirmModalProps) {
  const { t } = useTranslation()
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-white p-6 shadow-xl dark:bg-slate-900 dark:border-slate-800">
        <h2 id="delete-confirm-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {t(titleKey)}
        </h2>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t(cancelKey)}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl border border-red-200/50 bg-red-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            {t(confirmKey)}
          </button>
        </div>
      </div>
    </div>
  )
}

export function LeadDetails() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { leadId } = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [column, setColumn] = useState<Column | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContactName, setEditContactName] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editColumnId, setEditColumnId] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  const defaultCountry = useMemo(
    () => (LANGUAGE_TO_COUNTRY[i18n.language] ?? LANGUAGE_TO_COUNTRY[i18n.language.split('-')[0]] ?? 'US') as 'US' | 'ES' | 'BR' | 'DE',
    [i18n.language]
  )

  const fetchData = useCallback(async () => {
    if (!leadId) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setNotFound(false)

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !leadData) {
      setLead(null)
      setColumn(null)
      setColumns([])
      setNotes([])
      setNotFound(true)
      setLoading(false)
      return
    }

    const mappedLead = mapRowToLead(leadData as Record<string, unknown>)
    setLead(mappedLead)
    setEditTitle(mappedLead.title)
    setEditContactName(mappedLead.contactName)
    setEditWhatsapp(mappedLead.whatsapp)
    setEditColumnId(mappedLead.columnId)

    const [columnsRes, columnRes, notesRes] = await Promise.all([
      supabase.from('columns').select('*').order('order_index', { ascending: true }),
      supabase.from('columns').select('*').eq('id', mappedLead.columnId).single(),
      supabase.from('notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
    ])

    setColumns((columnsRes.data ?? []).map((row) => mapRowToColumn(row as Record<string, unknown>)))
    if (columnRes.data) {
      setColumn(mapRowToColumn(columnRes.data as Record<string, unknown>))
    } else {
      setColumn(null)
    }
    setNotes((notesRes.data ?? []).map((row) => mapRowToNote(row as Record<string, unknown>)))
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    if (lead) {
      setEditTitle(lead.title)
      setEditContactName(lead.contactName)
      setEditWhatsapp(lead.whatsapp)
      setEditColumnId(lead.columnId)
    }
  }, [lead?.id])

  const formatNoteDate = (iso: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    const content = newNoteContent.trim()
    if (!content || !lead) return

    const optimisticNote: Note = {
      id: `temp-${Date.now()}`,
      leadId: lead.id,
      content,
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [optimisticNote, ...prev])
    setNewNoteContent('')

    const { data: inserted, error } = await supabase
      .from('notes')
      .insert({ lead_id: lead.id, content })
      .select('id, lead_id, content, created_at')
      .single()

    if (error) {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id))
      return
    }
    const savedNote = mapRowToNote(inserted as Record<string, unknown>)
    setNotes((prev) => prev.map((n) => (n.id === optimisticNote.id ? savedNote : n)))
  }

  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault()
    if (!leadId || saving) return
    setSaving(true)
    const { error } = await supabase
      .from('leads')
      .update({
        title: editTitle,
        contact_name: editContactName,
        whatsapp: editWhatsapp,
        column_id: editColumnId,
      })
      .eq('id', leadId)

    setSaving(false)
    if (error) return
    setIsEditing(false)
    void fetchData()
  }

  async function handleDeleteLead() {
    if (!leadId) return
    setDeleteModalOpen(false)
    const { error } = await supabase.from('leads').delete().eq('id', leadId)
    if (!error) {
      navigate('/dashboard', { replace: true })
    }
  }

  async function handleDeleteNote(noteId: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_deleted: true } : n))
    )
    await supabase.from('notes').update({ is_deleted: true }).eq('id', noteId)
  }

  async function handleSaveNoteEdit(note: Note) {
    const newContent = editNoteContent.trim()
    if (!newContent) return
    const original = note.original_content ?? note.content
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? { ...n, content: newContent, is_edited: true, original_content: original }
          : n
      )
    )
    setEditingNoteId(null)
    setEditNoteContent('')
    await supabase
      .from('notes')
      .update({
        content: newContent,
        is_edited: true,
        original_content: original,
      })
      .eq('id', note.id)
  }

  const phoneParsed = lead?.whatsapp ? parsePhoneNumber(lead.whatsapp, 'US') : null
  const country = phoneParsed?.country
  const FlagComponent = country ? flags[country] : null
  const statusName = column?.title ?? lead?.columnId ?? ''

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 h-10 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" aria-hidden />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.loading')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !lead) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-slate-600 dark:text-slate-400">Lead not found.</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-fb-blue hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t('leadDetails.backToDashboard')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('leadDetails.backToDashboard')}
        </Link>
        {!isEditing && (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Edit className="h-4 w-4" aria-hidden />
              {t('leadDetails.edit')}
            </button>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200/50 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('leadDetails.deleteLead')}
            </button>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isEditing ? (
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('leadDetails.leadTitle')}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('leadDetails.contactName')}
                </label>
                <input
                  type="text"
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  WhatsApp
                </label>
                <div className="phone-input-modern">
                  <PhoneInput
                    international
                    defaultCountry={defaultCountry}
                    value={editWhatsapp || undefined}
                    onChange={(val) => setEditWhatsapp(val ?? '')}
                    className=""
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('leadDetails.status')}
                </label>
                <select
                  value={editColumnId}
                  onChange={(e) => setEditColumnId(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                  required
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setEditTitle(lead.title)
                    setEditContactName(lead.contactName)
                    setEditWhatsapp(lead.whatsapp)
                    setEditColumnId(lead.columnId)
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="inline-flex items-center gap-2">
                    <X className="h-4 w-4" /> {t('leadDetails.cancel')}
                  </span>
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-fb-blue py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-slate-900"
                >
                  <span className="inline-flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('leadDetails.saveChanges')}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{lead.title}</h1>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('leadDetails.contactName')}</dt>
                  <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{lead.contactName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('leadDetails.status')}</dt>
                  <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{statusName}</dd>
                </div>
                {lead.whatsapp && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">WhatsApp</dt>
                    <dd className="mt-0.5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      {phoneParsed ? (
                        <>
                          {FlagComponent && (
                            <div className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-sm [&>svg]:h-full [&>svg]:w-full [&>svg]:object-cover" aria-hidden>
                              <FlagComponent title={country ?? 'US'} />
                            </div>
                          )}
                          <span className="leading-none">{phoneParsed.formatInternational()}</span>
                        </>
                      ) : (
                        <span>{lead.whatsapp}</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              {lead.whatsapp && (
                <a
                  href={whatsappLink(lead.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-base font-bold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
                >
                  {t('leadDetails.sendWhatsApp')}
                </a>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('leadDetails.notes')}</h2>

          <form onSubmit={handleAddNote} className="mt-4">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={t('leadDetails.newNotePlaceholder')}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-xl bg-fb-blue py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {t('leadDetails.addNote')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-700" />

          <div className="mt-4 max-h-[20rem] overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500">{t('leadDetails.noNotes')}</p>
            ) : (
              <ul className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
                {notes.map((note) => (
                  <li key={note.id} className="group py-4 first:pt-0">
                    {note.is_deleted ? (
                      <p className="italic text-slate-400 dark:text-slate-500">
                        🚫 {t('leadDetails.thisNoteWasDeleted')}
                      </p>
                    ) : editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editNoteContent}
                          onChange={(e) => setEditNoteContent(e.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null)
                              setEditNoteContent('')
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            {t('leadDetails.cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNoteEdit(note)}
                            className="rounded-lg bg-fb-blue px-3 py-1.5 text-sm font-bold text-white hover:brightness-110"
                          >
                            {t('leadDetails.saveChanges')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex-1 text-slate-600 dark:text-slate-300">{note.content}</p>
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id)
                                setEditNoteContent(note.content)
                              }}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                              title={t('leadDetails.edit')}
                              aria-label={t('leadDetails.edit')}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
                              title={t('leadDetails.delete')}
                              aria-label={t('leadDetails.delete')}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <time className="mt-1 flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500" dateTime={note.createdAt}>
                          {formatNoteDate(note.createdAt)}
                          {note.is_edited && (
                            <span
                              className="italic"
                              title={[t('leadDetails.originalContent'), note.original_content].filter(Boolean).join(' ')}
                            >
                              {t('leadDetails.noteEdited')}
                            </span>
                          )}
                        </time>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteLead}
        titleKey="leadDetails.areYouSure"
        confirmKey="leadDetails.delete"
        cancelKey="leadDetails.cancel"
      />
    </div>
  )
}
