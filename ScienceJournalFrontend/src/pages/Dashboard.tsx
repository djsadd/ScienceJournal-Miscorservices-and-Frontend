import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Article, ArticleStatus, Volume } from '../shared/types'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import type { Lang } from '../shared/labels'

type RoleKey = 'author' | 'editor' | 'reviewer' | 'layout' | 'admin'

interface MeResponse {
  id: number
  username: string
  full_name?: string | null
  role: RoleKey
}

interface UserRolesResponse {
  user_id: string | number
  roles: string[]
}

interface ReviewItem {
  id: number
  article_id?: number
  article_title?: string | null
  status: string
  deadline?: string | null
  created_at?: string | null
}

interface AdminStats {
  total: number
  active: number
  inactive: number
  pending: number
  by_role: Record<string, number>
}

interface NotificationDto {
  id: number
  title: string
  message?: string | null
  related_entity?: string | null
  status: 'unread' | 'read'
  created_at: string
}

type DashboardCopy = {
  title: string
  loading: string
  error: string
  empty: string
  all: string
  manuscriptNumber: string
  roleNames: Record<RoleKey, string>
  status: Record<string, string>
  stats: {
    manuscripts: string
    reviews: string
    published: string
    unread: string
    users: string
    active: string
    pending: string
    volumes: string
  }
  recent: Record<RoleKey, { title: string; path: string }>
  notifications: string
  notificationEmpty: string
  locale: string
}

const copies: Record<Lang, DashboardCopy> = {
  ru: {
    title: 'Главная',
    loading: 'Загрузка...',
    error: 'Не удалось загрузить данные',
    empty: 'Пока нет данных для отображения.',
    all: 'Все',
    manuscriptNumber: '№',
    roleNames: {
      author: 'Автор',
      editor: 'Редактор',
      reviewer: 'Рецензент',
      layout: 'Верстальщик',
      admin: 'Администратор',
    },
    status: {
      draft: 'Черновик',
      submitted: 'Отправлено',
      under_review: 'На рецензировании',
      in_review: 'На рецензировании',
      editor_check: 'Проверка редактора',
      reviewer_check: 'Проверка рецензента',
      revisions: 'Требует доработки',
      send_for_revision: 'Требует доработки',
      sent_for_revision: 'Требует доработки',
      accepted: 'Принята',
      published: 'Опубликовано',
      rejected: 'Отклонено',
      withdrawn: 'Отозвано',
      pending: 'Ожидает',
      in_progress: 'В работе',
      completed: 'Завершено',
      active: 'Активно',
    },
    stats: {
      manuscripts: 'Рукописи',
      reviews: 'На рецензии',
      published: 'Опубликовано',
      unread: 'Непрочитано',
      users: 'Пользователи',
      active: 'Активные',
      pending: 'Ожидают',
      volumes: 'Выпуски',
    },
    recent: {
      author: { title: 'Последние рукописи', path: '/cabinet/submissions' },
      editor: { title: 'Последние рукописи', path: '/cabinet/editorial2' },
      reviewer: { title: 'Последние рецензии', path: '/cabinet/reviews' },
      layout: { title: 'Активные выпуски', path: '/cabinet/volumes' },
      admin: { title: 'Роли в системе', path: '/cabinet/admin/users' },
    },
    notifications: 'Уведомления',
    notificationEmpty: 'Новых уведомлений нет',
    locale: 'ru-RU',
  },
  en: {
    title: 'Home',
    loading: 'Loading...',
    error: 'Could not load data',
    empty: 'No data to show yet.',
    all: 'All',
    manuscriptNumber: 'No.',
    roleNames: {
      author: 'Author',
      editor: 'Editor',
      reviewer: 'Reviewer',
      layout: 'Designer',
      admin: 'Administrator',
    },
    status: {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under review',
      in_review: 'Under review',
      editor_check: 'Editor check',
      reviewer_check: 'Reviewer check',
      revisions: 'Needs revision',
      send_for_revision: 'Needs revision',
      sent_for_revision: 'Needs revision',
      accepted: 'Accepted',
      published: 'Published',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
      pending: 'Pending',
      in_progress: 'In progress',
      completed: 'Completed',
      active: 'Active',
    },
    stats: {
      manuscripts: 'Manuscripts',
      reviews: 'In review',
      published: 'Published',
      unread: 'Unread',
      users: 'Users',
      active: 'Active',
      pending: 'Pending',
      volumes: 'Issues',
    },
    recent: {
      author: { title: 'Recent manuscripts', path: '/cabinet/submissions' },
      editor: { title: 'Recent manuscripts', path: '/cabinet/editorial2' },
      reviewer: { title: 'Recent reviews', path: '/cabinet/reviews' },
      layout: { title: 'Active issues', path: '/cabinet/volumes' },
      admin: { title: 'System roles', path: '/cabinet/admin/users' },
    },
    notifications: 'Notifications',
    notificationEmpty: 'No new notifications',
    locale: 'en-US',
  },
  kz: {
    title: 'Басты бет',
    loading: 'Жүктелуде...',
    error: 'Деректерді жүктеу мүмкін болмады',
    empty: 'Әзірге көрсетілетін деректер жоқ.',
    all: 'Барлығы',
    manuscriptNumber: '№',
    roleNames: {
      author: 'Автор',
      editor: 'Редактор',
      reviewer: 'Рецензент',
      layout: 'Дизайнер',
      admin: 'Әкімші',
    },
    status: {
      draft: 'Жоба',
      submitted: 'Жіберілді',
      under_review: 'Рецензияда',
      in_review: 'Рецензияда',
      editor_check: 'Редактор тексеруі',
      reviewer_check: 'Рецензент тексеруі',
      revisions: 'Түзету қажет',
      send_for_revision: 'Түзету қажет',
      sent_for_revision: 'Түзету қажет',
      accepted: 'Қабылданды',
      published: 'Жарияланды',
      rejected: 'Қабылданбады',
      withdrawn: 'Қайтарылды',
      pending: 'Күтуде',
      in_progress: 'Жұмыста',
      completed: 'Аяқталды',
      active: 'Белсенді',
    },
    stats: {
      manuscripts: 'Қолжазбалар',
      reviews: 'Рецензияда',
      published: 'Жарияланды',
      unread: 'Оқылмаған',
      users: 'Пайдаланушылар',
      active: 'Белсенді',
      pending: 'Күтуде',
      volumes: 'Сандар',
    },
    recent: {
      author: { title: 'Соңғы қолжазбалар', path: '/cabinet/submissions' },
      editor: { title: 'Соңғы қолжазбалар', path: '/cabinet/editorial2' },
      reviewer: { title: 'Соңғы рецензиялар', path: '/cabinet/reviews' },
      layout: { title: 'Белсенді сандар', path: '/cabinet/volumes' },
      admin: { title: 'Жүйедегі рөлдер', path: '/cabinet/admin/users' },
    },
    notifications: 'Хабарламалар',
    notificationEmpty: 'Жаңа хабарлама жоқ',
    locale: 'kk-KZ',
  },
}

