import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../shared/components/Alert'
import { api } from '../api/client'

type UiVariant = 'info' | 'success' | 'warning' | 'error'

type Notification = {
  id: string
  type: UiVariant
  title: string
  message?: string
  targetPath?: string
  createdAt: string
  read: boolean
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

const NOTIFICATIONS_REFRESH_INTERVAL_MS = 15000

const stripLinks = (text?: string | null): string | undefined => {
  if (!text) return undefined
  // Remove pattern like: "Откройте: http(s)://..."
  let cleaned = text.replace(/Откройте:\s*https?:\/\/\S+/gi, '')
  // Remove any remaining URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '')
  // Collapse extra spaces and trim
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
  return cleaned || undefined
}

const mapTypeToVariant = (t: NotificationDto['type']): UiVariant => {
  switch (t) {
    case 'editorial':
      return 'warning'
    default:
      return 'info'
  }
}

const getNotificationTargetPath = (relatedEntity?: string | null): string | undefined => {
  if (!relatedEntity) return undefined
  const [type, rawId] = relatedEntity.split(':')
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) return undefined
  if (type === 'review') return `/cabinet/reviews/${id}`
  if (type === 'article') return `/cabinet/my-articles/${id}`
  return undefined
}

const toUi = (n: NotificationDto): Notification => ({
  id: String(n.id),
  type: mapTypeToVariant(n.type),
  title: n.title,
  message: stripLinks(n.message),
  targetPath: getNotificationTargetPath(n.related_entity),
  createdAt: n.created_at,
  read: n.status === 'read',
})

const notifyNotificationsUpdated = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('notifications:updated'))
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await api.get<NotificationDto[]>('/notifications', { params: { limit: 50, offset: 0 } })
      setItems(data.map(toUi))
    } catch (e: any) {
      console.error('Failed to load notifications', e)
      if (options?.silent) return
      setError('Не удалось загрузить уведомления')
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    load()
    const refresh = () => load({ silent: true })
    window.addEventListener('notifications:updated', refresh)
    const interval = window.setInterval(refresh, NOTIFICATIONS_REFRESH_INTERVAL_MS)
    return () => {
      window.removeEventListener('notifications:updated', refresh)
      window.clearInterval(interval)
    }
  }, [load])

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
      await load({ silent: true })
      notifyNotificationsUpdated()
    }
  }
  const markOne = async (id: string) => {
    try {
      await api.markNotificationRead(id)
    } catch (e) {
      // no-op
    } finally {
      await load({ silent: true })
      notifyNotificationsUpdated()
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
          <button type="button" className="button button--ghost" onClick={() => load()} disabled={loading}>
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
                  {n.targetPath ? (
                    <Link
                      className="button button--primary"
                      to={n.targetPath}
                      onClick={() => {
                        if (!n.read) {
                          api.markNotificationRead(n.id).finally(() => {
                            notifyNotificationsUpdated()
                          })
                        }
                      }}
                    >
                      Перейти к рецензии
                    </Link>
                  ) : null}
                  {!n.read ? (
                    <button className="button button--ghost" onClick={() => markOne(n.id)}>
                      Пометить как прочитано
                    </button>
                  ) : null}
                  {/* No action button for notifications */}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
