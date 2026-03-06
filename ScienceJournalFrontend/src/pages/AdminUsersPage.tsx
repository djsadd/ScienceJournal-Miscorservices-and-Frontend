import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type AdminUser = {
  id: number
  username: string
  full_name?: string | null
  email: string
  role: 'author' | 'reviewer' | 'editor' | 'layout' | 'admin'
  is_active: boolean
  organization?: string | null
  phone?: string | null
  preferred_language?: string | null
}

type AdminUserStats = {
  total: number
  active: number
  inactive: number
  pending: number
  by_role: Record<string, number>
}

type PasswordResetResult = {
  user_id: number
  temporary_password: string
  generated: boolean
}

const roleOptions: AdminUser['role'][] = ['author', 'reviewer', 'editor', 'layout', 'admin']

const roleLabels: Record<string, Record<AdminUser['role'], string>> = {
  ru: {
    author: 'Автор',
    reviewer: 'Рецензент',
    editor: 'Редактор',
    layout: 'Верстальщик',
    admin: 'Администратор',
  },
  en: {
    author: 'Author',
    reviewer: 'Reviewer',
    editor: 'Editor',
    layout: 'Layout',
    admin: 'Administrator',
  },
  kz: {
    author: 'Автор',
    reviewer: 'Рецензент',
    editor: 'Редактор',
    layout: 'Беттеуші',
    admin: 'Әкімші',
  },
}

const copy = {
  ru: {
    title: 'Пользователи',
    subtitle: 'Управление ролями, активацией и сбросом паролей.',
    refresh: 'Обновить',
    search: 'Поиск по имени, username или email',
    allRoles: 'Все роли',
    allStatuses: 'Все статусы',
    active: 'Активные',
    inactive: 'Неактивные',
    pending: 'Ожидают подтверждения',
    total: 'Всего пользователей',
    activeUsers: 'Активные',
    inactiveUsers: 'Неактивные',
    pendingUsers: 'На подтверждении',
    user: 'Пользователь',
    role: 'Роль',
    status: 'Статус',
    contacts: 'Контакты',
    actions: 'Действия',
    saveRole: 'Сменить роль',
    deactivate: 'Деактивировать',
    activate: 'Активировать',
    newPassword: 'Новый пароль',
    generate: 'Сгенерировать',
    reset: 'Сбросить пароль',
    activeBadge: 'Активен',
    inactiveBadge: 'Неактивен',
    tempPassword: 'Временный пароль',
    empty: 'Пользователи не найдены',
    loadError: 'Не удалось загрузить данные админки',
  },
  en: {
    title: 'Users',
    subtitle: 'Manage roles, activation and password resets.',
    refresh: 'Refresh',
    search: 'Search by name, username or email',
    allRoles: 'All roles',
    allStatuses: 'All statuses',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending approval',
    total: 'Total users',
    activeUsers: 'Active',
    inactiveUsers: 'Inactive',
    pendingUsers: 'Pending',
    user: 'User',
    role: 'Role',
    status: 'Status',
    contacts: 'Contacts',
    actions: 'Actions',
    saveRole: 'Update role',
    deactivate: 'Deactivate',
    activate: 'Activate',
    newPassword: 'New password',
    generate: 'Generate',
    reset: 'Reset password',
    activeBadge: 'Active',
    inactiveBadge: 'Inactive',
    tempPassword: 'Temporary password',
    empty: 'No users found',
    loadError: 'Failed to load admin data',
  },
  kz: {
    title: 'Пайдаланушылар',
    subtitle: 'Рөлдер, белсендіру және құпиясөзді қалпына келтіруді басқару.',
    refresh: 'Жаңарту',
    search: 'Аты, username немесе email бойынша іздеу',
    allRoles: 'Барлық рөлдер',
    allStatuses: 'Барлық мәртебелер',
    active: 'Белсенді',
    inactive: 'Белсенді емес',
    pending: 'Мақұлдауды күтуде',
    total: 'Барлық пайдаланушы',
    activeUsers: 'Белсенді',
    inactiveUsers: 'Белсенді емес',
    pendingUsers: 'Күтуде',
    user: 'Пайдаланушы',
    role: 'Рөл',
    status: 'Мәртебе',
    contacts: 'Байланыс',
    actions: 'Әрекеттер',
    saveRole: 'Рөлді өзгерту',
    deactivate: 'Өшіру',
    activate: 'Іске қосу',
    newPassword: 'Жаңа құпиясөз',
    generate: 'Генерациялау',
    reset: 'Құпиясөзді жаңарту',
    activeBadge: 'Белсенді',
    inactiveBadge: 'Белсенді емес',
    tempPassword: 'Уақытша құпиясөз',
    empty: 'Пайдаланушылар табылмады',
    loadError: 'Әкімші деректерін жүктеу мүмкін болмады',
  },
} as const

