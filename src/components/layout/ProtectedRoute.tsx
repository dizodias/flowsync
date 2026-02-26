import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) {
        setHasSession(!!session)
        setLoading(false)
      }
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400 dark:text-slate-500" aria-hidden />
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.loading')}</p>
      </div>
    )
  }

  if (!hasSession) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}
