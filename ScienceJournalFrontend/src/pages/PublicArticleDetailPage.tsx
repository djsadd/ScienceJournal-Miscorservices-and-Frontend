import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import { useLanguage } from '../shared/LanguageContext'
import { toApiFilesUrl } from '../shared/url'

type LayoutRecordOut = {
  id: string
  article_id?: number | null
  volume_id?: number | null
  file_id?: string | null
  file_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

const compact = (value?: string | null) => (value || '').trim()

const pickLocalized = (lang: 'ru' | 'en' | 'kz', ru?: string | null, en?: string | null, kz?: string | null) => {
  const value = lang === 'ru' ? ru : lang === 'en' ? en : kz
  return compact(value)
}

const formatAuthorName = (a: any) => {
  const last = compact(a?.last_name)
  const first = compact(a?.first_name)
  const patronymic = compact(a?.patronymic)
  return [last, first, patronymic].filter(Boolean).join(' ')
}

const extractAffiliations = (a: any) => {
  const values = [a?.affiliation1, a?.affiliation2, a?.affiliation3].map(compact).filter(Boolean)
  return Array.from(new Set(values))
}

export default function PublicArticleDetailPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'архив номеров',
      backToVolume: '← Назад к тому',
      loading: 'Загрузка...',
      error: 'Ошибка',
      notFound: 'Статья не найдена',
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
      type: 'Тип',
      authors: 'Авторы',
      affiliations: 'Аффиляции',
      abstract: 'Аннотация',
      keywords: 'Ключевые слова',
      layout: 'Верстка',
      noLayout: 'Нет верстки',
      downloadPdf: 'Скачать PDF',
      corresponding: 'Корреспондирующий',
      loadError: 'Не удалось загрузить том',
    },
    en: {
      eyebrow: 'archive of issues',
      backToVolume: '← Back to volume',
      loading: 'Loading...',
      error: 'Error',
      notFound: 'Article not found',
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
      type: 'Type',
      authors: 'Authors',
      affiliations: 'Affiliations',
      abstract: 'Abstract',
      keywords: 'Keywords',
      layout: 'Layout',
      noLayout: 'No layout',
      downloadPdf: 'Download PDF',
      corresponding: 'Corresponding',
      loadError: 'Failed to load volume',
    },
    kz: {
      eyebrow: 'шығарылымдар мұрағаты',
      backToVolume: '← Томға қайту',
      loading: 'Жүктелуде...',
      error: 'Қате',
      notFound: 'Мақала табылмады',
      doi: (d?: string | null) => `DOI: ${d || '—'}`,
      type: 'Түрі',
      authors: 'Авторлар',
      affiliations: 'Аффилиациялар',
      abstract: 'Аннотация',
      keywords: 'Кілт сөздер',
      layout: 'Беттеу',
      noLayout: 'Беттеу жоқ',
      downloadPdf: 'PDF жүктеу',
      corresponding: 'Хат-хабарласушы',
      loadError: 'Томды жүктеу сәтсіз аяқталды',
    },
  }[lang]

  const { volumeId, articleId } = useParams<{ volumeId: string; articleId: string }>()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layoutRecords, setLayoutRecords] = useState<LayoutRecordOut[] | null>(null)
  const [layoutLoading, setLayoutLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!volumeId) throw new Error('Missing volumeId')
        const data = (await api.getPublicVolumeById(volumeId)) as Volume
        if (!cancelled) setVolume(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || t.loadError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [volumeId])

  const article: Article | null = useMemo(() => {
    const items = volume?.articles || []
    if (!items.length) return null
    const found = items.find((a: any) => String(a?.id) === String(articleId))
    return (found as Article) || null
  }, [volume?.articles, articleId])

  useEffect(() => {
    if (!article) return
    const aid = Number((article as any).id)
    if (!Number.isFinite(aid)) return
    let cancelled = false
    const load = async () => {
      setLayoutLoading(true)
      try {
        const recs = (await api.getLayoutRecordsByArticle(aid)) as unknown as LayoutRecordOut[]
        if (!cancelled) setLayoutRecords(Array.isArray(recs) ? recs : [])
      } catch {
        if (!cancelled) setLayoutRecords([])
      } finally {
        if (!cancelled) setLayoutLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [article])

  const localizedTitle =
    pickLocalized(lang, (article as any)?.title_ru, (article as any)?.title_en, (article as any)?.title_kz) ||
    compact((article as any)?.title) ||
    '—'

  const localizedAbstract =
    pickLocalized(lang, (article as any)?.abstract_ru, (article as any)?.abstract_en, (article as any)?.abstract_kz) ||
    compact((article as any)?.abstract)

  const localizedKeywords = useMemo(() => {
    const items = (article as any)?.keywords
    if (!Array.isArray(items)) return []
    return items
      .map((k: any) => pickLocalized(lang, k?.title_ru, k?.title_en, k?.title_kz) || compact(k?.title_ru) || compact(k?.title_en) || compact(k?.title_kz))
      .map((x) => x.trim())
      .filter(Boolean)
  }, [article, lang])

  const authors = useMemo(() => {
    const items = (article as any)?.authors
    return Array.isArray(items) ? items : []
  }, [article])

  const layoutHref = useMemo(() => {
    const recs = Array.isArray(layoutRecords) ? layoutRecords : []
    if (recs.length === 0) return null
    const sorted = [...recs].sort((l, r) => {
      const lt = Date.parse(String(l.updated_at || l.created_at || '')) || 0
      const rt = Date.parse(String(r.updated_at || r.created_at || '')) || 0
      return rt - lt
    })
    const first = sorted[0]
    return toApiFilesUrl(first?.file_url || (first?.file_id ? `/files/${first.file_id}/download` : undefined)) || null
  }, [layoutRecords])

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h1 className="hero__title">{localizedTitle}</h1>
          <Link className="button button--ghost" to={volumeId ? `/archive/volumes/${volumeId}` : '/archive'}>{t.backToVolume}</Link>
        </div>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}

        {!loading && !error && !article && (
          <div className="panel">
            <div className="panel-title">{t.notFound}</div>
          </div>
        )}

        {article && (
          <div className="panel">
            <div className="submission-card__top">
              <div>
                <div className="panel-title">{localizedTitle}</div>
                <div className="meta-label">{t.doi((article as any)?.doi)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className="pill pill--ghost">{t.type}: {(article as any)?.article_type || '—'}</span>
                <span className="pill pill--ghost">{t.layout}</span>
                {layoutLoading ? (
                  <span className="meta-label">{t.loading}</span>
                ) : layoutHref ? (
                  <a className="button button--ghost button--compact" href={layoutHref} target="_blank" rel="noreferrer">{t.downloadPdf}</a>
                ) : (
                  <span className="meta-label">{t.noLayout}</span>
                )}
              </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: '0.9rem' }}>
              <div>
                <div className="panel-title" style={{ fontSize: '1.05rem' }}>{t.abstract}</div>
                <p className="article-abstract" style={{ whiteSpace: 'pre-wrap' }}>{localizedAbstract || '—'}</p>
              </div>
              <div>
                <div className="panel-title" style={{ fontSize: '1.05rem' }}>{t.keywords}</div>
                {localizedKeywords.length === 0 ? (
                  <div className="table__empty">—</div>
                ) : (
                  <div className="pill-list" style={{ justifyContent: 'flex-start' }}>
                    {localizedKeywords.map((k) => (
                      <span className="pill" key={k}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="panel-title" style={{ fontSize: '1.05rem' }}>{t.authors}</div>
              {authors.length === 0 ? (
                <div className="table__empty">—</div>
              ) : (
                <div className="assignment-list">
                  {authors.map((a: any, idx: number) => {
                    const name = formatAuthorName(a) || `Author ${idx + 1}`
                    const affs = extractAffiliations(a)
                    const isCorresponding = Boolean(a?.is_corresponding)
                    return (
                      <div className="assignment-row" key={String(a?.id ?? `${idx}-${name}`)}>
                        <div>
                          <div className="assignment-title">
                            {name}
                            {isCorresponding ? (
                              <span className="pill pill--ghost" style={{ marginLeft: '0.5rem' }}>{t.corresponding}</span>
                            ) : null}
                          </div>
                          {affs.length > 0 ? (
                            <div className="article-meta">
                              <span className="meta-label">{t.affiliations}:</span>
                              <span>{affs.join(' / ')}</span>
                            </div>
                          ) : null}
                          {compact(a?.orcid) ? (
                            <div className="article-meta">
                              <span className="meta-label">ORCID:</span>
                              <span>{compact(a?.orcid)}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

