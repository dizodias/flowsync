import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { parsePhoneNumber } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import type { Lead } from '../../types'

interface LeadCardProps {
  lead: Lead
}

export function LeadCard({ lead }: LeadCardProps) {
  const phoneParsed = lead.whatsapp ? parsePhoneNumber(lead.whatsapp, 'US') : null
  const country = phoneParsed?.country
  const FlagComponent = country ? flags[country] : null

  return (
    <Link
      to={`/leads/${lead.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-md"
    >
      <div className="font-medium text-slate-900 dark:text-slate-100">{lead.title}</div>
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lead.contactName}</div>
      {lead.whatsapp && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {phoneParsed ? (
            <>
              {FlagComponent && (
                <div className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-sm [&>svg]:h-full [&>svg]:w-full [&>svg]:object-cover" aria-hidden>
                  <FlagComponent title={country ?? 'US'} />
                </div>
              )}
              <span className="min-w-0 truncate leading-none">{phoneParsed.formatInternational()}</span>
            </>
          ) : (
            <span className="min-w-0 truncate">{lead.whatsapp}</span>
          )}
        </div>
      )}
    </Link>
  )
}
