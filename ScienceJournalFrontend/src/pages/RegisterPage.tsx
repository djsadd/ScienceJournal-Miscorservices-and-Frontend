import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'
import { useLanguage } from '../shared/LanguageContext'
import { registerCopy } from '../shared/translations'

type RegisterRole = 'author' | 'editor' | 'reviewer' | 'admin'
type ReviewLanguage = 'ru' | 'en' | 'kz'
type RegisterField =
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'email'
  | 'password'
  | 'confirm'
  | 'reviewLanguages'
  | 'acceptTerms'
type RegisterFieldErrors = Partial<Record<RegisterField, string>>

const reviewLanguageOptions: ReviewLanguage[] = ['ru', 'en', 'kz']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernamePattern = /^[A-Za-z0-9._-]{3,}$/
const hasLetterPattern = /\p{L}/u
const hasNumberPattern = /\d/

export function RegisterPage() {
  const { lang } = useLanguage()
  const t = registerCopy[lang]
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [organization, setOrganization] = useState('')
  const [institution, setInstitution] = useState('')
  const [role, setRole] = useState<RegisterRole>('author')
  const [reviewLanguages, setReviewLanguages] = useState<ReviewLanguage[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [notifyStatus, setNotifyStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const roleLabels = {
    author: t.fields.role.options.author,
    reviewer: t.fields.role.options.reviewer,
    editor: t.fields.role.options.editor,
    admin: lang === 'en' ? 'Administrator' : lang === 'kz' ? 'Әкімші' : 'Администратор',
  }

  const toggleReviewLanguage = (language: ReviewLanguage) => {
    setReviewLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language],
    )
  }

  const getInputClassName = (field: RegisterField) =>
    fieldErrors[field] ? 'text-input text-input--error' : 'text-input'

  const validateField = (field: RegisterField): string | undefined => {
    switch (field) {
      case 'firstName':
        return firstName.trim() ? undefined : t.errors.requiredField
      case 'lastName':
        return lastName.trim() ? undefined : t.errors.requiredField
      case 'username': {
        const value = username.trim()
        if (!value) return t.errors.requiredField
        return usernamePattern.test(value) ? undefined : t.errors.invalidUsername
      }
      case 'email': {
        const value = email.trim()
        if (!value) return t.errors.requiredField
        return emailPattern.test(value) ? undefined : t.errors.invalidEmail
      }
      case 'password':
        if (!password) return t.errors.requiredField
        if (password.length < 8) return t.errors.passwordTooShort
        if (!hasLetterPattern.test(password) || !hasNumberPattern.test(password)) return t.errors.passwordWeak
        return undefined
      case 'confirm':
        if (!confirm) return t.errors.confirmRequired
        return password === confirm ? undefined : t.errors.passwordMismatch
      case 'reviewLanguages':
        if (role !== 'reviewer') return undefined
        return reviewLanguages.length > 0 ? undefined : t.errors.reviewLanguagesRequired ?? t.fields.reviewLanguages.hint
      case 'acceptTerms':
        return acceptTerms ? undefined : t.errors.acceptRequired
      default:
        return undefined
    }
  }

  const validateForm = () => {
    const nextErrors: RegisterFieldErrors = {}
    const fields: RegisterField[] = ['firstName', 'lastName', 'username', 'email', 'password', 'confirm', 'acceptTerms']

    if (role === 'reviewer') {
      fields.push('reviewLanguages')
    }

    fields.forEach((field) => {
      const message = validateField(field)
      if (message) {
        nextErrors[field] = message
      }
    })

    return nextErrors
  }

  const clearFieldError = (field: RegisterField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const clearFormError = () => {
    setError((current) => (current ? null : current))
  }

  const extractApiErrorMessage = (apiError: ApiError) => {
    const body = apiError.bodyJson
    if (body && typeof body === 'object') {
      if ('detail' in body) {
        const detail = (body as { detail?: unknown }).detail
        if (typeof detail === 'string' && detail.trim()) {
          return detail
        }
        if (Array.isArray(detail)) {
          const joined = detail
            .map((item) => {
              if (typeof item === 'string') return item
              if (item && typeof item === 'object' && 'msg' in item) return String((item as { msg?: unknown }).msg)
              return null
            })
            .filter(Boolean)
            .join(', ')
          if (joined) return joined
        }
      }
      if ('message' in body && typeof (body as { message?: unknown }).message === 'string') {
        return String((body as { message?: string }).message)
      }
    }

    return apiError.bodyText || t.errors.registrationFailed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const nextErrors = validateForm()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setError(t.errors.invalidForm)
      return
    }

    setSubmitting(true)
    try {
      setError(null)

      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        organization: organization.trim(),
        institution: institution.trim(),
        role,
        ...(role === 'reviewer'
          ? {
              preferred_language: reviewLanguages.length === 1 ? reviewLanguages[0] : reviewLanguages,
            }
          : {}),
        accept_terms: acceptTerms,
        notify_status: notifyStatus,
      }

      const response = await api.post('/auth/register', payload)
      console.log('Register response:', response)
      navigate('/login')
    } catch (error) {
      console.error('Register error:', error)
      if (error instanceof ApiError) {
        setError(extractApiErrorMessage(error))
      } else {
        setError(t.errors.networkFail)
      }
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
          {error && (
            <Alert variant="error" className="auth-alert">
              {error}
            </Alert>
          )}
          <div className="grid grid-2 auth-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.firstName.label}</span>
              <input
                className={getInputClassName('firstName')}
                type="text"
                placeholder={t.fields.firstName.placeholder}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  clearFormError()
                  clearFieldError('firstName')
                }}
                aria-invalid={Boolean(fieldErrors.firstName)}
              />
              {fieldErrors.firstName ? <span className="form-error-text">{fieldErrors.firstName}</span> : null}
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.lastName.label}</span>
              <input
                className={getInputClassName('lastName')}
                type="text"
                placeholder={t.fields.lastName.placeholder}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  clearFormError()
                  clearFieldError('lastName')
                }}
                aria-invalid={Boolean(fieldErrors.lastName)}
              />
              {fieldErrors.lastName ? <span className="form-error-text">{fieldErrors.lastName}</span> : null}
            </label>
          </div>
          <label className="form-field">
            <span className="form-label">{t.fields.username.label}</span>
            <input
              className={getInputClassName('username')}
              type="text"
              placeholder={t.fields.username.placeholder}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                clearFormError()
                clearFieldError('username')
              }}
              aria-invalid={Boolean(fieldErrors.username)}
            />
            {fieldErrors.username ? <span className="form-error-text">{fieldErrors.username}</span> : null}
          </label>
          <div className="grid grid-2 auth-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.organization.label}</span>
              <input
                className="text-input"
                type="text"
                placeholder={t.fields.organization.placeholder}
                value={organization}
                onChange={(e) => {
                  setOrganization(e.target.value)
                  clearFormError()
                }}
              />
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.institution.label}</span>
              <input
                className="text-input"
                type="text"
                placeholder={t.fields.institution.placeholder}
                value={institution}
                onChange={(e) => {
                  setInstitution(e.target.value)
                  clearFormError()
                }}
              />
            </label>
          </div>
          <label className="form-field">
            <span className="form-label">{t.fields.email.label}</span>
            <input
              className={getInputClassName('email')}
              type="email"
              placeholder={t.fields.email.placeholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearFormError()
                clearFieldError('email')
              }}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? <span className="form-error-text">{fieldErrors.email}</span> : null}
          </label>
          <label className="form-field">
            <span className="form-label">{t.fields.role.label}</span>
            <select
              className="text-input"
              value={role}
              onChange={(e) => {
                const nextRole = e.target.value as RegisterRole
                clearFormError()
                setRole(nextRole)
                setFieldErrors((current) => {
                  if (nextRole === 'reviewer') return current
                  if (!current.reviewLanguages) return current
                  const next = { ...current }
                  delete next.reviewLanguages
                  return next
                })
              }}
            >
              <option value="author">{roleLabels.author}</option>
              <option value="reviewer">{roleLabels.reviewer}</option>
              <option value="editor">{roleLabels.editor}</option>
              <option value="admin">{roleLabels.admin}</option>
            </select>
          </label>
          {role === 'reviewer' && (
            <label className="form-field">
              <span className="form-label">{t.fields.reviewLanguages.label}</span>
              <div className="auth-row auth-row--wrap">
                {reviewLanguageOptions.map((language) => (
                  <label className="checkbox" key={language}>
                    <input
                      type="checkbox"
                      checked={reviewLanguages.includes(language)}
                      onChange={() => {
                        toggleReviewLanguage(language)
                        clearFormError()
                        clearFieldError('reviewLanguages')
                      }}
                    />
                    <span>{t.fields.reviewLanguages.options[language]}</span>
                  </label>
                ))}
              </div>
              <span className="form-hint">{t.fields.reviewLanguages.hint}</span>
              {fieldErrors.reviewLanguages ? (
                <span className="form-error-text">{fieldErrors.reviewLanguages}</span>
              ) : null}
            </label>
          )}
          <div className="grid grid-2 auth-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.password.label}</span>
              <input
                className={getInputClassName('password')}
                type="password"
                placeholder={t.fields.password.placeholder}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearFormError()
                  clearFieldError('password')
                  clearFieldError('confirm')
                }}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <span className="form-hint">{t.fields.password.hint}</span>
              {fieldErrors.password ? <span className="form-error-text">{fieldErrors.password}</span> : null}
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.confirm.label}</span>
              <input
                className={getInputClassName('confirm')}
                type="password"
                placeholder={t.fields.confirm.placeholder}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  clearFormError()
                  clearFieldError('confirm')
                }}
                aria-invalid={Boolean(fieldErrors.confirm)}
              />
              {fieldErrors.confirm ? <span className="form-error-text">{fieldErrors.confirm}</span> : null}
            </label>
          </div>

          <div className="auth-row auth-row--wrap">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked)
                  clearFormError()
                  clearFieldError('acceptTerms')
                }}
                aria-invalid={Boolean(fieldErrors.acceptTerms)}
              />
              <span>{t.fields.accept}</span>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={notifyStatus}
                onChange={(e) => {
                  setNotifyStatus(e.target.checked)
                  clearFormError()
                }}
              />
              <span>{t.fields.notify}</span>
            </label>
          </div>
          {fieldErrors.acceptTerms ? <span className="form-error-text">{fieldErrors.acceptTerms}</span> : null}

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
