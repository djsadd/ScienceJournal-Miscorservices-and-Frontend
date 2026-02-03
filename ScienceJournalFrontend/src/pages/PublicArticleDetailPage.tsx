import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import { useLanguage } from '../shared/LanguageContext'
import { homeCopy } from '../shared/translations'
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

const toDoiUrl = (doi?: string | null) => {
  const raw = compact(doi)
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://doi.org/${raw.replace(/^doi:\s*/i, '')}`
}

export default function PublicArticleDetailPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'архив номеров',
      loading: 'Загрузка...',
      error: 'Ошибка',
      notFound: 'Статья не найдена',
      journal: 'Журнал',
      volume: 'Том',
      doi: 'DOI',
      authors: 'Авторы',
      abstract: 'Аннотация',
      keywords: 'Ключевые слова',
      noLayout: 'Нет верстки',
      downloadPdf: 'Скачать PDF',
      corresponding: 'Корреспондирующий',
      loadError: 'Не удалось загрузить том',
    },
    en: {
      eyebrow: 'archive of issues',
      loading: 'Loading...',
      error: 'Error',
      notFound: 'Article not found',
      journal: 'Journal',
      volume: 'Volume',
      doi: 'DOI',
      authors: 'Authors',
      abstract: 'Abstract',
      keywords: 'Keywords',
      noLayout: 'No layout',
      downloadPdf: 'Download PDF',
      corresponding: 'Corresponding',
      loadError: 'Failed to load volume',
    },
    kz: {
      eyebrow: 'шығарылымдар мұрағаты',
      loading: 'Жүктелуде...',
      error: 'Қате',
      notFound: 'Мақала табылмады',
      journal: 'Журнал',
      volume: 'Том',
      doi: 'DOI',
      authors: 'Авторлар',
      abstract: 'Аннотация',
      keywords: 'Кілт сөздер',
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

  const doiRaw = compact((article as any)?.doi)
  const doiHref = toDoiUrl((article as any)?.doi)

  const journalTitle = homeCopy?.[lang]?.hero?.title || ''
  const volumeLabel =
    volume && volume.number && volume.year
      ? `${volume.number} / ${volume.year}${volume.month ? ` (${volume.month})` : ''}`
      : ''

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}

        {!loading && !error && !article && (
          <div className="panel">
            <div className="panel-title">{t.notFound}</div>
          </div>
        )}

        {article && (
          <div className="panel public-article">
            <div className="public-article__top">
              <div>
                <h1 className="public-article__title">{localizedTitle}</h1>
                <div className="public-article__meta">
                  {journalTitle ? (
                    <div className="public-article__meta-row">
                      <span className="meta-label">{t.journal}:</span>
                      <span>{journalTitle}</span>
                    </div>
                  ) : null}
                  {volumeLabel ? (
                    <div className="public-article__meta-row">
                      <span className="meta-label">{t.volume}:</span>
                      <span>{volumeLabel}</span>
                    </div>
                  ) : null}
                  <div className="public-article__meta-row">
                    <span className="meta-label">{t.doi}:</span>
                    {doiHref ? (
                      <a className="public-article__doi-link" href={doiHref} target="_blank" rel="noreferrer">
                        {doiRaw}
                      </a>
                    ) : (
                      <span className="meta-label">—</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="public-article__actions">
                {layoutLoading ? (
                  <span className="meta-label">{t.loading}</span>
                ) : layoutHref ? (
                  <a className="button button--primary public-article__download" href={layoutHref} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        fill="currentColor"
                        d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 1 1v1h14v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z"
                      />
                    </svg>
                    {t.downloadPdf}
                  </a>
                ) : (
                  <span className="meta-label">{t.noLayout}</span>
                )}
              </div>
            </div>

            <div className="public-article__section">
              <div className="panel-title public-article__section-title">{t.authors}</div>
              {authors.length === 0 ? (
                <div className="table__empty">—</div>
              ) : (
                <ul className="public-article__author-list">
                  {authors.map((a: any, idx: number) => {
                    const name = formatAuthorName(a) || `Author ${idx + 1}`
                    const affs = extractAffiliations(a)
                    const isCorresponding = Boolean(a?.is_corresponding)
                    return (
                      <li className="public-article__author" key={String(a?.id ?? `${idx}-${name}`)}>
                        <div className="public-article__author-name">
                          {name}
                          {isCorresponding ? <span className="public-article__corresponding" title={t.corresponding}>*</span> : null}
                        </div>
                        {affs.map((aff) => (
                          <div className="public-article__author-aff" key={`${String(a?.id ?? idx)}-${aff}`}>
                            {aff}
                          </div>
                        ))}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="public-article__section">
              <div className="panel-title public-article__section-title">{t.abstract}</div>
              <p className="public-article__text" style={{ whiteSpace: 'pre-wrap' }}>
                {localizedAbstract || '—'}
              </p>
            </div>

            <div className="public-article__section">
              <div className="panel-title public-article__section-title">{t.keywords}</div>
              <p className="public-article__keywords">
                {localizedKeywords.length ? localizedKeywords.join(', ') : '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
