import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import { toApiFilesUrl } from '../shared/url'

export default function VolumeDetailPage() {
  const { id } = useParams()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [movingArticleId, setMovingArticleId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!id) throw new Error('Missing id')
        const data = await api.getVolumeById<Volume>(id)
        if (!cancelled) setVolume(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || 'Не удалось загрузить том')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [id])

  const moveArticle = async (articleId: string, direction: 'up' | 'down') => {
    if (!id) return
    setMovingArticleId(articleId)
    setError(null)
    try {
      const updated = await api.reorderVolumeArticle<Volume>(id, articleId, direction)
      setVolume(updated)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Не удалось изменить порядок статей')
    } finally {
      setMovingArticleId(null)
    }
  }

  const articles = volume?.articles || []

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Том {volume ? `${volume.number} / ${volume.year}` : ''}</h1>
          {volume?.month ? <p className="subtitle">Месяц: {volume.month}</p> : null}
        </div>
        <div className="section-actions">
          <Link className="button button--ghost" to="/cabinet/volumes">← Назад к томам</Link>
          {volume && (
            <Link className="button" to={`/cabinet/volumes/${volume.id}/edit`}>Редактировать том</Link>
          )}
        </div>
      </section>

      <section className="section">
        <div className="panel">
          {loading && <div className="loading">Загрузка...</div>}
          {error && <div className="alert error">Ошибка: {error}</div>}
          {volume && (
            <div className="submission-card">
              <div className="submission-card__top">
                <div>
                  <div className="panel-title">Том {volume.number} / {volume.year}{volume.month ? ` (${volume.month} мес.)` : ''}</div>
                  {(volume.title_ru || volume.title_en || volume.title_kz) && (
                    <div className="meta-label">{volume.title_ru}{volume.title_en ? ` | ${volume.title_en}` : ''}{volume.title_kz ? ` | ${volume.title_kz}` : ''}</div>
                  )}
                </div>
                <span className={`badge ${volume.is_active ? 'badge--success' : 'badge--muted'}`}>{volume.is_active ? 'Активен' : 'Неактивен'}</span>
              </div>
              {volume.description && <p className="article-abstract">{volume.description}</p>}
              <div className="article-footer">
                <span className="meta-label">Статей: {articles.length}</span>
              </div>
            </div>
          )}
        </div>

        {articles.length > 0 && (
          <div className="panel">
            <div className="latest-table__title">Статьи в томе</div>
            <div className="latest-table__head" style={{ gridTemplateColumns: '88px minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) 170px 150px' }}>
              <span>Порядок</span>
              <span>Название</span>
              <span>Тип</span>
              <span>Авторы</span>
              <span>Файл</span>
              <span>Действия</span>
            </div>
            <div className="latest-table__body">
              {articles.map((article: Article, index) => {
                const downloadSrc = article.layout_file_url ?? article.manuscript_file_url
                const isMoving = movingArticleId === String(article.id)
                return (
                  <div
                    className="latest-table__row"
                    key={String(article.id)}
                    style={{ gridTemplateColumns: '88px minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) 170px 150px' }}
                  >
                    <div className="latest-table__cell">
                      <strong>{article.sort_order ?? index + 1}</strong>
                    </div>
                    <div className="latest-table__cell latest-table__cell--title">
                      <div className="latest-table__name">{article.title_ru || article.title_en || article.title_kz || 'Без заголовка'}</div>
                      <div className="latest-table__meta">DOI: {article.doi || '—'}</div>
                    </div>
                    <div className="latest-table__cell">{article.article_type || '—'}</div>
                    <div className="latest-table__cell">
                      {Array.isArray(article.authors) ? article.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}
                    </div>
                    <div className="latest-table__cell">
                      {downloadSrc ? (
                        <a className="button button--ghost button--compact" href={toApiFilesUrl(downloadSrc)} target="_blank" rel="noreferrer">
                          PDF
                        </a>
                      ) : (
                        <span className="meta-label">Нет файла</span>
                      )}
                    </div>
                    <div className="latest-table__cell" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="button button--ghost button--compact"
                        type="button"
                        onClick={() => moveArticle(String(article.id), 'up')}
                        disabled={isMoving || index === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="button button--ghost button--compact"
                        type="button"
                        onClick={() => moveArticle(String(article.id), 'down')}
                        disabled={isMoving || index === articles.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