const roleKeys: RoleKey[] = ['author', 'editor', 'reviewer', 'layout', 'admin']
const isRoleKey = (value: string): value is RoleKey => roleKeys.includes(value as RoleKey)
const reviewStatuses = ['under_review', 'in_review', 'editor_check', 'reviewer_check']

const readStoredRole = (): RoleKey | null => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem('activeRole')
  return stored && isRoleKey(stored) ? stored : null
}

const normalizeAllowedRoles = (roles: string[], fallback: RoleKey): RoleKey[] => {
  const cleanRoles = roles.filter(isRoleKey)
  if (cleanRoles.includes('admin')) {
    return Array.from(new Set<RoleKey>(['admin', 'editor', 'reviewer', 'author', ...cleanRoles]))
  }
  return cleanRoles.length > 0 ? cleanRoles : [fallback]
}

const normalizeArticle = (item: Record<string, unknown>): Article => ({
  id: String(item.id ?? ''),
  title: String(item.title_ru ?? item.title_en ?? item.title_kz ?? ''),
  abstract: String(item.abstract_ru ?? item.abstract_en ?? item.abstract_kz ?? ''),
  status: String(item.status ?? 'draft') as ArticleStatus,
  submittedAt: String(item.created_at ?? item.updated_at ?? ''),
  authors: Array.isArray(item.authors) ? item.authors : [],
})

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatRelativeTime = (value: string | null | undefined, locale: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = date.getTime() - Date.now()
  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60_000, unit: 'minute' },
    { amount: 3_600_000, unit: 'hour' },
    { amount: 86_400_000, unit: 'day' },
  ]
  const abs = Math.abs(diffMs)
  const division = divisions.find((item) => abs < item.amount * 24) ?? divisions[2]
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(diffMs / division.amount),
    division.unit,
  )
}

const stripLinks = (text?: string | null): string | undefined => {
  if (!text) return undefined
  const cleaned = text
    .replace(/Откройте:\s*https?:\/\/\S+/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || undefined
}

const notificationTargetPath = (relatedEntity?: string | null) => {
  if (!relatedEntity) return '/cabinet/notifications'
  const [type, rawId] = relatedEntity.split(':')
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) return '/cabinet/notifications'
  if (type === 'review') return `/cabinet/reviews/${id}`
  if (type === 'article') return `/cabinet/my-articles/${id}`
  return '/cabinet/notifications'
}

