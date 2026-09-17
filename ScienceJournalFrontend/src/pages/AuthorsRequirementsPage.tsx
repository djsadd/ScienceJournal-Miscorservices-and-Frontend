import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Settings = { requirements: Record<'ru' | 'kz' | 'en', boolean> }

export function AuthorsRequirementsPage() {
  const { lang } = useLanguage()
  const [available, setAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const t = {
    ru: { eyebrow: 'для авторов', title: 'Требования к статьям', text: 'Ознакомьтесь с актуальными требованиями к оформлению и подаче рукописей.', empty: 'PDF с требованиями для русского языка пока не загружен.', open: 'Открыть PDF в новой вкладке' },
    en: { eyebrow: 'for authors', title: 'Submission requirements', text: 'Please review the current manuscript formatting and submission requirements.', empty: 'The English requirements PDF has not been uploaded yet.', open: 'Open PDF in a new tab' },
    kz: { eyebrow: 'авторларға', title: 'Мақала талаптары', text: 'Қолжазбаны рәсімдеу және жіберу бойынша өзекті талаптармен танысыңыз.', empty: 'Қазақ тіліндегі талаптар PDF файлы әлі жүктелмеген.', open: 'PDF файлын жаңа бетте ашу' },
  }[lang]

  useEffect(() => {
    setLoading(true)
    api.getJournalSettings<Settings>().then(data => setAvailable(Boolean(data.requirements?.[lang]))).catch(() => setAvailable(false)).finally(() => setLoading(false))
  }, [lang])

  const pdfUrl = api.getRequirementsPdfUrl(lang)
  return <div className="public-container"><div className="section public-section requirements-page">
    <p className="eyebrow">{t.eyebrow}</p><h1 className="hero__title">{t.title}</h1><p className="subtitle">{t.text}</p>
    {!loading && available ? <><a className="button button--ghost" href={pdfUrl} target="_blank" rel="noreferrer">{t.open}</a><iframe className="requirements-pdf" title={t.title} src={pdfUrl} /></> : !loading && <div className="notice">{t.empty}</div>}
  </div></div>
}
