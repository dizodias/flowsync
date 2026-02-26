import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Board, type LeadMovePayload } from '../components/kanban/Board'
import { ListView } from '../components/kanban/ListView'
import { NewLeadModal, type NewLeadFormData } from '../components/kanban/NewLeadModal'
import { supabase } from '../lib/supabase'
import type { Column, Lead } from '../types'

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

export function Dashboard() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [columns, setColumns] = useState<Column[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [columnsLoading, setColumnsLoading] = useState(true)
  const [leadsLoading, setLeadsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchColumns() {
      setColumnsLoading(true)
      const { data, error } = await supabase
        .from('columns')
        .select('*')
        .order('order_index', { ascending: true })

      if (cancelled) return
      if (error) {
        setColumnsLoading(false)
        return
      }
      setColumns((data ?? []).map(mapRowToColumn))
      setColumnsLoading(false)
    }

    async function fetchLeads() {
      setLeadsLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('column_id', { ascending: true })
        .order('order_index', { ascending: true })

      if (cancelled) return
      if (error) {
        setLeadsLoading(false)
        return
      }
      setLeads((data ?? []).map(mapRowToLead))
      setLeadsLoading(false)
    }

    void fetchColumns()
    void fetchLeads()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setLoading(columnsLoading || leadsLoading)
  }, [columnsLoading, leadsLoading])

  async function handleAddLead(data: NewLeadFormData) {
    const columnLeads = leads.filter((l) => l.columnId === data.columnId)
    const nextOrderIndex = columnLeads.length

    const { data: inserted, error } = await supabase
      .from('leads')
      .insert({
        title: data.title,
        contact_name: data.contactName,
        whatsapp: data.whatsapp,
        column_id: data.columnId,
        order_index: nextOrderIndex,
      })
      .select('id, title, contact_name, whatsapp, column_id, created_at, order_index')
      .single()

    if (error) return

    const newLead = mapRowToLead(inserted as Record<string, unknown>)
    setLeads((prev) => [...prev, newLead])
  }

  async function handleLeadsChange(nextLeads: Lead[], movePayload?: LeadMovePayload) {
    const previousLeads = leads
    setLeads(nextLeads)

    if (!movePayload) return

    const { movedLeadId, newColumnId, newOrderIndex, sourceColumnId } = movePayload

    try {
      const { error: moveError } = await supabase
        .from('leads')
        .update({
          column_id: newColumnId,
          order_index: newOrderIndex,
        })
        .eq('id', movedLeadId)

      if (moveError) throw moveError

      if (sourceColumnId === newColumnId) {
        const destColumnLeads = nextLeads
          .filter((l) => l.columnId === newColumnId)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        const updates = destColumnLeads.map((lead, index) =>
          supabase.from('leads').update({ order_index: index }).eq('id', lead.id)
        )
        const results = await Promise.all(updates)
        const firstError = results.find((r) => r.error)
        if (firstError?.error) throw firstError.error
      }
    } catch (err) {
      console.error('Failed to persist lead move:', err)
      setLeads(previousLeads)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('dashboard.title')}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('dashboard.viewKanban')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('dashboard.viewList')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsNewLeadModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-fb-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            {t('dashboard.newLead')}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">{t('dashboard.loading')}</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <Board columns={columns} leads={leads} onLeadsChange={handleLeadsChange} />
      ) : (
        <ListView leads={leads} columns={columns} />
      )}

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        columns={columns}
        onSave={handleAddLead}
      />
    </div>
  )
}
