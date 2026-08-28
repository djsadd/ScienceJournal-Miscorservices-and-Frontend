import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Article, ArticleStatus, Volume } from '../shared/types'
import { StatCard } from '../shared/components/StatCard'
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

type DashboardCopy = {
  title: string
  subtitle: string
  loading: string
  error: string
  empty: string
  open: string
  roleNames: Record<RoleKey, string>
  status: Record<string, string>
  author: {
    section: string
    description: string
    action: string
    path: string
    stats: { total: string; review: string; revision: string }
    recent: string
  }
  editor: {
    section: string
    description: string
    action: string
    path: string
    stats: { incoming: string; review: string; decision: string }
    recent: string
  }
  reviewer: {
    section: string
    description: string
    action: string
    path: string
    stats: { pending: string; active: string; overdue: string }
    recent: string
  }
  layout: {
    section: string
    description: string
    action: string
    path: string
    stats: { activeVolumes: string; articles: string; ready: string }
    recent: string
  }
  admin: {
    section: string
    description: string
    action: string
    path: string
    stats: { total: string; active: string; pending: string }
    recent: string
  }
  locale: string
}

const copies: Record<Lang, DashboardCopy> = {
  ru: {
    title: 'Главная',
    subtitle: 'Короткая сводка по выбранной роли без лишних блоков.',
    loading: 'Загрузка...',
    error: 'Не удалось загрузить данные',
    empty: 'Пока нет данных для отображения.',
    open: 'Открыть',
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
      revisions: 'Правки',
      send_for_revision: 'На доработке',
      sent_for_revision: 'На доработке',
      accepted: 'Принято',
      published: 'Опубликовано',
      rejected: 'Отклонено',
      withdrawn: 'Отозвано',
    },
    author: {
      section: 'Мои рукописи',
      description: 'Статусы последних материалов и то, что требует внимания.',
      action: 'Перейти к подачам',
      path: '/cabinet/submissions',
      stats: { total: 'Всего материалов', review: 'На проверке', revision: 'Нужны правки' },
      recent: 'Последние материалы',
    },
    editor: {
      section: 'Редакционная очередь',
      description: 'Новые материалы и рукописи, ожидающие решения.',
      action: 'Открыть назначения',
      path: '/cabinet/editorial2',
      stats: { incoming: 'Новые', review: 'На рецензии', decision: 'Требуют решения' },
      recent: 'Ближайшие задачи',
    },
    reviewer: {
      section: 'Мои рецензии',
      description: 'Активные проверки и приглашения к рецензированию.',
      action: 'Открыть рецензии',
      path: '/cabinet/reviews',
      stats: { pending: 'Приглашения', active: 'В работе', overdue: 'Просрочено' },
      recent: 'Последние рецензии',
    },
    layout: {
      section: 'Верстка выпуска',
      description: 'Активные номера и опубликованные материалы в них.',
      action: 'Открыть доску',
      path: '/cabinet/layout',
      stats: { activeVolumes: 'Активные номера', articles: 'Статей в номерах', ready: 'Готовы к выпуску' },
      recent: 'Активные номера',
    },
    admin: {
      section: 'Пользователи',
      description: 'Минимальная сводка по аккаунтам и заявкам.',
      action: 'Управлять пользователями',
      path: '/cabinet/admin/users',
      stats: { total: 'Всего пользователей', active: 'Активные', pending: 'Ожидают подтверждения' },
      recent: 'Роли в системе',
    },
    locale: 'ru-RU',
  },
  en: {
    title: 'Home',
    subtitle: 'A short summary for the selected role only.',
    loading: 'Loading...',
    error: 'Could not load data',
    empty: 'No data to show yet.',
    open: 'Open',
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
      revisions: 'Revisions',
      send_for_revision: 'Revision',
      sent_for_revision: 'Revision',
      accepted: 'Accepted',
      published: 'Published',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    },
    author: {
      section: 'My manuscripts',
      description: 'Recent materials and statuses that need attention.',
      action: 'Go to submissions',
      path: '/cabinet/submissions',
      stats: { total: 'Total materials', review: 'Under review', revision: 'Need revision' },
      recent: 'Recent materials',
    },
    editor: {
      section: 'Editorial queue',
      description: 'New materials and manuscripts waiting for a decision.',
      action: 'Open assignments',
      path: '/cabinet/editorial2',
      stats: { incoming: 'New', review: 'Under review', decision: 'Need decision' },
      recent: 'Next tasks',
    },
    reviewer: {
      section: 'My reviews',
      description: 'Active reviews and review invitations.',
      action: 'Open reviews',
      path: '/cabinet/reviews',
      stats: { pending: 'Invitations', active: 'In progress', overdue: 'Overdue' },
      recent: 'Recent reviews',
    },
    layout: {
      section: 'Issue layout',
      description: 'Active issues and published articles inside them.',
      action: 'Open board',
      path: '/cabinet/layout',
      stats: { activeVolumes: 'Active issues', articles: 'Articles in issues', ready: 'Ready issues' },
      recent: 'Active issues',
    },
    admin: {
      section: 'Users',
      description: 'A minimal account and approval summary.',
      action: 'Manage users',
      path: '/cabinet/admin/users',
      stats: { total: 'Total users', active: 'Active', pending: 'Pending approval' },
      recent: 'System roles',
    },
    locale: 'en-US',
  },
  kz: {
    title: 'Басты бет',
    subtitle: 'Таңдалған рөл бойынша қысқа мәлімет.',
    loading: 'Жүктелуде...',
    error: 'Деректерді жүктеу мүмкін болмады',
    empty: 'Әзірге көрсетілетін деректер жоқ.',
    open: 'Ашу',
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
      revisions: 'Түзету',
      send_for_revision: 'Доработкада',
      sent_for_revision: 'Доработкада',
      accepted: 'Қабылданды',
      published: 'Жарияланды',
      rejected: 'Қабылданбады',
      withdrawn: 'Қайтарылды',
    },
    author: {
      section: 'Менің қолжазбаларым',
      description: 'Соңғы материалдар және назар қажет ететін күйлер.',
      action: 'Өтінімдерге өту',
      path: '/cabinet/submissions',
      stats: { total: 'Барлық материалдар', review: 'Тексерісте', revision: 'Түзету керек' },
      recent: 'Соңғы материалдар',
    },
    editor: {
      section: 'Редакциялық кезек',
      description: 'Жаңа материалдар және шешім күтіп тұрған қолжазбалар.',
      action: 'Тапсырмаларды ашу',
      path: '/cabinet/editorial2',
      stats: { incoming: 'Жаңа', review: 'Рецензияда', decision: 'Шешім керек' },
      recent: 'Жақын тапсырмалар',
    },
    reviewer: {
      section: 'Менің рецензияларым',
      description: 'Белсенді тексерулер және рецензия шақырулары.',
      action: 'Рецензияларды ашу',
      path: '/cabinet/reviews',
      stats: { pending: 'Шақырулар', active: 'Жұмыста', overdue: 'Мерзімі өтті' },
      recent: 'Соңғы рецензиялар',
    },
    layout: {
      section: 'Нөмір беттеу',
      description: 'Белсенді нөмірлер және олардағы жарияланған мақалалар.',
      action: 'Тақтаны ашу',
      path: '/cabinet/layout',
      stats: { activeVolumes: 'Белсенді нөмірлер', articles: 'Нөмірдегі мақалалар', ready: 'Дайын нөмірлер' },
      recent: 'Белсенді нөмірлер',
    },
    admin: {
      section: 'Пайдаланушылар',
      description: 'Аккаунттар мен өтінімдер бойынша қысқа мәлімет.',
      action: 'Пайдаланушыларды басқару',
      path: '/cabinet/admin/users',
      stats: { total: 'Барлық пайдаланушы', active: 'Белсенді', pending: 'Растау күтеді' },
      recent: 'Жүйедегі рөлдер',
    },
    locale: 'kk-KZ',
  },
}

