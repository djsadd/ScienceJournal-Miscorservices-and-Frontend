import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Template = { key: string; type?: string | null; name: string; subject_template: string; text_template: string; html_template?: string | null; is_active: boolean }

export default function AdminEmailTemplatesPage() {
  const [items, setItems] = useState<Template[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const current = items.find(item => item.key === selected)

  useEffect(() => {
    api.getEmailTemplates<Template[]>().then(result => { setItems(result); setSelected(result[0]?.key || '') }).catch(() => setMessage('Не удалось загрузить шаблоны')).finally(() => setLoading(false))
  }, [])

  const update = (field: keyof Template, value: string | boolean) => setItems(list => list.map(item => item.key === selected ? { ...item, [field]: value } : item))
  const save = async () => {
    if (!current) return
    setSaving(true); setMessage('')
    try {
      const saved = await api.updateEmailTemplate<Template>(current.key, current)
      setItems(list => list.map(item => item.key === saved.key ? saved : item))
      setMessage('Шаблон сохранён')
    } catch { setMessage('Не удалось сохранить шаблон') }
    finally { setSaving(false) }
  }

  return <div className="page">
    <section className="section-header"><div><p className="eyebrow">Администратор</p><h1 className="page-title">Шаблоны писем</h1><p className="subtitle">Настройка email для различных событий системы.</p></div></section>
    <section className="grid grid-2">
      <aside className="panel"><h3 className="panel-title">Тип письма</h3>{loading ? <div className="loading">Загрузка...</div> : <div className="auth-form">{items.map(item => <button key={item.key} type="button" className={`button ${selected === item.key ? 'button--primary' : 'button--ghost'}`} onClick={() => { setSelected(item.key); setMessage('') }}>{item.name}</button>)}</div>}</aside>
      <div className="panel">{current ? <div className="auth-form">
        <label className="form-field"><span className="form-label">Название шаблона</span><input className="text-input" value={current.name} onChange={e => update('name', e.target.value)} /></label>
        <label className="form-field"><span className="form-label">Тема письма</span><input className="text-input" value={current.subject_template} onChange={e => update('subject_template', e.target.value)} /></label>
        <label className="form-field"><span className="form-label">Текст письма</span><textarea className="text-input" rows={6} value={current.text_template} onChange={e => update('text_template', e.target.value)} /></label>
        <label className="form-field"><span className="form-label">HTML письма</span><textarea className="text-input" rows={8} value={current.html_template || ''} onChange={e => update('html_template', e.target.value)} /></label>
        <label className="choice-chip"><input type="checkbox" checked={current.is_active} onChange={e => update('is_active', e.target.checked)} /><span className="choice-chip__label">Использовать шаблон</span></label>
        <div className="form-hint">Базовые переменные: {'{title}'}, {'{message}'}, {'{article_id}'}. Для специальных писем также доступны переменные из их текущего текста: {'{display_name}'}, {'{verification_link}'}, {'{reset_link}'}, {'{expires_minutes}'}, {'{article_label}'}, {'{reviewer_id}'}, {'{reason}'}.</div>
        {message && <div className="alert alert--info">{message}</div>}
        <button className="button button--primary" disabled={saving || !current.subject_template.trim() || !current.text_template.trim()} onClick={save}>{saving ? 'Сохраняем...' : 'Сохранить шаблон'}</button>
      </div> : <div className="table__empty">Выберите шаблон.</div>}</div>
    </section>
  </div>
}
