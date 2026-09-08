import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'
import { useLanguage } from '../shared/LanguageContext'
import { loginCopy } from '../shared/translations'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const { lang } = useLanguage()
  const t = loginCopy[lang]
  const localizedHref = (path: string) => (path === '/' ? `/${lang}` : `/${lang}${path}`)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    const normalizedEmail = email.trim()
    if (!emailPattern.test(normalizedEmail)) {
      setSuccess(null)
      setError(t.forgot.invalidEmail)
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await api.post<{ message: string }>('/auth/forgot-password', { email: normalizedEmail })
      setSuccess(t.forgot.sent)
    } catch (caught) {
      console.error('Forgot password error:', caught)
      setError(caught instanceof ApiError ? t.errors.apiFail : t.errors.networkFail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="public-container auth-minimal">
      <section className="public-section auth-minimal__card">
        <div className="auth-minimal__header">
          <p className="eyebrow">{t.forgot.title}</p>
          <h1 className="panel-title">{t.forgot.trigger}</h1>
          <p className="subtitle">{t.forgot.description}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {success && (
            <Alert variant="success" title={t.forgot.successTitle} className="auth-alert">
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="error" title={t.forgot.errorTitle} className="auth-alert">
              {error}
            </Alert>
          )}

          <label className="form-field">
            <span className="form-label">{t.forgot.emailLabel}</span>
            <input
              className={`text-input${error ? ' text-input--error' : ''}`}
              type="email"
              placeholder={t.forgot.emailPlaceholder}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(null)
                setSuccess(null)
              }}
              autoComplete="email"
              required
            />
          </label>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {submitting ? t.forgot.submitBusy : t.forgot.submitIdle}
          </button>

          <div className="auth-minimal__footer">
            <Link to={localizedHref('/login')} className="auth-link">
              {t.reset.backToLogin}
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
