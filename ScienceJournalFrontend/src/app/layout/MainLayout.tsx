import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'
import { api } from '../../api/client'
import { useLanguage } from '../../shared/LanguageContext'
import type { Lang } from '../../shared/labels'

interface MainLayoutProps {
  children: ReactNode
}

type RoleKey = 'author' | 'editor' | 'reviewer' | 'designer'

const roleOptions: Record<RoleKey, string> = {
  author: 'Author',
  editor: 'Editor',
  reviewer: 'Reviewer',
  designer: 'Designer',
}

const roleNav: Record<
  RoleKey,
  {
    title: string
    items: { label: string; path?: string; tag?: string }[]
  }[]
> = {
  author: [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/cabinet' },
        { label: 'Profile', path: '/cabinet/profile' },
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
  const navigate = useNavigate()
  const { lang, setLang } = useLanguage()

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

  const sections = useMemo(() => roleNav[activeRole], [activeRole])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Link to="/" className="brand--compact">
            <div className="brand-mark">
              <img src={logo} alt="Science Journal" className="brand-logo brand-logo--plain" />
            </div>
            <div>
              <div className="brand-title">Izvestiya universiteta "Turan-Astana"</div>
              <div className="brand-subtitle">Science Journal - Department of Digital Transformation</div>
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
              {roleOptions[role]}
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
                    >
                      <span>{item.label}</span>
                      {item.tag ? <span className="sidebar__tag">{item.tag}</span> : null}
                    </NavLink>
                  ) : (
                    <div key={item.label} className="sidebar__link sidebar__link--static">
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
          <div className="sidebar__footer-title">Resources</div>
          <div className="sidebar__footer-links">
            <a href="#">Terms & Policies</a>
            <a href="#">Privacy</a>
          </div>
          <button
            className="button button--ghost button--compact"
            type="button"
            onClick={() => {
              api.logout()
              navigate('/login')
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="app-body">
        <main className="app-main">{children}</main>
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
            <span className="meta-label">c 2025</span>
            <span className="meta-label">All rights reserved</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
