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
      th: { title: 'Название', authors: 'Авторы', layout: 'Верстка' },
      untitled: 'Без заголовка',
      loadingLayout: 'Загрузка…',
      noLayout: 'Нет верстки',
      downloadPdf: 'Скачать PDF',
      volumeLabel: (v: Volume) => `Том ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Том ${v.number} / ${v.year}${v.month ? ` (${v.month} мес.)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
      loadError: 'Не удалось загрузить том',
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
      th: { title: 'Title', authors: 'Authors', layout: 'Layout' },
      untitled: 'Untitled',
      loadingLayout: 'Loading…',
      noLayout: 'No layout',
      downloadPdf: 'Download PDF',
      volumeLabel: (v: Volume) => `Volume ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Volume ${v.number} / ${v.year}${v.month ? ` (${v.month} mo.)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
      loadError: 'Failed to load volume',
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
      th: { title: 'Атауы', authors: 'Авторлар', layout: 'Беттеу' },
      untitled: 'Атаусыз',
      loadingLayout: 'Жүктелуде…',
      noLayout: 'Беттеу жоқ',
      downloadPdf: 'PDF жүктеу',
      volumeLabel: (v: Volume) => `Том ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Том ${v.number} / ${v.year}${v.month ? ` (${v.month} ай)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
      loadError: 'Томды жүктеу сәтсіз аяқталды',
    },
  }[lang]

  const { id } = useParams()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || t.loadError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

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
                  <div className="meta-label">
                    {volume.title_ru}
                    {volume.title_en ? ` | ${volume.title_en}` : ''}
                    {volume.title_kz ? ` | ${volume.title_kz}` : ''}
                  </div>
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
              <span>{t.th.authors}</span>
              <span>{t.th.layout}</span>
            </div>
            <div className="latest-table__body">
              {volume.articles.map((a: Article) => (
                <div className="latest-table__row" key={String((a as any).id ?? a.id)}>
                  <div className="latest-table__cell latest-table__cell--title">
                    <div className="latest-table__name">
                      <Link
                        to={id ? `/archive/volumes/${id}/articles/${String((a as any).id)}` : '#'}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {a.title_ru || a.title_en || a.title_kz || t.untitled}
                      </Link>
                    </div>
                    <div className="latest-table__meta">{t.doi(a.doi)}</div>
                  </div>
                  <div className="latest-table__cell">
                    {Array.isArray(a.authors)
                      ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ')
                      : '—'}
                  </div>
                  <div className="latest-table__cell">
                    {(() => {
                      const aid = Number((a as any).id)
                      const recs = Number.isFinite(aid) ? layoutByArticle[aid] || [] : []
                      if (layoutLoading && recs.length === 0) return <span className="meta-label">{t.loadingLayout}</span>
                      if (recs.length === 0) return <span className="meta-label">{t.noLayout}</span>
                      const sorted = [...recs].sort((l, r) => {
                        const lt = Date.parse(String(l.updated_at || l.created_at || '')) || 0
                        const rt = Date.parse(String(r.updated_at || r.created_at || '')) || 0
                        return rt - lt
                      })
                      const first = sorted[0]
                      const href = toApiFilesUrl(first?.file_url || (first?.file_id ? `/files/${first.file_id}/download` : undefined)) || '#'
                      return (
                        <a className="button button--ghost button--compact" href={href} target="_blank" rel="noreferrer">
                          {t.downloadPdf}
                        </a>
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

