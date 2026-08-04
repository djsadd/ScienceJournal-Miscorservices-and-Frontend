import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { toApiFilesUrl } from '../shared/url'
import type { Volume, Article } from '../shared/types'
import { useLanguage } from '../shared/LanguageContext'

const compact = (value?: string | null) => (value || '').trim()

const pickLocalized = (lang: 'ru' | 'en' | 'kz', ru?: string | null, en?: string | null, kz?: string | null) => {
  const value = lang === 'ru' ? ru : lang === 'en' ? en : kz
  return compact(value)
}

const toDoiUrl = (doi?: string | null) => {
  const raw = compact(doi)
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://doi.org/${raw.replace(/^doi:\s*/i, '')}`
}

export default function PublicVolumeDetailPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'архив номеров',
      loading: 'Загрузка...',
      error: 'Ошибка',
      home: 'Главная',
      archive: 'Архив',
      volumeCrumb: (year: number, vol: string, issue?: number | null) => `${year}, Том ${vol}${issue ? `, Номер ${issue}` : ''}`,
      completeIssue: 'Полный выпуск',
      coverFile: 'Обложка',
      contentsFile: 'Содержание',
      tableTitle: 'Статьи в томе',
      th: { title: 'Название', authors: 'Авторы', layout: 'Верстка' },
      untitled: 'Без заголовка',
      loadingLayout: 'Загрузка...',
      noLayout: 'Нет верстки',
      downloadPdf: 'Открыть PDF',
      doi: (d?: string | null) => `DOI: ${d || '-'}`,
      loadError: 'Не удалось загрузить том',
    },
    en: {
      eyebrow: 'archive of issues',
      loading: 'Loading...',
      error: 'Error',
      home: 'Home',
      archive: 'Archive',
      volumeCrumb: (year: number, vol: string, issue?: number | null) => `${year}, Volume ${vol}${issue ? `, Issue ${issue}` : ''}`,
      completeIssue: 'Complete issue',
      coverFile: 'Cover',
      contentsFile: 'Contents',
      tableTitle: 'Articles in this volume',
      th: { title: 'Title', authors: 'Authors', layout: 'Layout' },
      untitled: 'Untitled',
      loadingLayout: 'Loading...',
      noLayout: 'No layout',
      downloadPdf: 'View PDF',
      doi: (d?: string | null) => `DOI: ${d || '-'}`,
      loadError: 'Failed to load volume',
    },
    kz: {
      eyebrow: 'шығарылымдар мұрағаты',
      loading: 'Жүктелуде...',
      error: 'Қате',
      home: 'Басты бет',
      archive: 'Мұрағат',
      volumeCrumb: (year: number, vol: string, issue?: number | null) => `${year}, Том ${vol}${issue ? `, Нөмір ${issue}` : ''}`,
      completeIssue: 'Толық нөмір',
      coverFile: 'Мұқаба',
      contentsFile: 'Мазмұны',
      tableTitle: 'Бұл томдағы мақалалар',
      th: { title: 'Атауы', authors: 'Авторлар', layout: 'Беттеу' },
      untitled: 'Атаусыз',
      loadingLayout: 'Жүктелуде...',
      noLayout: 'Беттеу жоқ',
      downloadPdf: 'PDF ашу',
      doi: (d?: string | null) => `DOI: ${d || '-'}`,
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

  const fileHref = (raw?: string | null) => toApiFilesUrl(raw) || null

  const volumeCrumbLabel =
    volume && volume.number && volume.year ? t.volumeCrumb(volume.year, String(volume.number), volume.month) : ''

  const completeIssueHref = fileHref(
    (volume as any)?.complete_issue_file_url ||
      (volume as any)?.complete_issue_url ||
      (volume as any)?.issue_file_url ||
      (volume as any)?.full_issue_file_url ||
      (volume as any)?.full_journal_file_url ||
      null,
  )

  const coverFileHref = fileHref(
    (volume as any)?.cover_file_url ||
      (volume as any)?.cover_url ||
      (volume as any)?.issue_cover_file_url ||
      null,
  )

  const contentsFileHref = fileHref(
    (volume as any)?.contents_file_url ||
      (volume as any)?.contents_url ||
      (volume as any)?.table_of_contents_file_url ||
      null,
  )

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
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link className="breadcrumbs__link" to="/">{t.home}</Link>
          <span className="breadcrumbs__sep">/</span>
          <Link className="breadcrumbs__link" to="/archive">{t.archive}</Link>
          {volumeCrumbLabel ? (
            <>
              <span className="breadcrumbs__sep">/</span>
              <span className="breadcrumbs__current">{volumeCrumbLabel}</span>
            </>
          ) : null}
        </nav>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}

        {volume && (
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {completeIssueHref ? (
                <a className="button button--primary" href={completeIssueHref} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 18, height: 18 }}>
                    <path
                      fill="currentColor"
                      d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h5v2H7v10h10v-3h2v5H5V5Z"
                    />
                  </svg>
                  {t.completeIssue}
                </a>
              ) : null}
              {coverFileHref ? (
                <a className="button button--ghost button--compact" href={coverFileHref} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 16, height: 16 }}>
                    <path
                      fill="currentColor"
                      d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h5v2H7v10h10v-3h2v5H5V5Z"
                    />
                  </svg>
                  {t.coverFile}
                </a>
              ) : null}
              {contentsFileHref ? (
                <a className="button button--ghost button--compact" href={contentsFileHref} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 16, height: 16 }}>
                    <path
                      fill="currentColor"
                      d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h5v2H7v10h10v-3h2v5H5V5Z"
                    />
                  </svg>
                  {t.contentsFile}
                </a>
              ) : null}
            </div>
            {volume.description ? <p className="article-abstract" style={{ marginTop: '0.75rem', textAlign: 'justify' }}>{volume.description}</p> : null}
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
                        {pickLocalized(lang, a.title_ru, a.title_en, a.title_kz) ||
                          compact((a as any).title_ru) ||
                          compact((a as any).title_en) ||
                          compact((a as any).title_kz) ||
                          compact((a as any).title) ||
                          t.untitled}
                      </Link>
                    </div>
                    <div className="latest-table__meta">
                      {(() => {
                        const href = toDoiUrl(a.doi)
                        if (!href) return <span>{t.doi(null)}</span>
                        return (
                          <a className="public-article__doi-link" href={href} target="_blank" rel="noreferrer">
                            {t.doi(a.doi)}
                          </a>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="latest-table__cell">
                    {Array.isArray(a.authors)
                      ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ')
                      : '-'}
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
                        <a
                          className="button button--ghost button--compact"
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 16, height: 16 }}>
                            <path
                              fill="currentColor"
                              d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h5v2H7v10h10v-3h2v5H5V5Z"
                            />
                          </svg>
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

