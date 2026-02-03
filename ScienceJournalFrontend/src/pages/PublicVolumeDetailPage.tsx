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
      eyebrow: 'Р°СЂС…РёРІ РЅРѕРјРµСЂРѕРІ',
      back: 'в†ђ РќР°Р·Р°Рґ Рє Р°СЂС…РёРІСѓ',
      loading: 'Р—Р°РіСЂСѓР·РєР°...',
      error: 'РћС€РёР±РєР°',
      active: 'РђРєС‚РёРІРµРЅ',
      inactive: 'РќРµР°РєС‚РёРІРµРЅ',
      articlesCount: (n: number) => `РЎС‚Р°С‚РµР№: ${n}`,
      tableTitle: 'РЎС‚Р°С‚СЊРё РІ С‚РѕРјРµ',
      th: { title: 'РќР°Р·РІР°РЅРёРµ', authors: 'РђРІС‚РѕСЂС‹', layout: 'Р’С‘СЂС‚РєР°' },
      untitled: 'Р‘РµР· Р·Р°РіРѕР»РѕРІРєР°',
      loadingLayout: 'Р—Р°РіСЂСѓР·РєР°вЂ¦',
      noLayout: 'РќРµС‚ РІС‘СЂСЃС‚РєРё',
      downloadPdf: 'РЎРєР°С‡Р°С‚СЊ PDF',
      volumeLabel: (v: Volume) => `РўРѕРј ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `РўРѕРј ${v.number} / ${v.year}${v.month ? ` (${v.month} РјРµСЃ.)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || 'вЂ”'}`,
    },
    en: {
      eyebrow: 'archive of issues',
      back: 'в†ђ Back to archive',
      loading: 'Loading...',
      error: 'Error',
      active: 'Active',
      inactive: 'Inactive',
      articlesCount: (n: number) => `Articles: ${n}`,
      tableTitle: 'Articles in this volume',
      th: { title: 'Title', authors: 'Authors', layout: 'Layout' },
      untitled: 'Untitled',
      loadingLayout: 'LoadingвЂ¦',
      noLayout: 'No layout',
      downloadPdf: 'Download PDF',
      volumeLabel: (v: Volume) => `Volume ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `Volume ${v.number} / ${v.year}${v.month ? ` (${v.month} mo.)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || 'вЂ”'}`,
    },
    kz: {
      eyebrow: 'С€С‹Т“Р°СЂС‹Р»С‹РјРґР°СЂ РјТ±СЂР°Т“Р°С‚С‹',
      back: 'в†ђ РњТ±СЂР°Т“Р°С‚Т›Р° Т›Р°Р№С‚Сѓ',
      loading: 'Р–ТЇРєС‚РµР»СѓРґРµ...',
      error: 'ТљР°С‚Рµ',
      active: 'Р‘РµР»СЃРµРЅРґС–',
      inactive: 'Р‘РµР»СЃРµРЅРґС– РµРјРµСЃ',
      articlesCount: (n: number) => `РњР°Т›Р°Р»Р°Р»Р°СЂ: ${n}`,
      tableTitle: 'Р‘Т±Р» С‚РѕРјРґР°Т“С‹ РјР°Т›Р°Р»Р°Р»Р°СЂ',
      th: { title: 'РђС‚Р°СѓС‹', authors: 'РђРІС‚РѕСЂР»Р°СЂ', layout: 'Р‘РµС‚С‚РµСѓ' },
      untitled: 'РђС‚Р°СѓСЃС‹Р·',
      loadingLayout: 'Р–ТЇРєС‚РµР»СѓРґРµвЂ¦',
      noLayout: 'Р‘РµС‚С‚РµСѓ Р¶РѕТ›',
      downloadPdf: 'PDF Р¶ТЇРєС‚РµСѓ',
      volumeLabel: (v: Volume) => `РўРѕРј ${v.number} / ${v.year}`,
      volumePanelTitle: (v: Volume) => `РўРѕРј ${v.number} / ${v.year}${v.month ? ` (${v.month} Р°Р№)` : ''}`,
      doi: (d?: string | null) => `DOI: ${d || 'вЂ”'}`,
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
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С‚РѕРј')
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
          <h1 className="hero__title">{volume ? t.volumeLabel(volume) : 'вЂ”'}</h1>
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
                    {Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : 'вЂ”'}
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
                      const href =
                        toApiFilesUrl(first?.file_url || (first?.file_id ? `/files/${first.file_id}/download` : undefined)) || '#'
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

