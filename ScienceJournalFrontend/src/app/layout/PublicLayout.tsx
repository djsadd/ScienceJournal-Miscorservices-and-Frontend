import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'

interface PublicLayoutProps {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
  children?: { href: string; label: string }[]
}

const topNav: NavItem[] = [
  { href: '/', label: 'Главная' },
  { href: '/about', label: 'О журнале' },
  { href: '/archive', label: 'Архив' },
  { href: '/search', label: 'Поиск' },
  { href: '/contacts', label: 'Контакты' },
]

const dropdownNav: NavItem[] = [
  {
    href: '/editorial',
    label: 'Редколлегия',
    children: [
      { href: '/editorial', label: 'Редколлегия и рецензенты' },
      { href: '/policies', label: 'Редакционная политика' },
    ],
  },
  {
    href: '/policies',
    label: 'Правила и политика',
    children: [
      { href: '/policies/ethics', label: 'Публикационная этика' },
      { href: '/policies/ai', label: 'Политика по использованию ИИ' },
      { href: '/policies/review', label: 'Регламент рецензирования' },
    ],
  },
  {
    href: '/authors',
    label: 'Авторам',
    children: [
      { href: '/authors/requirements', label: 'Требования к статьям' },
      { href: '/authors/contract', label: 'Авторский договор' },
    ],
  },
]

export function PublicLayout({ children }: PublicLayoutProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lang, setLang] = useState<'KZ' | 'RU' | 'EN'>('RU')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const isDark = theme === 'dark'

  const handleOpen = (href: string | null) => setOpenDropdown(href)

  const renderNav = (items: NavItem[]) =>
    items.map((item) =>
      item.children ? (
        <div className="nav-dropdown" key={item.href} onMouseEnter={() => handleOpen(item.href)}>
          <button
            className="public-nav__link nav-dropdown__trigger"
            aria-expanded={openDropdown === item.href}
            onClick={() => handleOpen(openDropdown === item.href ? null : item.href)}
          >
            {item.label}
            <span className="caret">{'>'}</span>
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

  return (
    <div
      className={`public-shell ${mobileMenuOpen ? 'public-shell--menu-open' : ''} ${
        isDark ? 'theme-dark' : 'theme-light'
      }`}
    >
      <header className="public-header">
        <div className="public-top" aria-label="Site navigation">
          <Link to="/" className="brand brand--compact" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt="Логотип журнала" className="brand-logo brand-logo--plain" />
          </Link>
          <nav className="public-nav public-nav--top">{renderNav(topNav)}</nav>
          <div className="public-actions">
            <button
              type="button"
              className="theme-toggle theme-toggle--header"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              <span className="theme-toggle__icon" aria-hidden="true">
                {isDark ? '🌙' : '☀️'}
              </span>
              <span className="theme-toggle__label">{isDark ? 'Тёмная' : 'Светлая'}</span>
            </button>
            <div className="lang-switch">
              {(['KZ', 'RU', 'EN'] as const).map((code) => (
                <button
                  key={code}
                  className={`lang-chip ${lang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => setLang(code)}
                  type="button"
                >
                  {code}
                </button>
              ))}
            </div>
            <Link
              to="/cabinet"
              className="button button--ghost public-actions__desktop"
              onClick={() => setMobileMenuOpen(false)}
            >
              Кабинет
            </Link>
            <button
              className="mobile-nav-toggle"
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Переключить меню"
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
              Поиск
            </button>
            <Link
              to="/cabinet"
              className="button button--ghost"
              onClick={() => setMobileMenuOpen(false)}
            >
              Кабинет
            </Link>
          </div>
        </div>
      </header>
      <main className="public-main">{children}</main>

      {isSearchOpen && (
        <div className="search-modal__backdrop" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal__header">
              <h3>Поиск</h3>
              <button
                className="search-modal__close"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Закрыть поиск"
              >
                ×
              </button>
            </div>
            <div className="search-modal__body">
              <input
                className="search-modal__input"
                placeholder="Введите запрос"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <div className="search-modal__hints">
                <span className="pill">Поиск по архиву</span>
                <span className="pill">Автор, ключевые слова, том</span>
              </div>
            </div>
            <div className="search-modal__footer">
              <button className="button button--ghost" onClick={() => setIsSearchOpen(false)}>
                Отмена
              </button>
              <Link
                to="/search"
                className="button button--primary"
                onClick={() => setIsSearchOpen(false)}
              >
                Расширенный поиск
              </Link>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer__brand">
          <div className="brand-mark">
            <img src={logo} alt="Логотип журнала" className="brand-logo" />
          </div>
          <div>
            <div className="brand-title">Известия университета «Туран-Астана»</div>
            <div className="brand-subtitle">Science Journal</div>
          </div>
        </div>
        <div className="footer__meta">
          <span className="meta-label">c 2025 Science Journal</span>
          <span className="meta-label">Все права защищены</span>
        </div>
      </footer>
    </div>
  )
}
