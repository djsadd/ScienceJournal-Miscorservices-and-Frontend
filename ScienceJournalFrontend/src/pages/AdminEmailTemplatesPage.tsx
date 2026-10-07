import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import './EmailTemplates.css'

export type TemplateVariable = { name: string; description: string; sample: string }
export type EmailTemplate = { key: string; type?: string | null; name: string; description: string; variables: TemplateVariable[]; subject_template: string; text_template: string; html_template?: string | null; is_active: boolean }

const sections = [
  { id: 'access', title: 'Пользователи и доступ', description: 'Регистрация, подтверждение почты, пароль и состояние аккаунта.', icon: '01', keys: ['registration_welcome', 'email_verification', 'password_reset', 'account_status_changed'] },
  { id: 'editorial', title: 'Редакция', description: 'Письма авторам и редакторам на этапах редакционного процесса.', icon: '02', keys: ['new_article_submitted', 'editor_comments', 'article_withdrawn', 'reviewer_declined', 'review_completed', 'notification_editorial'] },
  { id: 'review', title: 'Рецензирование', description: 'Назначение, отмена и другие события работы рецензента.', icon: '03', keys: ['review_assigned', 'review_cancelled', 'notification_review_assignment'] },
  { id: 'notifications', title: 'Общие уведомления', description: 'Системные, статусные и пользовательские сообщения.', icon: '04', keys: ['notification_system', 'notification_article_status', 'notification_custom'] },
]

const recipientFor = (key: string) => {
  if (['new_article_submitted', 'reviewer_declined', 'review_completed'].includes(key)) return 'Редактору'
  if (['review_assigned', 'review_cancelled', 'notification_review_assignment'].includes(key)) return 'Рецензенту'
  if (['editor_comments', 'article_withdrawn', 'registration_welcome', 'email_verification', 'password_reset'].includes(key)) return 'Пользователю'
  return 'По событию'
}

export default function AdminEmailTemplatesPage() {
  const [items, setItems] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.getEmailTemplates<EmailTemplate[]>().then(setItems).catch(() => setError('Не удалось загрузить шаблоны писем.')).finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return sections.map(section => ({
      ...section,
      items: items.filter(item => section.keys.includes(item.key) && (!normalized || `${item.name} ${item.description} ${item.key}`.toLowerCase().includes(normalized))),
    })).filter(section => section.items.length)
  }, [items, query])

  return <div className="page email-templates-page">
    <section className="section-header email-templates-hero">
      <div><p className="eyebrow">Администратор · Коммуникации</p><h1 className="page-title">Шаблоны писем</h1><p className="subtitle">Все письма журнала собраны по рабочим процессам. Выберите событие, чтобы открыть его редактор.</p></div>
      <Link className="button button--ghost" to="/cabinet/admin/email-template-docs">Справочник тегов</Link>
    </section>

    <section className="email-template-toolbar panel">
      <label className="email-template-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти шаблон или событие" /></label>
      <div className="email-template-summary"><strong>{items.length}</strong><span>шаблонов</span><i /><strong>{items.filter(item => item.is_active).length}</strong><span>активны</span></div>
    </section>

    {loading ? <div className="email-template-state">Загружаем шаблоны…</div> : error ? <div className="alert alert--error">{error}</div> : grouped.length ? <div className="email-template-sections">
      {grouped.map(section => <section className="email-template-section" key={section.id}>
        <header className="email-template-section__header"><span>{section.icon}</span><div><h2>{section.title}</h2><p>{section.description}</p></div><b>{section.items.length}</b></header>
        <div className="email-template-cards">
          {section.items.map(item => <Link className="email-template-card" to={`/cabinet/admin/email-templates/${encodeURIComponent(item.key)}`} key={item.key}>
            <div className="email-template-card__top"><span className={`email-template-status ${item.is_active ? 'email-template-status--active' : ''}`}>{item.is_active ? 'Активен' : 'Выключен'}</span><span className="email-template-recipient">{recipientFor(item.key)}</span></div>
            <h3>{item.name}</h3><p>{item.description || 'Системный шаблон электронного письма.'}</p>
            <div className="email-template-card__footer"><code>{item.key}</code><span>Редактировать →</span></div>
          </Link>)}
        </div>
      </section>)}
    </div> : <div className="email-template-state"><strong>Ничего не найдено</strong><span>Попробуйте изменить поисковый запрос.</span></div>}
  </div>
}
