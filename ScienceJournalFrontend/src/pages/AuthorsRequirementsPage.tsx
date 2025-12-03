import { useLanguage } from '../shared/LanguageContext'

export function AuthorsRequirementsPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'для авторов',
      title: 'Требования к статьям',
      text:
        'Форматирование по стандарту журнала, оригинальность текста, корректное цитирование источников, наличие контактных данных всех авторов и информации о финансировании исследования.',
    },
    en: {
      eyebrow: 'for authors',
      title: 'Submission requirements',
      text:
        'Journal formatting, originality of the text, proper citation of sources, contact details for all authors, and disclosure of research funding.',
    },
    kz: {
      eyebrow: 'авторларға',
      title: 'Мақала талаптары',
      text:
        'Журнал стандарты бойынша форматтау, мәтіннің түпнұсқалығы, дереккөздерді дұрыс дәйексөздеу, барлық авторлардың байланыс деректері және зерттеуді қаржыландыру туралы ақпарат.',
    },
  }[lang]

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <p className="subtitle">{t.text}</p>
      </div>
    </div>
  )
}
