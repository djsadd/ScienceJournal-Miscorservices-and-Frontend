import { useLanguage } from '../shared/LanguageContext'
import PublicPagePdf from '../shared/components/PublicPagePdf'

export function PoliciesPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'политика журнала',
      title: 'Редакционная политика',
    },
    en: {
      eyebrow: 'journal policy',
      title: 'Editorial policy',
    },
    kz: {
      eyebrow: 'журнал саясаты',
      title: 'Редакциялық саясат',
    },
  }[lang]

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <PublicPagePdf kind="editorial-policy" title={t.title} />
      </div>
    </div>
  )
}
