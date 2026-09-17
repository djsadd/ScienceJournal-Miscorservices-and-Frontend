import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Settings = { editor_name: string; editor_email: string; phone: string; address: string; contact_email: string }

export function ContactsPage() {
  const { lang } = useLanguage()
  const [data, setData] = useState<Settings | null>(null)
  useEffect(() => { api.getJournalSettings<Settings>().then(setData).catch(() => undefined) }, [])
  const t = {
    ru: { eyebrow: 'контактная информация', title: 'Редакция «Известия университета Туран-Астана»', email: 'Электронная почта', phone: 'Телефон', address: 'Адрес', editor: 'Ответственный редактор', editorEmail: 'Почта редактора' },
    en: { eyebrow: 'contact information', title: 'Editorial team “Turan-Astana University News”', email: 'Email', phone: 'Phone', address: 'Address', editor: 'Managing editor', editorEmail: 'Editor email' },
    kz: { eyebrow: 'байланыс ақпараты', title: '«Тұран-Астана университетінің хабарлары» редакциясы', email: 'Электрондық пошта', phone: 'Телефон', address: 'Мекенжай', editor: 'Жауапты редактор', editorEmail: 'Редактордың поштасы' },
  }[lang]
  return <div className="public-container"><div className="section public-section"><p className="eyebrow">{t.eyebrow}</p><h1 className="hero__title">{t.title}</h1><div className="panel contact-card"><div className="contact-grid"><div><div className="meta-label">{t.email}</div><div>{data?.contact_email || '—'}</div></div><div><div className="meta-label">{t.phone}</div><div>{data?.phone || '—'}</div></div><div><div className="meta-label">{t.address}</div><div>{data?.address || '—'}</div></div></div><div className="divider"/><div className="contact-grid"><div><div className="meta-label">{t.editor}</div><div>{data?.editor_name || '—'}</div></div><div><div className="meta-label">{t.editorEmail}</div><div>{data?.editor_email || '—'}</div></div></div></div></div></div>
}
