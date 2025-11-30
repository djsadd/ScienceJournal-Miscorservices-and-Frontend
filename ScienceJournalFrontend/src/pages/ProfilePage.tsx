import { useEffect, useState } from 'react'
import { api } from '../api/client'

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
        if (mounted) setError('Не удалось загрузить профиль')
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
            <p className="eyebrow">Профиль</p>
            <h1 className="page-title">Мой профиль</h1>
            <p className="subtitle">Загрузка данных…</p>
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
            <p className="eyebrow">Профиль</p>
            <h1 className="page-title">Мой профиль</h1>
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
          <p className="eyebrow">Профиль</p>
          <h1 className="page-title">Мой профиль</h1>
          <p className="subtitle">Контакты и роль пользователя из вашего аккаунта.</p>
        </div>
        <div className="pill pill--ghost">Обновить данные</div>
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
            <div className="profile-label">Username</div>
            <div className="profile-value">{data?.username}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Email</div>
            <div className="profile-value">{data?.email}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Organization</div>
            <div className="profile-value">{data?.organization || '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Institution</div>
            <div className="profile-value">{data?.institution || '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Role</div>
            <div className="profile-value">{data?.role}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Active</div>
            <div className="profile-value">{data?.is_active ? 'Да' : 'Нет'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Accepted Terms</div>
            <div className="profile-value">{data?.accept_terms ? 'Да' : 'Нет'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Notifications</div>
            <div className="profile-value">{data?.notify_status ? 'Включены' : 'Выключены'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Phone</div>
            <div className="profile-value">{data?.phone || '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Profile ID</div>
            <div className="profile-value">{data?.profile_id ?? '—'}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Roles</div>
            <div className="profile-tags">
              {(data?.roles ?? [data?.role]).filter(Boolean).map((r) => (
                <span key={String(r)} className="status-chip status-chip--draft">
                  {String(r)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
