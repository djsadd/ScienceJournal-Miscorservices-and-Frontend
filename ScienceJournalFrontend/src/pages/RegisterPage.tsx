import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Alert } from '../shared/components/Alert'
import { useLanguage } from '../shared/LanguageContext'
import { registerCopy } from '../shared/translations'

const publicRegisterRoles = ['author', 'reviewer', 'editor'] as const
type RegisterRole = (typeof publicRegisterRoles)[number]
type ReviewLanguage = 'ru' | 'en' | 'kz'
type ReviewerScienceField =
  | 'economics'
  | 'politology'
  | 'jurisprudence'
  | 'pedagogy'
  | 'philology'
  | 'psychology'
  | 'sociology'
  | 'management'
  | 'philosophy'
  | 'cultural_studies'
  | 'information_technology'
  | 'other'

type RegisterField =
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'email'
  | 'orcid'
  | 'academicDegrees'
  | 'password'
  | 'confirm'
  | 'reviewLanguages'
  | 'reviewerScienceFields'
  | 'reviewerScienceOther'
  | 'acceptTerms'

type RegisterFieldErrors = Partial<Record<RegisterField, string>>

const reviewLanguageOptions: ReviewLanguage[] = ['ru', 'en', 'kz']
const academicDegreeOptions = ['candidate', 'doctor', 'phd', 'master', 'bachelor'] as const
type AcademicDegreeOption = (typeof academicDegreeOptions)[number]
const reviewerScienceFieldOptions: ReviewerScienceField[] = [
  'economics',
  'politology',
  'jurisprudence',
  'pedagogy',
  'philology',
  'psychology',
  'sociology',
  'management',
  'philosophy',
  'cultural_studies',
  'information_technology',
  'other',
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const orcidPattern = /^(\d{4}-){3}[\dX]{4}$/i
const usernamePattern = /^[A-Za-z0-9._-]{3,}$/
const hasLetterPattern = /\p{L}/u
const hasNumberPattern = /\d/

const apiFieldMap: Record<string, RegisterField> = {
  first_name: 'firstName',
  last_name: 'lastName',
  username: 'username',
  email: 'email',
  orcid: 'orcid',
  academic_degrees: 'academicDegrees',
  password: 'password',
  preferred_language: 'reviewLanguages',
  reviewer_science_fields: 'reviewerScienceFields',
  reviewer_science_other: 'reviewerScienceOther',
  accept_terms: 'acceptTerms',
}

export function RegisterPage() {
  const { lang } = useLanguage()
  const t = registerCopy[lang]
  const localizedHref = (path: string) => (path === '/' ? `/${lang}` : `/${lang}${path}`)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [organization, setOrganization] = useState('')
  const [institution, setInstitution] = useState('')
  const [academicDegrees, setAcademicDegrees] = useState<string[]>([])
  const [orcid, setOrcid] = useState('')
  const [role, setRole] = useState<RegisterRole>('author')
  const [reviewLanguages, setReviewLanguages] = useState<ReviewLanguage[]>([])
  const [reviewerScienceFields, setReviewerScienceFields] = useState<ReviewerScienceField[]>([])
  const [reviewerScienceOther, setReviewerScienceOther] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [notifyStatus, setNotifyStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const roleLabels: Record<RegisterRole, string> = {
    author: t.fields.role.options.author,
    reviewer: t.fields.role.options.reviewer,
    editor: t.fields.role.options.editor,
  }

  const reviewerScienceFieldLabels: Record<ReviewerScienceField, string> =
    lang === 'en'
      ? {
          economics: 'Economics',
          politology: 'Political science',
          jurisprudence: 'Jurisprudence',
          pedagogy: 'Pedagogy',
          philology: 'Philology',
          psychology: 'Psychology',
          sociology: 'Sociology',
          management: 'Management',
          philosophy: 'Philosophy',
          cultural_studies: 'Cultural studies',
          information_technology: 'Information technology',
          other: 'Other',
        }
      : lang === 'kz'
        ? {
            economics: 'Экономика',
            politology: 'Саясаттану',
            jurisprudence: 'Құқықтану',
            pedagogy: 'Педагогика',
            philology: 'Филология',
            psychology: 'Психология',
            sociology: 'Әлеуметтану',
            management: 'Менеджмент',
            philosophy: 'Философия',
            cultural_studies: 'Мәдениеттану',
            information_technology: 'Ақпараттық технологиялар',
            other: 'Өзге',
          }
        : {
            economics: 'Экономика',
            politology: 'Политология',
            jurisprudence: 'Юриспруденция',
            pedagogy: 'Педагогика',
            philology: 'Филология',
            psychology: 'Психология',
            sociology: 'Социология',
            management: 'Менеджмент',
            philosophy: 'Философия',
            cultural_studies: 'Культурология',
            information_technology: 'Информационные технологии',
            other: 'Иное',
          }

  const reviewerScienceTitle = lang === 'en' ? 'Science fields' : lang === 'kz' ? 'Ғылым бағыттары' : 'Направление наук'
  const reviewerScienceHint =
    lang === 'en'
      ? 'Select one or several fields. If you choose Other, fill in the text field.'
      : lang === 'kz'
        ? 'Бір немесе бірнеше бағытты таңдаңыз. Егер "Өзге" таңдалса, мәтінді толтырыңыз.'
        : 'Можно выбрать одно или несколько направлений. Если выбрано "Иное", заполните поле.'
  const reviewerScienceOtherLabel =
    lang === 'en' ? 'Specify other field' : lang === 'kz' ? 'Өзге бағытты нақтылаңыз' : 'Укажите иное направление'
  const degreeTitle = lang === 'en' ? 'Academic degrees' : lang === 'kz' ? 'Ғылыми дәрежелер' : 'Учёная степень'
  const registerPageCopy =
    lang === 'en'
      ? {
          title: 'Registration',
          role: role === 'reviewer' ? 'reviewer' : role === 'editor' ? 'editor' : 'author',
          intro:
            'A personal account opens access to article submission, manuscript status tracking and editorial correspondence.',
          quote:
            'The journal publishes original research, reviews and short communications across scientific fields.',
          requirementsTitle: 'Author requirements',
          requirements: ['Active work email', 'Organization affiliation', 'ORCID is recommended'],
          cardTitle: 'Create account',
          step: 'STEP 1 / 1',
          personal: '01 - Personal data',
          affiliation: '02 - Affiliation',
          degree: '03 - Academic degree',
          access: '04 - Account access',
          reviewer: 'Reviewer profile',
        }
      : lang === 'kz'
        ? {
            title: 'Тіркелу',
            role: role === 'reviewer' ? 'рецензент' : role === 'editor' ? 'редактор' : 'автор',
            intro:
              'Жеке кабинет мақала жіберуге, қолжазба мәртебесін бақылауға және редакциямен хат алмасуға мүмкіндік береді.',
            quote:
              'Журнал ғылым салалары бойынша түпнұсқа зерттеулерді, шолуларды және қысқа хабарламаларды жариялайды.',
            requirementsTitle: 'Авторларға талаптар',
            requirements: ['Жұмыс email мекенжайы', 'Ұйыммен аффилиация', 'ORCID ұсынылады'],
            cardTitle: 'Аккаунт жасау',
            step: 'STEP 1 / 1',
            personal: '01 - Жеке деректер',
            affiliation: '02 - Аффилиация',
            degree: '03 - Ғылыми дәреже',
            access: '04 - Аккаунтқа кіру',
            reviewer: 'Рецензент профилі',
          }
        : {
            title: 'Регистрация',
            role: role === 'reviewer' ? 'рецензента' : role === 'editor' ? 'редактора' : 'автора',
            intro:
              'Личный кабинет открывает доступ к подаче статей, отслеживанию статуса рукописей и переписке с редакцией.',
            quote:
              '«Известия» публикуют оригинальные исследования, обзоры и краткие сообщения во всех областях науки.',
            requirementsTitle: 'Требования к авторам',
            requirements: ['Действующий рабочий email', 'Аффилиация с организацией', 'ORCID рекомендуется'],
            cardTitle: 'Создание аккаунта',
            step: 'STEP 1 / 1',
            personal: '01 - Персональные данные',
            affiliation: '02 - Аффилиация',
            degree: '03 - Учёная степень',
            access: '04 - Доступ к аккаунту',
            reviewer: 'Профиль рецензента',
          }
  const academicDegreeLabels: Record<AcademicDegreeOption, string> =
    lang === 'en'
      ? {
          candidate: 'Candidate of Sciences',
          doctor: 'Doctor of Sciences',
          phd: 'PhD',
          master: 'Master',
          bachelor: 'Bachelor',
        }
      : lang === 'kz'
        ? {
            candidate: 'Ғылым кандидаты',
            doctor: 'Ғылым докторы',
            phd: 'PhD',
            master: 'Магистр',
            bachelor: 'Бакалавр',
          }
        : {
            candidate: 'Кандидат наук',
            doctor: 'Доктор наук',
            phd: 'PhD',
            master: 'Магистр',
            bachelor: 'Бакалавр',
          }

  const toggleReviewLanguage = (language: ReviewLanguage) => {
    setReviewLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language],
    )
  }

  const toggleReviewerScienceField = (field: ReviewerScienceField) => {
    setReviewerScienceFields((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
    )
  }

  const toggleAcademicDegree = (degree: AcademicDegreeOption) => {
    setAcademicDegrees((current) => (current.includes(degree) ? current.filter((item) => item !== degree) : [...current, degree]))
    clearFormError()
    clearFieldError('academicDegrees')
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
      case 'orcid': {
        const value = orcid.trim()
        if (!value) return undefined
        return orcidPattern.test(value) ? undefined : 'Введите ORCID в формате 0000-0000-0000-0000'
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
      case 'reviewerScienceFields':
        if (role !== 'reviewer') return undefined
        return reviewerScienceFields.length > 0
          ? undefined
          : lang === 'en'
            ? 'Select at least one science field'
            : lang === 'kz'
              ? 'Кемінде бір ғылым бағытын таңдаңыз'
              : 'Выберите хотя бы одно направление наук'
      case 'reviewerScienceOther':
        if (role !== 'reviewer' || !reviewerScienceFields.includes('other')) return undefined
        return reviewerScienceOther.trim()
          ? undefined
          : lang === 'en'
            ? 'Fill in the Other field'
            : lang === 'kz'
              ? '"Өзге" өрісін толтырыңыз'
              : 'Заполните поле "Иное"'
      case 'acceptTerms':
        return acceptTerms ? undefined : t.errors.acceptRequired
      default:
        return undefined
    }
  }

  const validateForm = () => {
    const nextErrors: RegisterFieldErrors = {}
    const fields: RegisterField[] = ['firstName', 'lastName', 'username', 'email', 'orcid', 'password', 'confirm', 'acceptTerms']

    if (role === 'reviewer') {
      fields.push('reviewLanguages', 'reviewerScienceFields')
      if (reviewerScienceFields.includes('other')) {
        fields.push('reviewerScienceOther')
      }
    }

    fields.forEach((field) => {
      const message = validateField(field)
      if (message) nextErrors[field] = message
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

  const clearFormError = () => setError((current) => (current ? null : current))

  const extractApiErrorMessage = (apiError: ApiError) => {
    const body = apiError.bodyJson
    if (body && typeof body === 'object') {
      if ('detail' in body) {
        const detail = (body as { detail?: unknown }).detail
        if (typeof detail === 'string' && detail.trim()) return detail
        if (detail && typeof detail === 'object' && 'message' in detail) {
          const message = (detail as { message?: unknown }).message
          if (typeof message === 'string' && message.trim()) return message
        }
      }
      if ('message' in body && typeof (body as { message?: unknown }).message === 'string') {
        return String((body as { message?: string }).message)
      }
    }
    return apiError.bodyText || t.errors.registrationFailed
  }

  const extractApiFieldErrors = (apiError: ApiError): RegisterFieldErrors => {
    const body = apiError.bodyJson
    const nextErrors: RegisterFieldErrors = {}

    if (!body || typeof body !== 'object' || !('detail' in body)) {
      return nextErrors
    }

    const detail = (body as { detail?: unknown }).detail
    if (detail && typeof detail === 'object' && !Array.isArray(detail) && 'fields' in detail) {
      const fields = (detail as { fields?: unknown }).fields
      if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
        Object.entries(fields as Record<string, unknown>).forEach(([apiField, message]) => {
          const field = apiFieldMap[apiField]
          if (field && typeof message === 'string' && message.trim()) {
            nextErrors[field] = message
          }
        })
      }
    }

    if (Array.isArray(detail)) {
      detail.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const loc = (item as { loc?: unknown }).loc
        const msg = (item as { msg?: unknown }).msg
        if (!Array.isArray(loc) || typeof msg !== 'string') return
        const apiField = String(loc[loc.length - 1] ?? '')
        const field = apiFieldMap[apiField]
        if (field && msg.trim()) {
          nextErrors[field] = msg
        }
      })
    }

    return nextErrors
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
      await api.post('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        organization: organization.trim(),
        institution: institution.trim(),
        academic_degrees: academicDegrees,
        orcid: orcid.trim() || undefined,
        role,
        ...(role === 'reviewer'
          ? {
              preferred_language: reviewLanguages.length === 1 ? reviewLanguages[0] : reviewLanguages,
              reviewer_science_fields: reviewerScienceFields,
              reviewer_science_other: reviewerScienceFields.includes('other') ? reviewerScienceOther.trim() : undefined,
            }
          : {}),
        accept_terms: acceptTerms,
        notify_status: notifyStatus,
      })
      navigate('/login')
    } catch (caught) {
      console.error('Register error:', caught)
      if (caught instanceof ApiError) {
        const apiFieldErrors = extractApiFieldErrors(caught)
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors((current) => ({ ...current, ...apiFieldErrors }))
        }
        setError(extractApiErrorMessage(caught))
      } else {
        setError(t.errors.networkFail)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="public-container auth-layout auth-layout--register">
      <aside className="register-aside" aria-labelledby="register-aside-title">
        <div className="register-aside__ornament" aria-hidden="true" />
        <h1 className="register-aside__title" id="register-aside-title">
          <span>{registerPageCopy.title}</span>
          <em>{registerPageCopy.role}</em>
        </h1>
        <p className="register-aside__intro">{registerPageCopy.intro}</p>
        <blockquote className="register-aside__quote">{registerPageCopy.quote}</blockquote>
        <div className="register-aside__requirements">
          <h2>{registerPageCopy.requirementsTitle}</h2>
          <ul>
            {registerPageCopy.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="public-section auth-card auth-card--register">
        <div className="auth-header auth-header--register">
          <h1 className="auth-title">{registerPageCopy.cardTitle}</h1>
          <span className="register-step">{registerPageCopy.step}</span>
        </div>

        <form className="auth-form auth-form--register" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert variant="error" className="auth-alert">
              {error}
            </Alert>
          )}

          <div className="register-form-section">
            <div className="register-section-label">{registerPageCopy.personal}</div>
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
                />
                {fieldErrors.firstName && <span className="form-error-text">{fieldErrors.firstName}</span>}
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
                />
                {fieldErrors.lastName && <span className="form-error-text">{fieldErrors.lastName}</span>}
              </label>
            </div>

            <div className="grid grid-2 auth-grid">
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
                />
                {fieldErrors.username && <span className="form-error-text">{fieldErrors.username}</span>}
              </label>

              <label className="form-field">
                <span className="form-label">{t.fields.role.label}</span>
                <select
                  className="text-input"
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value
                    if (!publicRegisterRoles.includes(nextRole as RegisterRole)) return
                    clearFormError()
                    setRole(nextRole as RegisterRole)
                    if (nextRole !== 'reviewer') {
                      setReviewerScienceFields([])
                      setReviewerScienceOther('')
                    }
                    setFieldErrors((current) => {
                      const next = { ...current }
                      delete next.reviewLanguages
                      delete next.reviewerScienceFields
                      delete next.reviewerScienceOther
                      return next
                    })
                  }}
                >
                  {publicRegisterRoles.map((option) => (
                    <option value={option} key={option}>
                      {roleLabels[option]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="register-form-section">
            <div className="register-section-label">{registerPageCopy.affiliation}</div>
            <div className="grid grid-2 auth-grid">
              <label className="form-field">
                <span className="form-label">{t.fields.organization.label}</span>
                <input className="text-input" type="text" placeholder={t.fields.organization.placeholder} value={organization} onChange={(e) => setOrganization(e.target.value)} />
              </label>
              <label className="form-field">
                <span className="form-label">{t.fields.institution.label}</span>
                <input className="text-input" type="text" placeholder={t.fields.institution.placeholder} value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-2 auth-grid">
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
                />
                {fieldErrors.email && <span className="form-error-text">{fieldErrors.email}</span>}
              </label>

              <label className="form-field">
                <span className="form-label">ORCID</span>
                <input
                  className={getInputClassName('orcid')}
                  type="text"
                  placeholder="0000-0000-0000-0000"
                  value={orcid}
                  onChange={(e) => {
                    setOrcid(e.target.value)
                    clearFormError()
                    clearFieldError('orcid')
                  }}
                />
                {fieldErrors.orcid && <span className="form-error-text">{fieldErrors.orcid}</span>}
              </label>
            </div>
          </div>

          <div className="register-form-section">
            <div className="register-section-label">{registerPageCopy.degree}</div>
            <div className="form-field">
              <span className="form-label form-label--sr">{degreeTitle}</span>
              <div className="choice-chips choice-chips--degree">
                {academicDegreeOptions.map((degree) => {
                  const label = academicDegreeLabels[degree]
                  return (
                    <label className={`choice-chip${academicDegrees.includes(degree) ? ' choice-chip--active' : ''}`} key={degree}>
                      <input type="checkbox" checked={academicDegrees.includes(degree)} onChange={() => toggleAcademicDegree(degree)} />
                      <span className="choice-chip__label">{label}</span>
                    </label>
                  )
                })}
              </div>
              {fieldErrors.academicDegrees && <span className="form-error-text">{fieldErrors.academicDegrees}</span>}
            </div>
          </div>

          {role === 'reviewer' && (
            <div className="register-form-section">
              <div className="register-section-label">{registerPageCopy.reviewer}</div>
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
                {fieldErrors.reviewLanguages && <span className="form-error-text">{fieldErrors.reviewLanguages}</span>}
              </label>

              <label className="form-field">
                <span className="form-label">{reviewerScienceTitle}</span>
                <div className="choice-chips">
                  {reviewerScienceFieldOptions.map((field) => (
                    <label className={`choice-chip${reviewerScienceFields.includes(field) ? ' choice-chip--active' : ''}`} key={field}>
                      <input
                        type="checkbox"
                        checked={reviewerScienceFields.includes(field)}
                        onChange={() => {
                          const willDisableOther = field === 'other' && reviewerScienceFields.includes('other')
                          toggleReviewerScienceField(field)
                          if (willDisableOther) setReviewerScienceOther('')
                          clearFormError()
                          clearFieldError('reviewerScienceFields')
                          clearFieldError('reviewerScienceOther')
                        }}
                      />
                      <span className="choice-chip__label">{reviewerScienceFieldLabels[field]}</span>
                    </label>
                  ))}
                </div>
                <span className="form-hint">{reviewerScienceHint}</span>
                {reviewerScienceFields.includes('other') && (
                  <input
                    className={`${getInputClassName('reviewerScienceOther')} choice-chip__other-input`}
                    type="text"
                    placeholder={reviewerScienceOtherLabel}
                    value={reviewerScienceOther}
                    onChange={(e) => {
                      setReviewerScienceOther(e.target.value)
                      clearFormError()
                      clearFieldError('reviewerScienceOther')
                    }}
                  />
                )}
                {fieldErrors.reviewerScienceOther && <span className="form-error-text">{fieldErrors.reviewerScienceOther}</span>}
                {fieldErrors.reviewerScienceFields && <span className="form-error-text">{fieldErrors.reviewerScienceFields}</span>}
              </label>
            </div>
          )}

          <div className="register-form-section">
            <div className="register-section-label">{registerPageCopy.access}</div>
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
                />
                <span className="form-hint">{t.fields.password.hint}</span>
                {fieldErrors.password && <span className="form-error-text">{fieldErrors.password}</span>}
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
                />
                {fieldErrors.confirm && <span className="form-error-text">{fieldErrors.confirm}</span>}
              </label>
            </div>

            <div className="auth-row auth-row--wrap auth-consents">
              <label className="checkbox">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                <span>{t.fields.accept}</span>
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={notifyStatus} onChange={(e) => setNotifyStatus(e.target.checked)} />
                <span>{t.fields.notify}</span>
              </label>
            </div>
          </div>
          {fieldErrors.acceptTerms && <span className="form-error-text">{fieldErrors.acceptTerms}</span>}

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {submitting ? t.submitBusy : t.submitIdle}
          </button>

          <div className="auth-footer">
            <span>{t.footerPrompt}</span>
            <Link to={localizedHref('/login')} className="auth-link">
              {t.footerLogin}
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
