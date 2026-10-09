import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Settings = {
  editor_name_ru: string; editor_name_kz: string; editor_name_en: string
  editor_email_ru: string; editor_email_kz: string; editor_email_en: string
  phone_ru: string; phone_kz: string; phone_en: string
  address_ru: string; address_kz: string; address_en: string
  contact_email_ru: string; contact_email_kz: string; contact_email_en: string
  journal_name_ru: string; journal_name_kz: string; journal_name_en: string
}

export function ContactsPage() {
  const { lang } = useLanguage()
  const [data, setData] = useState<Settings | null>(null)
  useEffect(() => { api.getJournalSettings<Settings>().then(setData).catch(() => undefined) }, [])
  const t = {
    ru: { eyebrow: 'контактная информация', title: 'Редакция «Известия университета Туран-Астана»', email: 'Электронная почта', phone: 'Телефон', address: 'Адрес', editor: 'Ответственный редактор', editorEmail: 'Почта редактора' },
    en: { eyebrow: 'contact information', title: 'Editorial team “Turan-Astana University News”', email: 'Email', phone: 'Phone', address: 'Address', editor: 'Managing editor', editorEmail: 'Editor email' },
    kz: { eyebrow: 'байланыс ақпараты', title: '«Тұран-Астана университетінің хабарлары» редакциясы', email: 'Электрондық пошта', phone: 'Телефон', address: 'Мекенжай', editor: 'Жауапты редактор', editorEmail: 'Редактордың поштасы' },
  }[lang]
  const journalName = data?.[`journal_name_${lang}`]
  const title = journalName
    ? (lang === 'en' ? `Editorial team — ${journalName}` : lang === 'kz' ? `${journalName} редакциясы` : `Редакция — ${journalName}`)
    : t.title
  return <div className="public-container"><div className="section public-section"><p className="eyebrow">{t.eyebrow}</p><h1 className="hero__title">{title}</h1><div className="panel contact-card"><div className="contact-grid"><div><div className="meta-label">{t.email}</div><div>{data?.[`contact_email_${lang}`] || '—'}</div></div><div><div className="meta-label">{t.phone}</div><div>{data?.[`phone_${lang}`] || '—'}</div></div><div><div className="meta-label">{t.address}</div><div>{data?.[`address_${lang}`] || '—'}</div></div></div><div className="divider"/><div className="contact-grid"><div><div className="meta-label">{t.editor}</div><div>{data?.[`editor_name_${lang}`] || '—'}</div></div><div><div className="meta-label">{t.editorEmail}</div><div>{data?.[`editor_email_${lang}`] || '—'}</div></div></div></div></div></div>
}
