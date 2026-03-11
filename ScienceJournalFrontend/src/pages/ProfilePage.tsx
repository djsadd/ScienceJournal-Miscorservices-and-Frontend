import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import type { Lang } from '../shared/labels'

type PreferredLanguage = 'ru' | 'en' | 'kz'

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
  }
}

const profileCopy: Record<Lang, ProfileCopy> = {
  ru: {
    header: { eyebrow: 'Профиль', title: 'Мой профиль', subtitle: 'Контакты, роль и настройки вашей учетной записи.' },
    loading: 'Загрузка данных...',
    error: 'Не удалось загрузить профиль',
    update: 'Данные аккаунта',
    yes: 'Да',
    no: 'Нет',
    enabled: 'Включены',
    disabled: 'Выключены',
    save: 'Сохранить язык',
    saving: 'Сохранение...',
    saveSuccess: 'Язык рецензирования обновлен',
    saveError: 'Не удалось обновить язык',
    reviewerLanguageHint: 'Настройка доступна для рецензента и используется при подборе рукописей.',
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
    save: 'Save language',
    saving: 'Saving...',
    saveSuccess: 'Review language updated',
    saveError: 'Failed to update language',
    reviewerLanguageHint: 'This setting is available to reviewers and is used for manuscript matching.',
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
    save: 'Тілді сақтау',
    saving: 'Сақталуда...',
    saveSuccess: 'Рецензия тілі жаңартылды',
    saveError: 'Тілді жаңарту мүмкін болмады',
    reviewerLanguageHint: 'Бұл баптау рецензентке қолжетімді және қолжазбаларды іріктеуде қолданылады.',
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

export function ProfilePage() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? lang : 'ru'
  const t = profileCopy[l]
  const [data, setData] = useState<MeResponse | null>(null)
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('ru')
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

  const handleSaveLanguage = async () => {
    if (!isReviewer || saving) return
    setSaving(true)
    setSaveMessage(null)
    try {
      await api.updateMyLanguage(preferredLanguage)
      setData((current) => (current ? { ...current, preferred_language: preferredLanguage } : current))
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
          <div className="profile-field">
            <div className="profile-label">{t.fields.username}</div>
            <div className="profile-value">{data?.username}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.email}</div>
            <div className="profile-value">{data?.email}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.organization}</div>
            <div className="profile-value">{data?.organization || '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.institution}</div>
            <div className="profile-value">{data?.institution || '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.role}</div>
            <div className="profile-value">{data ? roleLabelMap[l][data.role] : ''}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.active}</div>
            <div className="profile-value">{data?.is_active ? t.yes : t.no}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.acceptedTerms}</div>
            <div className="profile-value">{data?.accept_terms ? t.yes : t.no}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.notifications}</div>
            <div className="profile-value">{data?.notify_status ? t.enabled : t.disabled}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.phone}</div>
            <div className="profile-value">{data?.phone || '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">{t.fields.profileId}</div>
            <div className="profile-value">{data?.profile_id ?? '—'}</div>
          </div>
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
            <div className="profile-label">{t.fields.preferredLanguage}</div>
            {isReviewer ? (
              <div className="profile-language-editor">
                <select
                  className="text-input"
                  value={preferredLanguage}
                  onChange={(event) => setPreferredLanguage(event.target.value as PreferredLanguage)}
                  disabled={saving}
                >
                  <option value="ru">{languageLabelMap[l].ru}</option>
                  <option value="en">{languageLabelMap[l].en}</option>
                  <option value="kz">{languageLabelMap[l].kz}</option>
                </select>
                <div className="form-hint">{t.reviewerLanguageHint}</div>
                <button type="button" className="button button--secondary" onClick={handleSaveLanguage} disabled={saving}>
                  {saving ? t.saving : t.save}
                </button>
                {saveMessage && (
                  <div className="form-hint" style={{ color: saveMessage === t.saveSuccess ? '#18794e' : '#d00' }}>
                    {saveMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="profile-value">{languageLabel}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
