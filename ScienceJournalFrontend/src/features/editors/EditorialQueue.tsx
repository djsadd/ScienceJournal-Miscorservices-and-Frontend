import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Article, ReviewAssignment, User } from '../../shared/types'
import { reviewFields } from '../../pages/ReviewFormPage'

interface EditorialQueueProps {
  articles: Article[]
  users: User[]
  assignments: ReviewAssignment[]
}

type StatusFilter =
  | 'all'
  | 'new'
  | 'screening'
  | 'in_review'
  | 'decision'
  | 'revisions'
  | 'accepted'
  | 'rejected'
  | 'layout'
  | 'ready'

const statusLabel: Record<Exclude<StatusFilter, 'all'>, string> = {
  new: 'Новые',
  screening: 'На проверке',
  in_review: 'На рецензии',
  decision: 'Ждут решения редактора',
  revisions: 'На доработке у автора',
  accepted: 'Приняты',
  rejected: 'Отклонены',
  layout: 'На верстке',
  ready: 'Готовы к выпуску',
}

const articleStatusLabel: Record<Article['status'], string> = {
  draft: 'Черновик',
  submitted: 'Новая',
  under_review: 'В рецензировании',
  in_review: 'На рецензии',
  revisions: 'На доработке',
  accepted: 'Принята',
  published: 'Опубликована',
  withdrawn: 'Отозвана',
  rejected: 'Отклонена',
}

const pageSize = 6

