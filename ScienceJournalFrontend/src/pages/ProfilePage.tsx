import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import type { Lang } from '../shared/labels'

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
}

export function ProfilePage() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? (lang as Lang) : 'ru'
  const t = profileCopy[l]
  const [data, setData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const me = await api.get<MeResponse>('/auth/me')
        if (mounted) setData(me)
      } catch (e) {
        console.error(e)
        if (mounted) setError(t.error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

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
        </div>
      </div>
    </div>
  )
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
  }
}

const profileCopy: Record<Lang, ProfileCopy> = {
  ru: {
    header: { eyebrow: 'Профиль', title: 'Мой профиль', subtitle: 'Контакты и роль пользователя из вашего аккаунта.' },
    loading: 'Загрузка данных…',
    error: 'Не удалось загрузить профиль',
    update: 'Обновить данные',
    yes: 'Да',
    no: 'Нет',
    enabled: 'Включены',
    disabled: 'Выключены',
    fields: {
      username: 'Имя пользователя',
      email: 'Email',
      organization: 'Организация',
      institution: 'Институт/учреждение',
      role: 'Роль',
      active: 'Активен',
      acceptedTerms: 'Согласие с правилами',
      notifications: 'Уведомления',
      phone: 'Телефон',
      profileId: 'ID профиля',
      roles: 'Роли',
    },
  },
  en: {
    header: { eyebrow: 'Profile', title: 'My profile', subtitle: 'Contacts and role from your account.' },
    loading: 'Loading data…',
    error: 'Failed to load profile',
    update: 'Refresh data',
    yes: 'Yes',
    no: 'No',
    enabled: 'Enabled',
    disabled: 'Disabled',
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
    },
  },
  kz: {
    header: { eyebrow: 'Профиль', title: 'Менің профилім', subtitle: 'Есептік жазбаңыздағы байланыс және рөл.' },
    loading: 'Деректер жүктелуде…',
    error: 'Профильді жүктеу мүмкін болмады',
    update: 'Деректерді жаңарту',
    yes: 'Иә',
    no: 'Жоқ',
    enabled: 'Қосулы',
    disabled: 'Өшірулі',
    fields: {
      username: 'Пайдаланушы аты',
      email: 'Email',
      organization: 'Ұйым',
      institution: 'Мекеме',
      role: 'Рөл',
      active: 'Белсенді',
      acceptedTerms: 'Ережелерге келісім',
      notifications: 'Хабарландырулар',
      phone: 'Телефон',
      profileId: 'Профиль ID',
      roles: 'Рөлдер',
    },
  },
}

const roleLabelMap: Record<Lang, Record<MeResponse['role'], string>> = {
  ru: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент' },
  en: { author: 'Author', editor: 'Editor', reviewer: 'Reviewer' },
  kz: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент' },
}
