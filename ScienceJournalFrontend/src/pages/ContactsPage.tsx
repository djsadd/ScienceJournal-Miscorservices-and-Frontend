import { useLanguage } from '../shared/LanguageContext'

export function ContactsPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'контактная информация',
      title: 'Редакция «Вестник Туран-Астана»',
      emailLabel: 'Электронная почта',
      phoneLabel: 'Телефон',
      addressLabel: 'Адрес',
      addressValue: 'г. Астана, пр. Ықылас дүкенұлы, 29, Университет Туран-Астана',
      editorLabel: 'Ответственный редактор',
      editorName: 'Доценко А.Н',
      editorEmailLabel: 'Email редактора',
      note:
        'По вопросам подачи рукописей, рецензирования, макетирования и публикации обращайтесь по указанным контактам. Мы стараемся отвечать в течение 2 рабочих дней.',
    },
    en: {
      eyebrow: 'contact information',
      title: 'Editorial team “Bulletin of Turan-Astana”',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      addressLabel: 'Address',
      addressValue: 'Astana, Yqylas Dukenuly ave., 29, Turan-Astana University',
      editorLabel: 'Managing editor',
      editorName: 'Dotsenko A.N.',
      editorEmailLabel: 'Editor email',
      note:
        'For submissions, peer review, layout and publishing questions, contact us via the details above. We aim to respond within 2 business days.',
    },
    kz: {
      eyebrow: 'байланыс ақпараттары',
      title: '«Туран-Астана» журналы редакциясы',
      emailLabel: 'Email',
      phoneLabel: 'Телефон',
      addressLabel: 'Мекенжай',
      addressValue: 'Астана қ., Ықылас Дүкенұлы даңғ., 29, «Туран-Астана» университеті',
      editorLabel: 'Жауапты редактор',
      editorName: 'Доценко А.Н.',
      editorEmailLabel: 'Редактордың email-і',
      note:
        'Қолжазба жіберу, рецензиялау, беттеу және жариялау бойынша сұрақтарыңыз болса, көрсетілген байланысқа жазыңыз. Біз 2 жұмыс күні ішінде жауап беруге тырысамыз.',
    },
  }[lang]

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <div className="panel contact-card">
          <div className="contact-grid">
            <div>
              <div className="meta-label">{t.emailLabel}</div>
              <div>zharshy@tau-edu.kz</div>
            </div>
            <div>
              <div className="meta-label">{t.phoneLabel}</div>
              <div>+7 (7172) 64-43-10</div>
            </div>
            <div>
              <div className="meta-label">{t.addressLabel}</div>
              <div>{t.addressValue}</div>
            </div>
          </div>
          <div className="divider" />
          <div className="contact-grid">
            <div>
              <div className="meta-label">{t.editorLabel}</div>
              <div>{t.editorName}</div>
            </div>
            <div>
              <div className="meta-label">{t.editorEmailLabel}</div>
              <div>zharshy@tau-edu.kz</div>
            </div>
          </div>
          <p className="subtitle">{t.note}</p>
        </div>
      </div>
    </div>
  )
}
