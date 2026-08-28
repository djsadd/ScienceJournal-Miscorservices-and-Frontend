import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import type { Lang } from '../shared/labels'

type PreferredLanguage = 'ru' | 'en' | 'kz'
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

interface MeResponse {
  id: number
  username: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  organization: string | null
  institution: string | null
  email: string
  role: string
  is_active: boolean
  accept_terms: boolean
  notify_status: boolean
  profile_id: number | null
  phone?: string | null
  roles?: string[]
  preferred_language?: string | PreferredLanguage[] | null
  academic_degrees?: string[]
  orcid?: string | null
  reviewer_science_fields?: ReviewerScienceField[]
  reviewer_science_other?: string | null
}

type ProfileCopy = {
  header: { eyebrow: string; title: string; subtitle: string }
  loading: string
  error: string
  account: string
  contacts: string
  academic: string
  review: string
  status: string
  readonly: string
  save: string
  saving: string
  saveSuccess: string
  saveError: string
  requiredLanguage: string
  requiredScience: string
  requiredOther: string
  invalidOrcid: string
  yes: string
  no: string
  enabled: string
  disabled: string
  reviewerLanguageHint: string
  reviewerScienceHint: string
  reviewerScienceTitle: string
  reviewerScienceOtherLabel: string
  fields: Record<
    | 'fullName'
    | 'username'
    | 'email'
    | 'organization'
    | 'institution'
    | 'role'
    | 'active'
    | 'acceptedTerms'
    | 'notifications'
    | 'phone'
    | 'profileId'
    | 'roles'
    | 'preferredLanguage'
    | 'orcid'
    | 'degrees',
    string
  >
}

