import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Column, Lead } from '../../types'

interface ListViewProps {
  leads: Lead[]
  columns: Column[]
}

export function ListView({ leads, columns }: ListViewProps) {
  const { t } = useTranslation()

  function getColumnTitle(columnId: string) {
    return columns.find((c) => c.id === columnId)?.title ?? columnId
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80">
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                {t('listView.title')}
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                {t('listView.contact')}
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                {t('listView.whatsapp')}
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                {t('listView.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/leads/${lead.id}`}
                    className="font-medium text-fb-blue hover:underline dark:text-fb-blue"
                  >
                    {lead.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{lead.contactName}</td>
                <td className="px-4 py-3">
                  {lead.whatsapp ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      {lead.whatsapp}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {getColumnTitle(lead.columnId)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
