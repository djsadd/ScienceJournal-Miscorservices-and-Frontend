import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ReviewItem, ReviewListResponse } from '../shared/types'
import { Badge } from '../shared/components/Badge'

const DEFAULT_PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

function formatDate(dt?: string | null) {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  } catch {
    return '—'
  }
}

export default function MyReviewsPage() {
  const [data, setData] = useState<ReviewListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    api
      .getMyReviews<ReviewListResponse>({ page, page_size: pageSize })
      .then((res) => {
        if (!mounted) return
        setData(res)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        if (e instanceof ApiError) {
          console.error('MyReviews error', { status: e.status, url: e.url, bodyText: e.bodyText, bodyJson: e.bodyJson })
          let detail: string | null = null
          if (e.bodyJson && typeof e.bodyJson === 'object') {
            const j: any = e.bodyJson
            if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
            else if (j.message) detail = String(j.message)
          }
          setError(detail ? `Ошибка ${e.status}: ${detail}` : `Ошибка ${e.status}`)
        } else {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки')
        }
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [page, pageSize])

  const rows = useMemo(() => data?.items ?? [], [data])
  const pagination = data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = Math.max(1, pagination?.total_pages ?? 1)
  const windowStart = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2))
  const windowEnd = Math.min(totalPages, windowStart + MAX_VISIBLE_PAGES - 1)
  const visibleStart = Math.max(1, windowEnd - MAX_VISIBLE_PAGES + 1)
  const visiblePages = Array.from({ length: windowEnd - visibleStart + 1 }, (_, index) => visibleStart + index)

  const getReviewTitle = (review: ReviewItem) =>
    review.article_title?.trim() || `Статья #${review.article_id}`

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Рецензент</p>
          <h1 className="page-title">Мои рецензии</h1>
          <p className="subtitle">Список ваших рецензий с дедлайнами и статусами.</p>
        </div>
        <div className="pill pill--ghost">Роль: Reviewer</div>
      </section>

      <div className="panel">
        {loading ? (
          <div className="table__empty">Загрузка…</div>
        ) : error ? (
          <div className="table__empty">{error}</div>
        ) : (
          <>
            <div className="table">
              <div className="table__head">
                <span>Название статьи</span>
                <span>Дедлайн</span>
                <span>Статус</span>
              </div>
              <div className="table__body">
                {rows.map((review) => (
                  <div className="table__row table__row--align" key={review.id}>
                    <div className="table__cell table__cell--title">
                      <div className="table__title">
                        <Link to={`/cabinet/reviews/${review.id}`}>{getReviewTitle(review)}</Link>
                      </div>
                      <div className="table__meta">
                        Рецензия #{review.id} • Статья #{review.article_id}
                      </div>
                    </div>
                    <div className="table__cell">{formatDate(review.deadline)}</div>
                    <div className="table__cell">
                      <Badge status={review.status as any} />
                    </div>
                  </div>
                ))}
                {rows.length === 0 ? <div className="table__empty">Рецензий пока нет.</div> : null}
              </div>
            </div>

            {pagination && pagination.total_count > 0 ? (
              <div className="table__footer">
                <div className="pagination">
                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    disabled={!pagination.has_prev}
                    onClick={() => setPage(1)}
                    aria-label="Первая страница"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    disabled={!pagination.has_prev}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    aria-label="Предыдущая страница"
                  >
                    ‹
                  </button>
                  <span className="pagination__meta">
                    Стр. {currentPage} из {pagination.total_pages || 1} (всего {pagination.total_count})
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
                    disabled={!pagination.has_next}
                    onClick={() => setPage((prev) => prev + 1)}
                    aria-label="Следующая страница"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    disabled={!pagination.has_next}
                    onClick={() => setPage(totalPages)}
                    aria-label="Последняя страница"
                  >
                    »
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <Link className="button button--ghost" to="/cabinet">Назад в кабинет</Link>
      </div>
    </div>
  )
}
