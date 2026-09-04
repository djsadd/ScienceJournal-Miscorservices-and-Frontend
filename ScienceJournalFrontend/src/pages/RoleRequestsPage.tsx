import { useEffect, useMemo, useState } from 'react'

import { api, ApiError } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type RoleKey = 'author' | 'reviewer' | 'editor' | 'layout' | 'admin'
type LangKey = 'ru' | 'en' | 'kz'

type RoleRequest = {
  id: number
  user_id: number
  full_name?: string | null
  organization?: string | null
  current_roles: RoleKey[]
  requested_role: RoleKey
  status: 'pending' | 'pending_editor' | 'pending_admin' | 'approved' | 'rejected' | string
  editor_approved: boolean
  admin_approved: boolean
  created_at?: string | null
}

const roleLabels: Record<LangKey, Record<RoleKey, string>> = {
  ru: {
    author: 'Автор',
    reviewer: 'Рецензент',
    editor: 'Редактор',
    layout: 'Вёрстальщик',
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

const copy: Record<LangKey, {
  title: string
  subtitle: string
  refresh: string
  user: string
  requestedRole: string
  approvals: string
  status: string
  actions: string
  editorApproval: string
  adminApproval: string
  approveEditor: string
  approveAdmin: string
  reject: string
  approved: string
  rejected: string
  pendingEditor: string
  pendingAdmin: string
  pending: string
  yes: string
  no: string
  empty: string
  loading: string
  loadError: string
}> = {
  ru: {
    title: 'Заявки на роли',
    subtitle: 'Роли редактора, рецензента и вёрстальщика добавляются после согласования редактора и администратора.',
    refresh: 'Обновить',
    user: 'Пользователь',
    requestedRole: 'Запрошенная роль',
    approvals: 'Согласования',
    status: 'Статус',
    actions: 'Действия',
    editorApproval: 'Редактор',
    adminApproval: 'Администратор',
    approveEditor: 'Согласовать как редактор',
    approveAdmin: 'Согласовать как администратор',
    reject: 'Отклонить',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    pendingEditor: 'Ждёт редактора',
    pendingAdmin: 'Ждёт администратора',
    pending: 'На согласовании',
    yes: 'Да',
    no: 'Нет',
    empty: 'Заявок нет',
    loading: 'Загрузка...',
    loadError: 'Не удалось загрузить заявки',
  },
  en: {
    title: 'Role requests',
    subtitle: 'Editor, reviewer, and layout roles are added after editor and administrator approval.',
    refresh: 'Refresh',
    user: 'User',
    requestedRole: 'Requested role',
    approvals: 'Approvals',
    status: 'Status',
    actions: 'Actions',
    editorApproval: 'Editor',
    adminApproval: 'Administrator',
    approveEditor: 'Approve as editor',
    approveAdmin: 'Approve as administrator',
    reject: 'Reject',
    approved: 'Approved',
    rejected: 'Rejected',
    pendingEditor: 'Waiting for editor',
    pendingAdmin: 'Waiting for administrator',
    pending: 'Pending approval',
    yes: 'Yes',
    no: 'No',
    empty: 'No requests',
    loading: 'Loading...',
    loadError: 'Failed to load requests',
  },
  kz: {
    title: 'Рөл өтінімдері',
    subtitle: 'Редактор, рецензент және беттеуші рөлдері редактор мен әкімші мақұлдағаннан кейін қосылады.',
    refresh: 'Жаңарту',
    user: 'Пайдаланушы',
    requestedRole: 'Сұралған рөл',
    approvals: 'Мақұлдау',
    status: 'Мәртебе',
    actions: 'Әрекеттер',
    editorApproval: 'Редактор',
    adminApproval: 'Әкімші',
    approveEditor: 'Редактор ретінде мақұлдау',
    approveAdmin: 'Әкімші ретінде мақұлдау',
    reject: 'Қабылдамау',
    approved: 'Мақұлданды',
    rejected: 'Қабылданбады',
    pendingEditor: 'Редакторды күтуде',
    pendingAdmin: 'Әкімшіні күтуде',
    pending: 'Мақұлдауды күтуде',
    yes: 'Иә',
    no: 'Жоқ',
    empty: 'Өтінімдер жоқ',
    loading: 'Жүктелуде...',
    loadError: 'Өтінімдерді жүктеу мүмкін болмады',
  },
}

const statusClass = (status: string) => {
  if (status === 'approved') return 'accepted'
  if (status === 'rejected') return 'rejected'
  return 'draft'
}

export default function RoleRequestsPage() {
  const { lang } = useLanguage()
  const locale = (lang === 'en' || lang === 'kz' ? lang : 'ru') as LangKey
  const t = copy[locale]
  const roleText = roleLabels[locale]

  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [myRoles, setMyRoles] = useState<RoleKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const canEditorApprove = myRoles.includes('editor') || myRoles.includes('admin')
  const canAdminApprove = myRoles.includes('admin')

  const statusText = useMemo(() => ({
    pending: t.pending,
    pending_editor: t.pendingEditor,
    pending_admin: t.pendingAdmin,
    approved: t.approved,
    rejected: t.rejected,
  }), [t])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [roleData, requestData] = await Promise.all([
        api.get<{ roles: RoleKey[] }>('/users/me/roles'),
        api.getRoleRequests<RoleRequest[]>(),
      ])
      setMyRoles(roleData.roles || [])
      setRequests(requestData || [])
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

  const decide = async (requestId: number, stage: 'editor' | 'admin', decision: 'approve' | 'reject') => {
    setSavingKey(`${stage}-${decision}-${requestId}`)
    try {
      await api.decideRoleRequest(requestId, stage, decision)
      await load()
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="page role-requests-page">
      <section className="section-header">
        <div>
          <p className="eyebrow">{t.approvals}</p>
          <h1 className="page-title">{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <button type="button" className="button button--ghost" onClick={load} disabled={loading}>
          {t.refresh}
        </button>
      </section>

      {error ? <div className="table__empty">{error}</div> : null}

      <section className="panel">
        <div className="table table--role-requests">
          <div className="table__head">
            <span>{t.user}</span>
            <span>{t.requestedRole}</span>
            <span>{t.approvals}</span>
            <span>{t.status}</span>
            <span>{t.actions}</span>
          </div>
          <div className="table__body">
            {loading ? (
              <div className="table__empty">{t.loading}</div>
            ) : requests.length === 0 ? (
              <div className="table__empty">{t.empty}</div>
            ) : (
              requests.map((request) => {
                const isPending = request.status.startsWith('pending')
                return (
                  <div className="table__row table__row--align" key={request.id}>
                    <div className="table__cell table__cell--title">
                      <div className="table__title">{request.full_name || `#${request.user_id}`}</div>
                      <div className="table__meta">
                        #{request.user_id}
                        {request.organization ? ` · ${request.organization}` : ''}
                      </div>
                    </div>
                    <div className="table__cell">
                      <span className="pill">{roleText[request.requested_role] ?? request.requested_role}</span>
                      <div className="table__meta">
                        {(request.current_roles || []).map((role) => roleText[role] ?? role).join(', ')}
                      </div>
                    </div>
                    <div className="table__cell">
                      <div>{t.editorApproval}: {request.editor_approved ? t.yes : t.no}</div>
                      <div>{t.adminApproval}: {request.admin_approved ? t.yes : t.no}</div>
                    </div>
                    <div className="table__cell">
                      <span className={`status-chip status-chip--${statusClass(request.status)}`}>
                        {statusText[request.status as keyof typeof statusText] ?? request.status}
                      </span>
                    </div>
                    <div className="table__cell role-requests-page__actions">
                      {canEditorApprove && isPending && !request.editor_approved ? (
                        <button
                          type="button"
                          className="button button--ghost button--compact"
                          disabled={savingKey === `editor-approve-${request.id}`}
                          onClick={() => decide(request.id, 'editor', 'approve')}
                        >
                          {t.approveEditor}
                        </button>
                      ) : null}
                      {canAdminApprove && isPending && !request.admin_approved ? (
                        <button
                          type="button"
                          className="button button--ghost button--compact"
                          disabled={savingKey === `admin-approve-${request.id}`}
                          onClick={() => decide(request.id, 'admin', 'approve')}
                        >
                          {t.approveAdmin}
                        </button>
                      ) : null}
                      {isPending && (canEditorApprove || canAdminApprove) ? (
                        <button
                          type="button"
                          className="button button--ghost button--compact"
                          disabled={savingKey === `editor-reject-${request.id}`}
                          onClick={() => decide(request.id, canEditorApprove ? 'editor' : 'admin', 'reject')}
                        >
                          {t.reject}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
