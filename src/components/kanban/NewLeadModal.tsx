import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PhoneInput from 'react-phone-number-input'
import type { Column } from '../../types'

export interface NewLeadFormData {
  title: string
  contactName: string
  whatsapp: string
  columnId: string
}

interface NewLeadModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Column[]
  onSave: (data: NewLeadFormData) => void
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:bg-slate-800'

const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'US',
  es: 'ES',
  'pt-BR': 'BR',
  pt: 'BR',
  de: 'DE',
}

export function NewLeadModal({ isOpen, onClose, columns, onSave }: NewLeadModalProps) {
  const { t, i18n } = useTranslation()
  const [title, setTitle] = useState('')
  const [contactName, setContactName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [columnId, setColumnId] = useState(columns[0]?.id ?? '')

  const defaultCountry = useMemo(
    () => (LANGUAGE_TO_COUNTRY[i18n.language] ?? LANGUAGE_TO_COUNTRY[i18n.language.split('-')[0]] ?? 'US') as 'US' | 'ES' | 'BR' | 'DE',
    [i18n.language]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ title, contactName, whatsapp, columnId })
    setTitle('')
    setContactName('')
    setWhatsapp('')
    setColumnId(columns[0]?.id ?? '')
    onClose()
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setContactName('')
      setWhatsapp('')
      setColumnId(columns[0]?.id ?? '')
    }
  }, [isOpen, columns])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-lead-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="new-lead-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t('newLeadModal.addNewLead')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-lead-title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('newLeadModal.leadTitle')}
            </label>
            <input
              id="new-lead-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder={t('newLeadModal.leadTitle')}
              required
            />
          </div>

          <div>
            <label htmlFor="new-lead-contact" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('newLeadModal.contactName')}
            </label>
            <input
              id="new-lead-contact"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
              placeholder={t('newLeadModal.contactName')}
              required
            />
          </div>

          <div>
            <label htmlFor="new-lead-whatsapp" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('newLeadModal.whatsappNumber')}
            </label>
            <div id="new-lead-whatsapp" className="phone-input-modern">
              <PhoneInput
                international
                defaultCountry={defaultCountry}
                value={whatsapp || undefined}
                onChange={(val) => setWhatsapp(val ?? '')}
                placeholder={t('newLeadModal.whatsappNumber')}
                className=""
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-lead-column" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('newLeadModal.initialColumn')}
            </label>
            <select
              id="new-lead-column"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
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
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t('newLeadModal.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-fb-blue py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {t('newLeadModal.saveLead')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
