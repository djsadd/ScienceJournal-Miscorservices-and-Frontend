import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './VerifyEmailPage.css'
import logoUrl from '../assets/logo.svg'
import { useLanguage } from '../shared/LanguageContext'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function VerifyEmailPage() {
  const { lang } = useLanguage()
  const t = {
    ru: { missing: 'Отсутствует токен подтверждения.', success: 'Email успешно подтверждён. Ваш аккаунт активирован.', error: 'Ошибка подтверждения email.', network: 'Сеть недоступна. Попробуйте позже.', logo: 'Университет', title: 'Подтверждение электронной почты', subtitle: 'Спасибо, что с нами!', checking: 'Проверяем токен подтверждения…', login: 'Войти в систему', retry: 'Повторить регистрацию', help: 'Если проблема сохраняется, свяжитесь с поддержкой.' },
    en: { missing: 'The verification token is missing.', success: 'Your email has been verified successfully. Your account is now active.', error: 'Email verification failed.', network: 'The network is unavailable. Please try again later.', logo: 'University', title: 'Email verification', subtitle: 'Thank you for joining us!', checking: 'Verifying your token…', login: 'Sign in', retry: 'Register again', help: 'If the problem persists, please contact support.' },
    kz: { missing: 'Растау токені жоқ.', success: 'Email сәтті расталды. Аккаунтыңыз белсендірілді.', error: 'Email мекенжайын растау қатесі.', network: 'Желі қолжетімсіз. Кейінірек қайталап көріңіз.', logo: 'Университет', title: 'Электрондық поштаны растау', subtitle: 'Бізбен бірге болғаныңызға рақмет!', checking: 'Растау токені тексерілуде…', login: 'Жүйеге кіру', retry: 'Қайта тіркелу', help: 'Мәселе шешілмесе, қолдау қызметіне хабарласыңыз.' },
  }[lang]
  const localizedHref = (path: string) => `/${lang}${path}`
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
        setMessage(t.missing)
        return
      }
      setStatus('loading')
      try {
        const resp = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        if (resp.ok) {
          setStatus('success')
          setMessage(t.success)
        } else {
          const text = await resp.text()
          setStatus('error')
          setMessage(text || t.error)
        }
      } catch (e: any) {
        setStatus('error')
        setMessage(e?.message || t.network)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, t.error, t.missing, t.network, t.success])

  return (
    <div className="verify-wrapper">
      <header className="verify-topbar">
        <img src={logoUrl} alt={t.logo} className="verify-logo" />
      </header>
      <div className="verify-card">
        <div className="verify-header">
          <h1 className="verify-title">{t.title}</h1>
          <p className="verify-subtitle">{t.subtitle}</p>
        </div>

        {status === 'loading' && (
          <div className="verify-state">
            <div className="spinner" />
            <p>{t.checking}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-success">
            <p className="verify-message">{message}</p>
            <a className="verify-btn" href={localizedHref('/login')}>{t.login}</a>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-error">
            <p className="verify-message">{message}</p>
            <a className="verify-btn outline" href={localizedHref('/register')}>{t.retry}</a>
            <p className="verify-help">{t.help}</p>
          </div>
        )}
      </div>
      <div className="verify-bg" />
    </div>
  )
}
