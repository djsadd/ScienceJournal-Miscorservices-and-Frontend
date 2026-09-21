import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Preference = { type: string; in_app_enabled: boolean; email_enabled: boolean }
const labels: Record<string, { title: string; description: string }> = {
  system: { title: 'Системные', description: 'Безопасность, обслуживание и важные сообщения системы.' },
  article_status: { title: 'Статусы статей', description: 'Изменения этапов рассмотрения и публикации.' },
  review_assignment: { title: 'Рецензирование', description: 'Назначения, отмены и отказы от рецензирования.' },
  editorial: { title: 'Редакционные события', description: 'Решения редакции, комментарии и завершённые рецензии.' },
  custom: { title: 'Прочие', description: 'Дополнительные сообщения редакции.' },
}

export default function NotificationPreferencesPage() {
  const [items, setItems] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getNotificationPreferences<Preference[]>().then(setItems).catch(() => setMessage('Не удалось загрузить настройки')).finally(() => setLoading(false))
  }, [])

  const toggle = (type: string, field: 'in_app_enabled' | 'email_enabled') => {
    setItems(current => current.map(item => item.type === type ? { ...item, [field]: !item[field] } : item))
  }

  const save = async () => {
    setSaving(true); setMessage('')
    try {
      setItems(await api.updateNotificationPreferences<Preference[]>(items))
      setMessage('Настройки сохранены')
    } catch { setMessage('Не удалось сохранить настройки') }
    finally { setSaving(false) }
  }

  return <div className="page">
    <section className="section-header"><div><p className="eyebrow">Редактор</p><h1 className="page-title">Настройки уведомлений</h1><p className="subtitle">Выберите категории и способы получения уведомлений.</p></div></section>
    <section className="panel">
      {loading ? <div className="loading">Загрузка...</div> : <div className="table">
        <div className="table__head"><span>Категория</span><span>В кабинете</span><span>Email</span><span /></div>
        <div className="table__body">{items.map(item => <div className="table__row" key={item.type}>
          <div className="table__cell"><strong>{labels[item.type]?.title || item.type}</strong><span className="form-hint">{labels[item.type]?.description}</span></div>
          <div className="table__cell"><input type="checkbox" checked={item.in_app_enabled} onChange={() => toggle(item.type, 'in_app_enabled')} /></div>
          <div className="table__cell"><input type="checkbox" checked={item.email_enabled} onChange={() => toggle(item.type, 'email_enabled')} /></div><div />
        </div>)}</div>
      </div>}
      {message && <div className="alert alert--info" style={{ marginTop: 16 }}>{message}</div>}
      <div className="actions" style={{ marginTop: 16 }}><button className="button button--primary" disabled={saving || loading} onClick={save}>{saving ? 'Сохраняем...' : 'Сохранить'}</button></div>
    </section>
  </div>
}
