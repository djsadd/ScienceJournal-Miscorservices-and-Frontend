import { useLanguage } from '../shared/LanguageContext'

export function PolicyEthicsPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'регламенты',
      title: 'Публикационная этика',
      text:
        'Политика предотвращения плагиата, конфликта интересов и корректного цитирования. Авторы подтверждают оригинальность текста, предоставляют данные при запросе редакции и раскрывают финансовые источники.',
    },
    en: {
      eyebrow: 'policies',
      title: 'Publication ethics',
      text:
        'Policy to prevent plagiarism, conflicts of interest and ensure proper citation. Authors confirm originality, provide data upon editorial request, and disclose funding sources.',
    },
    kz: {
      eyebrow: 'ережелер',
      title: 'Жариялау этикасы',
      text:
        'Плагиатты болдырмау, мүдделер қақтығысын ашық көрсету және дұрыс дәйексөз келтіру саясаты. Авторлар мәтіннің түпнұсқалығын растайды, редакция сұрауы бойынша деректерді ұсынады және қаржыландыру көздерін жариялайды.',
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
