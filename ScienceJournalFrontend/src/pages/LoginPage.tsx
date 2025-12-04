import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'
import { useLanguage } from '../shared/LanguageContext'
import { loginCopy } from '../shared/translations'

export function LoginPage() {
  const { lang } = useLanguage()
  const t = loginCopy[lang]
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      setErrorMsg(null)
      // Backend accepts username OR email in the `username` field
      const payload = { username: identifier, password }
      const response = await api.post<{ access_token: string; refresh_token?: string; token_type?: string }>(
        '/auth/login',
        payload,
      )
      api.setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        tokenType: response.token_type ?? 'bearer',
      })
      navigate('/cabinet')
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          let detail: string | undefined
          if (error.bodyJson && typeof error.bodyJson === 'object' && 'detail' in (error.bodyJson as any)) {
            detail = String((error.bodyJson as any).detail)
          }
          if (detail && /pending approval/i.test(detail)) {
            setErrorMsg(t.errors.pendingApproval)
          } else {
            setErrorMsg(t.errors.accessDenied)
          }
          return
        }
        if (error.status === 401) {
          setErrorMsg(t.errors.invalidCreds)
          return
        }
        // Fallback for other API errors
        setErrorMsg(t.errors.apiFail)
        return
      }
      setErrorMsg(t.errors.networkFail)
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

        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <Alert variant="error" title={t.alertTitle} className="auth-alert" >
              {errorMsg}
            </Alert>
          )}
          <label className="form-field">
            <span className="form-label">{t.fields.identifierLabel}</span>
            <input
              className="text-input"
              type="text"
              placeholder={t.fields.identifierPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span className="form-label">{t.fields.passwordLabel}</span>
            <input
              className="text-input"
              type="password"
              placeholder={t.fields.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="auth-row">
            <label className="checkbox">
              <input type="checkbox" />
              <span>{t.rememberDevice}</span>
            </label>
            <a className="auth-link" href="mailto:support@sciencejournal.kz">
              {t.needHelp}
            </a>
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {submitting ? t.submitBusy : t.submitIdle}
          </button>

          <div className="auth-footer">
            <span>{t.footerPrompt}</span>
            <Link to="/register" className="auth-link">
              {t.footerRegister}
            </Link>
          </div>
        </form>
      </section>

      <section className="public-section auth-aside">
        <div className="auth-note">
          <p className="eyebrow">{t.asideEyebrow}</p>
          <h2 className="panel-title">{t.asideTitle}</h2>
          <p className="subtitle">{t.asideSubtitle}</p>
        </div>

        <div className="auth-badges">
          <div className="pill">{t.badges[0]}</div>
          <div className="pill">{t.badges[1]}</div>
          <div className="pill">{t.badges[2]}</div>
        </div>

        <div className="auth-steps">
          <div className="auth-step">
            <span className="auth-step__number">1</span>
            <div>
              <div className="auth-step__title">{t.steps[0].title}</div>
              <div className="auth-step__text">{t.steps[0].text}</div>
            </div>
          </div>
          <div className="auth-step">
            <span className="auth-step__number">2</span>
            <div>
              <div className="auth-step__title">{t.steps[1].title}</div>
              <div className="auth-step__text">{t.steps[1].text}</div>
            </div>
          </div>
          <div className="auth-step">
            <span className="auth-step__number">3</span>
            <div>
              <div className="auth-step__title">{t.steps[2].title}</div>
              <div className="auth-step__text">{t.steps[2].text}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
