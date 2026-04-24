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
  full_name: string
  first_name: string
  last_name: string
  organization: string | null
  institution: string | null
  email: string
  role: 'author' | 'editor' | 'reviewer'
  is_active: boolean
  accept_terms: boolean
  notify_status: boolean
  profile_id: number | null
  phone?: string | null
  roles?: string[]
  preferred_language?: PreferredLanguage | null
  academic_degrees?: string[]
  orcid?: string | null
  reviewer_science_fields?: ReviewerScienceField[]
  reviewer_science_other?: string | null
}

type ProfileCopy = {
  header: { eyebrow: string; title: string; subtitle: string }
  loading: string
  error: string
  update: string
  yes: string
  no: string
  enabled: string
  disabled: string
  save: string
  saving: string
  saveSuccess: string
  saveError: string
  reviewerLanguageHint: string
  reviewerScienceHint: string
  reviewerScienceTitle: string
  reviewerScienceOtherLabel: string
  academicTitle: string
  degreePlaceholder: string
  addDegree: string
  fields: {
    username: string
    email: string
    organization: string
    institution: string
    role: string
    active: string
    acceptedTerms: string
    notifications: string
    phone: string
    profileId: string
    roles: string
    preferredLanguage: string
    orcid: string
  }
}

const profileCopy: Record<Lang, ProfileCopy> = {
  ru: {
    header: { eyebrow: 'Профиль', title: 'Мой профиль', subtitle: 'Контакты, роль и настройки учетной записи.' },
    loading: 'Загрузка данных...',
    error: 'Не удалось загрузить профиль',
    update: 'Данные аккаунта',
    yes: 'Да',
    no: 'Нет',
    enabled: 'Включены',
    disabled: 'Выключены',
    save: 'Сохранить профиль',
    saving: 'Сохранение...',
    saveSuccess: 'Профиль обновлен',
    saveError: 'Не удалось обновить профиль',
    reviewerLanguageHint: 'Настройка доступна для рецензента и используется при подборе рукописей.',
    reviewerScienceHint: 'Можно выбрать одно или несколько направлений. Если выбрано "Иное", заполните поле.',
    reviewerScienceTitle: 'Направления наук',
    reviewerScienceOtherLabel: 'Укажите иное направление',
    academicTitle: 'Учёные данные',
    degreePlaceholder: 'Например: кандидат наук',
    addDegree: 'Добавить',
    fields: {
      username: 'Имя пользователя',
      email: 'Email',
      organization: 'Организация',
      institution: 'Подразделение',
      role: 'Роль',
      active: 'Активен',
      acceptedTerms: 'Приняты условия',
      notifications: 'Уведомления',
      phone: 'Телефон',
      profileId: 'ID профиля',
      roles: 'Роли',
      preferredLanguage: 'Язык рецензирования',
      orcid: 'ORCID',
    },
  },
  en: {
    header: { eyebrow: 'Profile', title: 'My profile', subtitle: 'Contacts, role and account settings.' },
    loading: 'Loading data...',
    error: 'Failed to load profile',
    update: 'Account data',
    yes: 'Yes',
    no: 'No',
    enabled: 'Enabled',
    disabled: 'Disabled',
    save: 'Save profile',
    saving: 'Saving...',
    saveSuccess: 'Profile updated',
    saveError: 'Failed to update profile',
    reviewerLanguageHint: 'This setting is available to reviewers and is used for manuscript matching.',
    reviewerScienceHint: 'Select one or several fields. If you choose Other, fill in the text field.',
    reviewerScienceTitle: 'Science fields',
    reviewerScienceOtherLabel: 'Specify other field',
    academicTitle: 'Academic details',
    degreePlaceholder: 'For example: Candidate of Sciences',
    addDegree: 'Add',
    fields: {
      username: 'Username',
      email: 'Email',
      organization: 'Organization',
      institution: 'Institution',
      role: 'Role',
      active: 'Active',
      acceptedTerms: 'Accepted terms',
      notifications: 'Notifications',
      phone: 'Phone',
      profileId: 'Profile ID',
      roles: 'Roles',
      preferredLanguage: 'Review language',
      orcid: 'ORCID',
    },
  },
  kz: {
    header: { eyebrow: 'Профиль', title: 'Менің профилім', subtitle: 'Байланыс деректері, рөл және аккаунт баптаулары.' },
    loading: 'Деректер жүктелуде...',
    error: 'Профильді жүктеу мүмкін болмады',
    update: 'Аккаунт деректері',
    yes: 'Иә',
    no: 'Жоқ',
    enabled: 'Қосулы',
    disabled: 'Сөндірулі',
    save: 'Профильді сақтау',
    saving: 'Сақталуда...',
    saveSuccess: 'Профиль жаңартылды',
    saveError: 'Профильді жаңарту мүмкін болмады',
    reviewerLanguageHint: 'Бұл баптау рецензентке қолжетімді және қолжазбаларды іріктеуде қолданылады.',
    reviewerScienceHint: 'Бір немесе бірнеше бағытты таңдаңыз. Егер "Өзге" таңдалса, мәтінді толтырыңыз.',
    reviewerScienceTitle: 'Ғылым бағыттары',
    reviewerScienceOtherLabel: 'Өзге бағытты нақтылаңыз',
    academicTitle: 'Ғылыми деректер',
    degreePlaceholder: 'Мысалы: ғылым кандидаты',
    addDegree: 'Қосу',
    fields: {
      username: 'Пайдаланушы аты',
      email: 'Email',
      organization: 'Ұйым',
      institution: 'Бөлімше',
      role: 'Рөл',
      active: 'Белсенді',
      acceptedTerms: 'Шарттар қабылданған',
      notifications: 'Хабарламалар',
      phone: 'Телефон',
      profileId: 'Профиль ID',
      roles: 'Рөлдер',
      preferredLanguage: 'Рецензия тілі',
      orcid: 'ORCID',
    },
  },
}

