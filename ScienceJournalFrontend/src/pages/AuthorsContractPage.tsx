import { useLanguage } from '../shared/LanguageContext'

export function AuthorsContractPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'для авторов',
      title: 'Публикационный договор',
      text:
        'Перед публикацией автор подписывает договор об исключительных правах на публикацию, гарантирует отсутствие нарушения прав третьих лиц и согласие со стандартами открытого доступа журнала.',
    },
    en: {
      eyebrow: 'for authors',
      title: 'Publishing agreement',
      text:
        'Before publication, the author signs an exclusive publishing agreement, guarantees no infringement of third‑party rights, and agrees with the journal’s open‑access standards.',
    },
    kz: {
      eyebrow: 'авторларға',
      title: 'Баспа келісімі',
      text:
        'Жариялар алдында автор эксклюзивті баспа келісімін жасайды, үшінші тұлғалардың құқықтары бұзылмағанын кепілдейді және журналдың ашық қолжетімділік стандарттарымен келіседі.',
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
