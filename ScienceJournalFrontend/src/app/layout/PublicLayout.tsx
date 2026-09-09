import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../../api/client'
import logo from '../../assets/logo.svg'
import { useLanguage } from '../../shared/LanguageContext'
import type { Lang } from '../../shared/labels'
import { publicNavCopy } from '../../shared/translations'

interface PublicLayoutProps {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
  children?: { href: string; label: string }[]
}

const creativeCommonsLicenseUrl = 'https://creativecommons.org/licenses/by/4.0/'
const creativeCommonsBadgeUrl = 'https://licensebuttons.net/l/by/4.0/88x31.png'
const publisherAddress = '010000, Republic of Kazakhstan, Astana, Y. Dukenuly St., 29'
const journalKickers: Record<Lang, string> = {
  ru: 'Интернет издания',
  kz: 'Интернет басылымдары',
  en: 'Internet editions',
}
const journalTitles: Record<Lang, string> = {
  ru: 'Известия университета «Туран-Астана»',
  kz: '«Тұран-Астана» университетінің хабарлары',
  en: 'Turan-Astana University News',
}
const journalSubtitles: Record<Lang, string> = {
  ru: 'Научный рецензируемый журнал · ISSN 2958-8103',
  kz: 'Ғылыми рецензияланатын журнал · ISSN 2958-8103',
  en: 'Peer-reviewed scientific journal · ISSN 2958-8103',
}
const authNavLabels: Record<Lang, { cabinet: string; login: string; register: string }> = {
  ru: { cabinet: 'Личный кабинет', login: 'Войти', register: 'Зарегистрироваться' },
  kz: { cabinet: 'Жеке кабинет', login: 'Кіру', register: 'Тіркелу' },
  en: { cabinet: 'Dashboard', login: 'Log in', register: 'Register' },
}
const languageCodes: Lang[] = ['ru', 'kz', 'en']

function stripLanguagePrefix(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'ru' || parts[0] === 'kz' || parts[0] === 'en') {
    parts.shift()
  }
  return parts.length ? `/${parts.join('/')}` : '/'
}

