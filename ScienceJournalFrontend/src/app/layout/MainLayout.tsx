import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'
import { api } from '../../api/client'
import { useLanguage } from '../../shared/LanguageContext'
import type { Lang } from '../../shared/labels'

interface MainLayoutProps {
  children: ReactNode
}

type RoleKey = 'author' | 'editor' | 'reviewer' | 'layout' | 'admin'
type LangKey = 'ru' | 'en' | 'kz'

type SidebarCopy = {
  roleOptions: Record<RoleKey, string>
  roleSwitcherLabel: string
  nav: Record<
    RoleKey,
    {
      title: string
      items: { label: string; path?: string; tag?: string }[]
    }[]
  >
  resourcesTitle: string
  terms: string
  privacy: string
  logout: string
  langLabel: string
  brandTitle: string
  brandSubtitle: string
  brandAlt: string
  mobileMenuOpen: string
  mobileMenuClose: string
  sidebarShow: string
  sidebarHide: string
}

const sidebarCopy: Record<LangKey, SidebarCopy> = {
  ru: {
    roleOptions: {
      author: 'Автор',
      editor: 'Редактор',
      reviewer: 'Рецензент',
      layout: 'Вёрстальщик',
      admin: 'Администратор',
    },
    roleSwitcherLabel: 'Выбор роли',
    nav: {
      author: [
        {
          title: 'Обзор',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Рукописи',
          items: [
            { label: 'Мои подачи', path: '/cabinet/submissions' },
            { label: 'Новая подача', path: '/cabinet/submission' },
            { label: 'Договор автора', path: '/authors/contract' },
          ],
        },
      ],
      editor: [
        {
          title: 'Обзор',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Редакция',
          items: [
            { label: 'Назначения', path: '/cabinet/editorial2' },
            { label: 'Быстрая публикация', path: '/cabinet/quick-publish' },
          ],
        },
        {
          title: 'Выпуски',
          items: [{ label: 'Номера журнала', path: '/cabinet/volumes' }],
        },
      ],
      reviewer: [
        {
          title: 'Обзор',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Рецензии',
          items: [{ label: 'Мои рецензии', path: '/cabinet/reviews' }],
        },
      ],
      layout: [
        {
          title: 'Обзор',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Верстка',
          items: [
            { label: 'Доска макетов', path: '/cabinet/layout' },
            { label: 'Архив (скоро)', tag: 'soon' },
          ],
        },
      ],
      admin: [
        {
          title: 'Обзор',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Администрирование',
          items: [{ label: 'Пользователи', path: '/cabinet/admin/users' }],
        },
      ],
    },
    resourcesTitle: 'Ресурсы',
    terms: 'Правила и политика',
    privacy: 'Приватность',
    logout: 'Выйти',
    langLabel: 'Язык',
    brandTitle: 'Известия университета "Туран-Астана"',
    brandSubtitle: 'Science Journal - Department of Digital Transformation',
    brandAlt: 'Логотип журнала',
    mobileMenuOpen: 'Меню',
    mobileMenuClose: 'Закрыть меню',
    sidebarShow: 'Показать меню',
    sidebarHide: 'Скрыть меню',
  },
  en: {
    roleOptions: {
      author: 'Author',
      editor: 'Editor',
      reviewer: 'Reviewer',
      layout: 'Designer',
      admin: 'Administrator',
    },
    roleSwitcherLabel: 'Role switcher',
    nav: {
      author: [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Submissions',
          items: [
            { label: 'My submissions', path: '/cabinet/submissions' },
            { label: 'New submission', path: '/cabinet/submission' },
            { label: 'Author contract', path: '/authors/contract' },
          ],
        },
      ],
      editor: [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Editorial',
          items: [
            { label: 'Assignments', path: '/cabinet/editorial2' },
            { label: 'Quick publish', path: '/cabinet/quick-publish' },
          ],
        },
        {
          title: 'Volumes',
          items: [{ label: 'Journal issues', path: '/cabinet/volumes' }],
        },
      ],
      reviewer: [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Reviews',
          items: [{ label: 'My reviews', path: '/cabinet/reviews' }],
        },
      ],
      layout: [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Layouts',
          items: [
            { label: 'Layout board', path: '/cabinet/layout' },
            { label: 'Archive (soon)', tag: 'soon' },
          ],
        },
      ],
      admin: [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Administration',
          items: [{ label: 'Users', path: '/cabinet/admin/users' }],
        },
      ],
    },
    resourcesTitle: 'Resources',
    terms: 'Terms & Policies',
    privacy: 'Privacy',
    logout: 'Logout',
    langLabel: 'Language',
    brandTitle: 'Bulletin of Turan-Astana University',
    brandSubtitle: 'Science Journal - Department of Digital Transformation',
    brandAlt: 'Science Journal',
    mobileMenuOpen: 'Menu',
    mobileMenuClose: 'Close menu',
    sidebarShow: 'Show sidebar',
    sidebarHide: 'Hide sidebar',
  },
  kz: {
    roleOptions: {
      author: 'Автор',
      editor: 'Редактор',
      reviewer: 'Рецензент',
      layout: 'Дизайнер',
      admin: 'Әкімші',
    },
    roleSwitcherLabel: 'Рөлді таңдау',
    nav: {
      author: [
        {
          title: 'Шолу',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Қолжазбалар',
          items: [
            { label: 'Менің өтінімдерім', path: '/cabinet/submissions' },
            { label: 'Жаңа өтінім', path: '/cabinet/submission' },
            { label: 'Автор шарты', path: '/authors/contract' },
          ],
        },
      ],
      editor: [
        {
          title: 'Шолу',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Редакция',
          items: [
            { label: 'Тапсырмалар', path: '/cabinet/editorial2' },
            { label: 'Жылдам жариялау', path: '/cabinet/quick-publish' },
          ],
        },
        {
          title: 'Сандар',
          items: [{ label: 'Журнал нөмірлері', path: '/cabinet/volumes' }],
        },
      ],
      reviewer: [
        {
          title: 'Шолу',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Рецензиялар',
          items: [{ label: 'Менің рецензияларым', path: '/cabinet/reviews' }],
        },
      ],
      layout: [
        {
          title: 'Шолу',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Беттеу',
          items: [
            { label: 'Макет тақтасы', path: '/cabinet/layout' },
            { label: 'Мұрағат (жақында)', tag: 'soon' },
          ],
        },
      ],
      admin: [
        {
          title: 'Шолу',
          items: [
            { label: 'Дашборд', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Әкімшілік',
          items: [{ label: 'Пайдаланушылар', path: '/cabinet/admin/users' }],
        },
      ],
    },
    resourcesTitle: 'Ресурстар',
    terms: 'Ережелер мен саясат',
    privacy: 'Құпиялылық',
    logout: 'Шығу',
    langLabel: 'Тіл',
    brandTitle: '«Туран-Астана» университетінің хабаршысы',
    brandSubtitle: 'Science Journal - Цифрлық трансформация департаменті',
    brandAlt: 'Журнал логотипы',
    mobileMenuOpen: 'Мәзір',
    mobileMenuClose: 'Мәзірді жабу',
    sidebarShow: 'Мәзірді көрсету',
    sidebarHide: 'Мәзірді жасыру',
  },
}

const allRoles: RoleKey[] = ['author', 'editor', 'reviewer', 'layout', 'admin']
const isRoleKey = (value: string): value is RoleKey => allRoles.includes(value as RoleKey)
const languageOptions: Lang[] = ['ru', 'en', 'kz']
const roleLandingPage: Record<RoleKey, string> = {
  author: '/cabinet/submissions',
  editor: '/cabinet/editorial2',
  reviewer: '/cabinet/reviews',
  layout: '/cabinet/layout',
  admin: '/cabinet/admin/users',
}

export function MainLayout({ children }: MainLayoutProps) {
  const [activeRole, setActiveRole] = useState<RoleKey>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
    return stored && isRoleKey(stored) ? stored : 'author'
  })
  const [availableRoles, setAvailableRoles] = useState<RoleKey[]>(allRoles)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const roleMenuRef = useRef<HTMLDivElement | null>(null)
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 960px)').matches
  })
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem('cabinetSidebarHidden') === '1'
    } catch {
      return false
    }
  })
  const navigate = useNavigate()
  const { lang, setLang } = useLanguage()
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const handleRoleChange = useCallback((role: RoleKey) => {
    setActiveRole(role)
    setIsRoleMenuOpen(false)
    closeSidebar()
    try {
      window.localStorage.setItem('activeRole', role)
    } catch {}
    navigate(roleLandingPage[role])
  }, [closeSidebar, navigate])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [lowVision, setLowVision] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lowVision')
      return saved === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    let isMounted = true
    const loadRoles = async () => {
      try {
        const response = await api.get<{ user_id: string; roles: string[] }>('/users/me/roles')
        const roles = (response.roles || []).filter(isRoleKey)
        const nextRoles: RoleKey[] =
          roles.includes('admin')
            ? Array.from(new Set<RoleKey>(['admin', 'editor', 'reviewer', 'author', ...roles]))
            : roles.length > 0
              ? roles
              : ['author']
        if (!isMounted) return
        setAvailableRoles(nextRoles)
        setActiveRole((prev) => {
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
          const preferred = stored && isRoleKey(stored) && nextRoles.includes(stored) ? stored : undefined
          return preferred ?? (nextRoles.includes(prev) ? prev : nextRoles[0])
        })
      } catch (error) {
        console.error('Failed to load roles', error)
        if (!isMounted) return
        setAvailableRoles(['author'])
        setActiveRole(() => {
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
          return stored && isRoleKey(stored) ? stored : 'author'
        })
      }
    }
    loadRoles()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadUnread = async () => {
      try {
        const data = await api.get<Array<{ id: number }>>('/notifications', { params: { status: 'unread', limit: 50, offset: 0 } })
        if (!active) return
        setUnreadCount(Array.isArray(data) ? data.length : 0)
      } catch {
        if (!active) return
        setUnreadCount(0)
      }
    }
    loadUnread()
    const interval = setInterval(loadUnread, 60000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(min-width: 960px)')
    const handleBreakpointChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktopViewport(event.matches)
      if (event.matches) {
        setIsSidebarOpen(false)
      }
    }
    handleBreakpointChange(mediaQuery)
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleBreakpointChange)
      return () => mediaQuery.removeEventListener('change', handleBreakpointChange)
    }
    mediaQuery.addListener(handleBreakpointChange)
    return () => mediaQuery.removeListener(handleBreakpointChange)
  }, [])

  useEffect(() => {
    if (!isDesktopViewport) return
    try {
      window.localStorage.setItem('cabinetSidebarHidden', isSidebarHidden ? '1' : '0')
    } catch {}
  }, [isDesktopViewport, isSidebarHidden])

  useEffect(() => {
    setIsRoleMenuOpen(false)
  }, [activeRole, isDesktopViewport])

  useEffect(() => {
    if (!isRoleMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!roleMenuRef.current?.contains(event.target as Node)) {
        setIsRoleMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [isRoleMenuOpen])

  const locale: LangKey = ['ru', 'en', 'kz'].includes(lang) ? (lang as LangKey) : 'ru'
  const copy = sidebarCopy[locale]
  const sections = useMemo(() => copy.nav[activeRole], [activeRole, copy])
  const isSidebarVisible = isDesktopViewport ? !isSidebarHidden : isSidebarOpen
  const toggleSidebar = () => {
    if (isDesktopViewport) {
      setIsSidebarHidden((prev) => !prev)
      return
    }
    setIsSidebarOpen((prev) => !prev)
  }
  const sidebarToggleLabel = isDesktopViewport
    ? isSidebarVisible ? copy.sidebarHide : copy.sidebarShow
    : isSidebarOpen ? copy.mobileMenuClose : copy.mobileMenuOpen

  return (
    <div className={`app-shell ${lowVision ? 'low-vision' : ''} ${isDesktopViewport && !isSidebarVisible ? 'app-shell--sidebar-hidden' : ''}`}>
      <aside id="cabinet-sidebar" className={`sidebar ${isSidebarOpen ? 'sidebar--open' : ''} ${isDesktopViewport && !isSidebarVisible ? 'sidebar--hidden' : ''}`}>
        <div className="sidebar__brand">
          <Link to="/" className="brand--compact">
            <div className="brand-mark">
              <img src={logo} alt={copy.brandAlt} className="brand-logo brand-logo--plain" />
            </div>
            <div>
              <div className="brand-title">{copy.brandTitle}</div>
              <div className="brand-subtitle">{copy.brandSubtitle}</div>
            </div>
          </Link>
        </div>

        <div className="sidebar__lang">
          <div className="sidebar__lang-row">
            {languageOptions.map((code) => (
              <button
                key={code}
                type="button"
                className={`sidebar-lang-icon ${lang === code ? 'sidebar-lang-icon--active' : ''}`}
                onClick={() => setLang(code)}
                aria-label={`Switch to ${code.toUpperCase()}`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="sidebar__accessibility">
            <button
              type="button"
              className={`button button--contrast ${lowVision ? 'button--active' : ''}`}
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
              Aa
            </button>
          </div>
        </div>

        <nav className="sidebar__nav">
          {sections.map((section) => (
            <div className="sidebar__section" key={section.title}>
              <div className="sidebar__section-top">
                <div className="sidebar__section-title">{section.title}</div>
              </div>
              <div className="sidebar__links">
                {section.items.map((item) =>
                  item.path ? (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      className={({ isActive }) =>
                        ['sidebar__link', isActive ? 'sidebar__link--active' : ''].join(' ')
                      }
                      onClick={closeSidebar}
                    >
                      <span className="sidebar__link-label">{item.label}</span>
                      <span className="sidebar__link-meta">
                        {item.path === '/cabinet/notifications' && unreadCount > 0 ? (
                          <span className="sidebar__tag">{unreadCount}</span>
                        ) : null}
                        {item.tag ? <span className="sidebar__tag">{item.tag}</span> : null}
                      </span>
                    </NavLink>
                  ) : (
                    <div
                      key={item.label}
                      className="sidebar__link sidebar__link--static"
                      onClick={closeSidebar}
                    >
                      <span className="sidebar__link-label">{item.label}</span>
                      <span className="sidebar__link-meta">{item.tag ? <span className="sidebar__tag">{item.tag}</span> : null}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__footer-title">{copy.resourcesTitle}</div>
          <div className="sidebar__footer-links">
            <a href="#">{copy.terms}</a>
            <a href="#">{copy.privacy}</a>
          </div>
          <button
            className="button button--ghost button--compact"
            type="button"
            onClick={() => {
              api.logout()
              navigate('/login')
            }}
          >
            {copy.logout}
          </button>
        </div>
      </aside>
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!isSidebarOpen}
      />
      <div className="app-body">
        <div className="mobile-shell-header">
          <button
            type="button"
            className="sidebar-toggle"
            aria-controls="cabinet-sidebar"
            aria-expanded={isSidebarVisible}
            aria-label={sidebarToggleLabel}
            title={sidebarToggleLabel}
            onClick={toggleSidebar}
          >
            <svg
              className="sidebar-toggle__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 6.75V17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              {isSidebarVisible ? (
                <path
                  d="M14.75 9.25L11.75 12L14.75 14.75"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M12.25 9.25L15.25 12L12.25 14.75"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
          <div
            ref={roleMenuRef}
            className={`header-role-switch ${isRoleMenuOpen ? 'header-role-switch--open' : ''}`}
          >
            <button
              type="button"
              className="mobile-shell-role mobile-shell-role--button"
              aria-haspopup="listbox"
              aria-expanded={isRoleMenuOpen}
              aria-label={copy.roleSwitcherLabel}
              title={copy.roleSwitcherLabel}
              onClick={() => setIsRoleMenuOpen((prev) => !prev)}
            >
              <span>{copy.roleOptions[activeRole]}</span>
              <svg
                className="mobile-shell-role__chevron"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isRoleMenuOpen ? (
              <div className="header-role-switch__menu" role="listbox" aria-label={copy.roleSwitcherLabel}>
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`header-role-switch__option ${activeRole === role ? 'header-role-switch__option--active' : ''}`}
                    aria-selected={activeRole === role}
                    onClick={() => handleRoleChange(role)}
                  >
                    {copy.roleOptions[role]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={`button button--contrast mobile-accessibility ${lowVision ? 'button--active' : ''}`}
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
            Aa
          </button>
        </div>
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <div className="footer__brand">
            <div className="brand-mark">
              <img src={logo} alt={copy.brandAlt} className="brand-logo" />
            </div>
            <div>
              <div className="brand-title">{copy.brandTitle}</div>
              <div className="brand-subtitle">{copy.brandSubtitle}</div>
            </div>
          </div>
          <div className="footer__meta">
            <span className="meta-label">c 2025</span>
            <span className="meta-label">All rights reserved</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
