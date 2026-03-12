import { useEffect, useMemo, useState } from 'react'

import { api, ApiError } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import ConfirmModal from '../shared/components/ConfirmModal'

type AdminRole = 'author' | 'reviewer' | 'editor' | 'layout' | 'admin'

type AdminUser = {
  id: number
  username: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email: string
  role: AdminRole
  is_active: boolean
  is_hidden: boolean
  organization?: string | null
  institution?: string | null
  phone?: string | null
  preferred_language?: string | null
  accept_terms?: boolean
  notify_status?: boolean
  roles?: string[]
  profile_id?: number | null
  is_council_member?: boolean | null
  is_collegium_member?: boolean | null
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

type LangKey = 'ru' | 'en' | 'kz'

const roleOptions: AdminRole[] = ['author', 'reviewer', 'editor', 'layout', 'admin']
const PAGE_SIZE = 10

const roleLabels: Record<LangKey, Record<AdminRole, string>> = {
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

const copy: Record<
  LangKey,
  {
    title: string
    subtitle: string
    refresh: string
    search: string
    allRoles: string
    allStatuses: string
    active: string
    inactive: string
    pending: string
    total: string
    activeUsers: string
    inactiveUsers: string
    pendingUsers: string
    user: string
    role: string
    status: string
    contacts: string
    actions: string
    open: string
    close: string
    saveRole: string
    deactivate: string
    activate: string
    newPassword: string
    generate: string
    reset: string
    activeBadge: string
    inactiveBadge: string
    tempPassword: string
    empty: string
    loadError: string
    loading: string
    detailsTitle: string
    detailsSubtitle: string
    fullName: string
    firstName: string
    lastName: string
    email: string
    username: string
    organization: string
    institution: string
    phone: string
    language: string
    profileId: string
    accountState: string
    notifications: string
    terms: string
    extraRoles: string
    councilMember: string
    collegiumMember: string
    yes: string
    no: string
    notSpecified: string
    dangerZone: string
    delete: string
    deleteTitle: string
    deleteMessage: string
    deleteConfirm: string
    detailError: string
    passwordLabel: string
    previousPage: string
    nextPage: string
    pageMeta: string
    pageSummary: string
  }
> = {
  ru: {
    title: 'Пользователи',
    subtitle: 'Управление учетными записями, ролями и доступом.',
    refresh: 'Обновить',
    search: 'Поиск по имени, username, email или организации',
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
    open: 'Подробнее',
    close: 'Закрыть',
    saveRole: 'Сохранить роль',
    deactivate: 'Деактивировать',
    activate: 'Активировать',
    newPassword: 'Новый пароль',
    generate: 'Сгенерировать',
    reset: 'Сбросить пароль',
    activeBadge: 'Активен',
    inactiveBadge: 'Неактивен',
    tempPassword: 'Временный пароль',
    empty: 'Пользователи не найдены',
    loadError: 'Не удалось загрузить данные пользователей',
    loading: 'Загрузка...',
    detailsTitle: 'Карточка пользователя',
    detailsSubtitle: 'Полная информация и административные действия.',
    fullName: 'Полное имя',
    firstName: 'Имя',
    lastName: 'Фамилия',
    email: 'Email',
    username: 'Username',
    organization: 'Организация',
    institution: 'Подразделение',
    phone: 'Телефон',
    language: 'Язык',
    profileId: 'ID профиля',
    accountState: 'Состояние аккаунта',
    notifications: 'Email-уведомления',
    terms: 'Принял условия',
    extraRoles: 'Роли профиля',
    councilMember: 'Член совета',
    collegiumMember: 'Член коллегии',
    yes: 'Да',
    no: 'Нет',
    notSpecified: 'Не указано',
    dangerZone: 'Опасная зона',
    delete: 'Удалить пользователя',
    deleteTitle: 'Скрыть пользователя',
    deleteMessage: 'Пользователь будет скрыт в базе, деактивирован и исчезнет из админского списка.',
    deleteConfirm: 'Скрыть',
    detailError: 'Не удалось загрузить карточку пользователя',
    passwordLabel: 'Управление паролем',
    previousPage: 'Назад',
    nextPage: 'Вперед',
    pageMeta: 'Стр. {current} / {total}',
    pageSummary: 'Показано {from}-{to} из {total}',
  },
  en: {
    title: 'Users',
    subtitle: 'Manage accounts, roles, and access.',
    refresh: 'Refresh',
    search: 'Search by name, username, email, or organization',
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
    open: 'Details',
    close: 'Close',
    saveRole: 'Save role',
    deactivate: 'Deactivate',
    activate: 'Activate',
    newPassword: 'New password',
    generate: 'Generate',
    reset: 'Reset password',
    activeBadge: 'Active',
    inactiveBadge: 'Inactive',
    tempPassword: 'Temporary password',
    empty: 'No users found',
    loadError: 'Failed to load users',
    loading: 'Loading...',
    detailsTitle: 'User details',
    detailsSubtitle: 'Full profile and administrative actions.',
    fullName: 'Full name',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    username: 'Username',
    organization: 'Organization',
    institution: 'Institution',
    phone: 'Phone',
    language: 'Language',
    profileId: 'Profile ID',
    accountState: 'Account state',
    notifications: 'Email notifications',
    terms: 'Accepted terms',
    extraRoles: 'Profile roles',
    councilMember: 'Council member',
    collegiumMember: 'Collegium member',
    yes: 'Yes',
    no: 'No',
    notSpecified: 'Not specified',
    dangerZone: 'Danger zone',
    delete: 'Delete user',
    deleteTitle: 'Hide user',
    deleteMessage: 'The user will be hidden in the database, deactivated, and removed from the admin list.',
    deleteConfirm: 'Hide',
    detailError: 'Failed to load user details',
    passwordLabel: 'Password management',
    previousPage: 'Previous',
    nextPage: 'Next',
    pageMeta: 'Page {current} / {total}',
    pageSummary: 'Showing {from}-{to} of {total}',
  },
  kz: {
    title: 'Пайдаланушылар',
    subtitle: 'Аккаунттар, рөлдер және рұқсаттарды басқару.',
    refresh: 'Жаңарту',
    search: 'Аты, username, email немесе ұйым бойынша іздеу',
    allRoles: 'Барлық рөлдер',
    allStatuses: 'Барлық мәртебелер',
    active: 'Белсенді',
    inactive: 'Белсенді емес',
    pending: 'Растауды күтуде',
    total: 'Барлық пайдаланушы',
    activeUsers: 'Белсенді',
    inactiveUsers: 'Белсенді емес',
    pendingUsers: 'Күтуде',
    user: 'Пайдаланушы',
    role: 'Рөл',
    status: 'Мәртебе',
    contacts: 'Байланыс',
    actions: 'Әрекеттер',
    open: 'Толығырақ',
    close: 'Жабу',
    saveRole: 'Рөлді сақтау',
    deactivate: 'Өшіру',
    activate: 'Белсендіру',
    newPassword: 'Жаңа пароль',
    generate: 'Генерациялау',
    reset: 'Парольді жаңарту',
    activeBadge: 'Белсенді',
    inactiveBadge: 'Белсенді емес',
    tempPassword: 'Уақытша пароль',
    empty: 'Пайдаланушылар табылмады',
    loadError: 'Пайдаланушыларды жүктеу мүмкін болмады',
    loading: 'Жүктелуде...',
    detailsTitle: 'Пайдаланушы картасы',
    detailsSubtitle: 'Толық ақпарат және әкімшілік әрекеттер.',
    fullName: 'Толық аты',
    firstName: 'Аты',
    lastName: 'Тегі',
    email: 'Email',
    username: 'Username',
    organization: 'Ұйым',
    institution: 'Бөлімше',
    phone: 'Телефон',
    language: 'Тіл',
    profileId: 'Профиль ID',
    accountState: 'Аккаунт күйі',
    notifications: 'Email хабарламалары',
    terms: 'Шарттарды қабылдады',
    extraRoles: 'Профиль рөлдері',
    councilMember: 'Кеңес мүшесі',
    collegiumMember: 'Алқа мүшесі',
    yes: 'Иә',
    no: 'Жоқ',
    notSpecified: 'Көрсетілмеген',
    dangerZone: 'Қауіпті аймақ',
    delete: 'Пайдаланушыны жою',
    deleteTitle: 'Пайдаланушыны жасыру',
    deleteMessage: 'Пайдаланушы базада жасырылып, белсенділігі өшіріліп, админ тізімінен жоғалады.',
    deleteConfirm: 'Жасыру',
    detailError: 'Пайдаланушы картасын жүктеу мүмкін болмады',
    passwordLabel: 'Парольді басқару',
    previousPage: 'Алдыңғы',
    nextPage: 'Келесі',
    pageMeta: 'Бет {current} / {total}',
    pageSummary: '{total} ішінен {from}-{to} көрсетілді',
  },
}

const getBoolText = (value: boolean | null | undefined, t: (typeof copy)[LangKey]) =>
  value == null ? t.notSpecified : value ? t.yes : t.no

const getDisplayName = (user: Pick<AdminUser, 'full_name' | 'first_name' | 'last_name' | 'username'>) =>
  user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username

export default function AdminUsersPage() {
  const { lang } = useLanguage()
  const locale = (lang === 'en' || lang === 'kz' ? lang : 'ru') as LangKey
  const t = copy[locale]
  const roleText = roleLabels[locale]

  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUserStats | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [draftRoles, setDraftRoles] = useState<Record<number, AdminRole>>({})
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
      setSelectedUser((prev) => (prev ? usersData.find((user) => user.id === prev.id) ?? prev : prev))
    } catch (err) {
      console.error(err)
      setError(err instanceof ApiError ? `${t.loadError}: ${err.status}` : t.loadError)
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetails = async (userId: number) => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const data = await api.getAdminUserDetail<AdminUser>(userId)
      setSelectedUser(data)
      setDraftRoles((prev) => ({ ...prev, [data.id]: data.role }))
    } catch (err) {
      console.error(err)
      setDetailError(err instanceof ApiError ? `${t.detailError}: ${err.status}` : t.detailError)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (selectedUserId == null) return
    void loadUserDetails(selectedUserId)
  }, [selectedUserId])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.full_name, user.first_name, user.last_name, user.username, user.email, user.organization, user.institution]
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const pageStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = filteredUsers.length === 0 ? 0 : pageStart + paginatedUsers.length - 1

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const closeModal = () => {
    setSelectedUserId(null)
    setSelectedUser(null)
    setDetailError(null)
    setConfirmDeleteOpen(false)
  }

  const openModal = (userId: number) => {
    setSelectedUserId(userId)
    setSelectedUser(users.find((user) => user.id === userId) ?? null)
    setDetailError(null)
  }

  const handleRoleUpdate = async (userId: number) => {
    const role = draftRoles[userId]
    if (!role) return
    setSavingKey(`role-${userId}`)
    try {
      await api.updateAdminUserRole(userId, role)
      await Promise.all([load(), loadUserDetails(userId)])
    } finally {
      setSavingKey(null)
    }
  }

  const handleStatusToggle = async (user: AdminUser) => {
    setSavingKey(`status-${user.id}`)
    try {
      await api.activateAdminUser(user.id, !user.is_active)
      await Promise.all([load(), loadUserDetails(user.id)])
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

  const handleDelete = async () => {
    if (!selectedUserId) return
    setSavingKey(`delete-${selectedUserId}`)
    try {
      await api.deleteAdminUser(selectedUserId)
      setConfirmDeleteOpen(false)
      await load()
      closeModal()
    } finally {
      setSavingKey(null)
    }
  }

  const modalUser = selectedUser

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
                {roleText[role as AdminRole] ?? role}: {count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="admin-users__filters">
          <input className="text-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
          <select
            className="text-input"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | AdminRole)}
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
              <div className="table__empty">{t.loading}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="table__empty">{t.empty}</div>
            ) : (
              paginatedUsers.map((user) => (
                <div className="table__row table__row--align" key={user.id}>
                  <div className="table__cell table__cell--title">
                    <div className="table__title">{getDisplayName(user)}</div>
                    <div className="table__meta">
                      #{user.id} · @{user.username}
                    </div>
                  </div>
                  <div className="table__cell">
                    <span className="pill">{roleText[user.role]}</span>
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
                    <div className="table__meta">{user.phone || user.organization || t.notSpecified}</div>
                  </div>
                  <div className="table__cell admin-users__actions">
                    <button type="button" className="button button--ghost button--compact" onClick={() => openModal(user.id)}>
                      {t.open}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {!loading && filteredUsers.length > 0 ? (
          <div className="admin-users__pagination">
            <span className="pagination__meta">
              {t.pageSummary
                .replace('{from}', String(pageStart))
                .replace('{to}', String(pageEnd))
                .replace('{total}', String(filteredUsers.length))}
            </span>
            <div className="pagination">
              <button
                type="button"
                className="button button--ghost button--compact"
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {t.previousPage}
              </button>
              <span className="pagination__meta">
                {t.pageMeta.replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
              </span>
              <button
                type="button"
                className="button button--ghost button--compact"
                disabled={currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                {t.nextPage}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedUserId != null ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal modal--wide admin-user-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <div>
                <div className="modal__title">{modalUser ? getDisplayName(modalUser) : t.detailsTitle}</div>
                <div className="table__meta">{t.detailsSubtitle}</div>
              </div>
              <button type="button" className="modal__close" onClick={closeModal} aria-label={t.close}>
                ×
              </button>
            </div>

            <div className="modal__body">
              {detailLoading && !modalUser ? <div className="table__empty">{t.loading}</div> : null}
              {detailError ? <div className="table__empty">{detailError}</div> : null}

              {modalUser ? (
                <div className="admin-user-modal__content">
                  <section className="admin-user-modal__grid">
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.fullName}</div>
                      <div>{getDisplayName(modalUser)}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.username}</div>
                      <div>@{modalUser.username}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.email}</div>
                      <div>{modalUser.email}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.phone}</div>
                      <div>{modalUser.phone || t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.organization}</div>
                      <div>{modalUser.organization || t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.institution}</div>
                      <div>{modalUser.institution || t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.firstName}</div>
                      <div>{modalUser.first_name || t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.lastName}</div>
                      <div>{modalUser.last_name || t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.language}</div>
                      <div>{modalUser.preferred_language || t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.profileId}</div>
                      <div>{modalUser.profile_id ?? t.notSpecified}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.notifications}</div>
                      <div>{getBoolText(modalUser.notify_status, t)}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.terms}</div>
                      <div>{getBoolText(modalUser.accept_terms, t)}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.councilMember}</div>
                      <div>{getBoolText(modalUser.is_council_member, t)}</div>
                    </div>
                    <div className="panel panel--compact">
                      <div className="table__meta">{t.collegiumMember}</div>
                      <div>{getBoolText(modalUser.is_collegium_member, t)}</div>
                    </div>
                    <div className="panel panel--compact admin-user-modal__wide-card">
                      <div className="table__meta">{t.extraRoles}</div>
                      <div>{modalUser.roles?.length ? modalUser.roles.map((role) => roleText[role as AdminRole] ?? role).join(', ') : t.notSpecified}</div>
                    </div>
                  </section>

                  <section className="panel admin-user-modal__controls">
                    <div className="admin-user-modal__section-title">{t.accountState}</div>
                    <div className="admin-user-modal__toolbar">
                      <span className={`status-chip status-chip--${modalUser.is_active ? 'accepted' : 'rejected'}`}>
                        {modalUser.is_active ? t.activeBadge : t.inactiveBadge}
                      </span>
                      <button
                        type="button"
                        className="button button--ghost button--compact"
                        disabled={savingKey === `status-${modalUser.id}`}
                        onClick={() => handleStatusToggle(modalUser)}
                      >
                        {modalUser.is_active ? t.deactivate : t.activate}
                      </button>
                    </div>
                  </section>

                  <section className="panel admin-user-modal__controls">
                    <div className="admin-user-modal__section-title">{t.role}</div>
                    <div className="admin-user-modal__toolbar">
                      <select
                        className="text-input"
                        value={draftRoles[modalUser.id] ?? modalUser.role}
                        onChange={(event) => setDraftRoles((prev) => ({ ...prev, [modalUser.id]: event.target.value as AdminRole }))}
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
                        disabled={savingKey === `role-${modalUser.id}`}
                        onClick={() => handleRoleUpdate(modalUser.id)}
                      >
                        {t.saveRole}
                      </button>
                    </div>
                  </section>

                  <section className="panel admin-user-modal__controls">
                    <div className="admin-user-modal__section-title">{t.passwordLabel}</div>
                    <div className="admin-user-modal__toolbar admin-user-modal__toolbar--stretch">
                      <input
                        className="text-input"
                        value={passwordDrafts[modalUser.id] ?? ''}
                        onChange={(event) => setPasswordDrafts((prev) => ({ ...prev, [modalUser.id]: event.target.value }))}
                        placeholder={t.newPassword}
                      />
                      <button
                        type="button"
                        className="button button--ghost button--compact"
                        disabled={savingKey === `password-${modalUser.id}`}
                        onClick={() => handlePasswordReset(modalUser.id)}
                      >
                        {passwordDrafts[modalUser.id]?.trim() ? t.reset : t.generate}
                      </button>
                    </div>
                    {passwordResults[modalUser.id] ? (
                      <div className="admin-users__password-result">
                        <span className="table__meta">{t.tempPassword}</span>
                        <code>{passwordResults[modalUser.id]}</code>
                      </div>
                    ) : null}
                  </section>

                  <section className="panel admin-user-modal__controls admin-user-modal__danger">
                    <div className="admin-user-modal__section-title">{t.dangerZone}</div>
                    <p className="table__meta">{t.deleteMessage}</p>
                    <button
                      type="button"
                      className="button button--ghost button--compact admin-user-modal__delete"
                      disabled={savingKey === `delete-${modalUser.id}`}
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      {t.delete}
                    </button>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmDeleteOpen}
        title={t.deleteTitle}
        message={t.deleteMessage}
        confirmText={t.deleteConfirm}
        cancelText={t.close}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
