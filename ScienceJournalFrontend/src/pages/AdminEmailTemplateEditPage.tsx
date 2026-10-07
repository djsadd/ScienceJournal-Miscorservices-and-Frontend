import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { EmailTemplate } from './AdminEmailTemplatesPage'
import './EmailTemplates.css'

type EditableField = 'subject_template' | 'text_template' | 'html_template'

export default function AdminEmailTemplateEditPage() {
  const { templateKey = '' } = useParams()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('success')
  const [bodyMode, setBodyMode] = useState<'text' | 'html'>('text')
  const [activeField, setActiveField] = useState<EditableField>('text_template')

  useEffect(() => {
    api.getEmailTemplates<EmailTemplate[]>()
      .then(items => setTemplate(items.find(item => item.key === templateKey) || null))
      .catch(() => { setMessageKind('error'); setMessage('Не удалось загрузить шаблон.') })
      .finally(() => setLoading(false))
  }, [templateKey])

  const update = (field: keyof EmailTemplate, value: string | boolean) => setTemplate(current => current ? { ...current, [field]: value } : current)
  const insertVariable = (name: string) => {
    if (!template) return
    update(activeField, `${template[activeField] || ''}{${name}}`)
    if (activeField === 'html_template') setBodyMode('html')
  }
  const save = async () => {
    if (!template) return
    setSaving(true); setMessage('')
    try {
      const saved = await api.updateEmailTemplate<EmailTemplate>(template.key, template)
      setTemplate(saved); setMessageKind('success'); setMessage('Изменения сохранены и будут использоваться в следующих письмах.')
    } catch (error: any) { setMessageKind('error'); setMessage(String(error?.bodyJson?.detail || error?.message || 'Не удалось сохранить шаблон.')) }
    finally { setSaving(false) }
  }
  const sendTest = async () => {
    if (!template || !testEmail.trim()) return
    setTestSending(true); setMessage('')
    try {
      const result = await api.testEmailTemplate<{ message: string }>(template.key, { ...template, recipient_email: testEmail.trim() })
      setMessageKind('success'); setMessage(result.message)
    } catch (error: any) { setMessageKind('error'); setMessage(String(error?.bodyJson?.detail || error?.message || 'Не удалось отправить тестовое письмо.')) }
    finally { setTestSending(false) }
  }

  if (loading) return <div className="page"><div className="email-template-state">Открываем редактор…</div></div>
  if (!template) return <div className="page"><div className="email-template-state"><strong>Шаблон не найден</strong><Link className="button button--ghost" to="/cabinet/admin/email-templates">Вернуться к шаблонам</Link></div></div>

  return <div className="page email-templates-page">
    <section className="email-editor-heading">
      <Link className="email-editor-back" to="/cabinet/admin/email-templates">← Все шаблоны</Link>
      <div className="email-editor-heading__row"><div><p className="eyebrow">Редактор шаблона</p><h1 className="page-title">{template.name}</h1><p className="subtitle">{template.description}</p></div>
        <label className="email-template-switch"><input type="checkbox" checked={template.is_active} onChange={event => update('is_active', event.target.checked)} /><span /><b>{template.is_active ? 'Отправка включена' : 'Отправка выключена'}</b></label>
      </div>
    </section>

    {message && <div className={`email-editor-message email-editor-message--${messageKind}`}>{message}<button type="button" onClick={() => setMessage('')}>×</button></div>}

    <div className="email-editor-layout">
      <main className="email-editor-main">
        <section className="email-editor-panel">
          <div className="email-editor-panel__title"><span>1</span><div><h2>Основные настройки</h2><p>Внутреннее название и тема, которую увидит получатель.</p></div></div>
          <label className="form-field"><span className="form-label">Название шаблона</span><input className="text-input" value={template.name} onChange={event => update('name', event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Тема письма</span><input className="text-input" value={template.subject_template} onFocus={() => setActiveField('subject_template')} onChange={event => update('subject_template', event.target.value)} /><small>Для добавления данных получателя нажмите нужный тег справа.</small></label>
        </section>

        <section className="email-editor-panel">
          <div className="email-editor-panel__title"><span>2</span><div><h2>Содержание письма</h2><p>Заполните обычную и HTML-версию одного сообщения.</p></div></div>
          <div className="email-editor-tabs"><button type="button" className={bodyMode === 'text' ? 'active' : ''} onClick={() => { setBodyMode('text'); setActiveField('text_template') }}>Обычный текст</button><button type="button" className={bodyMode === 'html' ? 'active' : ''} onClick={() => { setBodyMode('html'); setActiveField('html_template') }}>HTML-версия</button></div>
          {bodyMode === 'text' ? <label className="form-field"><span className="form-label">Текст письма</span><textarea className="text-input email-editor-textarea" value={template.text_template} onFocus={() => setActiveField('text_template')} onChange={event => update('text_template', event.target.value)} /></label> : <label className="form-field"><span className="form-label">HTML письма</span><textarea className="text-input email-editor-textarea email-editor-textarea--code" value={template.html_template || ''} onFocus={() => setActiveField('html_template')} onChange={event => update('html_template', event.target.value)} /></label>}
        </section>

        <section className="email-editor-panel">
          <div className="email-editor-panel__title"><span>3</span><div><h2>Проверка письма</h2><p>Отправим текущую версию с демонстрационными значениями тегов.</p></div></div>
          <div className="email-editor-test-template"><span>Будет отправлен шаблон</span><strong>{template.name}</strong><code>{template.key}</code><p>В письмо попадёт именно содержимое полей выше, включая ещё не сохранённые изменения.</p></div>
          <div className="email-editor-test"><input className="text-input" type="email" placeholder="name@example.com" value={testEmail} onChange={event => setTestEmail(event.target.value)} /><button className="button button--ghost" type="button" disabled={testSending || !testEmail.trim()} onClick={sendTest}>{testSending ? 'Отправляем…' : 'Отправить тест'}</button></div>
        </section>
      </main>

      <aside className="email-editor-side">
        <section className="email-editor-variables"><div className="email-editor-variables__head"><div><h2>Доступные теги</h2><p>Добавятся в выбранное поле</p></div><Link to="/cabinet/admin/email-template-docs">Справка</Link></div>
          <div className="email-editor-target">Сейчас: <strong>{activeField === 'subject_template' ? 'тема письма' : activeField === 'html_template' ? 'HTML-версия' : 'обычный текст'}</strong></div>
          <div className="email-editor-variable-list">{template.variables.map(variable => <button type="button" key={variable.name} onClick={() => insertVariable(variable.name)} title={`${variable.description}. Пример: ${variable.sample || '—'}`}><code>{`{${variable.name}}`}</code><span>{variable.description}</span><b>+</b></button>)}</div>
        </section>
        <section className="email-editor-meta"><span>Системный ключ</span><code>{template.key}</code><p>Используется сервисами для выбора этого шаблона.</p></section>
      </aside>
    </div>

    <div className="email-editor-actions"><Link className="button button--ghost" to="/cabinet/admin/email-templates">Отмена</Link><button className="button button--primary" disabled={saving || !template.subject_template.trim() || !template.text_template.trim()} onClick={save}>{saving ? 'Сохраняем…' : 'Сохранить изменения'}</button></div>
  </div>
}
