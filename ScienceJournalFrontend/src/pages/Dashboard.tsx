import { useEffect, useMemo, useState } from 'react'
import type { Article } from '../shared/types'
import { StatCard } from '../shared/components/StatCard'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import type { Lang } from '../shared/labels'
import { formatArticleStatus } from '../shared/labels'

interface MeResponse {
  id: number
  username: string
  full_name: string
  role: 'author' | 'editor' | 'reviewer'
}

type DashboardCopy = {
  header: { title: string; subtitle: string }
  pills: { loading: string; error: string; data: string }
  roles: { author: string; editor: string; reviewer: string; designer: string; cabinet: string }
  author: {
    title: string
    subtitle: string
    chip: string
    latestTitle: string
    tableHead: { title: string; status: string; action: string }
    stats: { inReview: string; revisions: string; accepted: string }
  }
  editor: { title: string; subtitle: string; stats: { incoming: string; onReview: string; needDecision: string; toLayout: string } }
  reviewer: { title: string; subtitle: string; stats: { invitations: string; active: string; overdue: string } }
  designer: { title: string; subtitle: string; stats: { onLayout: string; ready: string } }
  lastAction: {
    in_review: string
    revisions: string
    accepted: string
    submitted: string
    rejected: string
    updated: string
  }
  locale: string
}

const dashboardCopy: Record<Lang, DashboardCopy> = {
  ru: {
    header: { title: 'Главная панель', subtitle: 'Сводка по ролям и быстрый просмотр последних статей.' },
    pills: { loading: 'Загрузка…', error: 'Ошибка', data: 'Данные из API' },
    roles: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент', designer: 'Вёрстальщик', cabinet: 'Кабинет' },
    author: {
      title: 'Статистика заявок',
      subtitle: 'Текущее состояние рукописей в работе.',
      chip: 'Мои материалы',
      latestTitle: 'Мои последние статьи',
      tableHead: { title: 'Название', status: 'Статус', action: 'Последнее действие' },
      stats: { inReview: 'На рецензии', revisions: 'Требуют правок', accepted: 'Приняты' },
    },
    editor: {
      title: 'Поток задач',
      subtitle: 'Что сейчас требует внимания.',
      stats: {
        incoming: 'Входящие новые статьи',
        onReview: 'На рецензии',
        needDecision: 'Требуют решения',
        toLayout: 'На верстке',
      },
    },
    reviewer: {
      title: 'Мои проверки',
      subtitle: 'Приглашения и активные рецензии.',
      stats: { invitations: 'Новые приглашения', active: 'Текущие рецензии', overdue: 'Просроченные' },
    },
    designer: {
      title: 'Выпуск номера',
      subtitle: 'Статьи на верстке и в очереди на выпуск.',
      stats: { onLayout: 'На верстке', ready: 'Ожидают выпуска' },
    },
    lastAction: {
      in_review: 'Передано на рецензию',
      revisions: 'Ждет правок автора',
      accepted: 'Принято к публикации',
      submitted: 'Отправлено в редакцию',
      rejected: 'Отклонено',
      updated: 'Обновлено',
    },
    locale: 'ru-RU',
  },
  en: {
    header: { title: 'Dashboard', subtitle: 'Role summary and quick view of recent papers.' },
    pills: { loading: 'Loading…', error: 'Error', data: 'API data' },
    roles: { author: 'Author', editor: 'Editor', reviewer: 'Reviewer', designer: 'Designer', cabinet: 'Dashboard' },
    author: {
      title: 'Submission stats',
      subtitle: 'Current state of your manuscripts.',
      chip: 'My papers',
      latestTitle: 'My recent articles',
      tableHead: { title: 'Title', status: 'Status', action: 'Last action' },
      stats: { inReview: 'Under review', revisions: 'Revisions needed', accepted: 'Accepted' },
    },
    editor: {
      title: 'Task flow',
      subtitle: 'What needs attention now.',
      stats: { incoming: 'Incoming new papers', onReview: 'Under review', needDecision: 'Needs decision', toLayout: 'In layout' },
    },
    reviewer: {
      title: 'My reviews',
      subtitle: 'Invitations and active reviews.',
      stats: { invitations: 'New invitations', active: 'Active reviews', overdue: 'Overdue' },
    },
    designer: {
      title: 'Issue production',
      subtitle: 'Articles in layout and pending release.',
      stats: { onLayout: 'In layout', ready: 'Awaiting release' },
    },
    lastAction: {
      in_review: 'Sent for review',
      revisions: 'Awaiting author revisions',
      accepted: 'Accepted for publication',
      submitted: 'Submitted to editorial',
      rejected: 'Rejected',
      updated: 'Updated',
    },
    locale: 'en-US',
  },
  kz: {
    header: { title: 'Дашборд', subtitle: 'Рөлдер бойынша шолу және соңғы мақалалар.' },
    pills: { loading: 'Жүктелуде…', error: 'Қате', data: 'API деректері' },
    roles: { author: 'Автор', editor: 'Редактор', reviewer: 'Рецензент', designer: 'Дизайнер', cabinet: 'Кабинет' },
    author: {
      title: 'Өтінім статистикасы',
      subtitle: 'Қолжазбалардың ағымдағы күйі.',
      chip: 'Менің материалдарым',
      latestTitle: 'Соңғы мақалаларым',
      tableHead: { title: 'Атауы', status: 'Күйі', action: 'Соңғы әрекет' },
      stats: { inReview: 'Рецензияда', revisions: 'Түзетулер қажет', accepted: 'Қабылданды' },
    },
    editor: {
      title: 'Тапсырмалар ағымы',
      subtitle: 'Қазір назарды қажет ететіндер.',
      stats: { incoming: 'Келіп түскен мақалалар', onReview: 'Рецензияда', needDecision: 'Шешім қажет', toLayout: 'Беттеуде' },
    },
    reviewer: {
      title: 'Менің тексерулерім',
      subtitle: 'Шақырулар және белсенді рецензиялар.',
      stats: { invitations: 'Жаңа шақырулар', active: 'Белсенді рецензиялар', overdue: 'Мерзімі өткен' },
    },
    designer: {
      title: 'Нөмір шығару',
      subtitle: 'Беттеудегі және шығаруды күтетін мақалалар.',
      stats: { onLayout: 'Беттеуде', ready: 'Шығаруды күтуде' },
    },
    lastAction: {
      in_review: 'Рецензияға жіберілді',
      revisions: 'Автор түзетулерін күтуде',
      accepted: 'Жариялауға қабылданды',
      submitted: 'Редакцияға жіберілді',
      rejected: 'Қабылданбады',
      updated: 'Жаңартылды',
    },
    locale: 'kk-KZ',
  },
}