const getStatusClass = (status: string) => `status-chip status-chip--${status.replace(/[^a-z0-9_-]/gi, '_')}`

export function Dashboard() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? (lang as Lang) : 'ru'
  const t = copies[l]
  const [activeRole, setActiveRole] = useState<RoleKey>(() => readStoredRole() ?? 'author')
  const [articles, setArticles] = useState<Article[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      setArticles([])
      setReviews([])
      setVolumes([])
      setAdminStats(null)
      setNotifications([])

      try {
        const [meResp, rolesResp] = await Promise.all([
          api.get<MeResponse>('/auth/me'),
          api.get<UserRolesResponse>('/users/me/roles').catch(() => null),
        ])
        if (!mounted) return

        const allowedRoles = normalizeAllowedRoles(rolesResp?.roles ?? [meResp.role], meResp.role)
        const storedRole = readStoredRole()
        const nextRole = storedRole && allowedRoles.includes(storedRole)
          ? storedRole
          : allowedRoles[0] ?? meResp.role ?? 'author'
        setActiveRole(nextRole)

        const notificationsPromise = api
          .getNotifications<NotificationDto[]>({ limit: 5, offset: 0 })
          .catch(() => [])

        if (nextRole === 'author') {
          const [data, latestNotifications] = await Promise.all([
            api.get<Record<string, unknown>[]>('/articles/my'),
            notificationsPromise,
          ])
          if (mounted) {
            setArticles(data.map(normalizeArticle))
            setNotifications(latestNotifications)
          }
        } else if (nextRole === 'editor') {
          const [data, latestNotifications] = await Promise.all([
            api.getUnassignedArticles<{ items?: Record<string, unknown>[] } | Record<string, unknown>[]>({ status: 'all', page_size: 20 }),
            notificationsPromise,
          ])
          const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
          if (mounted) {
            setArticles(items.map(normalizeArticle))
            setNotifications(latestNotifications)
          }
        } else if (nextRole === 'reviewer') {
          const [data, latestNotifications] = await Promise.all([
            api.getMyReviews<{ items?: ReviewItem[] }>({ page: 1, page_size: 20 }),
            notificationsPromise,
          ])
          if (mounted) {
            setReviews(Array.isArray(data.items) ? data.items : [])
            setNotifications(latestNotifications)
          }
        } else if (nextRole === 'layout') {
          const [data, latestNotifications] = await Promise.all([
            api.getVolumes<Volume[]>({ active_only: true }),
            notificationsPromise,
          ])
          if (mounted) {
            setVolumes(Array.isArray(data) ? data : [])
            setNotifications(latestNotifications)
          }
        } else if (nextRole === 'admin') {
          const [data, latestNotifications] = await Promise.all([
            api.getAdminUserStats<AdminStats>(),
            notificationsPromise,
          ])
          if (mounted) {
            setAdminStats(data)
            setNotifications(latestNotifications)
          }
        }
      } catch (e) {
        console.error('Dashboard load error', e)
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

  const unreadCount = notifications.filter((item) => item.status === 'unread').length

  const stats = useMemo(() => {
    if (activeRole === 'reviewer') {
      return [
        { label: t.stats.manuscripts, value: reviews.length },
        { label: t.stats.reviews, value: reviews.filter((r) => ['pending', 'in_progress'].includes(r.status)).length },
        { label: t.stats.published, value: reviews.filter((r) => ['submitted', 'completed'].includes(r.status)).length },
        { label: t.stats.unread, value: unreadCount },
      ]
    }
    if (activeRole === 'layout') {
      const articlesInVolumes = volumes.reduce((sum, volume) => sum + (volume.articles?.length ?? 0), 0)
      return [
        { label: t.stats.volumes, value: volumes.length },
        { label: t.stats.manuscripts, value: articlesInVolumes },
        { label: t.stats.published, value: volumes.filter((v) => v.is_active).length },
        { label: t.stats.unread, value: unreadCount },
      ]
    }
    if (activeRole === 'admin') {
      return [
        { label: t.stats.users, value: adminStats?.total ?? 0 },
        { label: t.stats.active, value: adminStats?.active ?? 0 },
        { label: t.stats.pending, value: adminStats?.pending ?? 0 },
        { label: t.stats.unread, value: unreadCount },
      ]
    }
    return [
      { label: t.stats.manuscripts, value: articles.length },
      { label: t.stats.reviews, value: articles.filter((a) => reviewStatuses.includes(a.status)).length },
      { label: t.stats.published, value: articles.filter((a) => a.status === 'published' || a.status === 'accepted').length },
      { label: t.stats.unread, value: unreadCount },
    ]
  }, [activeRole, adminStats, articles, reviews, t, unreadCount, volumes])

  const rows = useMemo(() => {
    if (activeRole === 'reviewer') {
      return reviews.slice(0, 5).map((review) => ({
        id: String(review.id),
        title: review.article_title || `#${review.article_id ?? review.id}`,
        meta: formatDate(review.deadline ?? review.created_at, t.locale),
        statusKey: review.status,
        statusLabel: t.status[review.status] ?? review.status,
        path: `/cabinet/reviews/${review.id}`,
      }))
    }
    if (activeRole === 'layout') {
      return volumes.slice(0, 5).map((volume) => ({
        id: String(volume.id ?? `${volume.year}-${volume.number}`),
        title: volume.title_ru || volume.title_en || volume.title_kz || `${volume.year}, №${volume.number}`,
        meta: `${volume.articles?.length ?? 0}`,
        statusKey: volume.is_active ? 'active' : 'draft',
        statusLabel: volume.is_active ? t.status.active : t.status.draft,
        path: volume.id ? `/cabinet/volumes/${volume.id}` : '/cabinet/volumes',
      }))
    }
    if (activeRole === 'admin') {
      return Object.entries(adminStats?.by_role ?? {}).map(([role, count]) => ({
        id: role,
        title: isRoleKey(role) ? t.roleNames[role] : role,
        meta: String(count),
        statusKey: 'active',
        statusLabel: t.status.active,
        path: '/cabinet/admin/users',
      }))
    }
    return articles.slice(0, 5).map((article) => ({
      id: article.id,
      title: article.title || `#${article.id}`,
      meta: formatDate(article.submittedAt, t.locale),
      statusKey: article.status,
      statusLabel: t.status[article.status] ?? article.status,
      path: activeRole === 'editor' ? `/cabinet/editorial2/${article.id}` : `/cabinet/my-articles/${article.id}`,
    }))
  }, [activeRole, adminStats, articles, reviews, t, volumes])

  const section = t.recent[activeRole]

  return (
    <div className="app-container dashboard-home">
      <section className="section-header dashboard-home__header" aria-label={t.title}>
        <div>
          <p className="eyebrow">{t.roleNames[activeRole]}</p>
          <h1 className="page-title">{t.title}</h1>
        </div>
      </section>

      <section className="dashboard-home__stats" aria-label={t.title}>
        {stats.map((stat) => (
          <div className="dashboard-home__stat" key={stat.label}>
            <div className="dashboard-home__stat-value">{loading ? '...' : stat.value}</div>
            <div className="dashboard-home__stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="dashboard-home__block">
        <div className="dashboard-home__block-head">
          <h2>{section.title}</h2>
          <Link to={section.path}>{t.all} -&gt;</Link>
        </div>
        {error ? (
          <div className="dashboard-home__empty">{error}</div>
        ) : rows.length === 0 ? (
          <div className="dashboard-home__empty">{loading ? t.loading : t.empty}</div>
        ) : (
          <div className="dashboard-home__list">
            {rows.map((row) => (
              <Link className="dashboard-home__row" to={row.path} key={row.id}>
                <span className="dashboard-home__row-main">
                  <span className="dashboard-home__row-title">{row.title}</span>
                  {row.meta ? (
                    <span className="dashboard-home__row-meta">
                      {t.manuscriptNumber} {row.id} · {row.meta}
                    </span>
                  ) : null}
                </span>
                <span className={getStatusClass(row.statusKey)}>
                  <span className="status-chip__dot" aria-hidden="true" />
                  {row.statusLabel}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-home__block">
        <div className="dashboard-home__block-head">
          <h2>{t.notifications}</h2>
          <Link to="/cabinet/notifications">{t.all} -&gt;</Link>
        </div>
        {notifications.length === 0 ? (
          <div className="dashboard-home__empty">{loading ? t.loading : t.notificationEmpty}</div>
        ) : (
          <div className="dashboard-home__notifications">
            {notifications.slice(0, 3).map((notification) => {
              const message = stripLinks(notification.message)
              return (
                <Link
                  className={`dashboard-home__notification ${notification.status === 'unread' ? 'dashboard-home__notification--unread' : ''}`}
                  to={notificationTargetPath(notification.related_entity)}
                  key={notification.id}
                >
                  <span className="dashboard-home__notification-dot" aria-hidden="true" />
                  <span className="dashboard-home__notification-body">
                    <span className="dashboard-home__notification-title">{notification.title}</span>
                    {message ? <span className="dashboard-home__notification-message">{message}</span> : null}
                    <time dateTime={notification.created_at}>
                      {formatRelativeTime(notification.created_at, t.locale)}
                    </time>
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
