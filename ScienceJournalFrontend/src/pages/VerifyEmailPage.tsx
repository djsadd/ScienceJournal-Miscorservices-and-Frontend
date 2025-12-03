import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

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
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1>Подтверждение электронной почты</h1>
      {status === 'loading' && <p>Проверяем токен подтверждения…</p>}
      {status === 'success' && (
        <div style={{ color: 'green' }}>
          <p>{message}</p>
          <p>
            Теперь вы можете <a href="/login">войти</a> в систему.
          </p>
        </div>
      )}
      {status === 'error' && (
        <div style={{ color: 'crimson' }}>
          <p>{message}</p>
          <p>
            Если ссылка просрочена, выполните повторную регистрацию или обратитесь в поддержку.
          </p>
        </div>
      )}
    </div>
  )
}
