import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { formatArticleStatus } from '../shared/labels'
import type { Article, ArticleStatus, PagedResponse } from '../shared/types'

type Filters = {
  status?: string
  author_name?: string
  year?: number | ''
  article_type?: 'original' | 'review' | ''
  keywords?: string
  search?: string
}

const DEFAULT_PAGE_SIZE = 10
const CACHE_TTL_MS = 60_000
const MAX_VISIBLE_PAGES = 5

const keyOf = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

const memoryCache = new Map<string, { at: number; data: PagedResponse<Article> }>()

const FALLBACK_STATUS_OPTIONS: ArticleStatus[] = [
  'draft',
  'submitted',
  'editor_check',
  'reviewer_check',
  'sent_for_revision',
  'accepted',
  'rejected',
  'published',
  'withdrawn',
]

export default function EditorialPortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ status: undefined })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PagedResponse<Article> | null>(null)
  const [statusOptions, setStatusOptions] = useState<ArticleStatus[]>(FALLBACK_STATUS_OPTIONS)

  useEffect(() => {
    let mounted = true
    api
      .getArticleStatuses<string[]>({ scope: 'unassigned' })
      .then((statuses) => {
        if (!mounted) return
        const next = (Array.isArray(statuses) ? statuses : []).filter(
          (status): status is ArticleStatus => typeof status === 'string',
        )
        if (next.length > 0) setStatusOptions(next)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const params = useMemo(() => {
    const statusParam: ArticleStatus | 'all' = !filters.status ? 'all' : (filters.status as ArticleStatus)
    return {
      author_name: filters.author_name,
      keywords: filters.keywords,
      search: filters.search,
      year: filters.year === '' ? undefined : filters.year,
      article_type: filters.article_type === '' ? undefined : filters.article_type,
      status: statusParam,
      page,
      page_size: pageSize,
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      const cacheKey = keyOf(params)
      const cached = memoryCache.get(cacheKey)
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setData(cached.data)
        setLoading(false)
        return
      }

      try {
        const response = await api.getUnassignedArticles<PagedResponse<Article>>(params)
        if (cancelled) return
        setData(response)
        memoryCache.set(cacheKey, { at: Date.now(), data: response })
      } catch (e: any) {
        const message = e?.bodyJson?.detail || e?.message || 'Failed to load'
        if (!cancelled) setError(String(message))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timeout = setTimeout(run, params.search ? 350 : 0)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [params])

  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPage(1)
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
    setPageSize(DEFAULT_PAGE_SIZE)
  }

  const pagination = data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = Math.max(1, pagination?.total_pages ?? 1)
  const windowStart = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2))
  const windowEnd = Math.min(totalPages, windowStart + MAX_VISIBLE_PAGES - 1)
  const visibleStart = Math.max(1, windowEnd - MAX_VISIBLE_PAGES + 1)
  const visiblePages = Array.from(
    { length: windowEnd - visibleStart + 1 },
    (_, index) => visibleStart + index,
  )

  return (
    <div className="app-container app-container--wide editorial-portfolio">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Редакционный портфель</h1>
          <p className="subtitle">Секция с реальными данными из API.</p>
        </div>
      </section>

      <section className="section">
        <div className="panel panel--floating">
          <div className="filters filters--sticky">
            <div className="filter-group">
              <label className="filter-label">Автор</label>
              <input
                className="search"
                name="author_name"
                value={filters.author_name ?? ''}
                onChange={onInput}
                placeholder="Автор"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Поиск</label>
              <input
                className="search"
                name="search"
                value={filters.search ?? ''}
                onChange={onInput}
                placeholder="Заголовок/аннотация"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Ключевые слова</label>
              <input
                className="search"
                name="keywords"
                value={filters.keywords ?? ''}
                onChange={onInput}
                placeholder="Ключевые слова"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Год</label>
              <input
                className="search"
                name="year"
                type="number"
                value={filters.year ?? ''}
                onChange={onInput}
                placeholder="Год"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Тип статьи</label>
              <select className="chip-select" name="article_type" value={filters.article_type ?? ''} onChange={onInput}>
                <option value="">Тип</option>
                <option value="original">original</option>
                <option value="review">review</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Статус</label>
              <select className="chip-select" name="status" value={filters.status ?? ''} onChange={onInput}>
                <option value="">Все статусы</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatArticleStatus(status, 'ru')}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group filter-group--actions">
              <button className="button button--ghost button--compact" onClick={clearFilters}>
                Сбросить
              </button>
            </div>
          </div>

          {error ? <div className="alert error">Ошибка: {error}</div> : null}
          {loading ? <div className="loading">Загрузка...</div> : null}

          <div className="table table--portfolio">
            <div className="table__head">
              <span>Название</span>
              <span>Тип</span>
              <span>Статус</span>
              <span>Авторы</span>
              <span>Файлы</span>
            </div>
            <div className="table__body">
              {data?.items.map((article) => (
                <div className="table__row" key={article.id}>
                  <div className="table__cell table__cell--title">
                    <div className="table__title">
                      {article.title_ru || article.title_en || article.title_kz || 'Без заголовка'}
                    </div>
                    <div className="table__meta">DOI: {article.doi || '—'}</div>
                  </div>
                  <div className="table__cell">{article.article_type}</div>
                  <div className="table__cell">{formatArticleStatus(article.status, 'ru')}</div>
                  <div className="table__cell">
                    {article.authors.map((author) => `${author.last_name} ${author.first_name}`).join(', ') || '—'}
                  </div>
                  <div className="table__cell table__cell--actions">
                    <div className="actions">
                      <a className="button button--primary button--compact" href={`/cabinet/editorial2/${String(article.id)}`}>
                        Посмотреть
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && data && data.items.length === 0 ? <div className="table__empty">Нет результатов</div> : null}
            </div>
          </div>

          <div className="table__footer">
            <div className="pagination">
              <button
                type="button"
                className="button button--ghost button--compact"
                disabled={currentPage <= 1}
                onClick={() => setPage(1)}
                aria-label="Первая страница"
              >
                «
              </button>
              <button
                type="button"
                className="button button--ghost button--compact"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                aria-label="Предыдущая страница"
              >
                ‹
              </button>
              <span className="pagination__meta">
                Стр. {currentPage} из {pagination?.total_pages ?? '—'} (всего {pagination?.total_count ?? '—'})
              </span>
              <div className="pagination__pages" aria-label="Список страниц">
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`button button--ghost button--compact pagination__page ${pageNumber === currentPage ? 'pagination__page--active' : ''}`}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="button button--ghost button--compact"
                disabled={!pagination?.has_next}
                onClick={() => setPage((prev) => prev + 1)}
                aria-label="Следующая страница"
              >
                ›
              </button>
              <button
                type="button"
                className="button button--ghost button--compact"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Последняя страница"
              >
                »
              </button>
              <select
                className="chip-select"
                value={pageSize}
                onChange={(e) => {
                  setPage(1)
                  setPageSize(Number(e.target.value))
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