function PublicLayoutShell({ children }: PublicLayoutProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(api.getTokens()?.accessToken))
  const [lowVision, setLowVision] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lowVision')
      return saved === '1'
    } catch {
      return false
    }
  })

  const { lang, setLang } = useLanguage()
  const location = useLocation()
  const nav = publicNavCopy[lang]
  const authLabels = authNavLabels[lang]
  const currentPublicPath = stripLanguagePrefix(location.pathname)
  const isLoginPage = currentPublicPath === '/login'
  const isForgotPasswordPage = currentPublicPath === '/auth/forgot-password'
  const isLoginLikePage = isLoginPage || isForgotPasswordPage
  const isRegisterPage = currentPublicPath === '/register'

  const localizedHref = (href: string, targetLang = lang) => {
    const normalizedHref = href.startsWith('/') ? href : `/${href}`
    return normalizedHref === '/' ? `/${targetLang}` : `/${targetLang}${normalizedHref}`
  }

  const languageHref = (targetLang: Lang) => {
    const currentPath = stripLanguagePrefix(location.pathname)
    return `${localizedHref(currentPath, targetLang)}${location.search}${location.hash}`
  }

  const searchHref = () => {
    const query = searchQuery.trim()
    return localizedHref(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  useEffect(() => {
    try {
      localStorage.removeItem('theme')
    } catch {}
  }, [])

  useEffect(() => {
    setIsAuthenticated(Boolean(api.getTokens()?.accessToken))

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'sj_tokens') {
        setIsAuthenticated(Boolean(api.getTokens()?.accessToken))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [location.pathname])

  const topNav: NavItem[] = [
    { href: '/', label: nav.home },
    { href: '/about', label: nav.about },
    { href: '/archive', label: nav.archive },
    { href: '/search', label: nav.search },
    { href: '/contacts', label: nav.contacts },
  ]

  const dropdownNav: NavItem[] = [
    {
      href: '/editorial',
      label: nav.editorial.title,
      children: [
        { href: '/editorial', label: nav.editorial.board },
        { href: '/policies', label: nav.editorial.policies },
      ],
    },
    {
      href: '/policies',
      label: nav.policies.title,
      children: [
        { href: '/policies/ethics', label: nav.policies.ethics },
        { href: '/policies/ai', label: nav.policies.ai },
        { href: '/policies/review', label: nav.policies.review },
      ],
    },
    {
      href: '/authors',
      label: nav.authors.title,
      children: [
        { href: '/authors/requirements', label: nav.authors.requirements },
        { href: '/authors/contract', label: nav.authors.contract },
      ],
    },
  ]

  const handleOpen = (href: string | null) => setOpenDropdown(href)

  const renderNav = (items: NavItem[]) =>
    items.map((item) =>
      item.children ? (
        <div className="nav-dropdown" key={item.href} onMouseEnter={() => handleOpen(item.href)}>
          <button
            className="public-nav__link nav-dropdown__trigger"
            aria-expanded={openDropdown === item.href}
            onClick={() => handleOpen(openDropdown === item.href ? null : item.href)}
            type="button"
          >
            {item.label}
            <span className="caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {openDropdown === item.href && (
            <div className="nav-dropdown__menu" onMouseLeave={() => handleOpen(null)}>
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  to={localizedHref(child.href)}
                  className="nav-dropdown__item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : item.href === '/search' ? (
        <button
          key={item.href}
          type="button"
          className="public-nav__link nav-dropdown__trigger"
          onClick={() => {
            setIsSearchOpen(true)
            setMobileMenuOpen(false)
          }}
        >
          {item.label}
        </button>
      ) : (
        <Link
          key={item.href}
          to={localizedHref(item.href)}
          className="public-nav__link"
          onClick={() => setMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      ),
    )

  // Theme toggle removed; no theme labels/icons used

  return (
    <div
      className={`public-shell ${isLoginLikePage ? 'public-shell--login' : ''} ${
        isRegisterPage ? 'public-shell--register' : ''
      } ${
        mobileMenuOpen ? 'public-shell--menu-open' : ''
      } theme-light ${
        lowVision ? 'low-vision' : ''
      }`}
    >
      <header className="public-header">
        <div className="public-header__topline">
          <div className="public-header__kicker">{journalKickers[lang]}</div>
          <div className="public-actions public-actions--top">
            <div className="text-size-controls" aria-label="Управление размером текста">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  const root = document.querySelector('.public-shell') as HTMLElement | null
                  if (!root) return
                  const style = window.getComputedStyle(root)
                  const current = parseFloat(style.fontSize || '20')
                  const next = Math.min(current + 2, 26)
                  root.style.fontSize = `${next}px`
                }}
              >
                A+
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  const root = document.querySelector('.public-shell') as HTMLElement | null
                  if (!root) return
                  const style = window.getComputedStyle(root)
                  const current = parseFloat(style.fontSize || '20')
                  const next = Math.max(current - 2, 16)
                  root.style.fontSize = `${next}px`
                }}
              >
                A-
              </button>
            </div>
            <button
              className={`button button--contrast ${lowVision ? 'button--active' : ''}`}
              type="button"
              aria-pressed={lowVision}
              aria-label={lowVision ? 'Отключить версию для слабовидящих' : 'Включить версию для слабовидящих'}
              title={lowVision ? 'Отключить версию для слабовидящих' : 'Включить версию для слабовидящих'}
              onClick={() => {
                setLowVision((v) => {
                  const next = !v
                  try {
                    localStorage.setItem('lowVision', next ? '1' : '0')
                  } catch {}
                  return next
                })
              }}
            >
              👁️
            </button>
            <div className="lang-switch">
              {languageCodes.map((code) => (
                <Link
                  key={code}
                  to={languageHref(code)}
                  className={`lang-chip ${lang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => {
                    setLang(code)
                    setMobileMenuOpen(false)
                  }}
                >
                  {code.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="public-top" aria-label="Site navigation">
          <Link to={localizedHref('/')} className="brand brand--journal" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt={nav.brandAlt} className="brand-logo brand-logo--journal" />
            <span className="brand-site-copy">
              <span className="brand-site-title">{journalTitles[lang]}</span>
              <span className="brand-site-subtitle">{journalSubtitles[lang]}</span>
            </span>
          </Link>
          <div className="public-actions public-actions--mobile">
            <button
              className="mobile-nav-toggle"
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? nav.mobileMenu.ariaClose : nav.mobileMenu.ariaOpen}
            >
              {mobileMenuOpen ? '×' : '≡'}
            </button>
          </div>
        </div>
        <div className="public-subnav">
          <nav className="public-nav public-nav--top">{renderNav(topNav)}</nav>
          <nav className="public-nav public-nav--secondary">{renderNav(dropdownNav)}</nav>
          <div className="public-auth-actions public-actions__desktop">
            {isAuthenticated ? (
              <Link to="/cabinet" className="public-auth-button public-auth-button--primary">
                {authLabels.cabinet}
              </Link>
            ) : (
              <>
                <Link to={localizedHref('/login')} className="public-auth-button">
                  {authLabels.login}
                </Link>
                <Link to={localizedHref('/register')} className="public-auth-button public-auth-button--primary">
                  {authLabels.register}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="public-menu" role="navigation" aria-label="Mobile navigation">
          <nav className="public-nav public-nav--mobile">{renderNav(topNav)}</nav>
          <nav className="public-nav public-nav--mobile">{renderNav(dropdownNav)}</nav>
          <div className="public-menu__actions">
            <div className="lang-switch lang-switch--menu">
              {languageCodes.map((code) => (
                <Link
                  key={code}
                  to={languageHref(code)}
                  className={`lang-chip ${lang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => {
                    setLang(code)
                    setMobileMenuOpen(false)
                  }}
                >
                  {code.toUpperCase()}
                </Link>
              ))}
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => setIsSearchOpen(true)}
            >
              {nav.search}
            </button>
            {isAuthenticated ? (
              <Link
                to="/cabinet"
                className="button button--ghost"
                onClick={() => setMobileMenuOpen(false)}
              >
                {authLabels.cabinet}
              </Link>
            ) : (
              <>
                <Link
                  to={localizedHref('/login')}
                  className="button button--ghost"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {authLabels.login}
                </Link>
                <Link
                  to={localizedHref('/register')}
                  className="button button--ghost"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {authLabels.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main
        className={`public-main ${isLoginLikePage ? 'public-main--login' : ''} ${
          isRegisterPage ? 'public-main--register' : ''
        }`}
      >
        {children}
      </main>

      {isSearchOpen && (
        <div className="search-modal__backdrop" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal__header">
              <h3>{nav.searchModal.title}</h3>
              <button
                className="search-modal__close"
                onClick={() => setIsSearchOpen(false)}
                aria-label={nav.searchModal.close}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="search-modal__body">
              <input
                className="search-modal__input"
                placeholder={nav.searchModal.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <div className="search-modal__hints">
                <span className="pill">{nav.searchModal.hints[0]}</span>
                <span className="pill">{nav.searchModal.hints[1]}</span>
              </div>
            </div>
            <div className="search-modal__footer">
              <button className="button button--ghost" onClick={() => setIsSearchOpen(false)} type="button">
                {nav.searchModal.cancel}
              </button>
              <Link
                to={searchHref()}
                className="button button--primary"
                onClick={() => setIsSearchOpen(false)}
              >
                {nav.searchModal.submit}
              </Link>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer__brand">
          <div className="brand-mark">
            <img
              src={logo}
              alt={
                lang === 'ru'
                  ? 'Логотип журнала Известия университета Туран-Астана'
                  : lang === 'kz'
                    ? 'Туран-Астана университетінің хабарлары логотипі'
                    : 'Turan-Astana University news logo'
              }
              className="brand-logo"
            />
          </div>
          <div>
            <div className="brand-title">
              {lang === 'ru'
                ? 'Известия университета Туран-Астана'
                : lang === 'kz'
                  ? 'Туран-Астана университетінің хабарлары'
                  : 'Turan-Astana University news'}
            </div>
            <div className="brand-subtitle">
              <span>Print ISSN: 2663-631X</span>
              <span>Online ISSN: 3136-5337</span>
            </div>
            <a
              className="footer-license"
              href={creativeCommonsLicenseUrl}
              rel="license noopener noreferrer"
              target="_blank"
            >
              <img
                className="footer-license__badge"
                src={creativeCommonsBadgeUrl}
                alt="Creative Commons Attribution 4.0 International License"
              />
              <span>
                This journal is licensed under the CC-BY Creative Commons Attribution 4.0
                International License.
              </span>
            </a>
          </div>
        </div>
        <div className="footer__meta">
          <span className="meta-label">Since 2025</span>
          <span className="meta-label">&copy; Publisher - Turan-Astana University</span>
          <span className="meta-label">Publisher address: {publisherAddress}</span>
          <span className="meta-label">All rights reserved</span>
        </div>
      </footer>
    </div>
  )
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicLayoutShell>{children}</PublicLayoutShell>
}