export function EditorialQueue({ articles, users, assignments }: EditorialQueueProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [authorFilter, setAuthorFilter] = useState<'all' | string>('all')
  const [yearFilter, setYearFilter] = useState<'all' | string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all')
  const [keywords, setKeywords] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [activeReviewArticle, setActiveReviewArticle] = useState<Article | null>(null)

  const authors = useMemo(
    () =>
      Array.from(
        new Set(
          articles
            .flatMap((a) => a.authors)
            .map((id) => users.find((u) => u.id === id))
            .filter(Boolean)
            .map((u) => u!.id),
        ),
      ),
    [articles, users],
  )

  const authorOptions = authors
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean)
    .map((u) => ({ id: u!.id, name: u!.name }))

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          articles
            .map((a) => new Date(a.submittedAt).getFullYear())
            .filter((year) => !Number.isNaN(year)),
        ),
      )
        .sort((a, b) => b - a)
        .map(String),
    [articles],
  )

  const specialties = useMemo(
    () =>
      Array.from(new Set(articles.map((a) => a.specialty))).filter((s) => s && s.trim().length > 0),
    [articles],
  )

  const filtered = useMemo(() => {
    const keywordList = keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)

    return articles.filter((article) => {
      const firstAuthor = users.find((u) => u.id === article.authors[0])
      const matchesAuthor = authorFilter === 'all' || article.authors.includes(authorFilter)
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'new'
          ? article.status === 'submitted'
          : statusFilter === 'screening'
          ? article.status === 'submitted'
          : statusFilter === 'decision'
          ? article.status === 'revisions'
          : statusFilter === 'layout'
          ? article.status === 'accepted'
          : statusFilter === 'ready'
          ? article.status === 'accepted'
          : article.status === statusFilter
      const matchesYear = yearFilter === 'all' || new Date(article.submittedAt).getFullYear().toString() === yearFilter
      const matchesType = typeFilter === 'all' || article.specialty === typeFilter
      const matchesQuery =
        article.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        (firstAuthor?.name.toLowerCase().includes(query.trim().toLowerCase()) ?? false)
      const matchesKeywords =
        keywordList.length === 0 ||
        keywordList.some((kw) => article.title.toLowerCase().includes(kw) || article.abstract.toLowerCase().includes(kw))

      return matchesAuthor && matchesStatus && matchesYear && matchesType && matchesQuery && matchesKeywords
    })
  }, [articles, authorFilter, statusFilter, yearFilter, typeFilter, query, keywords, users])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const formatReviewerState = (article: Article) => {
    const assigned = assignments.filter((a) => a.articleId === article.id)
    if (assigned.length === 0) return '—'
    return assigned
      .map((a, idx) => {
        const reviewer = users.find((u) => u.id === a.reviewerId)
        const review = (article.reviews || []).find((r) => r.reviewerId === a.reviewerId)
        const icon = review ? '✓' : new Date(a.dueAt) < new Date() ? '✏' : '✉'
        const prefix = reviewer ? reviewer.name.split(' ')[0] : `R${idx + 1}`
        return `${prefix} ${icon}`
      })
      .join(', ')
  }

  const getDeadline = (article: Article) => {
    const relevant = assignments
      .filter((a) => a.articleId === article.id)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0]
    if (!relevant || article.status !== 'in_review') return '—'
    const date = new Date(relevant.dueAt)
    const formatted = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    return { formatted, overdue: date.getTime() < Date.now() }
  }

  const getActions = (status: Article['status']) => {
    switch (status) {
      case 'in_review':
        return ['Открыть', 'Назначить рецензента', 'Проверить рецензию']
      case 'revisions':
        return ['Отправить автору', 'Открыть', 'Проверить рецензию']
      case 'submitted':
        return ['Рассмотреть', 'Назначить рецензента']
      case 'accepted':
        return ['Отправить на верстку', 'Открыть']
      case 'rejected':
        return ['Открыть']
      default:
        return ['Открыть']
    }
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Все статьи</h1>
          <p className="subtitle">Главная панель: обзор статусов, дедлайнов и действий.</p>
        </div>
        <div className="pill pill--ghost">Экспорт · CSV</div>
      </section>

      <section className="section">
        <div className="panel panel--floating">
          <div className="filters filters--sticky">
            <div className="filter-group">
              <label className="filter-label">Статус</label>
              <select
                className="chip-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter)
                  setPage(1)
                }}
              >
                <option value="all">Все</option>
                {Object.entries(statusLabel).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Автор</label>
              <select
                className="chip-select"
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Все</option>
                {authorOptions.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Год</label>
              <select
                className="chip-select"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Все</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Тип статьи</label>
              <select
                className="chip-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Все</option>
                {specialties.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-group--wide">
              <label className="filter-label">Ключевые слова</label>
              <input
                className="search"
                placeholder="Через запятую"
                value={keywords}
                onChange={(e) => {
                  setKeywords(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div className="filter-group filter-group--wide">
              <label className="filter-label">Поиск</label>
              <input
                className="search"
                placeholder="Название или автор"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="table table--editor">
            <div className="table__head">
              <span>Название статьи</span>
              <span>Автор</span>
              <span>Статус</span>
              <span>Рецензенты</span>
              <span>Дедлайн</span>
              <span>Действия</span>
            </div>
            <div className="table__body">
              {paginated.map((article) => {
                const firstAuthor = users.find((u) => u.id === article.authors[0])
                const reviewerState = formatReviewerState(article)
                const deadline = getDeadline(article)

                return (
                  <div className="table__row table__row--align" key={article.id}>
                    <div className="table__cell table__cell--title table__cell--link">
                      <div className="table__title">{article.title}</div>
                      <div className="table__meta">#{article.id}</div>
                    </div>
                    <div className="table__cell">
                      <div className="table__title">{firstAuthor?.name ?? '—'}</div>
                      <div className="table__meta">{article.specialty}</div>
                    </div>
                    <div className="table__cell">
                      <span className={`status-chip status-chip--${article.status}`}>{articleStatusLabel[article.status]}</span>
                    </div>
                    <div className="table__cell">
                      <span className="reviewer-chip">{reviewerState}</span>
                    </div>
                    <div className="table__cell">
                      {deadline === '—' ? (
                        '—'
                      ) : (
                        <span className={`deadline ${deadline.overdue ? 'deadline--overdue' : ''}`}>{deadline.formatted}</span>
                      )}
                    </div>
                    <div className="table__cell table__cell--actions">
                      {getActions(article.status).map((action) => {
                        if (action === 'Открыть') {
                          return (
                            <Link
                              key={action}
                              className="button button--ghost button--compact"
                              to={`/cabinet/articles/${article.id}`}
                            >
                              {action}
                            </Link>
                          )
                        }
                        if (action === 'Проверить рецензию') {
                          return (
                            <button
                              key={action}
                              className="button button--ghost button--compact"
                              onClick={() => setActiveReviewArticle(article)}
                            >
                              {action}
                            </button>
                          )
                        }
                        return (
                          <button key={action} className="button button--ghost button--compact">
                            {action}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {paginated.length === 0 ? <div className="table__empty">Нет статей по выбранным фильтрам.</div> : null}
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div className="card-grid">
              {paginated.map((article) => {
                const firstAuthor = users.find((u) => u.id === article.authors[0])
                const reviewerState = formatReviewerState(article)
                const deadline = getDeadline(article)

                return (
                  <div className="panel submission-card" key={article.id}>
                    <div className="submission-card__top">
                      <div>
                        <div className="submission-card__title">{article.title}</div>
                        <div className="submission-card__meta">Автор: {firstAuthor?.name ?? '—'}</div>
                        <div className="submission-card__meta">Тип: {article.specialty}</div>
                      </div>
                      <span className={`status-chip status-chip--${article.status}`}>{articleStatusLabel[article.status]}</span>
                    </div>
                    <div className="submission-card__body">
                      <div>
                        <div className="submission-card__label">Рецензенты</div>
                        <div className="reviewer-chip">{reviewerState}</div>
                      </div>
                      <div>
                        <div className="submission-card__label">Дедлайн</div>
                        {deadline === '—' ? (
                          '—'
                        ) : (
                          <span className={`deadline ${deadline.overdue ? 'deadline--overdue' : ''}`}>{deadline.formatted}</span>
                        )}
                      </div>
                    </div>
                    <div className="submission-card__actions">
                      {getActions(article.status).map((action) => (
                        <button key={action} className="button button--ghost button--compact">
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className="table__footer">
            <div className="view-toggle">
              <button
                className={`button button--ghost button--compact ${viewMode === 'table' ? 'button--active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                Таблица
              </button>
              <button
                className={`button button--ghost button--compact ${viewMode === 'cards' ? 'button--active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                Карточки
              </button>
            </div>
            <div className="pagination">
              <button
                className="button button--ghost button--compact"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <span className="pagination__meta">
                Стр. {currentPage} / {totalPages}
              </span>
              <button
                className="button button--ghost button--compact"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Вперед
              </button>
            </div>
          </div>
        </div>
      </section>

      {activeReviewArticle ? (
        <div className="modal-backdrop" onClick={() => setActiveReviewArticle(null)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Проверка рецензии — {activeReviewArticle.title}</h3>
              <button className="modal__close" onClick={() => setActiveReviewArticle(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="modal__body">
              {reviewFields.map((label) => (
                <div className="form-field" key={label}>
                  <label className="form-label">{label}</label>
                  <textarea className="text-input" rows={3} placeholder="Содержимое рецензии" readOnly />
                </div>
              ))}
              <div className="form-field">
                <label className="form-label">Файл рукописи</label>
                <input type="file" disabled />
                <div className="form-hint">Загрузка недоступна в режиме просмотра.</div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setActiveReviewArticle(null)}>
                Закрыть
              </button>
              <button className="button button--primary" type="button">
                Принять рецензию
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
