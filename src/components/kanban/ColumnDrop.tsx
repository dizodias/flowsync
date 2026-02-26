import { Draggable, Droppable } from '@hello-pangea/dnd'
import type { Column, Lead } from '../../types'
import { LeadCard } from './LeadCard'

interface ColumnDropProps {
  column: Column
  leads: Lead[]
}

export function ColumnDrop({ column, leads }: ColumnDropProps) {
  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[12rem] rounded-2xl border border-slate-200 bg-slate-100/50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-800/50 ${
            snapshot.isDraggingOver ? 'ring-2 ring-fb-blue/30' : ''
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: column.color }}
              aria-hidden
            />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{column.title}</h3>
          </div>
          <div className="space-y-2">
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'opacity-90' : ''}
                  >
                    <LeadCard lead={lead} />
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
}
