import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import type { Column, Lead } from '../../types'
import { ColumnDrop } from './ColumnDrop'

export interface LeadMovePayload {
  movedLeadId: string
  newColumnId: string
  newOrderIndex: number
  sourceColumnId: string
}

interface BoardProps {
  columns: Column[]
  leads: Lead[]
  onLeadsChange: (leads: Lead[], movePayload?: LeadMovePayload) => void
}

export function Board({ columns, leads, onLeadsChange }: BoardProps) {
  const columnsOrdered = [...columns].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const sourceLeads = leads.filter((lead) => lead.columnId === source.droppableId)
    const destLeads = leads.filter((lead) => lead.columnId === destination.droppableId)
    const movingLead = leads.find((lead) => lead.id === draggableId)
    if (!movingLead) return

    let updatedSource: Lead[]
    let updatedDest: Lead[]

    if (source.droppableId === destination.droppableId) {
      const reordered = Array.from(sourceLeads)
      const [removed] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, removed)
      updatedSource = reordered
      updatedDest = reordered
    } else {
      const newSource = Array.from(sourceLeads)
      const [removed] = newSource.splice(source.index, 1)
      const movedLead: Lead = { ...removed, columnId: destination.droppableId }
      const newDest = Array.from(destLeads)
      newDest.splice(destination.index, 0, movedLead)
      updatedSource = newSource
      updatedDest = newDest
    }

    const nextLeads: Lead[] = columnsOrdered.flatMap((col) => {
      if (col.id === source.droppableId && col.id === destination.droppableId) {
        return updatedSource
      }
      if (col.id === source.droppableId) return updatedSource
      if (col.id === destination.droppableId) return updatedDest
      return leads.filter((l) => l.columnId === col.id)
    })

    const withOrderIndex: Lead[] = columnsOrdered.flatMap((col) => {
      const colLeads = nextLeads.filter((l) => l.columnId === col.id)
      return colLeads.map((lead, idx) => ({ ...lead, order_index: idx }))
    })

    const movePayload: LeadMovePayload = {
      movedLeadId: draggableId,
      newColumnId: destination.droppableId,
      newOrderIndex: destination.index,
      sourceColumnId: source.droppableId,
    }
    onLeadsChange(withOrderIndex, movePayload)
  }

  const leadsByColumn = (columnId: string) =>
    leads
      .filter((l) => l.columnId === columnId)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {columnsOrdered.map((column) => (
          <ColumnDrop
            key={column.id}
            column={column}
            leads={leadsByColumn(column.id)}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
