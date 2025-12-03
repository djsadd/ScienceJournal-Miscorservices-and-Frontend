import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'
import { api } from '../../api/client'
import { useLanguage } from '../../shared/LanguageContext'
import type { Lang } from '../../shared/labels'

interface MainLayoutProps {
  children: ReactNode
}

type RoleKey = 'author' | 'editor' | 'reviewer' | 'designer'
type LangKey = 'ru' | 'en' | 'kz'

type SidebarCopy = {
  roleOptions: Record<RoleKey, string>
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
}

const sidebarCopy: Record<LangKey, SidebarCopy> = {
  ru: {
    roleOptions: {
      author: 'Автор',
      editor: 'Редактор',
      reviewer: 'Рецензент',
      designer: 'Вёрстальщик',
    },
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
          items: [{ label: 'Назначения', path: '/cabinet/editorial2' }],
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
      designer: [
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
  },
  en: {
    roleOptions: {
      author: 'Author',
      editor: 'Editor',
      reviewer: 'Reviewer',
      designer: 'Designer',
    },
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
          items: [{ label: 'Assignments', path: '/cabinet/editorial2' }],
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
      designer: [
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
  },
  kz: {
    roleOptions: {
      author: 'Автор',
      editor: 'Редактор',
      reviewer: 'Рецензент',
      designer: 'Дизайнер',
    },
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
          items: [{ label: 'Тапсырмалар', path: '/cabinet/editorial2' }],
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
      designer: [
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
  },
}

const allRoles: RoleKey[] = ['author', 'editor', 'reviewer', 'designer']
const isRoleKey = (value: string): value is RoleKey => allRoles.includes(value as RoleKey)
const languageOptions: Lang[] = ['ru', 'en', 'kz']

export function MainLayout({ children }: MainLayoutProps) {
  const [activeRole, setActiveRole] = useState<RoleKey>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
    return stored && isRoleKey(stored) ? stored : 'author'
  })
  const [availableRoles, setAvailableRoles] = useState<RoleKey[]>(allRoles)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { lang, setLang } = useLanguage()
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
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
        const nextRoles: RoleKey[] = roles.length > 0 ? roles : ['author']
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
      } catch (e) {
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

  const locale: LangKey = ['ru', 'en', 'kz'].includes(lang) ? (lang as LangKey) : 'ru'
  const copy = sidebarCopy[locale]
  const sections = useMemo(() => copy.nav[activeRole], [activeRole, copy])

  return (
    <div className={`app-shell ${lowVision ? 'low-vision' : ''}`}>
      <aside id="cabinet-sidebar" className={`sidebar ${isSidebarOpen ? 'sidebar--open' : ''}`}>
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

        <div className="role-switch">
          {availableRoles.map((role) => (
            <button
              key={role}
              type="button"
              className={`role-chip ${activeRole === role ? 'role-chip--active' : ''}`}
              onClick={() => {
                setActiveRole(role)
                try {
                  window.localStorage.setItem('activeRole', role)
                } catch {}
              }}
            >
              {copy.roleOptions[role]}
            </button>
          ))}
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
              👁️
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
                      <span>{item.label}</span>
                      {item.path === '/cabinet/notifications' && unreadCount > 0 ? (
                        <span className="sidebar__tag">{unreadCount}</span>
                      ) : null}
                      {item.tag ? <span className="sidebar__tag">{item.tag}</span> : null}
                    </NavLink>
                  ) : (
                    <div
                      key={item.label}
                      className="sidebar__link sidebar__link--static"
                      onClick={closeSidebar}
                    >
                      <span>{item.label}</span>
                      {item.tag ? <span className="sidebar__tag">{item.tag}</span> : null}
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
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            {isSidebarOpen ? copy.mobileMenuClose : copy.mobileMenuOpen}
          </button>
          <span className="mobile-shell-role">{copy.roleOptions[activeRole]}</span>
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
            👁️
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
