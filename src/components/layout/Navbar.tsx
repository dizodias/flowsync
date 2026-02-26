import { Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

const THEME_STORAGE_KEY = 'flowsync-theme'

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

type LanguageOption = {
  value: 'en' | 'es' | 'pt-BR' | 'de'
  label: 'EN' | 'ES' | 'PT' | 'DE'
}

const languageOptions: LanguageOption[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'pt-BR', label: 'PT' },
  { value: 'de', label: 'DE' },
]

export function Navbar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [language, setLanguage] = useState<LanguageOption['value']>('en')
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getInitialTheme() === 'dark')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDarkMode)
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const darkModeLabel = useMemo(() => (isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'), [isDarkMode])

  const handleLanguageChange = (nextLanguage: LanguageOption['value']) => {
    setLanguage(nextLanguage)
    void i18n.changeLanguage(nextLanguage)
  }

  useEffect(() => {
    const current = i18n.language
    const match = languageOptions.find((option) => option.value === current)
    if (match) {
      setLanguage(match.value)
    }
  }, [i18n.language])

  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) setUser(session?.user ?? null)
    }
    void checkSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void checkSession()
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-900 shadow-nav dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src="/flowSyncBlack.png" alt="FlowSync" className="h-8 w-auto dark:hidden" />
            <img src="/flowSyncWhite.png" alt="FlowSync" className="hidden h-8 w-auto dark:block" />
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-fb-blue hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('navbar.dashboard')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="language">
            Language
          </label>
          <select
            id="language"
            className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-fb-blue focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-fb-blue dark:focus:ring-fb-blue/40"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageOption['value'])}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-900 hover:bg-slate-200 focus:border-fb-blue focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:focus:ring-fb-blue/40"
            onClick={() => setIsDarkMode((prev) => !prev)}
            aria-label={darkModeLabel}
            title={darkModeLabel}
          >
            {isDarkMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleLogOut}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
            >
              {t('navbar.logOut')}
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-fb-blue px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {t('navbar.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}