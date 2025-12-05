import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './VerifyEmailPage.css'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function VerifyEmailPage() {
  const query = useQuery()
  const token = query.get('token') || ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  )
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus('error')
        setMessage('Отсутствует токен подтверждения.')
        return
      }
      setStatus('loading')
      try {
        const resp = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        if (resp.ok) {
          setStatus('success')
          setMessage('Email успешно подтверждён. Ваш аккаунт активирован.')
        } else {
          const text = await resp.text()
          setStatus('error')
          setMessage(text || 'Ошибка подтверждения email.')
        }
      } catch (e: any) {
        setStatus('error')
        setMessage(e?.message || 'Сеть недоступна. Попробуйте позже.')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        <div className="verify-header">
          <div className="verify-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" className="icon-ring" />
              <path d="M9.5 12.5l2 2 4-5" className="icon-check" />
            </svg>
          </div>
          <h1 className="verify-title">Подтверждение электронной почты</h1>
          <p className="verify-subtitle">Спасибо, что с нами!</p>
        </div>

        {status === 'loading' && (
          <div className="verify-state">
            <div className="spinner" />
            <p>Проверяем токен подтверждения…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-success">
            <p className="verify-message">{message}</p>
            <a className="verify-btn" href="/login">Войти в систему</a>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-error">
            <p className="verify-message">{message}</p>
            <a className="verify-btn outline" href="/register">Повторить регистрацию</a>
            <p className="verify-help">Если проблема сохраняется, свяжитесь с поддержкой.</p>
          </div>
        )}
      </div>
      <div className="verify-bg" />
    </div>
  )
}
