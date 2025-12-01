import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import { homeCopy } from '../shared/translations'

export function HomePage() {
  const tokens = api.getTokens()
  const isAuthed = Boolean(tokens?.accessToken)
  const { lang } = useLanguage()
  const t = homeCopy[lang]

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
                <Link to="/login" className="button button--primary">
                  {t.hero.buttons.guestPrimary}
                </Link>
                <Link to="/register" className="button button--ghost">
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
              <div key={stat.label}>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Removed sections: About and Purpose per request */}

      
    </div>
  )
}