const roleKeys: RoleKey[] = ['author', 'editor', 'reviewer', 'layout', 'admin']
const isRoleKey = (value: string): value is RoleKey => roleKeys.includes(value as RoleKey)
const reviewStatuses = ['under_review', 'in_review', 'editor_check', 'reviewer_check']
const revisionStatuses = ['revisions', 'send_for_revision', 'sent_for_revision']

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
  return date.toLocaleDateString(locale)
}

export function Dashboard() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? (lang as Lang) : 'ru'
  const t = copies[l]
  const [me, setMe] = useState<MeResponse | null>(null)
  const [activeRole, setActiveRole] = useState<RoleKey>(() => readStoredRole() ?? 'author')
  const [articles, setArticles] = useState<Article[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
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

      try {
        const [meResp, rolesResp] = await Promise.all([
          api.get<MeResponse>('/auth/me'),
          api.get<UserRolesResponse>('/users/me/roles').catch(() => null),
        ])
        if (!mounted) return

        setMe(meResp)
        const allowedRoles = normalizeAllowedRoles(rolesResp?.roles ?? [meResp.role], meResp.role)
        const storedRole = readStoredRole()
        const nextRole = storedRole && allowedRoles.includes(storedRole)
          ? storedRole
          : allowedRoles[0] ?? meResp.role ?? 'author'
        setActiveRole(nextRole)

        if (nextRole === 'author') {
          const data = await api.get<Record<string, unknown>[]>('/articles/my')
          if (mounted) setArticles(data.map(normalizeArticle))
        } else if (nextRole === 'editor') {
          const data = await api.getUnassignedArticles<{ items?: Record<string, unknown>[] } | Record<string, unknown>[]>({ status: 'all', page_size: 20 })
          const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
          if (mounted) setArticles(items.map(normalizeArticle))
        } else if (nextRole === 'reviewer') {
          const data = await api.getMyReviews<{ items?: ReviewItem[] }>({ page: 1, page_size: 20 })
          if (mounted) setReviews(Array.isArray(data.items) ? data.items : [])
        } else if (nextRole === 'layout') {
          const data = await api.getVolumes<Volume[]>({ active_only: true })
          if (mounted) setVolumes(Array.isArray(data) ? data : [])
        } else if (nextRole === 'admin') {
          const data = await api.getAdminUserStats<AdminStats>()
          if (mounted) setAdminStats(data)
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

  const roleCopy = t[activeRole]

  const stats = useMemo(() => {
    if (activeRole === 'author') {
      return [
        { label: t.author.stats.total, value: articles.length },
        { label: t.author.stats.review, value: articles.filter((a) => reviewStatuses.includes(a.status)).length },
        { label: t.author.stats.revision, value: articles.filter((a) => revisionStatuses.includes(a.status)).length },
      ]
    }
    if (activeRole === 'editor') {
      return [
        { label: t.editor.stats.incoming, value: articles.filter((a) => a.status === 'submitted').length },
        { label: t.editor.stats.review, value: articles.filter((a) => reviewStatuses.includes(a.status)).length },
        { label: t.editor.stats.decision, value: articles.filter((a) => revisionStatuses.includes(a.status) || a.status === 'accepted').length },
      ]
    }
    if (activeRole === 'reviewer') {
      return [
        { label: t.reviewer.stats.pending, value: reviews.filter((r) => r.status === 'pending').length },
        { label: t.reviewer.stats.active, value: reviews.filter((r) => r.status === 'in_progress').length },
        {
          label: t.reviewer.stats.overdue,
          value: reviews.filter((r) => {
            const deadline = r.deadline ? new Date(r.deadline) : null
            return deadline ? deadline.getTime() < Date.now() && ['pending', 'in_progress'].includes(r.status) : false
          }).length,
        },
      ]
    }
    if (activeRole === 'layout') {
      const articlesInVolumes = volumes.reduce((sum, volume) => sum + (volume.articles?.length ?? 0), 0)
      return [
        { label: t.layout.stats.activeVolumes, value: volumes.length },
        { label: t.layout.stats.articles, value: articlesInVolumes },
        { label: t.layout.stats.ready, value: volumes.filter((v) => v.is_active).length },
      ]
    }
    return [
      { label: t.admin.stats.total, value: adminStats?.total ?? 0 },
      { label: t.admin.stats.active, value: adminStats?.active ?? 0 },
      { label: t.admin.stats.pending, value: adminStats?.pending ?? 0 },
    ]
  }, [activeRole, adminStats, articles, reviews, t, volumes])

  const rows = useMemo(() => {
    if (activeRole === 'reviewer') {
      return reviews.slice(0, 5).map((review) => ({
        id: String(review.id),
        title: review.article_title || `#${review.article_id ?? review.id}`,
        meta: formatDate(review.deadline ?? review.created_at, t.locale),
        chip: review.status,
        path: `/cabinet/reviews/${review.id}`,
      }))
    }
    if (activeRole === 'layout') {
      return volumes.slice(0, 5).map((volume) => ({
        id: String(volume.id ?? `${volume.year}-${volume.number}`),
        title: volume.title_ru || volume.title_en || volume.title_kz || `${volume.year}, №${volume.number}`,
        meta: `${volume.articles?.length ?? 0}`,
        chip: volume.is_active ? t.layout.stats.activeVolumes : t.layout.stats.ready,
        path: volume.id ? `/cabinet/volumes/${volume.id}` : '/cabinet/volumes',
      }))
    }
    if (activeRole === 'admin') {
      return Object.entries(adminStats?.by_role ?? {}).map(([role, count]) => ({
        id: role,
        title: isRoleKey(role) ? t.roleNames[role] : role,
        meta: String(count),
        chip: role,
        path: '/cabinet/admin/users',
      }))
    }
    return articles.slice(0, 5).map((article) => ({
      id: article.id,
      title: article.title || `#${article.id}`,
      meta: formatDate(article.submittedAt, t.locale),
      chip: t.status[article.status] ?? article.status,
      path: activeRole === 'editor' ? `/cabinet/editorial2/${article.id}` : `/cabinet/my-articles/${article.id}`,
    }))
  }, [activeRole, adminStats, articles, reviews, t, volumes])

  return (
    <div className="app-container dashboard-home">
      <section className="section-header dashboard-home__header">
        <div>
          <p className="eyebrow">{t.roleNames[activeRole]}</p>
          <h1 className="page-title">{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <span className="pill">{loading ? t.loading : error ? t.error : (me?.full_name || me?.username || t.roleNames[activeRole])}</span>
      </section>

      <section className="panel dashboard-home__summary">
        <div className="dashboard-home__summary-top">
          <div>
            <h2 className="panel-title">{roleCopy.section}</h2>
            <p className="subtitle">{roleCopy.description}</p>
          </div>
          <Link className="button button--primary" to={roleCopy.path}>
            {roleCopy.action}
          </Link>
        </div>
        <div className="grid grid-3 dashboard-home__stats">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={loading ? '...' : stat.value} />
          ))}
        </div>
      </section>

      <section className="panel dashboard-home__recent">
        <div className="dashboard-home__recent-top">
          <h2 className="panel-title">{roleCopy.recent}</h2>
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
                  {row.meta ? <span className="dashboard-home__row-meta">{row.meta}</span> : null}
                </span>
                <span className="dashboard-home__row-side">
                  <span className="status-chip status-chip--draft">{row.chip}</span>
                  <span className="dashboard-home__open">{t.open}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