export default function AdminUsersPage() {
  const { lang } = useLanguage()
  const t = copy[(lang === 'en' || lang === 'kz' ? lang : 'ru') as 'ru' | 'en' | 'kz']
  const roleText = roleLabels[(lang === 'en' || lang === 'kz' ? lang : 'ru') as 'ru' | 'en' | 'kz']
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUserStats | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AdminUser['role']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [draftRoles, setDraftRoles] = useState<Record<number, AdminUser['role']>>({})
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, string>>({})
  const [passwordResults, setPasswordResults] = useState<Record<number, string>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, statsData] = await Promise.all([
        api.getAdminUsers<AdminUser[]>(),
        api.getAdminUserStats<AdminUserStats>(),
      ])
      setUsers(usersData)
      setStats(statsData)
      setDraftRoles(Object.fromEntries(usersData.map((user) => [user.id, user.role])))
    } catch (err) {
      console.error(err)
      setError(err instanceof ApiError ? `${t.loadError}: ${err.status}` : t.loadError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.full_name, user.username, user.email, user.organization]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const handleRoleUpdate = async (userId: number) => {
    const role = draftRoles[userId]
    if (!role) return
    setSavingKey(`role-${userId}`)
    try {
      await api.updateAdminUserRole(userId, role)
      await load()
    } finally {
      setSavingKey(null)
    }
  }

  const handleStatusToggle = async (user: AdminUser) => {
    setSavingKey(`status-${user.id}`)
    try {
      await api.activateAdminUser(user.id, !user.is_active)
      await load()
    } finally {
      setSavingKey(null)
    }
  }

  const handlePasswordReset = async (userId: number) => {
    setSavingKey(`password-${userId}`)
    try {
      const result = await api.resetAdminUserPassword<PasswordResetResult>(userId, passwordDrafts[userId]?.trim() || undefined)
      setPasswordDrafts((prev) => ({ ...prev, [userId]: '' }))
      setPasswordResults((prev) => ({ ...prev, [userId]: result.temporary_password }))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="page admin-users">
      <section className="section-header">
        <div>
          <p className="eyebrow">{roleText.admin}</p>
          <h1 className="page-title">{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <button type="button" className="button button--ghost" onClick={load} disabled={loading}>
          {t.refresh}
        </button>
      </section>

      {stats ? (
        <section className="grid grid-4 admin-users__stats">
          <div className="panel panel--compact">
            <div className="table__meta">{t.total}</div>
            <div className="role-stat__value">{stats.total}</div>
          </div>
          <div className="panel panel--compact">
            <div className="table__meta">{t.activeUsers}</div>
            <div className="role-stat__value">{stats.active}</div>
          </div>
          <div className="panel panel--compact">
            <div className="table__meta">{t.inactiveUsers}</div>
            <div className="role-stat__value">{stats.inactive}</div>
          </div>
          <div className="panel panel--compact">
            <div className="table__meta">{t.pendingUsers}</div>
            <div className="role-stat__value">{stats.pending}</div>
          </div>
        </section>
      ) : null}

      {stats ? (
        <section className="panel admin-users__roles">
          <div className="actions">
            {Object.entries(stats.by_role).map(([role, count]) => (
              <span key={role} className="pill">
                {roleText[role as AdminUser['role']] ?? role}: {count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="admin-users__filters">
          <input
            className="text-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.search}
          />
          <select
            className="text-input"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | AdminUser['role'])}
          >
            <option value="all">{t.allRoles}</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleText[role]}
              </option>
            ))}
          </select>
          <select
            className="text-input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">{t.allStatuses}</option>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
          </select>
        </div>

        {error ? <div className="table__empty">{error}</div> : null}

        <div className="table table--admin-users">
          <div className="table__head">
            <span>{t.user}</span>
            <span>{t.role}</span>
            <span>{t.status}</span>
            <span>{t.contacts}</span>
            <span>{t.actions}</span>
          </div>
          <div className="table__body">
            {loading ? (
              <div className="table__empty">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="table__empty">{t.empty}</div>
            ) : (
              filteredUsers.map((user) => (
                <div className="table__row table__row--align" key={user.id}>
                  <div className="table__cell table__cell--title">
                    <div className="table__title">{user.full_name || user.username}</div>
                    <div className="table__meta">#{user.id} · @{user.username}</div>
                  </div>
                  <div className="table__cell">
                    <select
                      className="text-input"
                      value={draftRoles[user.id] ?? user.role}
                      onChange={(event) =>
                        setDraftRoles((prev) => ({ ...prev, [user.id]: event.target.value as AdminUser['role'] }))
                      }
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleText[role]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button--ghost button--compact"
                      disabled={savingKey === `role-${user.id}`}
                      onClick={() => handleRoleUpdate(user.id)}
                    >
                      {t.saveRole}
                    </button>
                  </div>
                  <div className="table__cell">
                    <span className={`status-chip status-chip--${user.is_active ? 'accepted' : 'rejected'}`}>
                      {user.is_active ? t.activeBadge : t.inactiveBadge}
                    </span>
                    {!user.is_active && (user.role === 'editor' || user.role === 'reviewer') ? (
                      <span className="table__meta">{t.pending}</span>
                    ) : null}
                  </div>
                  <div className="table__cell">
                    <div>{user.email}</div>
                    <div className="table__meta">{user.phone || user.organization || '—'}</div>
                    <div className="table__meta">{user.preferred_language || '—'}</div>
                  </div>
                  <div className="table__cell admin-users__actions">
                    <button
                      type="button"
                      className="button button--ghost button--compact"
                      disabled={savingKey === `status-${user.id}`}
                      onClick={() => handleStatusToggle(user)}
                    >
                      {user.is_active ? t.deactivate : t.activate}
                    </button>
                    <input
                      className="text-input"
                      value={passwordDrafts[user.id] ?? ''}
                      onChange={(event) => setPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))}
                      placeholder={t.newPassword}
                    />
                    <div className="actions">
                      <button
                        type="button"
                        className="button button--ghost button--compact"
                        disabled={savingKey === `password-${user.id}`}
                        onClick={() => handlePasswordReset(user.id)}
                      >
                        {passwordDrafts[user.id]?.trim() ? t.reset : t.generate}
                      </button>
                    </div>
                    {passwordResults[user.id] ? (
                      <div className="admin-users__password-result">
                        <span className="table__meta">{t.tempPassword}</span>
                        <code>{passwordResults[user.id]}</code>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