const profileCopy: Record<Lang, ProfileCopy> = {
  ru: {
    header: { eyebrow: 'Профиль', title: 'Мой профиль', subtitle: 'Основные данные аккаунта и настройки рецензирования.' },
    loading: 'Загрузка данных...',
    error: 'Не удалось загрузить профиль',
    account: 'Аккаунт',
    contacts: 'Контакты',
    academic: 'Учёные данные',
    review: 'Рецензирование',
    status: 'Статус',
    readonly: 'Только просмотр',
    save: 'Сохранить',
    saving: 'Сохранение...',
    saveSuccess: 'Профиль обновлён',
    saveError: 'Не удалось обновить профиль',
    requiredLanguage: 'Выберите хотя бы один язык рецензирования',
    requiredScience: 'Выберите хотя бы одно направление наук',
    requiredOther: 'Заполните поле «Иное»',
    invalidOrcid: 'Введите ORCID в формате 0000-0000-0000-0000',
    yes: 'Да',
    no: 'Нет',
    enabled: 'Включены',
    disabled: 'Выключены',
    reviewerLanguageHint: 'Можно выбрать несколько языков. Они используются при подборе рукописей.',
    reviewerScienceHint: 'Можно выбрать одно или несколько направлений.',
    reviewerScienceTitle: 'Направления наук',
    reviewerScienceOtherLabel: 'Укажите иное направление',
    fields: {
      fullName: 'ФИО',
      username: 'Логин',
      email: 'Email',
      organization: 'Организация',
      institution: 'Подразделение',
      role: 'Основная роль',
      active: 'Активен',
      acceptedTerms: 'Условия приняты',
      notifications: 'Уведомления',
      phone: 'Телефон',
      profileId: 'ID профиля',
      roles: 'Роли',
      preferredLanguage: 'Языки рецензирования',
      orcid: 'ORCID',
      degrees: 'Учёная степень',
    },
  },
  en: {
    header: { eyebrow: 'Profile', title: 'My profile', subtitle: 'Account details and reviewer settings.' },
    loading: 'Loading data...',
    error: 'Failed to load profile',
    account: 'Account',
    contacts: 'Contacts',
    academic: 'Academic details',
    review: 'Reviewing',
    status: 'Status',
    readonly: 'Read only',
    save: 'Save',
    saving: 'Saving...',
    saveSuccess: 'Profile updated',
    saveError: 'Failed to update profile',
    requiredLanguage: 'Select at least one review language',
    requiredScience: 'Select at least one science field',
    requiredOther: 'Fill in the Other field',
    invalidOrcid: 'Enter ORCID in the format 0000-0000-0000-0000',
    yes: 'Yes',
    no: 'No',
    enabled: 'Enabled',
    disabled: 'Disabled',
    reviewerLanguageHint: 'You can select multiple languages. They are used for manuscript matching.',
    reviewerScienceHint: 'Select one or several fields.',
    reviewerScienceTitle: 'Science fields',
    reviewerScienceOtherLabel: 'Specify other field',
    fields: {
      fullName: 'Full name',
      username: 'Username',
      email: 'Email',
      organization: 'Organization',
      institution: 'Institution',
      role: 'Primary role',
      active: 'Active',
      acceptedTerms: 'Terms accepted',
      notifications: 'Notifications',
      phone: 'Phone',
      profileId: 'Profile ID',
      roles: 'Roles',
      preferredLanguage: 'Review languages',
      orcid: 'ORCID',
      degrees: 'Academic degree',
    },
  },
  kz: {
    header: { eyebrow: 'Профиль', title: 'Менің профилім', subtitle: 'Аккаунт деректері және рецензиялау баптаулары.' },
    loading: 'Деректер жүктелуде...',
    error: 'Профильді жүктеу мүмкін болмады',
    account: 'Аккаунт',
    contacts: 'Байланыс',
    academic: 'Ғылыми деректер',
    review: 'Рецензиялау',
    status: 'Күйі',
    readonly: 'Тек қарау',
    save: 'Сақтау',
    saving: 'Сақталуда...',
    saveSuccess: 'Профиль жаңартылды',
    saveError: 'Профильді жаңарту мүмкін болмады',
    requiredLanguage: 'Кемінде бір рецензиялау тілін таңдаңыз',
    requiredScience: 'Кемінде бір ғылым бағытын таңдаңыз',
    requiredOther: '«Өзге» өрісін толтырыңыз',
    invalidOrcid: 'ORCID мәнін 0000-0000-0000-0000 форматында енгізіңіз',
    yes: 'Иә',
    no: 'Жоқ',
    enabled: 'Қосулы',
    disabled: 'Өшірулі',
    reviewerLanguageHint: 'Бірнеше тілді таңдауға болады. Олар қолжазбаларды іріктеуде қолданылады.',
    reviewerScienceHint: 'Бір немесе бірнеше бағытты таңдаңыз.',
    reviewerScienceTitle: 'Ғылым бағыттары',
    reviewerScienceOtherLabel: 'Өзге бағытты көрсетіңіз',
    fields: {
      fullName: 'Аты-жөні',
      username: 'Логин',
      email: 'Email',
      organization: 'Ұйым',
      institution: 'Бөлімше',
      role: 'Негізгі рөл',
      active: 'Белсенді',
      acceptedTerms: 'Шарттар қабылданған',
      notifications: 'Хабарламалар',
      phone: 'Телефон',
      profileId: 'Профиль ID',
      roles: 'Рөлдер',
      preferredLanguage: 'Рецензиялау тілдері',
      orcid: 'ORCID',
      degrees: 'Ғылыми дәреже',
    },
  },
}

const roleLabelMap: Record<Lang, Record<string, string>> = {
  ru: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент', admin: 'Администратор', layout: 'Верстальщик' },
  en: { author: 'Author', editor: 'Editor', reviewer: 'Reviewer', admin: 'Admin', layout: 'Layout editor' },
  kz: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент', admin: 'Әкімші', layout: 'Беттеуші' },
}

const languageLabelMap: Record<Lang, Record<PreferredLanguage, string>> = {
  ru: { ru: 'Русский', en: 'English', kz: 'Қазақша' },
  en: { ru: 'Russian', en: 'English', kz: 'Kazakh' },
  kz: { ru: 'Орысша', en: 'English', kz: 'Қазақша' },
}

const reviewLanguageOptions: PreferredLanguage[] = ['ru', 'en', 'kz']
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

