import { useLanguage } from '../shared/LanguageContext'

const copy = {
  ru: {
    eyebrow: 'О журнале',
    title: 'Вестник Туран-Астана',
    paragraphs: [
      'Научный журнал «Вестник Туран-Астана» является рецензируемым изданием, публикующим результаты оригинальных исследований в области экономики, управления, права, социальных и гуманитарных наук.',
      'Журнал издается с 2019 года, имеет свидетельство о регистрации и международный номер ISSN 2663-631X. Учредителем журнала является Университет «Туран-Астана».',
      'Редакционная политика направлена на развитие академического диалога между исследователями, преподавателями и практиками, а также на продвижение лучших научных и прикладных исследований.',
    ],
  },
  en: {
    eyebrow: 'About the journal',
    title: 'Bulletin of Turan-Astana',
    paragraphs: [
      '“Bulletin of Turan-Astana” is a peer‑reviewed journal publishing original research in economics, management, law, social and humanities.',
      'The journal has been published since 2019 and holds a media registration certificate and an international ISSN 2663‑631X. The founder is Turan‑Astana University.',
      'Editorial policy promotes academic dialogue among researchers, faculty and practitioners, and advances high‑quality scientific and applied studies.',
    ],
  },
  kz: {
    eyebrow: 'Журнал туралы',
    title: '«Туран-Астана» хабаршысы',
    paragraphs: [
      '«Туран-Астана» хабаршысы — экономика, менеджмент, құқық, әлеуметтік және гуманитарлық ғылымдар саласындағы түпнұсқа зерттеулерді жариялайтын рецензияланатын журнал.',
      'Журнал 2019 жылдан бері шығады, тіркеу куәлігін және халықаралық ISSN 2663‑631X нөмірін иеленген. Құрушылары — «Туран-Астана» университеті.',
      'Редакциялық саясат зерттеушілер, оқытушылар және тәжірибешілер арасындағы академиялық диалогты дамытуға және жоғары сапалы ғылыми әрі қолданбалы зерттеулерді ілгерілетуге бағытталған.',
    ],
  },
} as const

export function AboutPage() {
  const { lang } = useLanguage()
  const t = copy[lang] ?? copy.ru

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow.toLowerCase()}</p>
        <h1 className="hero__title">{t.title}</h1>
        {t.paragraphs.map((p, i) => (
          <p className="subtitle" key={i}>{p}</p>
        ))}
      </div>
    </div>
  )
}
