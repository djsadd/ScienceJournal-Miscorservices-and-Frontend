import { useEffect, useMemo, useState } from 'react'
import type { Article } from '../shared/types'
import { StatCard } from '../shared/components/StatCard'
import { api } from '../api/client'

interface MeResponse {
  id: number
  username: string
  full_name: string
  role: 'author' | 'editor' | 'reviewer'
}

const statusLabelMap: Record<Article['status'], string> = {
  draft: 'Черновик',
  submitted: 'Отправлено',
  under_review: 'В рецензировании',
  in_review: 'На рецензии',
  revisions: 'Требуют правок',
  accepted: 'Принято',
  published: 'Опубликовано',
  withdrawn: 'Отозвано',
  rejected: 'Отклонено',
}

const getLastAction = (article: Article) => {
  const date = new Date(article.submittedAt).toLocaleDateString('ru-RU')
  switch (article.status) {
    case 'in_review':
      return `Передано на рецензию · ${date}`
    case 'revisions':
      return `Ждет правок автора · ${date}`
    case 'accepted':
      return `Принято к публикации · ${date}`
    case 'submitted':
      return `Отправлено в редакцию · ${date}`
    case 'rejected':
      return `Отклонено · ${date}`
    default:
      return `Обновлено · ${date}`
  }
}

export function Dashboard() {
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
        if (mounted) setError('Не удалось загрузить данные дашборда')
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
      { label: 'На рецензии', value: inReview },
      { label: 'Требуют правок', value: revisions },
      { label: 'Приняты', value: accepted },
    ]
  }, [authorArticles])

  const editorStats = useMemo(() => {
    const incoming = editorArticles.filter((a) => a.status === 'submitted').length
    const onReview = editorArticles.filter((a) => a.status === 'in_review' || a.status === 'under_review').length
    const needDecision = editorArticles.filter((a) => a.status === 'revisions').length
    const toLayout = editorArticles.filter((a) => a.status === 'accepted').length
    return [
      { label: 'Входящие новые статьи', value: incoming },
      { label: 'На рецензии', value: onReview },
      { label: 'Требуют решения', value: needDecision },
      { label: 'На верстке', value: toLayout },
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
      { label: 'Новые приглашения', value: invitations },
      { label: 'Текущие рецензии', value: active },
      { label: 'Просроченные', value: overdue },
    ]
  }, [reviewItems])

  const designerStats = useMemo(() => {
    const onLayout = editorArticles.filter((a) => a.status === 'accepted').length
    const ready = volumes.filter((v) => v.is_active).length
    return [
      { label: 'На верстке', value: onLayout },
      { label: 'Ожидают выпуска', value: ready },
    ]
  }, [editorArticles, volumes])

  const roleLabel = me?.role === 'author' ? 'Автор' : me?.role === 'editor' ? 'Редактор' : me?.role === 'reviewer' ? 'Рецензент' : 'Кабинет'

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">{roleLabel}</p>
          <h1 className="page-title">Главная панель</h1>
          <p className="subtitle">Сводка по ролям и быстрый просмотр последних статей.</p>
        </div>
        <div className="pill pill--ghost">{loading ? 'Загрузка…' : error ? 'Ошибка' : 'Данные из API'}</div>
      </section>

      <div className="dashboard-grid">
        <div className="panel role-panel role-panel--wide">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">Автор</p>
              <h2 className="panel-title">Статистика заявок</h2>
              <p className="subtitle">Текущее состояние рукописей в работе.</p>
            </div>
            <span className="pill">Мои материалы</span>
          </div>

          <div className="grid grid-3 role-panel__stats">
            {authorStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="latest-table">
            <div className="latest-table__title">Мои последние статьи</div>
            <div className="latest-table__head">
              <span>Название</span>
              <span>Статус</span>
              <span>Последнее действие</span>
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
                      {statusLabelMap[article.status] ?? article.status}
                    </span>
                  </div>
                  <div className="latest-table__cell latest-table__cell--action">{getLastAction(article)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">Редактор</p>
              <h2 className="panel-title">Поток задач</h2>
              <p className="subtitle">Что сейчас требует внимания.</p>
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
              <p className="eyebrow">Рецензент</p>
              <h2 className="panel-title">Мои проверки</h2>
              <p className="subtitle">Приглашения и активные рецензии.</p>
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
              <p className="eyebrow">Верстальщик</p>
              <h2 className="panel-title">Выпуск номера</h2>
              <p className="subtitle">Статьи на верстке и в очереди на выпуск.</p>
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
