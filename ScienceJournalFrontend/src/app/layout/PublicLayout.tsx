import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'
import { LanguageProvider, useLanguage } from '../../shared/LanguageContext'
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

function PublicLayoutShell({ children }: PublicLayoutProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const { lang, setLang } = useLanguage()
  const nav = publicNavCopy[lang]
  const isDark = theme === 'dark'

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
                  to={child.href}
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
          to={item.href}
          className="public-nav__link"
          onClick={() => setMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      ),
    )

  const themeLabel = isDark ? nav.theme.dark : nav.theme.light
  const themeIcon = isDark ? nav.theme.iconDark : nav.theme.iconLight
  const themeAria = isDark ? nav.theme.ariaLight : nav.theme.ariaDark

  return (
    <div
      className={`public-shell ${mobileMenuOpen ? 'public-shell--menu-open' : ''} ${
        isDark ? 'theme-dark' : 'theme-light'
      }`}
    >
      <header className="public-header">
        <div className="public-top" aria-label="Site navigation">
          <Link to="/" className="brand brand--compact" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt={nav.brandAlt} className="brand-logo brand-logo--plain" />
          </Link>
          <nav className="public-nav public-nav--top">{renderNav(topNav)}</nav>
          <div className="public-actions">
            <button
              type="button"
              className="theme-toggle theme-toggle--header"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={themeAria}
            >
              <span className="theme-toggle__icon" aria-hidden="true">
                {themeIcon}
              </span>
              <span className="theme-toggle__label">{themeLabel}</span>
            </button>
            <div className="lang-switch">
              {(['ru', 'kz', 'en'] as Lang[]).map((code) => (
                <button
                  key={code}
                  className={`lang-chip ${lang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => setLang(code)}
                  type="button"
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <Link
              to="/cabinet"
              className="button button--ghost public-actions__desktop"
              onClick={() => setMobileMenuOpen(false)}
            >
              {nav.cabinet}
            </Link>
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
          <nav className="public-nav public-nav--secondary">{renderNav(dropdownNav)}</nav>
        </div>
        <div className="public-menu" role="navigation" aria-label="Mobile navigation">
          <nav className="public-nav public-nav--mobile">{renderNav(topNav)}</nav>
          <nav className="public-nav public-nav--mobile">{renderNav(dropdownNav)}</nav>
          <div className="public-menu__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => setIsSearchOpen(true)}
            >
              {nav.search}
            </button>
            <Link
              to="/cabinet"
              className="button button--ghost"
              onClick={() => setMobileMenuOpen(false)}
            >
              {nav.cabinet}
            </Link>
          </div>
        </div>
      </header>
      <main className="public-main">{children}</main>

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
                to="/search"
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
            <img src={logo} alt="Science Journal" className="brand-logo" />
          </div>
          <div>
            <div className="brand-title">Izvestiya universiteta "Turan-Astana"</div>
            <div className="brand-subtitle">Science Journal - Department of Digital Transformation</div>
          </div>
        </div>
        <div className="footer__meta">
          <span className="meta-label">c 2025 Science Journal</span>
          <span className="meta-label">All rights reserved</span>
        </div>
      </footer>
    </div>
  )
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <LanguageProvider>
      <PublicLayoutShell>{children}</PublicLayoutShell>
    </LanguageProvider>
  )
}
