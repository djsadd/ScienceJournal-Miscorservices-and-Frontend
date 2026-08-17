import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import { homeCopy } from '../shared/translations'
import type { Volume } from '../shared/types'
import { toApiFilesUrl } from '../shared/url'

const compact = (value?: string | null) => (value || '').trim()

const pickLocalized = (lang: 'ru' | 'en' | 'kz', ru?: string | null, en?: string | null, kz?: string | null) => {
  const value = lang === 'ru' ? ru : lang === 'en' ? en : kz
  return compact(value)
}

export function HomePage() {
  const tokens = api.getTokens()
  const isAuthed = Boolean(tokens?.accessToken)
  const { lang } = useLanguage()
  const t = homeCopy[lang]
  const localizedHref = (path: string) => (path === '/' ? `/${lang}` : `/${lang}${path}`)
  const ui = {
    ru: {
      latest: 'Последний выпуск',
      openIssue: 'Открыть выпуск',
      downloadIssue: 'Открыть выпуск',
      noCover: 'Обложка не загружена',
    },
    en: {
      latest: 'Latest issue',
      openIssue: 'Open issue',
      downloadIssue: 'View issue',
      noCover: 'No cover uploaded',
    },
    kz: {
      latest: 'Соңғы шығарылым',
      openIssue: 'Шығарылымды ашу',
      downloadIssue: 'Шығарылымды ашу',
      noCover: 'Мұқаба жүктелмеген',
    },
  }[lang]

  const [volumes, setVolumes] = useState<Volume[] | null>(null)
  const [latestError, setLatestError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLatestError(null)
      try {
        const data = await api.getPublicVolumes<Volume[]>()
        if (!cancelled) setVolumes(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) setLatestError(e?.bodyJson?.detail || e?.message || 'Failed to load')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const latest = useMemo(() => {
    const list = Array.isArray(volumes) ? volumes : []
    return list.length ? list[0] : null
  }, [volumes])

  const latestTitle = latest ? pickLocalized(lang, latest.title_ru, latest.title_en, latest.title_kz) : ''
  const coverHref = latest?.cover_file_url ? toApiFilesUrl(latest.cover_file_url) : undefined
  const issueHref = latest?.complete_issue_file_url ? toApiFilesUrl(latest.complete_issue_file_url) : undefined

  return (
    <div className="public-container home-page">
      <section className="hero">
        <div>
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1 className="hero__title">{t.hero.title}</h1>
          <p className="subtitle hero__subtitle">{t.hero.subtitle}</p>
          <div className="hero__actions">
            {isAuthed ? (
              <>
                <Link to="/cabinet" className="button button--primary">
                  {t.hero.buttons.authedPrimary}
                </Link>
                <Link to="/cabinet/profile" className="button button--ghost">
                  {t.hero.buttons.authedSecondary}
                </Link>
              </>
            ) : (
              <>
                <Link to={localizedHref('/login')} className="button button--primary">
                  {t.hero.buttons.guestPrimary}
                </Link>
                <Link to={localizedHref('/register')} className="button button--ghost">
                  {t.hero.buttons.guestSecondary}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero__panel panel">
          <h3 className="panel-title">{t.hero.statsTitle}</h3>
          <p className="subtitle">{t.hero.statsDescription}</p>
          <div className="stat-block">
            {t.hero.stats.map((stat) => (
              <div key={`${stat.label}-${stat.value}`}>
                <div className={`stat-value ${stat.value.includes('\n') ? 'stat-value--multiline' : ''}`}>
                  {stat.value}
                </div>
                {stat.label && <div className="stat-label">{stat.label}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Removed sections: About and Purpose per request */}

      {latest ? (
        <section className="panel home-latest">
          <div className="home-latest__header">
            <div className="panel-title">{ui.latest}</div>
            <div className="home-latest__actions">
              <Link className="button button--ghost button--compact" to={localizedHref(`/archive/volumes/${latest.id}`)}>
                {ui.openIssue}
              </Link>
              {issueHref ? (
                <a className="button button--primary button--compact" href={issueHref} target="_blank" rel="noreferrer">
                  {ui.downloadIssue}
                </a>
              ) : null}
            </div>
          </div>

          <div className="home-latest__body">
            {coverHref ? (
              <a className="home-latest__cover" href={coverHref} target="_blank" rel="noreferrer" aria-label={ui.latest}>
                <img src={coverHref} alt={latestTitle || ui.latest} loading="lazy" />
              </a>
            ) : (
              <div className="home-latest__cover home-latest__cover--empty">
                <div className="meta-label">{ui.noCover}</div>
              </div>
            )}

            <div className="home-latest__meta">
              <div className="home-latest__name">
                {latest.year}, Volume {latest.number}
                {latest.month ? `, Issue ${latest.month}` : ''}
              </div>
              {latestTitle ? <div className="subtitle" style={{ marginTop: '0.25rem' }}>{latestTitle}</div> : null}
              {latest.description ? (
                <p className="home-latest__desc" style={{ marginTop: '0.6rem' }}>
                  {latest.description}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : latestError ? (
        <div className="meta-label">{latestError}</div>
      ) : null}

      
    </div>
  )
}
