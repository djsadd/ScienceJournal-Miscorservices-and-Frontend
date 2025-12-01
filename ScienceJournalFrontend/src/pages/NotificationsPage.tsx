import { useMemo, useState } from 'react'
import Alert from '../shared/components/Alert'

type Notification = {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  createdAt: string
  read: boolean
  link?: { label: string; href: string }
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'info',
    title: 'Новая рецензия по вашей статье',
    message: 'Статья «Аналитика данных в образовании» получила обновленную рецензию.',
    createdAt: '2025-11-30T09:12:00Z',
    read: false,
    link: { label: 'Открыть', href: '/cabinet/my-articles/123' },
  },
  {
    id: 'n2',
    type: 'success',
    title: 'Статья принята к публикации',
    message: 'Поздравляем! Ваша статья принята в ближайший выпуск.',
    createdAt: '2025-11-28T15:40:00Z',
    read: true,
    link: { label: 'Перейти к выпуску', href: '/cabinet/volumes' },
  },
  {
    id: 'n3',
    type: 'warning',
    title: 'Требуются правки от редактора',
    message: 'Пожалуйста, внесите правки до 05.12.2025.',
    createdAt: '2025-11-27T12:05:00Z',
    read: false,
    link: { label: 'Открыть задачу', href: '/cabinet/editorial2' },
  },
  {
    id: 'n4',
    type: 'error',
    title: 'Не удалось загрузить файл макета',
    message: 'Попробуйте повторить загрузку позже или свяжитесь с поддержкой.',
    createdAt: '2025-11-25T08:20:00Z',
    read: true,
  },
]

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter],
  )

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  const markOne = (id: string, read: boolean) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))

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
          <button type="button" className="button button--primary" onClick={markAllRead}>
            Пометить все как прочитанные
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
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
                    <button className="button button--ghost" onClick={() => markOne(n.id, true)}>
                      Пометить как прочитано
                    </button>
                  ) : (
                    <button className="button button--ghost" onClick={() => markOne(n.id, false)}>
                      Пометить как непрочитанное
                    </button>
                  )}
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
