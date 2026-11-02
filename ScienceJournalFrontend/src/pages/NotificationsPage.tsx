import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../shared/components/Alert'
import ConfirmModal from '../shared/components/ConfirmModal'
import { useLanguage } from '../shared/LanguageContext'
import type { Lang } from '../shared/labels'
import { api } from '../api/client'
import './NotificationsPage.css'

type NotificationType = 'system' | 'article_status' | 'review_assignment' | 'review_completed' | 'editorial' | 'custom'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message?: string
  targetPath?: string
  createdAt: string
  read: boolean
}

type NotificationDto = {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message?: string | null
  related_entity?: string | null
  status: 'unread' | 'read'
  created_at: string
  read_at?: string | null
}

const NOTIFICATIONS_REFRESH_INTERVAL_MS = 15000
// Shorter messages are shown in full, so there is nothing to expand
const LONG_MESSAGE_LENGTH = 160

const copy = {
  ru: {
    title: 'Уведомления',
    all: 'Все',
    unread: 'Непрочитанные',
    readAll: 'Прочитать все',
    deleteRead: 'Удалить прочитанные',
    refresh: 'Обновить',
    read: 'Прочитать',
    more: 'Подробнее',
    collapse: 'Свернуть',
    open: 'Перейти',
    delete: 'Удалить',
    unreadMark: 'Не прочитано',
    loading: 'Загрузка…',
    empty: 'Нет уведомлений',
    emptyUnread: 'Нет непрочитанных уведомлений',
    loadError: 'Не удалось загрузить уведомления',
    actionError: 'Не удалось выполнить действие. Попробуйте ещё раз.',
    deleteOneTitle: 'Удалить уведомление?',
    deleteManyTitle: 'Удалить прочитанные уведомления?',
    deleteMessage: 'Это действие нельзя отменить.',
    cancel: 'Отмена',
    types: {
      system: 'Система',
      article_status: 'Статус статьи',
      review_assignment: 'Рецензирование',
      review_completed: 'Рецензия завершена',
      editorial: 'Редакция',
      custom: 'Сообщение',
    },
  },
  en: {
    title: 'Notifications',
    all: 'All',
    unread: 'Unread',
    readAll: 'Read all',
    deleteRead: 'Delete read',
    refresh: 'Refresh',
    read: 'Read',
    more: 'More',
    collapse: 'Collapse',
    open: 'Open',
    delete: 'Delete',
    unreadMark: 'Unread',
    loading: 'Loading…',
    empty: 'No notifications',
    emptyUnread: 'No unread notifications',
    loadError: 'Failed to load notifications',
    actionError: 'The action failed. Please try again.',
    deleteOneTitle: 'Delete this notification?',
    deleteManyTitle: 'Delete read notifications?',
    deleteMessage: 'This action cannot be undone.',
    cancel: 'Cancel',
    types: {
      system: 'System',
      article_status: 'Article status',
      review_assignment: 'Review',
      review_completed: 'Review completed',
      editorial: 'Editorial',
      custom: 'Message',
    },
  },
  kz: {
    title: 'Хабарламалар',
    all: 'Барлығы',
    unread: 'Оқылмаған',
    readAll: 'Барлығын оқу',
    deleteRead: 'Оқылғандарды жою',
    refresh: 'Жаңарту',
    read: 'Оқу',
    more: 'Толығырақ',
    collapse: 'Жию',
    open: 'Өту',
    delete: 'Жою',
    unreadMark: 'Оқылмаған',
    loading: 'Жүктелуде…',
    empty: 'Хабарламалар жоқ',
    emptyUnread: 'Оқылмаған хабарламалар жоқ',
    loadError: 'Хабарламаларды жүктеу мүмкін болмады',
    actionError: 'Әрекет орындалмады. Қайталап көріңіз.',
    deleteOneTitle: 'Хабарламаны жою керек пе?',
    deleteManyTitle: 'Оқылған хабарламаларды жою керек пе?',
    deleteMessage: 'Бұл әрекетті болдырмау мүмкін емес.',
    cancel: 'Болдырмау',
    types: {
      system: 'Жүйе',
      article_status: 'Мақала мәртебесі',
      review_assignment: 'Рецензиялау',
      review_completed: 'Рецензия аяқталды',
      editorial: 'Редакция',
      custom: 'Хабарлама',
    },
  },
} satisfies Record<Lang, unknown>

