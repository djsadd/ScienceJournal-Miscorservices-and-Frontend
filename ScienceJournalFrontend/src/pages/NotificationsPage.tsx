import { useEffect, useMemo, useState } from 'react'
import Alert from '../shared/components/Alert'
import { api } from '../api/client'

type UiVariant = 'info' | 'success' | 'warning' | 'error'

type Notification = {
  id: string
  type: UiVariant
  title: string
  message?: string
  createdAt: string
  read: boolean
  link?: { label: string; href: string }
}

type NotificationDto = {
  id: number
  user_id: number
  type: 'system' | 'article_status' | 'review_assignment' | 'editorial' | 'custom'
  title: string
  message?: string | null
  related_entity?: string | null
  status: 'unread' | 'read'
  created_at: string
  read_at?: string | null
}

const mapTypeToVariant = (t: NotificationDto['type']): UiVariant => {
  switch (t) {
    case 'editorial':
      return 'warning'
    default:
      return 'info'
  }
}

const toUi = (n: NotificationDto): Notification => ({
  id: String(n.id),
  type: mapTypeToVariant(n.type),
  title: n.title,
  message: n.message ?? undefined,
  createdAt: n.created_at,
  read: n.status === 'read',
})

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<NotificationDto[]>('/notifications', { params: { limit: 50, offset: 0 } })
      setItems(data.map(toUi))
    } catch (e: any) {
      console.error('Failed to load notifications', e)
      setError('Не удалось загрузить уведомления')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter],
  )

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read)
    if (unread.length === 0) return
    try {
      await Promise.all(unread.map((n) => api.markNotificationRead(n.id)))
    } catch (e) {
      // Ignore partial failures; will refresh
    } finally {
      await load()
    }
  }
  const markOne = async (id: string) => {
    try {
      await api.markNotificationRead(id)
    } catch (e) {
      // no-op
    } finally {
      await load()
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Уведомления</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`button button--ghost ${filter === 'all' ? 'button--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            type="button"
            className={`button button--ghost ${filter === 'unread' ? 'button--active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Непрочитанные
          </button>
          <button type="button" className="button button--primary" onClick={markAllRead} disabled={loading}>
            Пометить все как прочитанные
          </button>
          <button type="button" className="button button--ghost" onClick={load} disabled={loading}>
            Обновить
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error ? (
          <div style={{ padding: 16, color: '#b91c1c' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 16, color: '#667085' }}>Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, color: '#667085' }}>Нет уведомлений</div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className="notification-row"
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <div style={{ width: 8, alignSelf: 'stretch' }}>
                {!n.read ? (
                  <span
                    title="Непрочитано"
                    style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: '#2563eb' }}
                  />
                ) : null}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Alert variant={n.type} title={n.title}>
                  {n.message}
                </Alert>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                  <time dateTime={n.createdAt} style={{ color: '#667085', fontSize: 12 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </time>
                  <span style={{ flex: 1 }} />
                  {!n.read ? (
                    <button className="button button--ghost" onClick={() => markOne(n.id)}>
                      Пометить как прочитано
                    </button>
                  ) : null}
                  {n.link ? (
                    <a className="button button--secondary" href={n.link.href}>
                      {n.link.label}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
