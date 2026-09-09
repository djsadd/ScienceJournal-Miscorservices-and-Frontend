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
  const forgotPageCopy =
    lang === 'en'
      ? {
          eyebrow: 'Account access',
          method: 'Email',
          help: 'Enter the email linked to your account. We will send a password reset link.',
          support: 'If you have trouble restoring access, contact the editorial office:',
          copyright: '© 2026 Turan-Astana University News. All rights reserved.',
          backToLogin: 'Back to sign in',
        }
      : lang === 'kz'
        ? {
            eyebrow: 'Аккаунтқа кіру',
            method: 'Email',
            help: 'Аккаунтқа тіркелген email мекенжайын көрсетіңіз. Біз парольді қалпына келтіру сілтемесін жібереміз.',
            support: 'Кіруді қалпына келтіру кезінде мәселе туындаса, редакцияға жазыңыз:',
            copyright: '© 2026 «Тұран-Астана» университетінің хабарлары. Барлық құқықтар қорғалған.',
            backToLogin: 'Кіру бетіне оралу',
          }
        : {
            eyebrow: 'Доступ к аккаунту',
            method: 'Email',
            help: 'Укажите email, привязанный к аккаунту. Мы отправим ссылку для создания нового пароля.',
            support: 'Если у вас возникли проблемы с восстановлением доступа, обратитесь в редакцию:',
            copyright: '© 2026 Известия университета «Туран-Астана». Все права защищены.',
            backToLogin: 'Вернуться ко входу',
          }
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
    <div className="public-container auth-layout auth-layout--login auth-layout--forgot">
      <section className="public-section auth-card auth-card--login auth-card--forgot">
        <div className="auth-header auth-header--login">
          <h1 className="auth-title">{t.forgot.title}</h1>
          <span className="login-eyebrow">{forgotPageCopy.eyebrow}</span>
        </div>

        <form className="auth-form auth-form--login" onSubmit={handleSubmit} noValidate>
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

          <div className="login-method-tabs" aria-label={forgotPageCopy.eyebrow}>
            <span className="login-method-tabs__item login-method-tabs__item--active">{forgotPageCopy.method}</span>
          </div>

          <p className="forgot-password-copy">{forgotPageCopy.help}</p>

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

          <div className="auth-footer">
            <Link to={localizedHref('/login')} className="auth-link">
              {forgotPageCopy.backToLogin}
            </Link>
          </div>
        </form>
      </section>

      <div className="login-support">
        <span className="login-support__icon" aria-hidden="true">!</span>
        <span>
          {forgotPageCopy.support} <a href="mailto:digital@tau-edu.kz">digital@tau-edu.kz</a>
        </span>
      </div>

      <p className="login-copyright">{forgotPageCopy.copyright}</p>
    </div>
  )
}
