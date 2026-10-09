import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Lang = 'ru' | 'kz' | 'en'
type Settings = {
  university_name_ru: string; university_name_kz: string; university_name_en: string
  journal_name_ru: string; journal_name_kz: string; journal_name_en: string
  editor_name_ru: string; editor_name_kz: string; editor_name_en: string
  editor_email_ru: string; editor_email_kz: string; editor_email_en: string
  phone_ru: string; phone_kz: string; phone_en: string
  address_ru: string; address_kz: string; address_en: string
  contact_email_ru: string; contact_email_kz: string; contact_email_en: string
  logo_available: boolean; logo_url: string | null; logo_version: number | null; requirements: Record<Lang, boolean>
}

const emptySettings: Settings = {
  university_name_ru: '', university_name_kz: '', university_name_en: '',
  journal_name_ru: '', journal_name_kz: '', journal_name_en: '',
  editor_name_ru: '', editor_name_kz: '', editor_name_en: '',
  editor_email_ru: '', editor_email_kz: '', editor_email_en: '',
  phone_ru: '', phone_kz: '', phone_en: '',
  address_ru: '', address_kz: '', address_en: '',
  contact_email_ru: '', contact_email_kz: '', contact_email_en: '',
  logo_available: false, logo_url: null, logo_version: null, requirements: { ru: false, kz: false, en: false },
}
const languageNames: Record<Lang, string> = { ru: 'Русский', kz: 'Қазақша', en: 'English' }

