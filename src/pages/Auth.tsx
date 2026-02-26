import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Auth() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isLogin && password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'))
      return
    }
    setLoading(true)
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
      }
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : t('auth.errorGeneric')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-[360px] px-4">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isLogin ? t('auth.login') : t('auth.signUp')}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="auth-email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
                placeholder={t('auth.email')}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
                placeholder={t('auth.password')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="auth-confirm-password" className="sr-only">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-fb-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
                  placeholder={t('auth.confirmPassword')}
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-fb-blue py-3 text-lg font-bold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-slate-900"
            >
              {loading ? (isLogin ? t('auth.login') + '…' : t('auth.signUp') + '…') : isLogin ? t('auth.login') : t('auth.signUp')}
            </button>
          </form>

          <div className="my-6 border-t border-slate-200 dark:border-slate-800" aria-hidden="true" />

          <div className="flex justify-center">
            <button
              type="button"
              className="w-full rounded-lg border-2 border-fb-green bg-fb-green py-2.5 text-sm font-bold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fb-green focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              onClick={() => setIsLogin((prev) => !prev)}
            >
              {t('auth.createNewAccount')}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <button
            type="button"
            className="font-medium text-fb-blue hover:underline focus:outline-none focus:underline"
            onClick={() => setIsLogin((prev) => !prev)}
          >
            {isLogin ? t('auth.noAccountSignUp') : t('auth.hasAccountLogin')}
          </button>
        </p>
      </div>
    </div>
  )
}