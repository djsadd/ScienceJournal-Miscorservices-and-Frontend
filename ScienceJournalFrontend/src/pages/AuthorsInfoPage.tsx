import { Link } from 'react-router-dom'
import { useLanguage } from '../shared/LanguageContext'

export function AuthorsInfoPage() {
  const { lang } = useLanguage()
  const t = {
    ru: { eyebrow: 'для авторов', title: 'Как подать статью', requirements: 'Основные требования', requirementItems: ['Форматирование рукописи по стандарту журнала.', 'Оригинальность и корректное цитирование источников.', 'Указание данных и этических соглашений, если применимо.'], process: 'Процесс', processItems: ['Отправьте рукопись через личный кабинет.', 'Дождитесь назначения рецензентов (2–4 недели).', 'Выполните правки по итогам раундов.'], support: 'Поддержка', supportText: 'Свяжитесь с редакцией, если требуется консультация по формату, проверке оригинальности или этике публикаций.', submit: 'Перейти к подаче' },
    en: { eyebrow: 'for authors', title: 'How to submit an article', requirements: 'Key requirements', requirementItems: ['Format the manuscript according to the journal guidelines.', 'Ensure originality and cite sources correctly.', 'Provide data and ethics statements where applicable.'], process: 'Process', processItems: ['Submit your manuscript through your account.', 'Wait for reviewers to be assigned (2–4 weeks).', 'Revise the manuscript following each review round.'], support: 'Support', supportText: 'Contact the editorial office if you need advice on formatting, originality checks, or publication ethics.', submit: 'Start submission' },
    kz: { eyebrow: 'авторларға', title: 'Мақаланы қалай жіберуге болады', requirements: 'Негізгі талаптар', requirementItems: ['Қолжазбаны журнал талаптарына сәйкес рәсімдеңіз.', 'Түпнұсқалықты сақтап, дереккөздерге дұрыс сілтеме жасаңыз.', 'Қажет болған жағдайда деректер мен этикалық мәлімдемелерді көрсетіңіз.'], process: 'Үдеріс', processItems: ['Қолжазбаны жеке кабинет арқылы жіберіңіз.', 'Рецензенттердің тағайындалуын күтіңіз (2–4 апта).', 'Рецензиялау кезеңдерінің қорытындысы бойынша түзетулер енгізіңіз.'], support: 'Қолдау', supportText: 'Рәсімдеу, түпнұсқалықты тексеру немесе жариялау этикасы бойынша кеңес қажет болса, редакцияға хабарласыңыз.', submit: 'Мақала жіберуге өту' },
  }[lang]
  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <div className="panel">
          <h3 className="panel-title">{t.requirements}</h3>
          <ul className="list">
            {t.requirementItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="grid grid-2" style={{ marginTop: '0.8rem' }}>
          <div className="panel">
            <h3 className="panel-title">{t.process}</h3>
            <ul className="list">
              {t.processItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="panel">
            <h3 className="panel-title">{t.support}</h3>
            <p className="subtitle">{t.supportText}</p>
            <Link className="button button--primary" to="/cabinet/submissions">
              {t.submit}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
