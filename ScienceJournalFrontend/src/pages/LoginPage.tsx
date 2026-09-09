import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'
import { useLanguage } from '../shared/LanguageContext'
import { loginCopy } from '../shared/translations'

export function LoginPage() {
  const { lang } = useLanguage()
  const t = loginCopy[lang]
  const localizedHref = (path: string) => (path === '/' ? `/${lang}` : `/${lang}${path}`)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const navigate = useNavigate()

  const loginPageCopy =
    lang === 'en'
      ? {
          title: 'Sign in',
          eyebrow: 'Authorization',
          method: 'Email / Username',
          identifierLabel: 'Email or username',
          identifierPlaceholder: 'name@example.com or username',
          passwordLabel: 'Password',
          passwordPlaceholder: 'Enter password',
          forgotPassword: 'Forgot password?',
          remember: 'Remember me on this device',
          support: 'If you have trouble signing in, contact the editorial office:',
          copyright: '© 2026 Turan-Astana University News. All rights reserved.',
          showPassword: 'Show password',
          hidePassword: 'Hide password',
        }
      : lang === 'kz'
        ? {
            title: 'Жүйеге кіру',
            eyebrow: 'Авторизация',
            method: 'Email / Username',
            identifierLabel: 'Email немесе username',
            identifierPlaceholder: 'name@example.com немесе username',
            passwordLabel: 'Құпиясөз',
            passwordPlaceholder: 'Құпиясөзді енгізіңіз',
            forgotPassword: 'Құпиясөзді ұмыттыңыз ба?',
            remember: 'Осы құрылғыда есте сақтау',
            support: 'Кіру кезінде мәселе туындаса, редакцияға жазыңыз:',
            copyright: '© 2026 «Тұран-Астана» университетінің хабарлары. Барлық құқықтар қорғалған.',
            showPassword: 'Құпиясөзді көрсету',
            hidePassword: 'Құпиясөзді жасыру',
          }
        : {
            title: 'Вход в систему',
            eyebrow: 'Авторизация',
            method: 'Email / Username',
            identifierLabel: 'Email или username',
            identifierPlaceholder: 'name@example.com или username',
            passwordLabel: 'Пароль',
            passwordPlaceholder: 'Введите пароль',
            forgotPassword: 'Забыли пароль?',
            remember: 'Запомнить меня на этом устройстве',
            support: 'Если у вас возникли проблемы со входом, обратитесь в редакцию:',
            copyright: '© 2026 Известия университета «Туран-Астана». Все права защищены.',
            showPassword: 'Показать пароль',
            hidePassword: 'Скрыть пароль',
          }

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
          if (error.bodyJson && typeof error.bodyJson === 'object' && 'detail' in error.bodyJson) {
            const rawDetail = (error.bodyJson as { detail?: unknown }).detail
            detail = typeof rawDetail === 'string' ? rawDetail : undefined
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
    <div className="public-container auth-layout auth-layout--login">
      <section className="public-section auth-card auth-card--login">
        <div className="auth-header auth-header--login">
          <h1 className="auth-title">{loginPageCopy.title}</h1>
          <span className="login-eyebrow">{loginPageCopy.eyebrow}</span>
        </div>

        <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
          {errorMsg && (
            <Alert variant="error" title={t.alertTitle} className="auth-alert" >
              {errorMsg}
            </Alert>
          )}

          <div className="login-method-tabs" aria-label={loginPageCopy.eyebrow}>
            <span className="login-method-tabs__item login-method-tabs__item--active">{loginPageCopy.method}</span>
          </div>

          <label className="form-field">
            <span className="form-label">{loginPageCopy.identifierLabel}</span>
            <input
              className="text-input"
              type="text"
              placeholder={loginPageCopy.identifierPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span className="login-password-head">
              <span className="form-label">{loginPageCopy.passwordLabel}</span>
              <Link className="auth-link login-forgot-link" to={localizedHref('/auth/forgot-password')}>
                {loginPageCopy.forgotPassword}
              </Link>
            </span>
            <span className="password-input-wrap">
              <input
                className="text-input"
                type={showPassword ? 'text' : 'password'}
                placeholder={loginPageCopy.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="password-visibility"
                type="button"
                aria-label={showPassword ? loginPageCopy.hidePassword : loginPageCopy.showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                👁
              </button>
            </span>
          </label>

          <div className="auth-row auth-row--login">
            <label className="checkbox">
              <input type="checkbox" />
              <span>{loginPageCopy.remember}</span>
            </label>
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {submitting ? t.submitBusy : t.submitIdle}
          </button>

          <div className="auth-footer">
            <span>{t.footerPrompt}</span>
            <Link to={localizedHref('/register')} className="auth-link">
              {t.footerRegister}
            </Link>
          </div>
        </form>
      </section>

      <div className="login-support">
        <span className="login-support__icon" aria-hidden="true">!</span>
        <span>
          {loginPageCopy.support}{' '}
          <a href="mailto:digital@tau-edu.kz">digital@tau-edu.kz</a>
        </span>
      </div>

      <p className="login-copyright">{loginPageCopy.copyright}</p>
    </div>
  )
}