const reviewerScienceFieldLabels: Record<Lang, Record<ReviewerScienceField, string>> = {
  ru: {
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
  },
  en: {
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
  },
  kz: {
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
  },
}

const academicDegreeLabels: Record<Lang, Record<AcademicDegreeOption, string>> = {
  ru: {
    candidate: 'Кандидат наук',
    doctor: 'Доктор наук',
    phd: 'PhD',
    master: 'Магистр',
    bachelor: 'Бакалавр',
  },
  en: {
    candidate: 'Candidate of Sciences',
    doctor: 'Doctor of Sciences',
    phd: 'PhD',
    master: 'Master',
    bachelor: 'Bachelor',
  },
  kz: {
    candidate: 'Ғылым кандидаты',
    doctor: 'Ғылым докторы',
    phd: 'PhD',
    master: 'Магистр',
    bachelor: 'Бакалавр',
  },
}

const orcidPattern = /^(\d{4}-){3}[\dX]{4}$/i
const legacyAcademicDegreeMap: Record<string, AcademicDegreeOption> = {
  candidate: 'candidate',
  doctor: 'doctor',
  phd: 'phd',
  master: 'master',
  bachelor: 'bachelor',
  'кандидат наук': 'candidate',
  'доктор наук': 'doctor',
  магистр: 'master',
  бакалавр: 'bachelor',
  'candidate of sciences': 'candidate',
  'doctor of sciences': 'doctor',
  'ғылым кандидаты': 'candidate',
  'ғылым докторы': 'doctor',
}

function normalizeAcademicDegreeValues(values?: string[] | null): AcademicDegreeOption[] {
  if (!values?.length) return []
  const normalized: AcademicDegreeOption[] = []
  for (const value of values) {
    if (typeof value !== 'string') continue
    const mapped = legacyAcademicDegreeMap[value.trim().toLowerCase()]
    if (mapped && !normalized.includes(mapped)) normalized.push(mapped)
  }
  return normalized
}

function normalizePreferredLanguages(value?: string | PreferredLanguage[] | null): PreferredLanguage[] {
  const rawValues = Array.isArray(value) ? value : (value || '').split(',')
  const normalized: PreferredLanguage[] = []
  for (const item of rawValues) {
    const candidate = String(item).trim() as PreferredLanguage
    if (reviewLanguageOptions.includes(candidate) && !normalized.includes(candidate)) {
      normalized.push(candidate)
    }
  }
  return normalized
}