function getLastAction(article: Article, copy: DashboardCopy) {
  const date = new Date(article.submittedAt).toLocaleDateString(copy.locale)
  const base =
    article.status === 'in_review'
      ? copy.lastAction.in_review
      : article.status === 'revisions'
        ? copy.lastAction.revisions
        : article.status === 'accepted'
          ? copy.lastAction.accepted
          : article.status === 'submitted'
            ? copy.lastAction.submitted
            : article.status === 'rejected'
              ? copy.lastAction.rejected
              : copy.lastAction.updated
  return `${base} · ${date}`
}

export function Dashboard() {
  const { lang } = useLanguage()
  const l: Lang = (['ru', 'en', 'kz'] as const).includes(lang) ? (lang as Lang) : 'ru'
  const t = dashboardCopy[l]
  const [me, setMe] = useState<MeResponse | null>(null)
  const [authorArticles, setAuthorArticles] = useState<Article[]>([])
  const [editorArticles, setEditorArticles] = useState<Article[]>([])
  const [reviewItems, setReviewItems] = useState<any[]>([])
  const [volumes, setVolumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const meResp = await api.get<MeResponse>('/auth/me')
        if (!mounted) return
        setMe(meResp)

        // Fetch per-role data in parallel
        const tasks: Promise<any>[] = []
        // Author: my articles
        tasks.push(
          api
            .get<any[]>('/articles/my')
            .then((data) =>
              data.map((item) => ({
                id: String(item.id),
                title: item.title_ru ?? item.title_en ?? item.title_kz ?? '',
                abstract: item.abstract_ru ?? item.abstract_en ?? item.abstract_kz ?? '',
                status: item.status,
                submittedAt: item.created_at,
                authors: item.authors ?? [],
              })) as Article[],
            )
            .then((mapped) => {
              if (mounted) setAuthorArticles(mapped)
            }),
        )

        // Editor: unassigned or general queue
        tasks.push(
          api
            .getUnassignedArticles<any>()
            .then((res) => {
              const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
              const mapped = items.map((item: any) => ({
                id: String(item.id),
                title: item.title_ru ?? item.title_en ?? item.title_kz ?? '',
                abstract: item.abstract_ru ?? item.abstract_en ?? item.abstract_kz ?? '',
                status: item.status,
                submittedAt: item.created_at,
                authors: item.authors ?? [],
                specialty: item.article_type,
                reviews: item.reviews ?? [],
              })) as Article[]
              if (mounted) setEditorArticles(mapped)
            }),
        )

        // Reviewer: my reviews
        tasks.push(
          api.get<any[]>('/reviews/my-reviews').then((items) => {
            if (mounted) setReviewItems(items ?? [])
          }),
        )

        // Designer: volumes (active)
        tasks.push(
          api.get<any>('/volumes', { params: { active_only: true } }).then((res) => {
            const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
            if (mounted) setVolumes(items)
          }),
        )

        await Promise.allSettled(tasks)
      } catch (e) {
        console.error('Dashboard load error', e)
        if (mounted) setError(t.pills.error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const latest = useMemo(
    () =>
      [...authorArticles]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 4),
    [authorArticles],
  )

  const authorStats = useMemo(() => {
    const inReview = authorArticles.filter((a) => a.status === 'in_review' || a.status === 'under_review').length
    const revisions = authorArticles.filter((a) => a.status === 'revisions').length
    const accepted = authorArticles.filter((a) => a.status === 'accepted').length
    return [
      { label: t.author.stats.inReview, value: inReview },
      { label: t.author.stats.revisions, value: revisions },
      { label: t.author.stats.accepted, value: accepted },
    ]
  }, [authorArticles])

  const editorStats = useMemo(() => {
    const incoming = editorArticles.filter((a) => a.status === 'submitted').length
    const onReview = editorArticles.filter((a) => a.status === 'in_review' || a.status === 'under_review').length
    const needDecision = editorArticles.filter((a) => a.status === 'revisions').length
    const toLayout = editorArticles.filter((a) => a.status === 'accepted').length
    return [
      { label: t.editor.stats.incoming, value: incoming },
      { label: t.editor.stats.onReview, value: onReview },
      { label: t.editor.stats.needDecision, value: needDecision },
      { label: t.editor.stats.toLayout, value: toLayout },
    ]
  }, [editorArticles])

  const reviewerStats = useMemo(() => {
    const invitations = reviewItems.filter((r) => r.status === 'pending').length
    const active = reviewItems.filter((r) => r.status === 'in_progress').length
    const overdue = reviewItems.filter((r) => {
      const d = r.deadline ? new Date(r.deadline) : null
      return d ? d.getTime() < Date.now() && (r.status === 'in_progress' || r.status === 'pending') : false
    }).length
    return [
      { label: t.reviewer.stats.invitations, value: invitations },
      { label: t.reviewer.stats.active, value: active },
      { label: t.reviewer.stats.overdue, value: overdue },
    ]
  }, [reviewItems])

  const designerStats = useMemo(() => {
    const onLayout = editorArticles.filter((a) => a.status === 'accepted').length
    const ready = volumes.filter((v) => v.is_active).length
    return [
      { label: t.designer.stats.onLayout, value: onLayout },
      { label: t.designer.stats.ready, value: ready },
    ]
  }, [editorArticles, volumes])

  const roleLabel = me?.role === 'author' ? t.roles.author : me?.role === 'editor' ? t.roles.editor : me?.role === 'reviewer' ? t.roles.reviewer : t.roles.cabinet

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">{roleLabel}</p>
          <h1 className="page-title">{t.header.title}</h1>
          <p className="subtitle">{t.header.subtitle}</p>
        </div>
        <div className="pill pill--ghost">{loading ? t.pills.loading : error ? t.pills.error : t.pills.data}</div>
      </section>

      <div className="dashboard-grid">
        <div className="panel role-panel role-panel--wide">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">{t.roles.author}</p>
              <h2 className="panel-title">{t.author.title}</h2>
              <p className="subtitle">{t.author.subtitle}</p>
            </div>
            <span className="pill">{t.author.chip}</span>
          </div>

          <div className="grid grid-3 role-panel__stats">
            {authorStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="latest-table">
            <div className="latest-table__title">{t.author.latestTitle}</div>
            <div className="latest-table__head">
              <span>{t.author.tableHead.title}</span>
              <span>{t.author.tableHead.status}</span>
              <span>{t.author.tableHead.action}</span>
            </div>
            <div className="latest-table__body">
              {latest.map((article) => (
                <div className="latest-table__row" key={article.id}>
                  <div className="latest-table__cell latest-table__cell--title">
                    <div className="latest-table__name">{article.title}</div>
                    <div className="latest-table__meta">#{article.id}</div>
                  </div>
                  <div className="latest-table__cell">
                    <span className={`status-chip status-chip--${article.status}`}>
                      {formatArticleStatus(article.status, l)}
                    </span>
                  </div>
                  <div className="latest-table__cell latest-table__cell--action">{getLastAction(article, t)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">{t.roles.editor}</p>
              <h2 className="panel-title">{t.editor.title}</h2>
              <p className="subtitle">{t.editor.subtitle}</p>
            </div>
          </div>
          <div className="role-stats role-stats--dense">
            {editorStats.map((stat) => (
              <div className="role-stat" key={stat.label}>
                <div className="role-stat__value">{stat.value}</div>
                <div className="role-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">{t.roles.reviewer}</p>
              <h2 className="panel-title">{t.reviewer.title}</h2>
              <p className="subtitle">{t.reviewer.subtitle}</p>
            </div>
          </div>
          <div className="role-stats">
            {reviewerStats.map((stat) => (
              <div className="role-stat" key={stat.label}>
                <div className="role-stat__value">{stat.value}</div>
                <div className="role-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">{t.roles.designer}</p>
              <h2 className="panel-title">{t.designer.title}</h2>
              <p className="subtitle">{t.designer.subtitle}</p>
            </div>
          </div>
          <div className="role-stats">
            {designerStats.map((stat) => (
              <div className="role-stat" key={stat.label}>
                <div className="role-stat__value">{stat.value}</div>
                <div className="role-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
