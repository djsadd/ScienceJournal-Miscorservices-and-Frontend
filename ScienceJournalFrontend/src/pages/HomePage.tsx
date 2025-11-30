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

      <section id="about" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.about.eyebrow}</p>
            <h2 className="panel-title">{t.about.title}</h2>
          </div>
          <a className="button button--ghost" href="#contacts">
            {t.about.cta}
          </a>
        </div>
        <div className="panel">
          {t.about.paragraphs.map((paragraph, idx) => (
            <p className="subtitle" key={idx}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section id="purpose" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.purpose.eyebrow}</p>
            <h2 className="panel-title">{t.purpose.title}</h2>
          </div>
          <a className="button button--ghost" href="#authors">
            {t.purpose.cta}
          </a>
        </div>
        <div className="panel">
          <p className="subtitle">{t.purpose.paragraph}</p>
        </div>
      </section>

      <section id="editorial" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.editorial.eyebrow}</p>
            <h2 className="panel-title">{t.editorial.title}</h2>
          </div>
          <a className="button button--ghost" href="#rules">
            {t.editorial.cta}
          </a>
        </div>
        <div className="grid grid-3">
          {t.editorial.board.map((person) => (
            <div className="panel person-card" key={person.name}>
              <div className="panel-title">{person.name}</div>
              <p className="subtitle">{person.role}</p>
              <p className="meta-label">{person.field}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rules" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.rules.eyebrow}</p>
            <h2 className="panel-title">{t.rules.title}</h2>
          </div>
          <Link className="button button--primary" to="/cabinet/submissions">
            {t.rules.cta}
          </Link>
        </div>
        <div className="panel">
          <ul className="list">
            {t.rules.list.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="registry" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.registry.eyebrow}</p>
            <h2 className="panel-title">{t.registry.title}</h2>
          </div>
          <a className="button button--ghost" href="#contacts">
            {t.registry.cta}
          </a>
        </div>
        <div className="grid grid-3">
          {t.registry.items.map((item) => (
            <div className="panel issue-card" key={item.title}>
              <div className="panel-title">{item.title}</div>
              <p className="subtitle">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contacts" className="section public-section">
        <div className="panel contact-card">
          <div>
            <p className="eyebrow">{t.contacts.eyebrow}</p>
            <h2 className="panel-title">{t.contacts.title}</h2>
            <p className="subtitle">{t.contacts.subtitle}</p>
          </div>
          <div className="contact-grid">
            <div>
              <div className="meta-label">{t.contacts.emailLabel}</div>
              <div>editorial@sciencejournal.edu</div>
            </div>
            <div>
              <div className="meta-label">{t.contacts.phoneLabel}</div>
              <div>{t.contacts.phoneValue}</div>
            </div>
            <div>
              <div className="meta-label">{t.contacts.addressLabel}</div>
              <div>{t.contacts.addressValue}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