const dateLocale: Record<Lang, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
}

const typeIcons: Record<NotificationType, string> = {
  system: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  article_status: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h6',
  review_assignment: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9V3ZM9 14l2 2 4-4',
  review_completed: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12l3 3 5-6',
  editorial: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4',
  custom: 'M4 6h16v12H4V6ZM4 7l8 6 8-6',
}

const actionIcons = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  expand: 'M6 9l6 6 6-6',
  collapse: 'M6 15l6-6 6 6',
  open: 'M5 12h14M13 6l6 6-6 6',
  delete: 'M4 7h16M10 3h4l1 4H9l1-4ZM6 7l1 14h10l1-14M10 11v6M14 11v6',
  refresh: 'M20 11a8 8 0 0 0-14.3-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14.3 4l1.7-2M20 20v-5h-5',
  bell: 'M18 9.75C18 6.44 15.31 3.75 12 3.75S6 6.44 6 9.75V12.5C6 13.46 5.62 14.38 4.94 15.06L4.5 15.5H19.5L19.06 15.06C18.38 14.38 18 13.46 18 12.5V9.75ZM9.75 18.25C10.14 19.42 11.04 20.25 12 20.25C12.96 20.25 13.86 19.42 14.25 18.25',
}

const Icon = ({ path }: { path: string }) => (
  <svg
    className="notifications-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
)

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

const getTargetPath = (relatedEntity?: string | null): string | undefined => {
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
  type: n.type,
  title: n.title,
  message: stripLinks(n.message),
  targetPath: getTargetPath(n.related_entity),
  createdAt: n.created_at,
  read: n.status === 'read',
})

const notifyNotificationsUpdated = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('notifications:updated'))
}

