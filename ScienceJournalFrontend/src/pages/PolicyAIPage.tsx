import { useLanguage } from '../shared/LanguageContext'

export function PolicyAIPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'регламенты',
      title: 'Заявление об отношении к использованию ИИ',
      text:
        'Приём материалов, созданных с использованием ИИ, допускается только с прозрачным указанием инструментов и степени участия автора. Ответственность за корректность, авторство и отсутствие заимствований несёт автор.',
    },
    en: {
      eyebrow: 'policies',
      title: 'Statement on AI usage',
      text:
        'Submissions created with AI are accepted only with transparent disclosure of tools and the author’s level of involvement. The author is responsible for accuracy, authorship and absence of plagiarism.',
    },
    kz: {
      eyebrow: 'ережелер',
      title: 'ЖИ қолдануға қатысты мәлімдеме',
      text:
        'ЖИ көмегімен жасалған материалдар тек қолданылған құралдарды және автордың қатысу деңгейін ашық көрсету арқылы қабылданады. Дұрыстығы, авторлығы және плагиаттың болмауы үшін автор жауап береді.',
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