const roleLabelMap = {
  ru: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент' },
  en: { author: 'Author', editor: 'Editor', reviewer: 'Reviewer' },
  kz: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент' },
} as const

const languageLabelMap = {
  ru: { ru: 'Русский', en: 'English', kz: 'Қазақша' },
  en: { ru: 'Russian', en: 'English', kz: 'Kazakh' },
  kz: { ru: 'Орысша', en: 'English', kz: 'Қазақша' },
} as const

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

const orcidPattern = /^(\d{4}-){3}[\dX]{4}$/i

export function ProfilePage() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? lang : 'ru'
  const t = profileCopy[l]
  const [data, setData] = useState<MeResponse | null>(null)
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('ru')
  const [reviewerScienceFields, setReviewerScienceFields] = useState<ReviewerScienceField[]>([])
  const [reviewerScienceOther, setReviewerScienceOther] = useState('')
  const [academicDegrees, setAcademicDegrees] = useState<string[]>([])
  const [degreeDraft, setDegreeDraft] = useState('')
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
        setPreferredLanguage((me.preferred_language as PreferredLanguage | null) || 'ru')
        setReviewerScienceFields(me.reviewer_science_fields || [])
        setReviewerScienceOther(me.reviewer_science_other || '')
        setAcademicDegrees(me.academic_degrees || [])
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

  const isReviewer = useMemo(() => {
    const roles = new Set((data?.roles ?? [data?.role]).filter(Boolean))
    return roles.has('reviewer')
  }, [data])

  const toggleReviewerScienceField = (field: ReviewerScienceField) => {
    setReviewerScienceFields((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
    )
  }

  const addAcademicDegree = () => {
    const value = degreeDraft.trim()
    if (!value) return
    setAcademicDegrees((current) => (current.includes(value) ? current : [...current, value]))
    setDegreeDraft('')
  }

  const removeAcademicDegree = (degree: string) => {
    setAcademicDegrees((current) => current.filter((item) => item !== degree))
  }

  const handleSaveProfile = async () => {
    if (saving) return
    if (orcid.trim() && !orcidPattern.test(orcid.trim())) {
      setSaveMessage('Введите ORCID в формате 0000-0000-0000-0000')
      return
    }
    setSaving(true)
    setSaveMessage(null)
    try {
      await api.updateMyProfileDetails({
        academic_degrees: academicDegrees,
        orcid: orcid.trim() || null,
      })
      if (isReviewer) {
        await api.updateMyLanguage(preferredLanguage)
        await api.updateMyReviewerScience({
          reviewer_science_fields: reviewerScienceFields,
          reviewer_science_other: reviewerScienceFields.includes('other') ? reviewerScienceOther.trim() : null,
        })
      }
      setData((current) =>
        current
          ? {
              ...current,
              academic_degrees: academicDegrees,
              orcid: orcid.trim() || null,
              preferred_language: preferredLanguage,
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

  if (loading) {
    return (
      <div className="app-container">
        <section className="section-header">
          <div>
            <p className="eyebrow">{t.header.eyebrow}</p>
            <h1 className="page-title">{t.header.title}</h1>
            <p className="subtitle">{t.loading}</p>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <section className="section-header">
          <div>
            <p className="eyebrow">{t.header.eyebrow}</p>
            <h1 className="page-title">{t.header.title}</h1>
            <p className="subtitle" style={{ color: '#d00' }}>{error}</p>
          </div>
        </section>
      </div>
    )
  }

  const avatarLetter = (data?.full_name || data?.username || 'U')[0]
  const languageLabel = data?.preferred_language ? languageLabelMap[l][data.preferred_language] : '—'

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">{t.header.eyebrow}</p>
          <h1 className="page-title">{t.header.title}</h1>
          <p className="subtitle">{t.header.subtitle}</p>
        </div>
        <div className="pill pill--ghost">{t.update}</div>
      </section>

      <div className="panel profile-card">
        <div className="profile-card__top">
          <div className="avatar">{avatarLetter}</div>
          <div>
            <div className="profile-name">{data?.full_name || `${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim()}</div>
            <div className="profile-meta">{data?.organization || data?.institution || '—'}</div>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field"><div className="profile-label">{t.fields.username}</div><div className="profile-value">{data?.username}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.email}</div><div className="profile-value">{data?.email}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.organization}</div><div className="profile-value">{data?.organization || '—'}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.institution}</div><div className="profile-value">{data?.institution || '—'}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.role}</div><div className="profile-value">{data ? roleLabelMap[l][data.role] : ''}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.active}</div><div className="profile-value">{data?.is_active ? t.yes : t.no}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.acceptedTerms}</div><div className="profile-value">{data?.accept_terms ? t.yes : t.no}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.notifications}</div><div className="profile-value">{data?.notify_status ? t.enabled : t.disabled}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.phone}</div><div className="profile-value">{data?.phone || '—'}</div></div>
          <div className="profile-field"><div className="profile-label">{t.fields.profileId}</div><div className="profile-value">{data?.profile_id ?? '—'}</div></div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.roles}</div>
            <div className="profile-tags">
              {(data?.roles ?? [data?.role]).filter(Boolean).map((r) => (
                <span key={String(r)} className="status-chip status-chip--draft">
                  {roleLabelMap[l][String(r) as keyof typeof roleLabelMap[typeof l]] ?? String(r)}
                </span>
              ))}
            </div>
          </div>

          <div className="profile-field">
            <div className="profile-label">{t.academicTitle}</div>
            <div className="profile-language-editor">
              <label className="form-field" style={{ marginBottom: 0 }}>
                <span className="form-label">{t.fields.orcid}</span>
                <input className="text-input" type="text" placeholder="0000-0000-0000-0000" value={orcid} onChange={(e) => setOrcid(e.target.value)} />
              </label>
              <div className="chip-editor">
                <div className="chip-editor__input-row">
                  <input
                    className="text-input"
                    type="text"
                    placeholder={t.degreePlaceholder}
                    value={degreeDraft}
                    onChange={(e) => setDegreeDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAcademicDegree()
                      }
                    }}
                  />
                  <button type="button" className="button button--secondary button--compact" onClick={addAcademicDegree}>
                    {t.addDegree}
                  </button>
                </div>
                {academicDegrees.length > 0 && (
                  <div className="chip-list">
                    {academicDegrees.map((degree) => (
                      <span className="chip-list__item" key={degree}>
                        <span>{degree}</span>
                        <button type="button" className="chip-list__remove" onClick={() => removeAcademicDegree(degree)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-field">
            <div className="profile-label">{t.fields.preferredLanguage}</div>
            {isReviewer ? (
              <div className="profile-language-editor">
                <select className="text-input" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value as PreferredLanguage)} disabled={saving}>
                  <option value="ru">{languageLabelMap[l].ru}</option>
                  <option value="en">{languageLabelMap[l].en}</option>
                  <option value="kz">{languageLabelMap[l].kz}</option>
                </select>
                <div className="form-hint">{t.reviewerLanguageHint}</div>
              </div>
            ) : (
              <div className="profile-value">{languageLabel}</div>
            )}
          </div>

          {isReviewer && (
            <div className="profile-field">
              <div className="profile-label">{t.reviewerScienceTitle}</div>
              <div className="profile-language-editor">
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
                        }}
                        disabled={saving}
                      />
                      <span className="choice-chip__label">{reviewerScienceFieldLabels[l][field]}</span>
                    </label>
                  ))}
                </div>
                <div className="form-hint">{t.reviewerScienceHint}</div>
                {reviewerScienceFields.includes('other') && (
                  <input className="text-input choice-chip__other-input" type="text" placeholder={t.reviewerScienceOtherLabel} value={reviewerScienceOther} onChange={(e) => setReviewerScienceOther(e.target.value)} disabled={saving} />
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button type="button" className="button button--secondary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </div>
        {saveMessage && <div className="form-hint" style={{ color: saveMessage === t.saveSuccess ? '#18794e' : '#d00' }}>{saveMessage}</div>}
      </div>
    </div>
  )
}
