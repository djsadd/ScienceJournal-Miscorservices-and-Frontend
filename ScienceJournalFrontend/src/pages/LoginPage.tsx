import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'

export function LoginPage() {
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
            setErrorMsg('Ваш аккаунт ожидает подтверждения администратором. Доступ будет открыт после проверки.')
          } else {
            setErrorMsg('Доступ в систему закрыт. Обратитесь к администратору или в поддержку.')
          }
          return
        }
        if (error.status === 401) {
          setErrorMsg('Неверные учетные данные. Проверьте email/username и пароль.')
          return
        }
        // Fallback for other API errors
        setErrorMsg('Не удалось выполнить вход. Повторите попытку позже.')
        return
      }
      setErrorMsg('Не удалось выполнить вход. Проверьте подключение и попробуйте снова.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="public-container auth-layout">
      <section className="public-section auth-card">
        <div className="auth-header">
          <p className="eyebrow">Вход</p>
          <h1 className="hero__title">Войти и продолжить работу</h1>
          <p className="subtitle">
            Используйте учетные данные Science Journal, чтобы получить доступ к кабинету, заданиям и публикациям.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <Alert variant="error" title="Нет доступа" className="auth-alert" >
              {errorMsg}
            </Alert>
          )}
          <label className="form-field">
            <span className="form-label">Username или Email</span>
            <input
              className="text-input"
              type="text"
              placeholder="username или name@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span className="form-label">Пароль</span>
            <input
              className="text-input"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="auth-row">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Запомнить устройство</span>
            </label>
            <a className="auth-link" href="mailto:support@sciencejournal.kz">
              Нужна помощь?
            </a>
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {submitting ? 'Отправляем...' : 'Войти'}
          </button>

          <div className="auth-footer">
            <span>Еще нет аккаунта?</span>
            <Link to="/register" className="auth-link">
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </section>

      <section className="public-section auth-aside">
        <div className="auth-note">
          <p className="eyebrow">Для чего входить</p>
          <h2 className="panel-title">Работа с материалами</h2>
          <p className="subtitle">
            Получайте доступ к заявкам, рецензиям, верстке и редактированию. Сохраняем ваши действия под защищенным
            токеном.
          </p>
        </div>

        <div className="auth-badges">
          <div className="pill">Безопасное подключение</div>
          <div className="pill">Разграничение ролей</div>
          <div className="pill">Работа в одном окне</div>
        </div>

        <div className="auth-steps">
          <div className="auth-step">
            <span className="auth-step__number">1</span>
            <div>
              <div className="auth-step__title">Войти в кабинет</div>
              <div className="auth-step__text">Вводите username или email и пароль, чтобы открыть инструменты.</div>
            </div>
          </div>
          <div className="auth-step">
            <span className="auth-step__number">2</span>
            <div>
              <div className="auth-step__title">Работайте с заявками</div>
              <div className="auth-step__text">Отвечайте, публикуйте и рецензируйте в одном интерфейсе.</div>
            </div>
          </div>
          <div className="auth-step">
            <span className="auth-step__number">3</span>
            <div>
              <div className="auth-step__title">Сохраняйте прогресс</div>
              <div className="auth-step__text">Данные защищены токенами доступа и обновления.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
