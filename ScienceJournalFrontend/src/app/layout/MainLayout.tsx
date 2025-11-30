import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'
import { api } from '../../api/client'

interface MainLayoutProps {
  children: ReactNode
}

type RoleKey = 'author' | 'editor' | 'reviewer' | 'designer'

const roleOptions: Record<RoleKey, string> = {
  author: 'Автор',
  editor: 'Редактор',
  reviewer: 'Рецензент',
  designer: 'Верстальщик',
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
      title: 'Главная',
      items: [
        { label: 'Главная', path: '/cabinet' },
        { label: 'Профиль', path: '/cabinet/profile' },
      ],
    },
    {
      title: 'Работа с рукописями',
      items: [
        { label: 'Мои рукописи', path: '/cabinet/submissions' },
        { label: 'Новая рукопись', path: '/cabinet/submission' },
        { label: 'Авторский договор', path: '/authors/contract' },
      ],
    },
  ],
  editor: [
    {
      title: 'Главная',
      items: [
        { label: 'Главная', path: '/cabinet' },
        { label: 'Профиль', path: '/cabinet/profile' },
      ],
    },
    {
      title: 'Редакционный поток',
      items: [
        { label: 'Редакционный портфель', path: '/cabinet/editorial2' },
      ],
    },
    {
      title: 'Коллекция томов',
      items: [
        { label: 'Мои тома', path: '/cabinet/volumes' },
      ],
    },
  ],
  reviewer: [
    {
      title: 'Главная',
      items: [
        { label: 'Главная', path: '/cabinet' },
        { label: 'Профиль', path: '/cabinet/profile' },
      ],
    },
    {
      title: 'Рецензирование',
      items: [
        { label: 'Мои рецензии', path: '/cabinet/reviews' },
      ],
    },
  ],
  designer: [
    {
      title: 'Главная',
      items: [
        { label: 'Главная', path: '/cabinet' },
        { label: 'Профиль', path: '/cabinet/profile' },
      ],
    },
    {
      title: 'Верстка номеров',
      items: [
        { label: 'Макеты и номера', path: '/cabinet/layout' },
        { label: 'Задачи (скоро)', tag: 'скоро' },
      ],
    },
  ],
}

const allRoles: RoleKey[] = ['author', 'editor', 'reviewer', 'designer']
const isRoleKey = (value: string): value is RoleKey => allRoles.includes(value as RoleKey)

export function MainLayout({ children }: MainLayoutProps) {
  const [activeRole, setActiveRole] = useState<RoleKey>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
    return stored && isRoleKey(stored) ? stored : 'author'
  })
  const [availableRoles, setAvailableRoles] = useState<RoleKey[]>(allRoles)
  const navigate = useNavigate()

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
              <img src={logo} alt="Логотип журнала" className="brand-logo brand-logo--plain" />
            </div>
            <div>
              <div className="brand-title">Известия университета «Туран-Астана»</div>
            <div className="brand-subtitle">Science Journal · Департамент цифровой трансформации</div>
            </div>
          </div>
          <div className="footer__meta">
            <span className="meta-label">c 2025</span>
            <span className="meta-label">Все права защищены</span>
          </div>
        </footer>
      </div>
    </div>
  )
}



