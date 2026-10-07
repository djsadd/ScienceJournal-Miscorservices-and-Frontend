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
type CabinetBrandSettings = {
  journal_name_ru: string; journal_name_kz: string; journal_name_en: string
  logo_available: boolean
  logo_version: number | null
}

type NotificationPreviewDto = {
  id: number
  type: 'system' | 'article_status' | 'review_assignment' | 'editorial' | 'custom'
  title: string
  message?: string | null
  related_entity?: string | null
  status: 'unread' | 'read'
  created_at: string
}

type NotificationPreview = {
  id: number
  title: string
  message?: string
  targetPath?: string
  read: boolean
  createdAt: string
}

type RoleRequestDto = {
  id: number
  requested_role: RoleKey
  status: string
  editor_approved: boolean
  admin_approved: boolean
}

type CurrentUserDto = {
  username: string
  full_name?: string | null
}

type SidebarCopy = {
  roleOptions: Record<RoleKey, string>
  roleSwitcherLabel: string
  addRoleTitle: string
  addRoleEmpty: string
  addRoleAuthorConfirm: string
  addRoleApprovalConfirm: string
  addRolePending: string
  addRoleRequested: string
  addRoleAdded: string
  addRoleFailed: string
  languageNames: Record<LangKey, string>
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
  notificationsLabel: string
  notificationsTitle: string
  notificationsLoading: string
  notificationsEmpty: string
  notificationsAll: string
  notificationsUnread: string
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
    addRoleTitle: 'Добавить роль',
    addRoleEmpty: 'Все доступные роли уже добавлены',
    addRoleAuthorConfirm: 'Добавить себе роль автора?',
    addRoleApprovalConfirm: 'Эта роль будет добавлена после согласования редактора и администратора. Отправить заявку?',
    addRolePending: 'На согласовании',
    addRoleRequested: 'Заявка отправлена',
    addRoleAdded: 'Роль автора добавлена',
    addRoleFailed: 'Не удалось отправить заявку',
    languageNames: {
      ru: 'Рус',
      en: 'Eng',
      kz: 'Қаз',
    },
    nav: {
      author: [
        {
          title: 'Обзор',
          items: [
            { label: 'Главная', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Рукописи',
          items: [
            { label: 'Мои подачи', path: '/cabinet/submissions' },
            { label: 'Новая подача', path: '/cabinet/submission' },
          ],
        },
      ],
      editor: [
        {
          title: 'Рабочий стол',
          items: [
            { label: 'Обзор', path: '/cabinet' },
            { label: 'Все рукописи', path: '/cabinet/editorial2' },
            { label: 'Рецензенты', path: '/cabinet/admin/users' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
            { label: 'Настройки уведомлений', path: '/cabinet/notification-settings' },
          ],
        },
        {
          title: 'Публикация',
          items: [
            { label: 'Выпуски', path: '/cabinet/volumes' },
            { label: 'Аналитика', path: '/cabinet/admin/analytics' },
            { label: 'Быстрая публикация', path: '/cabinet/quick-publish' },
            { label: 'Заявки на роли', path: '/cabinet/role-requests' },
          ],
        },
        {
          title: 'Система',
          items: [{ label: 'Настройки журнала', path: '/cabinet/admin/journal-settings' }],
        },
      ],
      reviewer: [
        {
          title: 'Обзор',
          items: [
            { label: 'Главная', path: '/cabinet' },
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
            { label: 'Главная', path: '/cabinet' },
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
            { label: 'Главная', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Уведомления', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Администрирование',
          items: [
            { label: 'Пользователи', path: '/cabinet/admin/users' },
            { label: 'Аналитика', path: '/cabinet/admin/analytics' },
            { label: 'Настройки журнала', path: '/cabinet/admin/journal-settings' },
            { label: 'Шаблоны писем', path: '/cabinet/admin/email-templates' },
            { label: 'Документация шаблонов', path: '/cabinet/admin/email-template-docs' },
            { label: 'Заявки на роли', path: '/cabinet/role-requests' },
          ],
        },
      ],
    },
    resourcesTitle: 'Ресурсы',
    terms: 'Правила и политика',
    privacy: 'Приватность',
    logout: 'Выйти',
    langLabel: 'Язык',
    brandTitle: 'Вернуться на главную',
    brandSubtitle: '',
    brandAlt: 'Логотип университета',
    mobileMenuOpen: 'Меню',
    mobileMenuClose: 'Закрыть меню',
    sidebarShow: 'Развернуть меню',
    sidebarHide: 'Свернуть меню',
    notificationsLabel: 'Уведомления',
    notificationsTitle: 'Уведомления',
    notificationsLoading: 'Загрузка...',
    notificationsEmpty: 'Нет уведомлений',
    notificationsAll: 'Все уведомления',
    notificationsUnread: 'Непрочитано',
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
    addRoleTitle: 'Add role',
    addRoleEmpty: 'All available roles are already assigned',
    addRoleAuthorConfirm: 'Add the author role to your profile?',
    addRoleApprovalConfirm: 'This role will be added after editor and administrator approval. Send request?',
    addRolePending: 'Pending approval',
    addRoleRequested: 'Request sent',
    addRoleAdded: 'Author role added',
    addRoleFailed: 'Failed to send request',
    languageNames: {
      ru: 'Rus',
      en: 'Eng',
      kz: 'Kaz',
    },
    nav: {
      author: [
        {
          title: 'Overview',
          items: [
            { label: 'Home', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Submissions',
          items: [
            { label: 'My submissions', path: '/cabinet/submissions' },
            { label: 'New submission', path: '/cabinet/submission' },
          ],
        },
      ],
      editor: [
        {
          title: 'Workspace',
          items: [
            { label: 'Overview', path: '/cabinet' },
            { label: 'All manuscripts', path: '/cabinet/editorial2' },
            { label: 'Reviewers', path: '/cabinet/admin/users' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
            { label: 'Notification settings', path: '/cabinet/notification-settings' },
          ],
        },
        {
          title: 'Publication',
          items: [
            { label: 'Issues', path: '/cabinet/volumes' },
            { label: 'Analytics', path: '/cabinet/admin/analytics' },
            { label: 'Quick publish', path: '/cabinet/quick-publish' },
            { label: 'Role requests', path: '/cabinet/role-requests' },
          ],
        },
        {
          title: 'System',
          items: [{ label: 'Journal settings', path: '/cabinet/admin/journal-settings' }],
        },
      ],
      reviewer: [
        {
          title: 'Overview',
          items: [
            { label: 'Home', path: '/cabinet' },
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
            { label: 'Home', path: '/cabinet' },
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
            { label: 'Home', path: '/cabinet' },
            { label: 'Profile', path: '/cabinet/profile' },
            { label: 'Notifications', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Administration',
          items: [
            { label: 'Users', path: '/cabinet/admin/users' },
            { label: 'Analytics', path: '/cabinet/admin/analytics' },
            { label: 'Journal settings', path: '/cabinet/admin/journal-settings' },
            { label: 'Email templates', path: '/cabinet/admin/email-templates' },
            { label: 'Template documentation', path: '/cabinet/admin/email-template-docs' },
            { label: 'Role requests', path: '/cabinet/role-requests' },
          ],
        },
      ],
    },
    resourcesTitle: 'Resources',
    terms: 'Terms & Policies',
    privacy: 'Privacy',
    logout: 'Logout',
    langLabel: 'Language',
    brandTitle: 'Back to home',
    brandSubtitle: '',
    brandAlt: 'University logo',
    mobileMenuOpen: 'Menu',
    mobileMenuClose: 'Close menu',
    sidebarShow: 'Expand sidebar',
    sidebarHide: 'Collapse sidebar',
    notificationsLabel: 'Notifications',
    notificationsTitle: 'Notifications',
    notificationsLoading: 'Loading...',
    notificationsEmpty: 'No notifications',
    notificationsAll: 'All notifications',
    notificationsUnread: 'Unread',
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
    addRoleTitle: 'Рөл қосу',
    addRoleEmpty: 'Барлық қолжетімді рөлдер қосылған',
    addRoleAuthorConfirm: 'Профильге автор рөлін қосасыз ба?',
    addRoleApprovalConfirm: 'Бұл рөл редактор және әкімші мақұлдағаннан кейін қосылады. Өтінім жіберілсін бе?',
    addRolePending: 'Мақұлдауды күтуде',
    addRoleRequested: 'Өтінім жіберілді',
    addRoleAdded: 'Автор рөлі қосылды',
    addRoleFailed: 'Өтінімді жіберу мүмкін болмады',
    languageNames: {
      ru: 'Орыс',
      en: 'Ағыл',
      kz: 'Қаз',
    },
    nav: {
      author: [
        {
          title: 'Шолу',
          items: [
            { label: 'Басты бет', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Қолжазбалар',
          items: [
            { label: 'Менің өтінімдерім', path: '/cabinet/submissions' },
            { label: 'Жаңа өтінім', path: '/cabinet/submission' },
          ],
        },
      ],
      editor: [
        {
          title: 'Жұмыс үстелі',
          items: [
            { label: 'Шолу', path: '/cabinet' },
            { label: 'Барлық қолжазбалар', path: '/cabinet/editorial2' },
            { label: 'Рецензенттер', path: '/cabinet/admin/users' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
            { label: 'Хабарлама баптаулары', path: '/cabinet/notification-settings' },
          ],
        },
        {
          title: 'Жариялау',
          items: [
            { label: 'Шығарылымдар', path: '/cabinet/volumes' },
            { label: 'Аналитика', path: '/cabinet/admin/analytics' },
            { label: 'Жылдам жариялау', path: '/cabinet/quick-publish' },
            { label: 'Рөл өтінімдері', path: '/cabinet/role-requests' },
          ],
        },
        {
          title: 'Жүйе',
          items: [{ label: 'Журнал баптаулары', path: '/cabinet/admin/journal-settings' }],
        },
      ],
      reviewer: [
        {
          title: 'Шолу',
          items: [
            { label: 'Басты бет', path: '/cabinet' },
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
            { label: 'Басты бет', path: '/cabinet' },
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
            { label: 'Басты бет', path: '/cabinet' },
            { label: 'Профиль', path: '/cabinet/profile' },
            { label: 'Хабарламалар', path: '/cabinet/notifications' },
          ],
        },
        {
          title: 'Әкімшілік',
          items: [
            { label: 'Пайдаланушылар', path: '/cabinet/admin/users' },
            { label: 'Аналитика', path: '/cabinet/admin/analytics' },
            { label: 'Журнал баптаулары', path: '/cabinet/admin/journal-settings' },
            { label: 'Хат үлгілері', path: '/cabinet/admin/email-templates' },
            { label: 'Үлгілер құжаттамасы', path: '/cabinet/admin/email-template-docs' },
            { label: 'Рөл өтінімдері', path: '/cabinet/role-requests' },
          ],
        },
      ],
    },
    resourcesTitle: 'Ресурстар',
    terms: 'Ережелер мен саясат',
    privacy: 'Құпиялылық',
    logout: 'Шығу',
    langLabel: 'Тіл',
    brandTitle: 'Басты бетке оралу',
    brandSubtitle: '',
    brandAlt: 'Университет логотипі',
    mobileMenuOpen: 'Мәзір',
    mobileMenuClose: 'Мәзірді жабу',
    sidebarShow: 'Мәзірді жаю',
    sidebarHide: 'Мәзірді жию',
    notificationsLabel: 'Хабарламалар',
    notificationsTitle: 'Хабарламалар',
    notificationsLoading: 'Жүктелуде...',
    notificationsEmpty: 'Хабарламалар жоқ',
    notificationsAll: 'Барлық хабарламалар',
    notificationsUnread: 'Оқылмаған',
  },
}

const allRoles: RoleKey[] = ['author', 'editor', 'reviewer', 'layout', 'admin']
const selfRequestRoles: RoleKey[] = ['author', 'editor', 'reviewer', 'layout']
const isRoleKey = (value: string): value is RoleKey => allRoles.includes(value as RoleKey)
const languageOptions: Lang[] = ['ru', 'en', 'kz']
const cabinetHomePath = '/cabinet'
const NOTIFICATIONS_REFRESH_INTERVAL_MS = 15000
const notificationLocale: Record<LangKey, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
}

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TA'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

const NavIcon = ({ path }: { path?: string }) => {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }

  if (path === '/cabinet/admin/analytics') {
    return (
      <svg {...common}>
        <path d="M4.5 18.5L9.2 13.6L12.6 15.7L19.5 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.5 7.5H19.5V11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 5.5V18.5H19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (path === '/cabinet/quick-publish') return <svg {...common}><path d="M12 3.8L13.9 9.2L19.5 11L13.9 12.8L12 18.2L10.1 12.8L4.5 11L10.1 9.2L12 3.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M18.5 3.5V7M16.75 5.25H20.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  if (path === '/cabinet/role-requests') return <svg {...common}><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M4.5 18C5 14.9 6.7 13.5 9 13.5C10.3 13.5 11.4 13.9 12.2 14.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M15 15.5L17 17.5L20.5 13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  if (path === '/cabinet/notification-settings') return <svg {...common}><path d="M7 16.5H17L15.8 14.7V10A3.8 3.8 0 008.2 10V14.7L7 16.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M10.4 19H13.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M18.5 5.5L20 4M5.5 5.5L4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  if (path === '/cabinet/submissions') return <svg {...common}><path d="M7 4.5H17V19.5H7V4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9.5 8H14.5M9.5 11.5H14.5M9.5 15H12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  if (path === '/cabinet/reviews') return <svg {...common}><path d="M6 4.5H18V19.5H6V4.5Z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 9L10.5 10.5L14.5 6.5M9 15L10.5 16.5L14.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  if (path === '/cabinet/layout') return <svg {...common}><rect x="4.5" y="4.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M4.5 10H19.5M11 10V19.5" stroke="currentColor" strokeWidth="1.6"/></svg>
  if (path === '/cabinet/admin/email-templates') return <svg {...common}><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M5 7L12 13L19 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
  if (path === '/cabinet/admin/email-template-docs') return <svg {...common}><path d="M6 4.5H16.5L19 7V19.5H6V4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 9H16M9 12.5H16M9 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>

  if (path === '/cabinet/admin/users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 18C4.9 15.5 6.4 14 9 14C11.6 14 13.1 15.5 13.5 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 8V14M14 11H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (path === '/cabinet/volumes') {
    return (
      <svg {...common}>
        <path d="M6 4.5H17.5V19.5H6C5.2 19.5 4.5 18.8 4.5 18V6C4.5 5.2 5.2 4.5 6 4.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 16.5H17.5M7 4.5V16.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  if (path === '/cabinet/admin/journal-settings') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 3.75V6M12 18V20.25M3.75 12H6M18 12H20.25M6.17 6.17L7.76 7.76M16.24 16.24L17.83 17.83M17.83 6.17L16.24 7.76M7.76 16.24L6.17 17.83" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (path === '/cabinet/editorial2') {
    return (
      <svg {...common}>
        <path d="M7 4.75H15L18 7.75V19.25H7V4.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M15 5V8H18M9.5 12H15.5M9.5 15H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (path === '/cabinet/notifications') {
    return (
      <svg {...common}>
        <path d="M5 5.5H19V15.5H9L5 19V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  }

  if (path === '/cabinet') {
    return (
      <svg {...common}>
        <path d="M5 5H10V10H5V5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 5H19V10H14V5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 14H10V19H5V14Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 14H19V19H14V14Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  if (path === '/cabinet/profile') {
    return (
      <svg {...common}>
        <path d="M12 12.25C14.07 12.25 15.75 10.57 15.75 8.5C15.75 6.43 14.07 4.75 12 4.75C9.93 4.75 8.25 6.43 8.25 8.5C8.25 10.57 9.93 12.25 12 12.25Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.75 19.25C6.55 16.7 8.9 15 12 15C15.1 15 17.45 16.7 18.25 19.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (path === '/cabinet/submission') {
    return (
      <svg {...common}>
        <path d="M12 5V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 12H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (path?.includes('contract')) {
    return (
      <svg {...common}>
        <path d="M7 4.75H15L18 7.75V19.25H7V4.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M15 5V8H18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9.5 14.5L11 16L15 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M7 4.75H15L18 7.75V19.25H7V4.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 5V8H18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

const stripNotificationLinks = (text?: string | null): string | undefined => {
  if (!text) return undefined
  const cleaned = text
    .replace(/Откройте:\s*https?:\/\/\S+/gi, '')
    .replace(/РћС‚РєСЂРѕР№С‚Рµ:\s*https?:\/\/\S+/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || undefined
}

const getNotificationTargetPath = (relatedEntity?: string | null): string | undefined => {
  if (!relatedEntity) return undefined
  const [type, rawId] = relatedEntity.split(':')
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) return undefined
  if (type === 'review') return `/cabinet/reviews/${id}`
  if (type === 'article') return `/cabinet/my-articles/${id}`
  return undefined
}

const toNotificationPreview = (notification: NotificationPreviewDto): NotificationPreview => ({
  id: notification.id,
  title: notification.title,
  message: stripNotificationLinks(notification.message),
  targetPath: getNotificationTargetPath(notification.related_entity),
  read: notification.status === 'read',
  createdAt: notification.created_at,
})

export function MainLayout({ children }: MainLayoutProps) {
  const [brandSettings, setBrandSettings] = useState<CabinetBrandSettings | null>(null)
  const [activeRole, setActiveRole] = useState<RoleKey>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
    return stored && isRoleKey(stored) ? stored : 'author'
  })
  const [availableRoles, setAvailableRoles] = useState<RoleKey[]>(allRoles)
  const [roleRequests, setRoleRequests] = useState<RoleRequestDto[]>([])
  const [roleActionStatus, setRoleActionStatus] = useState<string | null>(null)
  const [roleActionKey, setRoleActionKey] = useState<RoleKey | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const roleMenuRef = useRef<HTMLDivElement | null>(null)
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null)
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
  const configuredLogo = brandSettings?.logo_available
    ? `${api.getJournalLogoUrl()}?v=${brandSettings.logo_version || ''}`
    : logo
  const configuredJournalName = brandSettings?.[`journal_name_${lang}`]

  useEffect(() => {
    api.getJournalSettings<CabinetBrandSettings>().then(setBrandSettings).catch(() => undefined)
  }, [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const handleRoleChange = useCallback(async (role: RoleKey) => {
    setActiveRole(role)
    setIsRoleMenuOpen(false)
    closeSidebar()
    try {
      window.localStorage.setItem('activeRole', role)
    } catch {}
    await api.refreshTokens().catch(() => null)
    if (typeof window !== 'undefined') {
      window.location.assign(cabinetHomePath)
      return
    }
    navigate(cabinetHomePath)
  }, [closeSidebar, navigate])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notificationItems, setNotificationItems] = useState<NotificationPreview[]>([])
  const [areNotificationsLoading, setAreNotificationsLoading] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [lowVision, setLowVision] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lowVision')
      return saved === '1'
    } catch {
      return false
    }
  })

  const loadRoles = useCallback(async (shouldUpdate: () => boolean = () => true) => {
    try {
      const [response, requests] = await Promise.all([
        api.get<{ user_id: string; roles: string[] }>('/users/me/roles'),
        api.getMyRoleRequests<RoleRequestDto[]>().catch(() => []),
      ])
      const roles = (response.roles || []).filter(isRoleKey)
      const nextRoles: RoleKey[] =
        roles.includes('admin')
          ? Array.from(new Set<RoleKey>(['admin', 'editor', 'reviewer', 'author', ...roles]))
          : roles.length > 0
            ? roles
            : ['author']
      if (!shouldUpdate()) return
      setAvailableRoles(nextRoles)
      setRoleRequests((requests || []).filter((item) => isRoleKey(item.requested_role)))
      setActiveRole((prev) => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
        const preferred = stored && isRoleKey(stored) && nextRoles.includes(stored) ? stored : undefined
        return preferred ?? (nextRoles.includes(prev) ? prev : nextRoles[0])
      })
    } catch (error) {
      console.error('Failed to load roles', error)
      if (!shouldUpdate()) return
      setAvailableRoles(['author'])
      setRoleRequests([])
      setActiveRole(() => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeRole') : null
        return stored && isRoleKey(stored) ? stored : 'author'
      })
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    loadRoles(() => isMounted)
    return () => {
      isMounted = false
    }
  }, [loadRoles])

  useEffect(() => {
    let isMounted = true
    api.get<CurrentUserDto>('/auth/me')
      .then((user) => {
        if (!isMounted) return
        setCurrentUserName(user.full_name || user.username || '')
      })
      .catch(() => {
        if (!isMounted) return
        setCurrentUserName('')
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadHeaderNotifications = async () => {
      setAreNotificationsLoading(true)
      try {
        const [unread, latest] = await Promise.all([
          api.get<Array<{ id: number }>>('/notifications', { params: { status: 'unread', limit: 50, offset: 0 } }),
          api.get<NotificationPreviewDto[]>('/notifications', { params: { limit: 5, offset: 0 } }),
        ])
        if (!active) return
        setUnreadCount(Array.isArray(unread) ? unread.length : 0)
        setNotificationItems(Array.isArray(latest) ? latest.map(toNotificationPreview) : [])
      } catch {
        if (!active) return
        setUnreadCount(0)
        setNotificationItems([])
      } finally {
        if (active) {
          setAreNotificationsLoading(false)
        }
      }
    }
    loadHeaderNotifications()
    window.addEventListener('notifications:updated', loadHeaderNotifications)
    const interval = setInterval(loadHeaderNotifications, NOTIFICATIONS_REFRESH_INTERVAL_MS)
    return () => {
      active = false
      window.removeEventListener('notifications:updated', loadHeaderNotifications)
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
    setIsNotificationsOpen(false)
  }, [activeRole, isDesktopViewport])

  useEffect(() => {
    if (!isRoleMenuOpen && !isNotificationsOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (isRoleMenuOpen && !roleMenuRef.current?.contains(target)) {
        setIsRoleMenuOpen(false)
      }
      if (isNotificationsOpen && !notificationsMenuRef.current?.contains(target)) {
        setIsNotificationsOpen(false)
      }
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [isRoleMenuOpen, isNotificationsOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let frameId = 0
    const readPageTitle = () => {
      frameId = 0
      const title = document
        .querySelector<HTMLElement>('.app-main .page-title')
        ?.textContent
        ?.replace(/\s+/g, ' ')
        .trim()

      setPageTitle(title || '')
    }
    const scheduleRead = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(readPageTitle)
    }

    scheduleRead()
    const main = document.querySelector('.app-main')
    if (!main) {
      return () => {
        if (frameId) window.cancelAnimationFrame(frameId)
      }
    }

    const observer = new MutationObserver(scheduleRead)
    observer.observe(main, { childList: true, subtree: true, characterData: true })

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [lang])

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
  const formattedNotificationDate = useCallback(
    (value: string) => {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString(notificationLocale[locale], {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    [locale],
  )
  const pendingRequestedRoles = useMemo(
    () => new Set(roleRequests.filter((item) => item.status.startsWith('pending')).map((item) => item.requested_role)),
    [roleRequests],
  )
  const rolesToRequest = useMemo(
    () => selfRequestRoles.filter((role) => !availableRoles.includes(role)),
    [availableRoles],
  )
  const handleAddRole = useCallback(
    async (role: RoleKey) => {
      if (pendingRequestedRoles.has(role)) return
      const confirmText = role === 'author' ? copy.addRoleAuthorConfirm : copy.addRoleApprovalConfirm
      if (typeof window !== 'undefined' && !window.confirm(confirmText)) return

      setRoleActionKey(role)
      setRoleActionStatus(null)
      try {
        const result = await api.requestMyRole<RoleRequestDto>(role)
        await loadRoles()
        setRoleActionStatus(result.status === 'approved' ? copy.addRoleAdded : copy.addRoleRequested)
      } catch (error) {
        console.error('Failed to request role', error)
        setRoleActionStatus(copy.addRoleFailed)
      } finally {
        setRoleActionKey(null)
      }
    },
    [copy, loadRoles, pendingRequestedRoles],
  )

  return (
    <div className={`app-shell ${lowVision ? 'low-vision' : ''} ${isDesktopViewport && !isSidebarVisible ? 'app-shell--sidebar-hidden' : ''}`}>
      <aside id="cabinet-sidebar" className={`sidebar ${isSidebarOpen ? 'sidebar--open' : ''} ${isDesktopViewport && !isSidebarVisible ? 'sidebar--hidden' : ''}`}>
        <div className="sidebar__brand">
          <Link to={`/${lang}`} className="brand--compact" onClick={closeSidebar}>
            <div className="brand-mark">
              <img src={configuredLogo} alt={copy.brandAlt} className="brand-logo brand-logo--plain" />
            </div>
            <div>
              <div className="brand-title">{copy.brandTitle}</div>
              {copy.brandSubtitle ? <div className="brand-subtitle">{copy.brandSubtitle}</div> : null}
            </div>
          </Link>
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
                      end={item.path === '/cabinet'}
                      className={({ isActive }) =>
                        ['sidebar__link', isActive ? 'sidebar__link--active' : ''].join(' ')
                      }
                      onClick={closeSidebar}
                      title={item.label}
                    >
                      <span className="sidebar__link-icon">
                        <NavIcon path={item.path} />
                      </span>
                      <span className="sidebar__link-label">{item.label}</span>
                      <span className="sidebar__link-meta">
                        {item.path === '/cabinet/notifications' && !item.tag && unreadCount > 0 ? (
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
                      title={item.label}
                    >
                      <span className="sidebar__link-icon">
                        <NavIcon path={item.path} />
                      </span>
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
          <button
            className="sidebar__footer-action"
            type="button"
            aria-label={copy.logout}
            title={copy.logout}
            onClick={() => {
              api.logout()
              navigate('/login')
            }}
          >
            <span className="sidebar__footer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6H6.75C5.78 6 5 6.78 5 7.75V16.25C5 17.22 5.78 18 6.75 18H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M14 8L18 12L14 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 12H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            {copy.logout}
          </button>
          <button
            className="sidebar__footer-action"
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarToggleLabel}
            title={sidebarToggleLabel}
          >
            <span className="sidebar__footer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d={isDesktopViewport && !isSidebarVisible ? "M9 6L15 12L9 18" : "M15 6L9 12L15 18"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {sidebarToggleLabel}
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
          <div className="app-header-start">
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
            {pageTitle ? (
              <div className="cabinet-breadcrumbs" aria-label="Breadcrumb">
                <Link to="/cabinet">{copy.brandTitle}</Link>
                <span>/</span>
                <span>{pageTitle}</span>
              </div>
            ) : null}
          </div>
          <div className="header-controls">
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
                onClick={() => {
                  setIsNotificationsOpen(false)
                  setIsRoleMenuOpen((prev) => !prev)
                }}
              >
                <span className="mobile-shell-role__avatar">
                  {getInitials(currentUserName || copy.roleOptions[activeRole])}
                </span>
                <span className="mobile-shell-role__text">
                  <span className="mobile-shell-role__name">
                    {currentUserName || copy.roleOptions[activeRole]}
                  </span>
                  <span className="mobile-shell-role__role">{copy.roleOptions[activeRole]}</span>
                </span>
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
                  <div className="header-role-switch__divider" />
                  <div className="header-role-switch__section-title">{copy.addRoleTitle}</div>
                  {rolesToRequest.length === 0 ? (
                    <div className="header-role-switch__empty">{copy.addRoleEmpty}</div>
                  ) : (
                    rolesToRequest.map((role) => {
                      const pending = pendingRequestedRoles.has(role)
                      return (
                        <button
                          key={`request-${role}`}
                          type="button"
                          className="header-role-switch__option header-role-switch__option--request"
                          disabled={pending || roleActionKey === role}
                          onClick={() => handleAddRole(role)}
                        >
                          <span>{copy.roleOptions[role]}</span>
                          {pending ? <span className="header-role-switch__status">{copy.addRolePending}</span> : null}
                        </button>
                      )
                    })
                  )}
                  {roleActionStatus ? <div className="header-role-switch__message">{roleActionStatus}</div> : null}
                </div>
              ) : null}
            </div>
            <div
              ref={notificationsMenuRef}
              className={`header-notifications ${isNotificationsOpen ? 'header-notifications--open' : ''}`}
            >
              <button
                type="button"
                className="header-notifications__button"
                aria-haspopup="dialog"
                aria-expanded={isNotificationsOpen}
                aria-label={copy.notificationsLabel}
                title={copy.notificationsLabel}
                onClick={() => {
                  setIsRoleMenuOpen(false)
                  window.dispatchEvent(new Event('notifications:updated'))
                  setIsNotificationsOpen((prev) => !prev)
                }}
              >
                <svg
                  className="header-notifications__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 9.75C18 6.44 15.31 3.75 12 3.75S6 6.44 6 9.75V12.5C6 13.46 5.62 14.38 4.94 15.06L4.5 15.5H19.5L19.06 15.06C18.38 14.38 18 13.46 18 12.5V9.75Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.75 18.25C10.14 19.42 11.04 20.25 12 20.25C12.96 20.25 13.86 19.42 14.25 18.25"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                {unreadCount > 0 ? (
                  <span className="header-notifications__badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </button>
              {isNotificationsOpen ? (
                <div className="header-notifications__menu" role="dialog" aria-label={copy.notificationsTitle}>
                  <div className="header-notifications__top">
                    <div className="header-notifications__title">{copy.notificationsTitle}</div>
                    {unreadCount > 0 ? (
                      <span className="header-notifications__unread">
                        {copy.notificationsUnread}: {unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="header-notifications__list">
                    {areNotificationsLoading ? (
                      <div className="header-notifications__state">{copy.notificationsLoading}</div>
                    ) : notificationItems.length === 0 ? (
                      <div className="header-notifications__state">{copy.notificationsEmpty}</div>
                    ) : (
                      notificationItems.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.targetPath ?? '/cabinet/notifications'}
                          className={`header-notification ${notification.read ? '' : 'header-notification--unread'}`}
                          onClick={() => {
                            setIsNotificationsOpen(false)
                            if (!notification.read) {
                              api.markNotificationRead(notification.id).finally(() => {
                                window.dispatchEvent(new Event('notifications:updated'))
                              })
                            }
                          }}
                        >
                          <span className="header-notification__dot" aria-hidden="true" />
                          <span className="header-notification__body">
                            <span className="header-notification__title">{notification.title}</span>
                            {notification.message ? (
                              <span className="header-notification__message">{notification.message}</span>
                            ) : null}
                            <time className="header-notification__time" dateTime={notification.createdAt}>
                              {formattedNotificationDate(notification.createdAt)}
                            </time>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link
                    to="/cabinet/notifications"
                    className="header-notifications__all"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    {copy.notificationsAll}
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="header-lang-switch" role="group" aria-label={copy.langLabel}>
              {languageOptions.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`header-lang-switch__option ${lang === code ? 'header-lang-switch__option--active' : ''}`}
                  onClick={() => setLang(code)}
                  aria-label={`Switch to ${copy.languageNames[code]}`}
                  aria-pressed={lang === code}
                  title={copy.languageNames[code]}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
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
              <img src={configuredLogo} alt={copy.brandAlt} className="brand-logo" />
            </div>
            <div>
              <div className="brand-title">{configuredJournalName || copy.brandTitle}</div>
              {copy.brandSubtitle ? <div className="brand-subtitle">{copy.brandSubtitle}</div> : null}
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

