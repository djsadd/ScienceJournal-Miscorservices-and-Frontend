import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { toApiFilesUrl } from '../shared/url'
import type { Volume, Article } from '../shared/types'
import { useLanguage } from '../shared/LanguageContext'

export default function PublicVolumeDetailPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'архив номеров',
      back: '← Назад к архиву',
      loading: 'Загрузка...',
      error: 'Ошибка',
      active: 'Активен',
      inactive: 'Неактивен',
      articlesCount: (n: number) => `Статей: ${n}`,
      tableTitle: 'Статьи в томе',
      th: { title: 'Название', type: 'Тип', authors: 'Авторы', file: 'Файл', layout: 'Вёрстка' },
      untitled: 'Без заголовка',
      noFile: 'Нет файла',
      loadingLayout: 'Загрузка…',
      noLayout: 'Нет вёрстки',
      downloadPdf: 'Скачать PDF',
      monthSuffix: (m?: number | null) => (m ? ` (${m} мес.)` : ''),
      volumeLabel: (v: Volume) => `Том ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Том ${v.number} / ${v.year}${v.month ? ` (${v.month} мес.)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
    },
    en: {
      eyebrow: 'archive of issues',
      back: '← Back to archive',
      loading: 'Loading...',
      error: 'Error',
      active: 'Active',
      inactive: 'Inactive',
      articlesCount: (n: number) => `Articles: ${n}`,
      tableTitle: 'Articles in this volume',
      th: { title: 'Title', type: 'Type', authors: 'Authors', file: 'File', layout: 'Layout' },
      untitled: 'Untitled',
      noFile: 'No file',
      loadingLayout: 'Loading…',
      noLayout: 'No layout',
      downloadPdf: 'Download PDF',
      monthSuffix: (m?: number | null) => (m ? ` (${m} mo.)` : ''),
      volumeLabel: (v: Volume) => `Volume ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Volume ${v.number} / ${v.year}${v.month ? ` (${v.month} mo.)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
    },
    kz: {
      eyebrow: 'шығарылымдар мұрағаты',
      back: '← Мұрағатқа қайту',
      loading: 'Жүктелуде...',
      error: 'Қате',
      active: 'Белсенді',
      inactive: 'Белсенді емес',
      articlesCount: (n: number) => `Мақалалар: ${n}`,
      tableTitle: 'Бұл томдағы мақалалар',
      th: { title: 'Атауы', type: 'Түрі', authors: 'Авторлар', file: 'Файл', layout: 'Беттеу' },
      untitled: 'Атаусыз',
      noFile: 'Файл жоқ',
      loadingLayout: 'Жүктелуде…',
      noLayout: 'Беттеу жоқ',
      downloadPdf: 'PDF жүктеу',
      monthSuffix: (m?: number | null) => (m ? ` (${m} ай)` : ''),
      volumeLabel: (v: Volume) => `Том ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Том ${v.number} / ${v.year}${v.month ? ` (${v.month} ай)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
    },
  }[lang]
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
        <p className="eyebrow">{t.eyebrow}</p>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h1 className="hero__title">{volume ? t.volumeLabel(volume) : '—'}</h1>
          <Link className="button button--ghost" to="/archive">{t.back}</Link>
        </div>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}

        {volume && (
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <div className="submission-card__top">
              <div>
                <div className="panel-title">{t.volumePanelTitle(volume)}</div>
                {(volume.title_ru || volume.title_en || volume.title_kz) && (
                  <div className="meta-label">{volume.title_ru}{volume.title_en ? ` | ${volume.title_en}` : ''}{volume.title_kz ? ` | ${volume.title_kz}` : ''}</div>
                )}
              </div>
              <span className={`badge ${volume.is_active ? 'badge--success' : 'badge--muted'}`}>{volume.is_active ? t.active : t.inactive}</span>
            </div>
            {volume.description && <p className="article-abstract">{volume.description}</p>}
            <div className="article-footer">
              <span className="meta-label">{t.articlesCount(volume.articles?.length ?? 0)}</span>
            </div>
          </div>
        )}

        {volume?.articles && volume.articles.length > 0 && (
          <div className="panel">
            <div className="latest-table__title">{t.tableTitle}</div>
            <div className="latest-table__head">
              <span>{t.th.title}</span>
              <span>{t.th.type}</span>
              <span>{t.th.authors}</span>
              <span>{t.th.file}</span>
              <span>{t.th.layout}</span>
            </div>
            <div className="latest-table__body">
              {volume.articles.map((a: Article) => (
                <div className="latest-table__row" key={String(a.id)}>
                  <div className="latest-table__cell latest-table__cell--title">
                    <div className="latest-table__name">{a.title_ru || a.title_en || a.title_kz || t.untitled}</div>
                    <div className="latest-table__meta">{t.doi(a.doi)}</div>
                  </div>
                  <div className="latest-table__cell">{a.article_type || '—'}</div>
                  <div className="latest-table__cell">{Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}</div>
                  <div className="latest-table__cell">
                    {a.manuscript_file_url ? null : (
                      <span className="meta-label">{t.noFile}</span>
                    )}
                  </div>
                  <div className="latest-table__cell">
                    {(() => {
                      const aid = Number((a as any).id)
                      const recs = Number.isFinite(aid) ? layoutByArticle[aid] || [] : []
                      if (layoutLoading && recs.length === 0) return <span className="meta-label">{t.loadingLayout}</span>
                      if (recs.length === 0) return <span className="meta-label">{t.noLayout}</span>
                      const first = recs[0]
                      const href = toApiFilesUrl(first.file_url || (first.file_id ? `/files/${first.file_id}/download` : undefined)) || '#'
                      return (
                        <a className="button button--ghost button--compact" href={href} target="_blank" rel="noreferrer">{t.downloadPdf}</a>
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
