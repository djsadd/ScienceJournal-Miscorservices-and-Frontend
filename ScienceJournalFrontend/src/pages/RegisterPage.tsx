import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import { registerCopy } from '../shared/translations'

export function RegisterPage() {
  const { lang } = useLanguage()
  const t = registerCopy[lang]
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [organization, setOrganization] = useState('')
  const [institution, setInstitution] = useState('')
  const [role, setRole] = useState<'author' | 'editor' | 'reviewer'>('author')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [notifyStatus, setNotifyStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      setError(null)
      if (password !== confirm) {
        setError(t.errors.passwordMismatch)
        return
      }
      if (!acceptTerms) {
        setError(t.errors.acceptRequired)
        return
      }

      const payload = {
        username,
        email,
        password,
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        organization,
        institution,
        role,
        accept_terms: acceptTerms,
        notify_status: notifyStatus,
      }

      const response = await api.post('/auth/register', payload)
      console.log('Register response:', response)
      navigate('/login')
    } catch (error) {
      console.error('Register error:', error)
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
          {error && (
            <div className="form-error" role="alert" style={{ color: '#d00', marginBottom: '0.5rem' }}>
              {error}
            </div>
          )}
          <div className="grid grid-2 auth-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.firstName.label}</span>
              <input
                className="text-input"
                type="text"
                placeholder={t.fields.firstName.placeholder}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.lastName.label}</span>
              <input
                className="text-input"
                type="text"
                placeholder={t.fields.lastName.placeholder}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span className="form-label">{t.fields.username.label}</span>
            <input
              className="text-input"
              type="text"
              placeholder={t.fields.username.placeholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <div className="grid grid-2 auth-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.organization.label}</span>
              <input
                className="text-input"
                type="text"
                placeholder={t.fields.organization.placeholder}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.institution.label}</span>
              <input
                className="text-input"
                type="text"
                placeholder={t.fields.institution.placeholder}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </label>
          </div>
          <label className="form-field">
            <span className="form-label">{t.fields.email.label}</span>
            <input
              className="text-input"
              type="email"
              placeholder={t.fields.email.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span className="form-label">{t.fields.role.label}</span>
            <select
              className="text-input"
              value={role}
              onChange={(e) => setRole(e.target.value as 'author' | 'editor' | 'reviewer')}
            >
              <option value="author">{t.fields.role.options.author}</option>
              <option value="reviewer">{t.fields.role.options.reviewer}</option>
              <option value="editor">{t.fields.role.options.editor}</option>
            </select>
          </label>
          <div className="grid grid-2 auth-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.password.label}</span>
              <input
                className="text-input"
                type="password"
                placeholder={t.fields.password.placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="form-hint">{t.fields.password.hint}</span>
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.confirm.label}</span>
              <input
                className="text-input"
                type="password"
                placeholder={t.fields.confirm.placeholder}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="auth-row auth-row--wrap">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              <span>{t.fields.accept}</span>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={notifyStatus}
                onChange={(e) => setNotifyStatus(e.target.checked)}
              />
              <span>{t.fields.notify}</span>
            </label>
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {submitting ? t.submitBusy : t.submitIdle}
          </button>

          <div className="auth-footer">
            <span>{t.footerPrompt}</span>
            <Link to="/login" className="auth-link">
              {t.footerLogin}
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

        <div className="auth-meta">
          <div className="auth-meta__item">{t.meta[0]}</div>
          <div className="auth-meta__item">{t.meta[1]}</div>
          <div className="auth-meta__item">{t.meta[2]}</div>
        </div>
      </section>
    </div>
  )
}
