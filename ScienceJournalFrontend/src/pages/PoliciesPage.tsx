import { useLanguage } from '../shared/LanguageContext'

export function PoliciesPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'регламенты, процедуры, документация',
      title: 'Правила и процессы',
      scope: {
        title: 'Тематика журнала',
        list: ['экономика и управление;', 'право и государственное управление;', 'социальные и гуманитарные науки;', 'маркетинг, финансы и предпринимательство.'],
      },
      authors: {
        title: 'Правила для авторов',
        list: ['Требования к форматированию рукописи.', 'Проверка оригинальности и наличие данных.', 'Этика публикаций и раскрытие конфликтов интересов.'],
      },
      review: {
        title: 'Процесс рецензирования',
        list: ['Двустороннее слепое рецензирование.', 'Сроки: 2–4 недели на отзыв.', 'Раунды доработок и финальное решение редакции.'],
      },
    },
    en: {
      eyebrow: 'policies, procedures, documentation',
      title: 'Policies and processes',
      scope: {
        title: 'Journal scope',
        list: ['economics and management;', 'law and public administration;', 'social and humanities;', 'marketing, finance and entrepreneurship.'],
      },
      authors: {
        title: 'Guidelines for authors',
        list: ['Manuscript formatting requirements.', 'Originality check and data availability.', 'Publication ethics and conflict of interest disclosure.'],
      },
      review: {
        title: 'Peer review process',
        list: ['Double‑blind peer review.', 'Timeline: 2–4 weeks for feedback.', 'Revision rounds and final editorial decision.'],
      },
    },
    kz: {
      eyebrow: 'саясаттар, рәсімдер, құжаттар',
      title: 'Ережелер мен үдерістер',
      scope: {
        title: 'Журнал тақырыбы',
        list: ['экономика және басқару;', 'құқық және мемлекеттік басқару;', 'әлеуметтік және гуманитарлық ғылымдар;', 'маркетинг, қаржы және кәсіпкерлік.'],
      },
      authors: {
        title: 'Авторларға арналған ережелер',
        list: ['Қолжазбаны форматтау талаптары.', 'Түпнұсқалықты тексеру және деректердің қолжетімділігі.', 'Жариялау этикасы және мүдделер қақтығысын ашып көрсету.'],
      },
      review: {
        title: 'Рецензиялау үдерісі',
        list: ['Қос соқыр рецензиялау.', 'Мерзімдер: пікір үшін 2–4 апта.', 'Түзету раундтары және редакцияның соңғы шешімі.'],
      },
    },
  }[lang]

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <div className="panel">
          <h3 className="panel-title">{t.scope.title}</h3>
          <ul className="list">
            {t.scope.list.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-2">
          <div className="panel">
            <h3 className="panel-title">{t.authors.title}</h3>
            <ul className="list">
              {t.authors.list.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3 className="panel-title">{t.review.title}</h3>
            <ul className="list">
              {t.review.list.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
