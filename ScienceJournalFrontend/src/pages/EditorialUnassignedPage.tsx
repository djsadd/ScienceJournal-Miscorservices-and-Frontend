import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Article, PagedResponse } from '../shared/types'
import './EditorialUnassignedPage.css'
import { formatArticleStatus } from '../shared/labels'

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

export default function EditorialUnassignedPage() {
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
        setLoading(false)
        return
      }
      try {
        const res = await api.getUnassignedArticles<PagedResponse<Article>>(params)
        if (!cancelled) {
          setData(res)
          memoryCache.set(cacheKey, { at: Date.now(), data: res })
        }
      } catch (e: any) {
        const message = e?.bodyJson?.detail || e?.message || 'Failed to load'
        if (!cancelled) setError(String(message))
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
    <div className="container">
      <h1>Неназначенные статьи</h1>

      <div className="filters">
        <input name="author_name" value={filters.author_name ?? ''} onChange={onInput} placeholder="Автор" />
        <input name="search" value={filters.search ?? ''} onChange={onInput} placeholder="Поиск (заголовок/аннотация)" />
        <input name="keywords" value={filters.keywords ?? ''} onChange={onInput} placeholder="Ключевые слова" />
        <input name="year" type="number" value={filters.year ?? ''} onChange={onInput} placeholder="Год" />
        <select name="article_type" value={filters.article_type ?? ''} onChange={onInput}>
          <option value="">Тип статьи</option>
          <option value="original">original</option>
          <option value="review">review</option>
        </select>
        <select name="status" value={filters.status ?? ''} onChange={onInput}>
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{formatArticleStatus(s, 'ru')}</option>
          ))}
        </select>
        <button onClick={clearFilters}>Сбросить</button>
      </div>

      {error && <div className="alert error">Ошибка: {error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      <div className="list">
        {data?.items.map((a) => (
          <div className="card" key={a.id}>
            <div className="card-head">
              <div className="titles">
                <div className="title">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                <div className="subtitle">DOI: {a.doi || '—'} | Тип: {a.article_type} | Статус: {formatArticleStatus(a.status, 'ru')}</div>
              </div>
              <div className="actions">
                <a href={a.manuscript_file_url || '#'} target="_blank" rel="noreferrer">Рукопись</a>
                {a.antiplagiarism_file_url && (
                  <a href={a.antiplagiarism_file_url} target="_blank" rel="noreferrer">Антиплагиат</a>
                )}
                {a.author_info_file_url && (
                  <a href={a.author_info_file_url} target="_blank" rel="noreferrer">Автор инфо</a>
                )}
                {a.cover_letter_file_url && (
                  <a href={a.cover_letter_file_url} target="_blank" rel="noreferrer">Письмо</a>
                )}
              </div>
            </div>
            <div className="abstract">{a.abstract_ru || a.abstract_en || a.abstract_kz || 'Нет аннотации'}</div>
            <div className="meta">
              <div>
                Авторы: {a.authors.map((x) => `${x.last_name} ${x.first_name}`).join(', ') || '—'}
              </div>
              <div>
                Ключевые слова: {(a.keywords ?? []).map((k) => k.title_ru || k.title_en || k.title_kz).join(', ') || '—'}
              </div>
              <div className="flags">
                <span>AI: {a.generative_ai_info || '—'}</span>
                <span>Plagiarism-free: {a.plagiarism_free ? 'Да' : 'Нет'}</span>
                <span>Authors agree: {a.authors_agree ? 'Да' : 'Нет'}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && data && data.items.length === 0 && <div className="empty">Нет результатов</div>}
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Назад</button>
        <span>
          Стр. {data?.pagination.page ?? page} из {data?.pagination.total_pages ?? '—'} (всего {data?.pagination.total_count ?? '—'})
        </span>
        <button disabled={!data?.pagination.has_next} onClick={() => setPage((p) => p + 1)}>Вперед</button>
        <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}> 
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  )
}