export default function AdminJournalSettingsPage() {
  const { lang } = useLanguage()
  const [settings, setSettings] = useState<Settings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [logoRevision, setLogoRevision] = useState(0)
  const labels = {
    ru: { title: 'Настройки журнала', subtitle: 'Бренд, контакты редакции и требования к статьям', identity: 'Основная информация', university: 'Название университета', journal: 'Название журнала', logo: 'Логотип', logoHint: 'PNG, JPEG или WebP, до 5 МБ', uploadLogo: 'Загрузить логотип', removeLogo: 'Удалить логотип', save: 'Сохранить настройки', contacts: 'Контакты редакции', name: 'ФИО ответственного редактора', editorEmail: 'Почта ответственного редактора', phone: 'Номер телефона', address: 'Адрес', email: 'Электронная почта редакции', docs: 'PDF-файлы требований', upload: 'Загрузить PDF', open: 'Открыть PDF', saved: 'Изменения сохранены', error: 'Не удалось сохранить изменения', loading: 'Загрузка...' },
    en: { title: 'Journal settings', subtitle: 'Branding, editorial contacts, and submission requirements', identity: 'General information', university: 'University name', journal: 'Journal name', logo: 'Logo', logoHint: 'PNG, JPEG, or WebP, up to 5 MB', uploadLogo: 'Upload logo', removeLogo: 'Remove logo', save: 'Save settings', contacts: 'Editorial contacts', name: 'Managing editor name', editorEmail: 'Managing editor email', phone: 'Phone number', address: 'Address', email: 'Editorial email', docs: 'Requirements PDF files', upload: 'Upload PDF', open: 'Open PDF', saved: 'Changes saved', error: 'Could not save changes', loading: 'Loading...' },
    kz: { title: 'Журнал баптаулары', subtitle: 'Бренд, редакция байланыстары және мақала талаптары', identity: 'Негізгі ақпарат', university: 'Университет атауы', journal: 'Журнал атауы', logo: 'Логотип', logoHint: 'PNG, JPEG немесе WebP, 5 МБ дейін', uploadLogo: 'Логотипті жүктеу', removeLogo: 'Логотипті жою', save: 'Баптауларды сақтау', contacts: 'Редакция байланыстары', name: 'Жауапты редактордың аты-жөні', editorEmail: 'Жауапты редактордың поштасы', phone: 'Телефон нөмірі', address: 'Мекенжай', email: 'Редакцияның электрондық поштасы', docs: 'Талаптардың PDF файлдары', upload: 'PDF жүктеу', open: 'PDF ашу', saved: 'Өзгерістер сақталды', error: 'Өзгерістерді сақтау мүмкін болмады', loading: 'Жүктелуде...' },
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
  const uploadLogo = async (file?: File) => {
    if (!file) return
    setSaving(true); setMessage('')
    try {
      await api.uploadJournalLogo(file)
      setSettings(current => ({ ...current, logo_available: true, logo_url: '/publication/journal-settings/logo', logo_version: Date.now() }))
      setLogoRevision(Date.now()); setMessage(labels.saved)
    } catch { setMessage(labels.error) } finally { setSaving(false) }
  }
  const removeLogo = async () => {
    setSaving(true); setMessage('')
    try { await api.deleteJournalLogo(); setSettings(current => ({ ...current, logo_available: false, logo_url: null, logo_version: null })); setMessage(labels.saved) }
    catch { setMessage(labels.error) } finally { setSaving(false) }
  }
  const upload = async (language: Lang, file?: File) => {
    if (!file) return
    setSaving(true); setMessage('')
    try {
      await api.uploadRequirementsPdf(language, file)
      setSettings(current => ({ ...current, requirements: { ...current.requirements, [language]: true } }))
      setMessage(labels.saved)
    } catch { setMessage(labels.error) } finally { setSaving(false) }
  }

  if (loading) return <div className="page"><div className="panel">{labels.loading}</div></div>
  return <div className="page admin-journal-settings">
    <div className="page__header"><div><p className="eyebrow">Admin</p><h1>{labels.title}</h1><p className="subtitle">{labels.subtitle}</p></div></div>
    {message && <div className="notice" role="status">{message}</div>}
    <form onSubmit={save}>
      <section className="panel settings-section">
        <h2>{labels.identity}</h2>
        <div className="settings-form settings-form--identity">
          {(['ru', 'kz', 'en'] as Lang[]).map(language => <div className="settings-language" key={language}>
            <h3>{languageNames[language]}</h3>
            <label><span className="form-label">{labels.university}</span><input className="text-input" required maxLength={200} value={settings[`university_name_${language}`]} onChange={e => setSettings({ ...settings, [`university_name_${language}`]: e.target.value })} /></label>
            <label><span className="form-label">{labels.journal}</span><input className="text-input" required maxLength={200} value={settings[`journal_name_${language}`]} onChange={e => setSettings({ ...settings, [`journal_name_${language}`]: e.target.value })} /></label>
          </div>)}
        </div>
        <div className="logo-setting">
          <div className="logo-setting__preview">{settings.logo_available ? <img src={`${api.getJournalLogoUrl()}?v=${logoRevision || settings.logo_version || ''}`} alt={labels.logo} /> : <span>{labels.logo}</span>}</div>
          <div className="logo-setting__actions"><strong>{labels.logo}</strong><span className="form-hint">{labels.logoHint}</span><div><label className="button button--ghost">{labels.uploadLogo}<input hidden type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={e => uploadLogo(e.target.files?.[0])} /></label>{settings.logo_available && <button className="button button--ghost" type="button" disabled={saving} onClick={removeLogo}>{labels.removeLogo}</button>}</div></div>
        </div>
      </section>
      <section className="panel settings-section">
        <h2>{labels.contacts}</h2>
        <div className="settings-form settings-form--identity">
          {(['ru', 'kz', 'en'] as Lang[]).map(language => <div className="settings-language" key={language}>
            <h3>{languageNames[language]}</h3>
            <label><span className="form-label">{labels.name}</span><input className="text-input" required value={settings[`editor_name_${language}`]} onChange={e => setSettings({ ...settings, [`editor_name_${language}`]: e.target.value })} /></label>
            <label><span className="form-label">{labels.editorEmail}</span><input className="text-input" type="email" required value={settings[`editor_email_${language}`]} onChange={e => setSettings({ ...settings, [`editor_email_${language}`]: e.target.value })} /></label>
            <label><span className="form-label">{labels.phone}</span><input className="text-input" required value={settings[`phone_${language}`]} onChange={e => setSettings({ ...settings, [`phone_${language}`]: e.target.value })} /></label>
            <label><span className="form-label">{labels.email}</span><input className="text-input" type="email" required value={settings[`contact_email_${language}`]} onChange={e => setSettings({ ...settings, [`contact_email_${language}`]: e.target.value })} /></label>
            <label><span className="form-label">{labels.address}</span><textarea className="text-input" required rows={3} value={settings[`address_${language}`]} onChange={e => setSettings({ ...settings, [`address_${language}`]: e.target.value })} /></label>
          </div>)}
        </div>
      </section>
      <button className="button settings-save" disabled={saving}>{labels.save}</button>
    </form>
    <section className="panel settings-section"><h2>{labels.docs}</h2><div className="requirements-upload-grid">
      {(['ru', 'kz', 'en'] as Lang[]).map(language => <div className="requirements-upload" key={language}><strong>{language.toUpperCase()}</strong><label className="button button--ghost">{labels.upload}<input hidden type="file" accept="application/pdf,.pdf" disabled={saving} onChange={e => upload(language, e.target.files?.[0])} /></label>{settings.requirements[language] && <a className="button button--ghost" href={api.getRequirementsPdfUrl(language)} target="_blank" rel="noreferrer">{labels.open}</a>}</div>)}
    </div></section>
  </div>
}
