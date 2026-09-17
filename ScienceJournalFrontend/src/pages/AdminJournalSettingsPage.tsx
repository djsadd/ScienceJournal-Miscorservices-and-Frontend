import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Lang = 'ru' | 'kz' | 'en'
type Settings = {
  editor_name: string
  editor_email: string
  phone: string
  address: string
  contact_email: string
  requirements: Record<Lang, boolean>
}

const emptySettings: Settings = {
  editor_name: '', editor_email: '', phone: '', address: '', contact_email: '',
  requirements: { ru: false, kz: false, en: false },
}

export default function AdminJournalSettingsPage() {
  const { lang } = useLanguage()
  const [settings, setSettings] = useState<Settings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const labels = {
    ru: { title: 'Настройки журнала', subtitle: 'Контакты редакции и требования к статьям', save: 'Сохранить контакты', name: 'ФИО ответственного редактора', editorEmail: 'Почта ответственного редактора', phone: 'Номер телефона', address: 'Адрес', email: 'Электронная почта редакции', docs: 'PDF-файлы требований', upload: 'Загрузить PDF', open: 'Открыть PDF', saved: 'Изменения сохранены', error: 'Не удалось сохранить изменения' },
    en: { title: 'Journal settings', subtitle: 'Editorial contacts and submission requirements', save: 'Save contacts', name: 'Managing editor name', editorEmail: 'Managing editor email', phone: 'Phone number', address: 'Address', email: 'Editorial email', docs: 'Requirements PDF files', upload: 'Upload PDF', open: 'Open PDF', saved: 'Changes saved', error: 'Could not save changes' },
    kz: { title: 'Журнал баптаулары', subtitle: 'Редакция байланыстары және мақала талаптары', save: 'Байланыстарды сақтау', name: 'Жауапты редактордың аты-жөні', editorEmail: 'Жауапты редактордың поштасы', phone: 'Телефон нөмірі', address: 'Мекенжай', email: 'Редакцияның электрондық поштасы', docs: 'Талаптардың PDF файлдары', upload: 'PDF жүктеу', open: 'PDF ашу', saved: 'Өзгерістер сақталды', error: 'Өзгерістерді сақтау мүмкін болмады' },
  }[lang]

  useEffect(() => {
    api.getJournalSettings<Settings>().then(setSettings).catch(() => setMessage(labels.error)).finally(() => setLoading(false))
  }, [labels.error])

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('')
    try { setSettings(await api.updateJournalSettings<Settings>(settings)); setMessage(labels.saved) }
    catch (error) { setMessage(error instanceof ApiError && error.status === 403 ? 'Доступ разрешён только администратору' : labels.error) }
    finally { setSaving(false) }
  }

  const upload = async (language: Lang, file?: File) => {
    if (!file) return
    setSaving(true); setMessage('')
    try {
      await api.uploadRequirementsPdf(language, file)
      setSettings((current) => ({ ...current, requirements: { ...current.requirements, [language]: true } }))
      setMessage(labels.saved)
    } catch { setMessage(labels.error) } finally { setSaving(false) }
  }

  if (loading) return <div className="page"><div className="panel">Загрузка...</div></div>
  return <div className="page admin-journal-settings">
    <div className="page__header"><div><p className="eyebrow">Admin</p><h1>{labels.title}</h1><p className="subtitle">{labels.subtitle}</p></div></div>
    {message && <div className="notice">{message}</div>}
    <form className="panel settings-form" onSubmit={save}>
      <label><span className="form-label">{labels.name}</span><input className="text-input" required value={settings.editor_name} onChange={e => setSettings({ ...settings, editor_name: e.target.value })} /></label>
      <label><span className="form-label">{labels.editorEmail}</span><input className="text-input" type="email" required value={settings.editor_email} onChange={e => setSettings({ ...settings, editor_email: e.target.value })} /></label>
      <label><span className="form-label">{labels.phone}</span><input className="text-input" required value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} /></label>
      <label><span className="form-label">{labels.email}</span><input className="text-input" type="email" required value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} /></label>
      <label className="settings-form__wide"><span className="form-label">{labels.address}</span><textarea className="text-input" required rows={3} value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} /></label>
      <div className="settings-form__wide"><button className="button" disabled={saving}>{labels.save}</button></div>
    </form>
    <section className="panel"><h2>{labels.docs}</h2><div className="requirements-upload-grid">
      {(['ru', 'kz', 'en'] as Lang[]).map(language => <div className="requirements-upload" key={language}><strong>{language.toUpperCase()}</strong><label className="button button--ghost">{labels.upload}<input hidden type="file" accept="application/pdf,.pdf" disabled={saving} onChange={e => upload(language, e.target.files?.[0])} /></label>{settings.requirements[language] && <a className="button button--ghost" href={api.getRequirementsPdfUrl(language)} target="_blank" rel="noreferrer">{labels.open}</a>}</div>)}
    </div></section>
  </div>
}
