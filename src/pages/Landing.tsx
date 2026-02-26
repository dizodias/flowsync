import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface DemoColumn {
  id: string
  titleKey: string
  color: string
}

interface DemoLead {
  id: string
  titleKey: string
  contactKey: string
  columnId: string
}

const DEMO_COLUMNS: DemoColumn[] = [
  { id: 'col-new', titleKey: 'columnNew', color: '#0866FF' },
  { id: 'col-contacted', titleKey: 'columnContacted', color: '#f59e0b' },
  { id: 'col-won', titleKey: 'columnWon', color: '#42b72a' },
]

const DEMO_LEADS_INITIAL: DemoLead[] = [
  { id: 'demo-1', titleKey: 'lead1Title', contactKey: 'lead1Contact', columnId: 'col-new' },
  { id: 'demo-2', titleKey: 'lead2Title', contactKey: 'lead2Contact', columnId: 'col-new' },
  { id: 'demo-3', titleKey: 'lead3Title', contactKey: 'lead3Contact', columnId: 'col-contacted' },
  { id: 'demo-4', titleKey: 'lead4Title', contactKey: 'lead4Contact', columnId: 'col-contacted' },
  { id: 'demo-5', titleKey: 'lead5Title', contactKey: 'lead5Contact', columnId: 'col-won' },
]

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

function moveBetween<T extends { columnId: string }>(
  sourceList: T[],
  destList: T[],
  sourceIndex: number,
  destIndex: number,
  newColumnId: string
): { sourceList: T[]; destList: T[] } {
  const sourceCopy = Array.from(sourceList)
  const destCopy = Array.from(destList)
  const [removed] = sourceCopy.splice(sourceIndex, 1)
  const updated = { ...removed, columnId: newColumnId } as T
  destCopy.splice(destIndex, 0, updated)
  return { sourceList: sourceCopy, destList: destCopy }
}

export function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [demoLeads, setDemoLeads] = useState<DemoLead[]>(DEMO_LEADS_INITIAL)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) {
        navigate('/dashboard', { replace: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceLeads = demoLeads.filter((l) => l.columnId === source.droppableId)
    const destLeads = demoLeads.filter((l) => l.columnId === destination.droppableId)
    const movingLead = demoLeads.find((l) => l.id === draggableId)
    if (!movingLead) return

    let nextLeads: DemoLead[]

    if (source.droppableId === destination.droppableId) {
      const reordered = reorder(sourceLeads, source.index, destination.index)
      nextLeads = DEMO_COLUMNS.flatMap((col) =>
        col.id === source.droppableId ? reordered : demoLeads.filter((l) => l.columnId === col.id)
      )
    } else {
      const { sourceList, destList } = moveBetween<DemoLead>(
        sourceLeads,
        destLeads,
        source.index,
        destination.index,
        destination.droppableId
      )
      nextLeads = DEMO_COLUMNS.flatMap((col) => {
        if (col.id === source.droppableId) return sourceList
        if (col.id === destination.droppableId) return destList
        return demoLeads.filter((l) => l.columnId === col.id)
      })
    }

    setDemoLeads(nextLeads)
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-balance text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-slate-50">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-4 max-w-prose text-pretty text-base text-slate-600 sm:text-lg dark:text-slate-300">
            {t('landing.heroSubtitle')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-xl bg-fb-blue px-6 py-3 text-base font-bold text-white shadow-md hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              {t('landing.cta')}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {t('landing.demo.pipeline')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('landing.demo.kanbanPreview')}
            </span>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid gap-3 sm:grid-cols-3">
              {DEMO_COLUMNS.map((column) => {
                const columnLeads = demoLeads.filter((l) => l.columnId === column.id)
                return (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[10rem] rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50 ${
                          snapshot.isDraggingOver ? 'ring-2 ring-fb-blue/30' : ''
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: column.color }}
                            aria-hidden
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t(`landing.demo.${column.titleKey}`)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {columnLeads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
                                    snapshot.isDragging ? 'opacity-90 shadow-md' : ''
                                  }`}
                                >
                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {t(`landing.demo.${lead.titleKey}`)}
                                  </div>
                                  <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                                    {t(`landing.demo.${lead.contactKey}`)}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      </div>
    </section>
  )
}