export function ProfilePage() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? lang : 'ru'
  const t = profileCopy[l]
  const [data, setData] = useState<MeResponse | null>(null)
  const [fullName, setFullName] = useState('')
  const [organization, setOrganization] = useState('')
  const [phone, setPhone] = useState('')
  const [reviewLanguages, setReviewLanguages] = useState<PreferredLanguage[]>(['ru'])
  const [reviewerScienceFields, setReviewerScienceFields] = useState<ReviewerScienceField[]>([])
  const [reviewerScienceOther, setReviewerScienceOther] = useState('')
  const [academicDegrees, setAcademicDegrees] = useState<AcademicDegreeOption[]>([])
  const [orcid, setOrcid] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const me = await api.get<MeResponse>('/auth/me')
        if (!mounted) return
        setData(me)
        setFullName(me.full_name || `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim())
        setOrganization(me.organization || '')
        setPhone(me.phone || '')
        setReviewLanguages(normalizePreferredLanguages(me.preferred_language))
        setReviewerScienceFields(me.reviewer_science_fields || [])
        setReviewerScienceOther(me.reviewer_science_other || '')
        setAcademicDegrees(normalizeAcademicDegreeValues(me.academic_degrees))
        setOrcid(me.orcid || '')
      } catch (caught) {
        console.error(caught)
        if (mounted) setError(t.error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [t.error])

  const roles = useMemo(() => (data?.roles?.length ? data.roles : data?.role ? [data.role] : []), [data])
  const isReviewer = roles.includes('reviewer')
  const avatarLetter = (fullName || data?.username || 'U').trim()[0]?.toUpperCase() || 'U'

  const toggleReviewLanguage = (language: PreferredLanguage) => {
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
  }

  const formatLanguages = (languages: PreferredLanguage[]) =>
    languages.length ? languages.map((language) => languageLabelMap[l][language]).join(', ') : '—'

  const handleSaveProfile = async () => {
    if (saving) return
    if (orcid.trim() && !orcidPattern.test(orcid.trim())) {
      setSaveMessage(t.invalidOrcid)
      return
    }
    if (isReviewer && reviewLanguages.length === 0) {
      setSaveMessage(t.requiredLanguage)
      return
    }
    if (isReviewer && reviewerScienceFields.length === 0) {
      setSaveMessage(t.requiredScience)
      return
    }
    if (isReviewer && reviewerScienceFields.includes('other') && !reviewerScienceOther.trim()) {
      setSaveMessage(t.requiredOther)
      return
    }

    setSaving(true)
    setSaveMessage(null)
    try {
      await api.updateMyContactProfile({
        full_name: fullName.trim() || null,
        organization: organization.trim() || null,
        phone: phone.trim() || null,
      })
      await api.updateMyProfileDetails({
        academic_degrees: academicDegrees,
        orcid: orcid.trim() || null,
      })
      if (isReviewer) {
        await api.updateMyLanguage(reviewLanguages)
        await api.updateMyReviewerScience({
          reviewer_science_fields: reviewerScienceFields,
          reviewer_science_other: reviewerScienceFields.includes('other') ? reviewerScienceOther.trim() : null,
        })
      }
      setData((current) =>
        current
          ? {
              ...current,
              full_name: fullName.trim() || current.full_name,
              organization: organization.trim() || null,
              phone: phone.trim() || null,
              academic_degrees: academicDegrees,
              orcid: orcid.trim() || null,
              preferred_language: reviewLanguages.join(','),
              reviewer_science_fields: reviewerScienceFields,
              reviewer_science_other: reviewerScienceFields.includes('other') ? reviewerScienceOther.trim() : null,
            }
          : current,
      )
      setSaveMessage(t.saveSuccess)
    } catch (caught) {
      console.error(caught)
      setSaveMessage(t.saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading || error) {
    return (
      <div className="app-container">
        <section className="section-header">
          <div>
            <p className="eyebrow">{t.header.eyebrow}</p>
            <h1 className="page-title">{t.header.title}</h1>
            <p className="subtitle" style={error ? { color: '#b42318' } : undefined}>{error || t.loading}</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="app-container">
      <section className="section-header profile-header">
        <div>
          <p className="eyebrow">{t.header.eyebrow}</p>
          <h1 className="page-title">{t.header.title}</h1>
          <p className="subtitle">{t.header.subtitle}</p>
        </div>
      </section>

      <section className="panel profile-summary">
        <div className="avatar">{avatarLetter}</div>
        <div className="profile-summary__main">
          <div className="profile-name">{fullName || data?.username}</div>
          <div className="profile-meta">{data?.email}</div>
        </div>
        <div className="profile-tags">
          {roles.map((role) => (
            <span key={role} className="status-chip status-chip--draft">
              {roleLabelMap[l][role] ?? role}
            </span>
          ))}
        </div>
      </section>

      <div className="profile-layout">
        <section className="panel profile-section">
          <div className="profile-section__head">
            <h2>{t.contacts}</h2>
          </div>
          <div className="profile-form-grid">
            <label className="form-field">
              <span className="form-label">{t.fields.fullName}</span>
              <input className="text-input" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={saving} />
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.organization}</span>
              <input className="text-input" value={organization} onChange={(event) => setOrganization(event.target.value)} disabled={saving} />
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.phone}</span>
              <input className="text-input" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={saving} />
            </label>
            <label className="form-field">
              <span className="form-label">{t.fields.orcid}</span>
              <input className="text-input" placeholder="0000-0000-0000-0000" value={orcid} onChange={(event) => setOrcid(event.target.value)} disabled={saving} />
            </label>
          </div>
        </section>

        <section className="panel profile-section">
          <div className="profile-section__head">
            <h2>{t.account}</h2>
            <span>{t.readonly}</span>
          </div>
          <div className="profile-readonly-grid">
            <div><span>{t.fields.username}</span><strong>{data?.username || '—'}</strong></div>
            <div><span>{t.fields.email}</span><strong>{data?.email || '—'}</strong></div>
            <div><span>{t.fields.institution}</span><strong>{data?.institution || '—'}</strong></div>
            <div><span>{t.fields.profileId}</span><strong>{data?.profile_id ?? '—'}</strong></div>
          </div>
        </section>

        <section className="panel profile-section">
          <div className="profile-section__head">
            <h2>{t.academic}</h2>
          </div>
          <div className="profile-check-grid">
            {academicDegreeOptions.map((degree) => (
              <label className="checkbox" key={degree}>
                <input type="checkbox" checked={academicDegrees.includes(degree)} onChange={() => toggleAcademicDegree(degree)} disabled={saving} />
                <span>{academicDegreeLabels[l][degree]}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel profile-section">
          <div className="profile-section__head">
            <h2>{t.status}</h2>
            <span>{formatLanguages(normalizePreferredLanguages(data?.preferred_language))}</span>
          </div>
          <div className="profile-readonly-grid">
            <div><span>{t.fields.role}</span><strong>{roleLabelMap[l][data?.role || ''] ?? data?.role ?? '—'}</strong></div>
            <div><span>{t.fields.active}</span><strong>{data?.is_active ? t.yes : t.no}</strong></div>
            <div><span>{t.fields.acceptedTerms}</span><strong>{data?.accept_terms ? t.yes : t.no}</strong></div>
            <div><span>{t.fields.notifications}</span><strong>{data?.notify_status ? t.enabled : t.disabled}</strong></div>
          </div>
        </section>

        {isReviewer && (
          <section className="panel profile-section profile-section--wide">
            <div className="profile-section__head">
              <h2>{t.review}</h2>
            </div>
            <div className="profile-review-block">
              <div className="form-field">
                <span className="form-label">{t.fields.preferredLanguage}</span>
                <div className="profile-check-grid profile-check-grid--compact">
                  {reviewLanguageOptions.map((language) => (
                    <label className="checkbox" key={language}>
                      <input type="checkbox" checked={reviewLanguages.includes(language)} onChange={() => toggleReviewLanguage(language)} disabled={saving} />
                      <span>{languageLabelMap[l][language]}</span>
                    </label>
                  ))}
                </div>
                <span className="form-hint">{t.reviewerLanguageHint}</span>
              </div>

              <div className="form-field">
                <span className="form-label">{t.reviewerScienceTitle}</span>
                <div className="profile-check-grid">
                  {reviewerScienceFieldOptions.map((field) => (
                    <label className="checkbox" key={field}>
                      <input
                        type="checkbox"
                        checked={reviewerScienceFields.includes(field)}
                        onChange={() => {
                          const willDisableOther = field === 'other' && reviewerScienceFields.includes('other')
                          toggleReviewerScienceField(field)
                          if (willDisableOther) setReviewerScienceOther('')
                        }}
                        disabled={saving}
                      />
                      <span>{reviewerScienceFieldLabels[l][field]}</span>
                    </label>
                  ))}
                </div>
                <span className="form-hint">{t.reviewerScienceHint}</span>
              </div>

              {reviewerScienceFields.includes('other') && (
                <label className="form-field">
                  <span className="form-label">{t.reviewerScienceOtherLabel}</span>
                  <input className="text-input" value={reviewerScienceOther} onChange={(event) => setReviewerScienceOther(event.target.value)} disabled={saving} />
                </label>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="profile-actions">
        <button type="button" className="button profile-save-button" onClick={handleSaveProfile} disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
      </div>

      {saveMessage && <div className={`profile-save-message${saveMessage === t.saveSuccess ? ' profile-save-message--success' : ''}`}>{saveMessage}</div>}
    </div>
  )
}
