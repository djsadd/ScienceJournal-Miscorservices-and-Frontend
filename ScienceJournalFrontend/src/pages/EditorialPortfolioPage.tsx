import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Article, PagedResponse } from '../shared/types'
import { formatArticleStatus } from '../shared/labels'

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

const keyOf = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

const memoryCache = new Map<string, { at: number; data: PagedResponse<Article> }>()

const STATUS_OPTIONS = [
  'draft',
  'submitted',
  'under_review',
  'in_review',
  'editor_check',
  'reviewer_check',
  'revisions',
  'accepted',
  'rejected',
  'published',
  'withdrawn',
] as const

export default function EditorialPortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ status: undefined })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PagedResponse<Article> | null>(null)

  const params = useMemo(
    () => ({
      ...filters,
      year: filters.year === '' ? undefined : filters.year,
      article_type: filters.article_type === '' ? undefined : filters.article_type,
      // When "Все статусы" selected (empty string), send explicit status=all
      status: !filters.status ? 'all' : filters.status,
      page,
      page_size: pageSize,
    }),
    [filters, page, pageSize]
  )

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      const cacheKey = keyOf(params)
      const cached = memoryCache.get(cacheKey)
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setData(cached.data)
        // Debug: log cached response to console
        try { console.log('[EditorialPortfolio] Using cached data. Params:', params, 'Data:', cached.data) } catch {}
        setLoading(false)
        return
      }
      try {
        // Debug: log request params
        try { console.log('[EditorialPortfolio] Fetching with params:', params) } catch {}
        const res = await api.getUnassignedArticles<PagedResponse<Article>>(params)
        if (!cancelled) {
          setData(res)
          memoryCache.set(cacheKey, { at: Date.now(), data: res })
        }
        // Debug: log fresh response
        try { console.log('[EditorialPortfolio] API response:', res) } catch {}
      } catch (e: any) {
        const message = e?.bodyJson?.detail || e?.message || 'Failed to load'
        if (!cancelled) setError(String(message))
        try { console.error('[EditorialPortfolio] API error:', e) } catch {}
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const t = setTimeout(run, params.search ? 350 : 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [params])

  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPage(1)
    setFilters((f) => ({ ...f, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
    setPageSize(DEFAULT_PAGE_SIZE)
  }

  return (
    <div className="app-container">
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
              <input className="search" name="author_name" value={filters.author_name ?? ''} onChange={onInput} placeholder="Автор" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Поиск</label>
              <input className="search" name="search" value={filters.search ?? ''} onChange={onInput} placeholder="Заголовок/аннотация" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Ключевые слова</label>
              <input className="search" name="keywords" value={filters.keywords ?? ''} onChange={onInput} placeholder="Ключевые слова" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Год</label>
              <input className="search" name="year" type="number" value={filters.year ?? ''} onChange={onInput} placeholder="Год" />
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
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{formatArticleStatus(s, 'ru')}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <button className="button button--ghost button--compact" onClick={clearFilters}>Сбросить</button>
            </div>
          </div>

          {error && <div className="alert error">Ошибка: {error}</div>}
          {loading && <div className="loading">Загрузка...</div>}

          <div className="table table--portfolio">
            <div className="table__head">
              <span>Название</span>
              <span>Тип</span>
              <span>Статус</span>
              <span>Авторы</span>
              <span>Файлы</span>
            </div>
            <div className="table__body">
              {data?.items.map((a) => (
                <div className="table__row" key={a.id}>
                  <div className="table__cell table__cell--title">
                    <div className="table__title">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                    <div className="table__meta">DOI: {a.doi || '—'}</div>
                  </div>
                  <div className="table__cell">{a.article_type}</div>
                  <div className="table__cell">{formatArticleStatus(a.status, 'ru')}</div>
                  <div className="table__cell">{a.authors.map((x) => `${x.last_name} ${x.first_name}`).join(', ') || '—'}</div>
                  <div className="table__cell table__cell--actions">
                    <div className="actions">
                      <a className="button button--primary button--compact" href={`/cabinet/editorial2/${String(a.id)}`}>Посмотреть</a>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && data && data.items.length === 0 && <div className="table__empty">Нет результатов</div>}
            </div>
          </div>

          <div className="table__footer">
            <div className="pagination">
              <button
                className="button button--ghost button--compact"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <span className="pagination__meta">
                Стр. {data?.pagination.page ?? page} из {data?.pagination.total_pages ?? '—'} (всего {data?.pagination.total_count ?? '—'})
              </span>
              <button
                className="button button--ghost button--compact"
                disabled={!data?.pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперед
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
