import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'
import { useLanguage } from '../shared/LanguageContext'
import { loginCopy } from '../shared/translations'

const hasLetterPattern = /\p{L}/u
const hasNumberPattern = /\d/

export default function ResetPasswordPage() {
  const { lang } = useLanguage()
  const t = loginCopy[lang].reset
  const localizedHref = (path: string) => (path === '/' ? `/${lang}` : `/${lang}${path}`)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(token ? null : t.tokenMissing)
  const [messageVariant, setMessageVariant] = useState<'error' | 'success'>(token ? 'success' : 'error')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const validate = () => {
    let isValid = true
    setNewPasswordError(null)
    setConfirmPasswordError(null)

    if (newPassword.length < 8) {
      setNewPasswordError(t.passwordTooShort)
      isValid = false
    } else if (!hasLetterPattern.test(newPassword) || !hasNumberPattern.test(newPassword)) {
      setNewPasswordError(t.passwordWeak)
      isValid = false
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t.passwordMismatch)
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting || completed || !token) return
    if (!validate()) return

    setSubmitting(true)
    setMessage(null)
    try {
      await api.post<{ message: string }>('/auth/reset-password', {
        token,
        new_password: newPassword,
      })
      setCompleted(true)
      setMessageVariant('success')
      setMessage(t.passwordUpdated)
    } catch (error) {
      console.error('Reset password error:', error)
      setMessageVariant('error')
      setMessage(error instanceof ApiError ? t.apiFail : t.networkFail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="public-container auth-layout">
      <section className="public-section auth-card">
        <div className="auth-header">
          <p className="eyebrow">{t.headerEyebrow}</p>
          <h1 className="hero__title">{t.headerTitle}</h1>
          <p className="subtitle">{t.headerSubtitle}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {message && (
            <Alert variant={messageVariant} title={messageVariant === 'success' ? t.successTitle : t.errorTitle} className="auth-alert">
              {message}
            </Alert>
          )}

          <label className="form-field">
            <span className="form-label">{t.newPasswordLabel}</span>
            <input
              className={`text-input${newPasswordError ? ' text-input--error' : ''}`}
              type="password"
              placeholder={t.newPasswordPlaceholder}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setNewPasswordError(null)
                setMessage(null)
              }}
              disabled={!token || completed}
              required
            />
            {newPasswordError && <span className="form-error-text">{newPasswordError}</span>}
          </label>

          <label className="form-field">
            <span className="form-label">{t.confirmLabel}</span>
            <input
              className={`text-input${confirmPasswordError ? ' text-input--error' : ''}`}
              type="password"
              placeholder={t.confirmPlaceholder}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setConfirmPasswordError(null)
                setMessage(null)
              }}
              disabled={!token || completed}
              required
            />
            {confirmPasswordError && <span className="form-error-text">{confirmPasswordError}</span>}
          </label>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting || completed || !token}>
            {submitting ? t.submitBusy : t.submitIdle}
          </button>

          <div className="auth-footer">
            <Link to={localizedHref('/login')} className="auth-link">
              {t.backToLogin}
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
