import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useLanguage } from '../LanguageContext'

type DocumentKind = 'about' | 'editorial-policy' | 'ai-policy'
type Settings = { documents?: Partial<Record<DocumentKind, Partial<Record<'ru' | 'kz' | 'en', boolean>>>> }

export default function PublicPagePdf({ kind, title }: { kind: DocumentKind; title: string }) {
  const { lang } = useLanguage()
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let active = true
    api.getJournalSettings<Settings>()
      .then((settings) => { if (active) setAvailable(Boolean(settings.documents?.[kind]?.[lang])) })
      .catch(() => { if (active) setAvailable(false) })
    return () => { active = false }
  }, [kind, lang])

  if (!available) return null
  const url = api.getPublicDocumentPdfUrl(kind, lang)
  const openLabel = lang === 'en' ? 'Open PDF in a new tab' : lang === 'kz' ? 'PDF файлын жаңа бетте ашу' : 'Открыть PDF в новой вкладке'
  return <div className="public-page-pdf">
    <a className="button button--ghost" href={url} target="_blank" rel="noreferrer">{openLabel}</a>
    <iframe className="requirements-pdf" title={`${title} PDF`} src={url} />
  </div>
}
