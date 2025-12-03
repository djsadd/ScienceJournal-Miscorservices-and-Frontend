import { useLanguage } from '../shared/LanguageContext'

export function PolicyReviewPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'регламенты',
      title: 'Регламент рецензирования',
      text:
        'Двустороннее слепое рецензирование, срок подготовки отзыва — 2–4 недели. Возможны несколько раундов до финального решения редакции; все замечания фиксируются в системе и доступны автору.',
    },
    en: {
      eyebrow: 'policies',
      title: 'Peer review regulations',
      text:
        'Double‑blind peer review; review preparation time is 2–4 weeks. Multiple rounds are possible before the final editorial decision; all comments are recorded in the system and available to the author.',
    },
    kz: {
      eyebrow: 'ережелер',
      title: 'Рецензиялау регламенті',
      text:
        'Қос соқыр рецензиялау; пікір дайындау мерзімі — 2–4 апта. Редакцияның соңғы шешіміне дейін бірнеше раунд болуы мүмкін; барлық ескертпелер жүйеде тіркеліп, авторға қолжетімді.',
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