export default function NotificationsPage() {
  const { lang } = useLanguage()
  const t = copy[lang]
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set())
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await api.get<NotificationDto[]>('/notifications', { params: { limit: 50, offset: 0 } })
      setItems(data.map(toUi))
    } catch (e) {
      console.error('Failed to load notifications', e)
      if (options?.silent) return
      setError('load')
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

  const unreadIds = useMemo(() => items.filter((n) => !n.read).map((n) => n.id), [items])
  const readIds = useMemo(() => items.filter((n) => n.read).map((n) => n.id), [items])

  // A notification being read stays in the "unread" tab until the tab changes
  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read || expandedIds.has(n.id)) : items),
    [items, filter, expandedIds],
  )

  const runForIds = async (ids: string[], action: (id: string) => Promise<unknown>): Promise<Set<string>> => {
    setError(null)
    setBusyIds((prev) => new Set([...prev, ...ids]))
    const results = await Promise.allSettled(ids.map(action))
    setBusyIds((prev) => new Set([...prev].filter((id) => !ids.includes(id))))
    const succeeded = new Set(ids.filter((_, index) => results[index].status === 'fulfilled'))
    if (succeeded.size < ids.length) setError('action')
    return succeeded
  }

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return
    const succeeded = await runForIds(ids, (id) => api.markNotificationRead(id))
    setItems((prev) => prev.map((n) => (succeeded.has(n.id) ? { ...n, read: true } : n)))
    notifyNotificationsUpdated()
  }

  const deleteItems = async (ids: string[]) => {
    const succeeded = await runForIds(ids, (id) => api.deleteNotification(id))
    setItems((prev) => prev.filter((n) => !succeeded.has(n.id)))
    notifyNotificationsUpdated()
  }

  const toggleExpanded = (n: Notification) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(n.id)) next.add(n.id)
      return next
    })
    if (!n.read) markRead([n.id])
  }

  const changeFilter = (next: 'all' | 'unread') => {
    setFilter(next)
    setExpandedIds(new Set())
  }

  const confirmDelete = () => {
    if (deleteIds) deleteItems(deleteIds)
    setDeleteIds(null)
  }

  const isBulkBusy = busyIds.size > 0

  return (
    <div className="page notifications-page">
      <h1 className="page-title">{t.title}</h1>

      <div className="notifications-toolbar">
        <div className="notifications-tabs" role="group" aria-label={t.title}>
          <button
            type="button"
            className={`notifications-tabs__tab ${filter === 'all' ? 'notifications-tabs__tab--active' : ''}`}
            aria-pressed={filter === 'all'}
            onClick={() => changeFilter('all')}
          >
            {t.all}
            <span className="notifications-tabs__count">{items.length}</span>
          </button>
          <button
            type="button"
            className={`notifications-tabs__tab ${filter === 'unread' ? 'notifications-tabs__tab--active' : ''}`}
            aria-pressed={filter === 'unread'}
            onClick={() => changeFilter('unread')}
          >
            {t.unread}
            <span className="notifications-tabs__count">{unreadIds.length}</span>
          </button>
        </div>

        <div className="notifications-toolbar__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => markRead(unreadIds)}
            disabled={isBulkBusy || unreadIds.length === 0}
          >
            <Icon path={actionIcons.check} />
            {t.readAll}
          </button>
          <button
            type="button"
            className="button button--ghost notifications-button--danger"
            onClick={() => setDeleteIds(readIds)}
            disabled={isBulkBusy || readIds.length === 0}
          >
            <Icon path={actionIcons.delete} />
            {t.deleteRead}
          </button>
          <button
            type="button"
            className="button button--ghost notifications-button--icon"
            onClick={() => load()}
            disabled={loading}
            aria-label={t.refresh}
            title={t.refresh}
          >
            <Icon path={actionIcons.refresh} />
          </button>
        </div>
      </div>

      {error ? (
        <Alert variant="error" className="notifications-page__error">
          {error === 'load' ? t.loadError : t.actionError}
        </Alert>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="notifications-list">
          {filtered.map((n) => {
            const expanded = expandedIds.has(n.id)
            const busy = busyIds.has(n.id)
            const isLong = (n.message?.length ?? 0) > LONG_MESSAGE_LENGTH
            return (
              <li key={n.id} className={`notification-item ${n.read ? '' : 'notification-item--unread'}`}>
                <span className="notification-item__type-icon">
                  <Icon path={typeIcons[n.type]} />
                </span>

                <div className="notification-item__body">
                  <div className="notification-item__meta">
                    <span className="notification-item__type">{t.types[n.type]}</span>
                    {!n.read ? <span className="notification-item__unread">{t.unreadMark}</span> : null}
                  </div>
                  <div className="notification-item__title">{n.title}</div>
                  {n.message ? (
                    <div
                      className={`notification-item__message ${isLong && !expanded ? 'notification-item__message--clamped' : ''}`}
                    >
                      {n.message}
                    </div>
                  ) : null}
                  <time className="notification-item__time" dateTime={n.createdAt}>
                    {new Date(n.createdAt).toLocaleString(dateLocale[lang], {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                <div className="notification-item__actions">
                  {!n.read ? (
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => toggleExpanded(n)}
                      disabled={busy}
                    >
                      <Icon path={actionIcons.check} />
                      {t.read}
                    </button>
                  ) : isLong ? (
                    <button
                      type="button"
                      className="button button--ghost"
                      aria-expanded={expanded}
                      onClick={() => toggleExpanded(n)}
                    >
                      <Icon path={expanded ? actionIcons.collapse : actionIcons.expand} />
                      {expanded ? t.collapse : t.more}
                    </button>
                  ) : null}
                  {n.targetPath ? (
                    <Link
                      className="button button--ghost"
                      to={n.targetPath}
                      onClick={() => {
                        if (!n.read) markRead([n.id])
                      }}
                    >
                      <Icon path={actionIcons.open} />
                      {t.open}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="button button--ghost notifications-button--danger"
                    onClick={() => setDeleteIds([n.id])}
                    disabled={busy}
                  >
                    <Icon path={actionIcons.delete} />
                    {t.delete}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : error === 'load' ? null : (
        <div className="notifications-empty">
          {loading ? (
            t.loading
          ) : (
            <>
              <Icon path={actionIcons.bell} />
              {filter === 'unread' ? t.emptyUnread : t.empty}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        open={deleteIds !== null}
        title={deleteIds?.length === 1 ? t.deleteOneTitle : t.deleteManyTitle}
        message={t.deleteMessage}
        confirmText={t.delete}
        cancelText={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIds(null)}
      />
    </div>
  )
}
