import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Article } from '../../shared/types'
import { Badge } from '../../shared/components/Badge'
import { api } from '../../api/client'

// No props; component loads data from API only

interface WithdrawResponse {
  id: number
  status: string
  message: string
}

const getActionLabel = (status: Article['status'] | 'send_for_revision' | 'sent_for_revision') => {
  switch (status) {
    case 'in_review':
      return 'Смотреть'
    case 'revisions':
      return 'Скачать рецензию'
    case 'send_for_revision':
    case 'sent_for_revision':
      return 'Отправлено на доработку'
    case 'accepted':
      return 'PDF'
    default:
      return 'Подробнее'
  }
}

export function AuthorSubmissions() {
  const [statusFilter, setStatusFilter] = useState<'all' | Article['status']>('all')
  const [yearFilter, setYearFilter] = useState<'all' | string>('all')
  const [query, setQuery] = useState('')
  // Language switcher removed per request; default language handled on details page
  const [apiArticles, setApiArticles] = useState<Article[]>([])
  const [revokeId, setRevokeId] = useState<number | null>(null)
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  useEffect(() => {
    api
      .get<any[]>('/articles/my')
      .then((data) => {
        const mapped = data.map((item) => ({
          id: item.id,
          title: item.title_ru ?? item.title_en ?? item.title_kz ?? '',
          status: item.status as Article['status'],
          submittedAt: item.created_at,
          editorId: undefined,
        })) as Article[]

        setApiArticles(mapped)
      })
      .catch((error) => {
        console.error('Ошибка при загрузке /articles/my', error)
      })
  }, [])

  const allArticles = useMemo(
    () => [...apiArticles],
    [apiArticles],
  )

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          allArticles
            .map((a) => new Date(a.submittedAt).getFullYear())
            .filter((year) => !Number.isNaN(year)),
        ),
      )
        .sort((a, b) => b - a)
        .map(String),
    [allArticles],
  )

  const filtered = useMemo(
    () =>
      allArticles.filter((article) => {
        const matchesStatus = statusFilter === 'all' || article.status === statusFilter
        const matchesYear = yearFilter === 'all' || new Date(article.submittedAt).getFullYear().toString() === yearFilter
        const matchesQuery = article.title.toLowerCase().includes(query.trim().toLowerCase())
        return matchesStatus && matchesYear && matchesQuery
      }),
    [allArticles, statusFilter, yearFilter, query],
  )

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Автор</p>
          <h1 className="page-title">Мои статьи</h1>
          <p className="subtitle">Быстрый обзор статусов рукописей и действий по ним.</p>
        </div>
        <Link className="button button--primary" to="/cabinet/submission">
          Подать статью
        </Link>
      </section>

      <section className="section">
        <div className="panel">
          <div className="filters">
            <div className="filter-group">
              <label className="filter-label">Статус</label>
              <select
                className="chip-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">Все</option>
                <option value="in_review">На рецензии</option>
                <option value="revisions">Правки</option>
                <option value="accepted">Принято</option>
                <option value="submitted">Отправлено</option>
                <option value="draft">Черновик</option>
                <option value="rejected">Отклонено</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Год</label>
              <select
                className="chip-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value as typeof yearFilter)}
              >
                <option value="all">Все</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-group--wide">
              <label className="filter-label">Поиск</label>
              <input
                className="search"
                placeholder="Название статьи"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table">
            <div className="table__head">
              <span>Название статьи</span>
              <span>Статус</span>
              <span>Дата</span>
              <span>Действия</span>
            </div>
            <div className="table__body">
              {filtered.map((article) => (
                <div className="table__row" key={article.id}>
                  <div className="table__cell table__cell--title">
                    <div className="table__title">{article.title}</div>
                    <div className="table__meta">
                      {'Редактор не назначен'}
                    </div>
                  </div>
                  <div className="table__cell">
                    <Badge status={article.status} />
                  </div>
                  <div className="table__cell">
                    {new Date(article.submittedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div className="table__cell">
                    <div className="pill-list">
                      <Link
                        className="button button--ghost button--compact"
                        to={`/cabinet/my-articles/${article.id}`}
                      >
                        {getActionLabel(article.status)}
                      </Link>
                      {article.status === 'submitted' && (
                        <button
                          type="button"
                          className="button button--danger button--compact"
                          onClick={() => setRevokeId(Number(article.id))}
                        >
                          Отозвать
                        </button>
                      )}
                      {(['withdrawn','revisions'].includes(article.status) || (article.status as any) === 'send_for_revision' || (article.status as any) === 'sent_for_revision') && (
                        <Link
                          className="button button--primary button--compact"
                          to={`/cabinet/my-articles/${article.id}`}
                        >
                          Редактировать и отправить
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 ? <div className="table__empty">Ничего не найдено по выбранным фильтрам.</div> : null}
            </div>
          </div>
        </div>
      </section>
      {revokeId !== null && (
        <div
          className="modal-backdrop"
          onClick={() => setRevokeId(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <p className="eyebrow">Подтверждение действия</p>
              <h3 className="panel-title">Отозвать статью?</h3>
            </div>
            <div className="modal__body">
              <p className="subtitle">
                Вы уверены, что хотите отозвать выбранную статью? После отзыва редакция приостановит рассмотрение
                рукописи.
              </p>
              {revokeMessage && <div className="alert alert--info">{revokeMessage}</div>}
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setRevokeId(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="button button--danger"
                disabled={revokeLoading}
                onClick={async () => {
                  if (revokeId == null) return
                  try {
                    setRevokeLoading(true)
                    setRevokeMessage(null)
                    const res = await api.post<WithdrawResponse>(`/articles/${revokeId}/withdraw`)
                    setRevokeMessage(res.message || 'Статья была успешно отозвана.')
                    // обновим статус в локальном списке apiArticles
                    setApiArticles((prev) =>
                      prev.map((a) =>
                        Number(a.id) === res.id
                          ? { ...a, status: res.status as Article['status'] }
                          : a,
                      ),
                    )
                    setTimeout(() => {
                      setRevokeId(null)
                    }, 1500)
                  } catch (e) {
                    console.error('Ошибка при отзыве статьи', e)
                    setRevokeMessage('Не удалось отозвать статью. Попробуйте позже.')
                  } finally {
                    setRevokeLoading(false)
                  }
                }}
              >
                {revokeLoading ? 'Отзываем…' : 'Отозвать статью'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
