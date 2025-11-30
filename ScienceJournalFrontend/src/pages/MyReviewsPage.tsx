import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ReviewItem } from '../shared/types'
import { Badge } from '../shared/components/Badge'

function formatDate(dt?: string | null) {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  } catch {
    return '—'
  }
}

export default function MyReviewsPage() {
  const [data, setData] = useState<ReviewItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    api
      .getMyReviews<ReviewItem[]>()
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
  }, [])

  const rows = useMemo(() => data ?? [], [data])

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
          <div className="table">
            <div className="table__head">
              <span>Статья</span>
              <span>Дедлайн</span>
              <span>Статус</span>
            </div>
            <div className="table__body">
              {rows.map((r) => (
                <div className="table__row table__row--align" key={r.id}>
                  <div className="table__cell table__cell--title">
                    <div className="table__title">
                      <Link to={`/cabinet/reviews/${r.id}`}>
                        {(r as any).article_title || (r as any).articleTitle || `Статья #${r.article_id}`}
                      </Link>
                    </div>
                    <div className="table__meta">Рецензия #{r.id}</div>
                  </div>
                  <div className="table__cell">{formatDate(r.deadline)}</div>
                  <div className="table__cell">
                    <Badge status={r.status as any} />
                  </div>
                </div>
              ))}
              {rows.length === 0 ? <div className="table__empty">Рецензий пока нет.</div> : null}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <Link className="button button--ghost" to="/cabinet">Назад в кабинет</Link>
      </div>
    </div>
  )
}
