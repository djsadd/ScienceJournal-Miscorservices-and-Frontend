import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { toApiFilesUrl } from '../shared/url'
import type { Volume, Article } from '../shared/types'

export default function PublicVolumeDetailPage() {
  const { id } = useParams()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Layout records map: articleId -> records
  type LayoutRecordOut = {
    id: string
    article_id?: number | null
    volume_id?: number | null
    file_id?: string | null
    file_url?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  const [layoutByArticle, setLayoutByArticle] = useState<Record<number, LayoutRecordOut[]>>({})
  const [layoutLoading, setLayoutLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!id) throw new Error('Missing id')
        const data = (await api.getPublicVolumeById(id)) as Volume
        if (!cancelled) setVolume(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || 'Не удалось загрузить том')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

  // Fetch layout records for all articles in the volume (best-effort, optional)
  useEffect(() => {
    const articles = volume?.articles || []
    if (!articles || articles.length === 0) return
    let cancelled = false
    const load = async () => {
      setLayoutLoading(true)
      try {
        const map: Record<number, LayoutRecordOut[]> = {}
        await Promise.all(
          articles.map(async (a) => {
            const aid = Number((a as any).id)
            if (!Number.isFinite(aid)) return
            try {
              const recs = (await api.getLayoutRecordsByArticle(aid)) as unknown as LayoutRecordOut[]
              map[aid] = Array.isArray(recs) ? recs : []
            } catch {
              map[aid] = []
            }
          })
        )
        if (!cancelled) setLayoutByArticle(map)
      } finally {
        if (!cancelled) setLayoutLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [volume?.articles])

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">архив номеров</p>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h1 className="hero__title">{volume ? `Том ${volume.number} / ${volume.year}` : 'Том'}</h1>
          <Link className="button button--ghost" to="/archive">← Назад к архиву</Link>
        </div>

        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="alert error">Ошибка: {error}</div>}

        {volume && (
          <div className="panel" style={{ marginBottom: '1rem' }}>
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
              <span className="meta-label">Статей: {volume.articles?.length ?? 0}</span>
            </div>
          </div>
        )}

        {volume?.articles && volume.articles.length > 0 && (
          <div className="panel">
            <div className="latest-table__title">Статьи в томе</div>
            <div className="latest-table__head">
              <span>Название</span>
              <span>Тип</span>
              <span>Авторы</span>
              <span>Файл</span>
              <span>Вёрстка</span>
            </div>
            <div className="latest-table__body">
              {volume.articles.map((a: Article) => (
                <div className="latest-table__row" key={String(a.id)}>
                  <div className="latest-table__cell latest-table__cell--title">
                    <div className="latest-table__name">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                    <div className="latest-table__meta">DOI: {a.doi || '—'}</div>
                  </div>
                  <div className="latest-table__cell">{a.article_type || '—'}</div>
                  <div className="latest-table__cell">{Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}</div>
                  <div className="latest-table__cell">
                    {a.manuscript_file_url ? (
                      <a className="button button--ghost button--compact" href={toApiFilesUrl(a.manuscript_file_url)} target="_blank" rel="noreferrer">Скачать PDF</a>
                    ) : (
                      <span className="meta-label">Нет файла</span>
                    )}
                  </div>
                  <div className="latest-table__cell">
                    {(() => {
                      const aid = Number((a as any).id)
                      const recs = Number.isFinite(aid) ? layoutByArticle[aid] || [] : []
                      if (layoutLoading && recs.length === 0) return <span className="meta-label">Загрузка…</span>
                      if (recs.length === 0) return <span className="meta-label">Нет вёрстки</span>
                      const first = recs[0]
                      const href = toApiFilesUrl(first.file_url || (first.file_id ? `/files/${first.file_id}/download` : undefined)) || '#'
                      return (
                        <a className="button button--ghost button--compact" href={href} target="_blank" rel="noreferrer">Скачать вёрстку</a>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
