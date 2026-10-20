import { useLanguage } from '../shared/LanguageContext'

const copy = {
  ru: {
    eyebrow: 'О журнале',
    title: 'О журнале',
    paragraphs: [
      'Журнал «Известия университета „Туран-Астана“» является рецензируемым научным журналом, имеющим казахстанскую и международную регистрацию:',
      'печатная версия — свидетельство о регистрации СМИ № 17458-Ж от 14 января 2019 года, ISSN 2663-631X;',
      'онлайн-версия — свидетельство о постановке на учёт периодического печатного издания, интернет-издания № KZ77VPY00156365 от 11.08.2026, ISSN 3136-5337.',
      'Учредитель — университет «Туран-Астана».',
      'Журнал выпускается с 2019 года и служит открытой платформой для обсуждения актуальных проблем современных социально-гуманитарных исследований экономической, политологической, философской и педагогической направленности.',
    ],
    postScopeParagraphs: [
      'Плата за публикацию в журнале не взимается.',
      'Издание содействует обмену опытом в научном и экспертном сообществе, повышению профессионального уровня учёных, профессорско-преподавательского состава вузов и колледжей, распространению передовых социально-гуманитарных знаний среди казахстанских и зарубежных читателей.',
      'В редакционную коллегию журнала и его международный редакционный совет входят известные и авторитетные казахстанские и зарубежные учёные.',
      'Редакционная политика журнала «Известия университета „Туран-Астана“» строится на принципах информационной открытости, научности и доступности авторских публикаций.',
      'Журнал выпускается в печатной версии. Архивы журнала размещаются на сайте, а полнотекстовые версии публикаций доступны для ознакомления всем желающим без ограничений. Периодичность выхода номеров — ежеквартально.',
    ],
    purposeTitle: 'Цель и задачи журнала',
    purpose: 'Цель журнала «Известия университета „Туран-Астана“» — содействие развитию социально-гуманитарных исследований. Для реализации данной цели служат следующие задачи:',
    tasks: [
      'ознакомление научного сообщества с новейшими исследованиями в актуальных областях современного социально-гуманитарного знания;',
      'создание среды для обмена мнениями и опытом казахстанских и зарубежных учёных и экспертов, укрепления связей науки и практики;',
      'содействие повышению научно-теоретического и методологического уровня казахстанских исследований.',
    ],
    scopeTitle: 'Тематическая направленность журнала',
    scopeIntro: 'Журнал «Известия университета „Туран-Астана“» осуществляет научно-публикационную деятельность по следующим тематическим направлениям:',
    scope: [
      'экономика, управление, бизнес;',
      'педагогические науки, филология и психология;',
      'политология;',
      'юриспруденция;',
      'прочие социальные науки — культурология, гостиничный бизнес, туризм, междисциплинарные общественные науки — и мультидисциплинарные гуманитарные науки;',
      'компьютерные науки и информатика.',
    ],
  },
  en: {
    eyebrow: 'About the journal',
    title: 'About the journal',
    paragraphs: [
      'The journal “Turan-Astana University News” is a peer-reviewed scientific journal registered in Kazakhstan and internationally:',
      'print edition — mass media registration certificate No. 17458-Zh dated 14 January 2019, ISSN 2663-631X;',
      'online edition — certificate of registration of a periodical print and internet edition No. KZ77VPY00156365 dated 11 August 2026, ISSN 3136-5337.',
      'The founder is Turan-Astana University.',
      'Published since 2019, the journal provides an open platform for discussing current economic, political, philosophical, and educational issues in contemporary social sciences and humanities.',
    ],
    postScopeParagraphs: ['No publication fee is charged.', 'The journal facilitates the exchange of experience within the academic and expert community, supports the professional development of researchers and teaching staff at universities and colleges, and disseminates advanced knowledge in the social sciences and humanities among readers in Kazakhstan and abroad.', 'The editorial board and international editorial council include renowned and respected scholars from Kazakhstan and other countries.', 'The editorial policy of “Turan-Astana University News” is based on transparency, academic rigour, and accessibility of authors’ publications.', 'The journal is published in print. Its archives are available on the website, and full-text publications are freely accessible without restrictions. Issues are published quarterly.'],
    purposeTitle: 'Aim and objectives of the journal',
    purpose: 'The aim of “Turan-Astana University News” is to promote the development of research in the social sciences and humanities. This aim is pursued through the following objectives:',
    tasks: ['to introduce the academic community to the latest research in relevant fields of contemporary social sciences and humanities;', 'to create an environment for exchanging ideas and experience among Kazakhstani and international scholars and experts and for strengthening links between research and practice;', 'to help improve the theoretical and methodological quality of research in Kazakhstan.'],
    scopeTitle: 'Thematic scope of the journal',
    scopeIntro: '“Turan-Astana University News” publishes research in the following subject areas:',
    scope: ['economics, management, and business;', 'education, philology, and psychology;', 'political science;', 'law;', 'other social sciences, including cultural studies, hospitality, tourism, interdisciplinary social sciences, and multidisciplinary humanities;', 'computer science and informatics.'],
  },
  kz: {
    eyebrow: 'Журнал туралы',
    title: 'Журнал туралы',
    paragraphs: [
      '«Тұран-Астана» университетінің хабарлары» журналы — Қазақстанда және халықаралық деңгейде тіркелген рецензияланатын ғылыми журнал:',
      'баспа нұсқасы — 2019 жылғы 14 қаңтардағы № 17458-Ж бұқаралық ақпарат құралын тіркеу туралы куәлік, ISSN 2663-631X;',
      'онлайн нұсқасы — 2026 жылғы 11 тамыздағы № KZ77VPY00156365 мерзімді баспа басылымын және интернет-басылымды есепке қою туралы куәлік, ISSN 3136-5337.',
      'Құрылтайшысы — «Тұран-Астана» университеті.',
      'Журнал 2019 жылдан бері шығады және қазіргі әлеуметтік-гуманитарлық зерттеулердің экономикалық, саясаттану, философиялық және педагогикалық бағыттарындағы өзекті мәселелерді талқылауға арналған ашық алаң болып табылады.',
    ],
    postScopeParagraphs: ['Журналда мақала жариялау үшін ақы алынбайды.', 'Басылым ғылыми және сараптамалық қоғамдастықта тәжірибе алмасуға, ғалымдар мен жоғары оқу орындары және колледждердің профессор-оқытушылар құрамының кәсіби деңгейін арттыруға, қазақстандық және шетелдік оқырмандар арасында озық әлеуметтік-гуманитарлық білімді таратуға ықпал етеді.', 'Журналдың редакциялық алқасы мен халықаралық редакциялық кеңесінің құрамына Қазақстанның және шетелдердің белгілі әрі беделді ғалымдары кіреді.', '«Тұран-Астана» университетінің хабарлары» журналының редакциялық саясаты ақпараттық ашықтық, ғылымилық және авторлық жарияланымдардың қолжетімділігі қағидаттарына негізделеді.', 'Журнал баспа нұсқасында шығарылады. Журнал мұрағаты сайтта орналастырылады, ал жарияланымдардың толық мәтіндері барлық оқырманға шектеусіз қолжетімді. Шығарылымдар тоқсан сайын жарық көреді.'],
    purposeTitle: 'Журналдың мақсаты мен міндеттері',
    purpose: '«Тұран-Астана» университетінің хабарлары» журналының мақсаты — әлеуметтік-гуманитарлық зерттеулердің дамуына ықпал ету. Осы мақсатқа жету үшін мынадай міндеттер қойылады:',
    tasks: ['ғылыми қоғамдастықты қазіргі әлеуметтік-гуманитарлық білімнің өзекті салаларындағы жаңа зерттеулермен таныстыру;', 'қазақстандық және шетелдік ғалымдар мен сарапшылар арасында пікір және тәжірибе алмасуға жағдай жасау, ғылым мен практиканың байланысын нығайту;', 'қазақстандық зерттеулердің ғылыми-теориялық және әдіснамалық деңгейін арттыруға ықпал ету.'],
    scopeTitle: 'Журналдың тақырыптық бағыттары',
    scopeIntro: '«Тұран-Астана» университетінің хабарлары» журналы келесі тақырыптық бағыттар бойынша ғылыми жарияланымдар шығарады:',
    scope: ['экономика, басқару, бизнес;', 'педагогикалық ғылымдар, филология және психология;', 'саясаттану;', 'құқықтану;', 'өзге әлеуметтік ғылымдар — мәдениеттану, қонақжайлылық бизнесі, туризм, пәнаралық қоғамдық ғылымдар және мультидисциплинарлық гуманитарлық ғылымдар;', 'компьютерлік ғылымдар және информатика.'],
  },
} as const

export function AboutPage() {
  const { lang } = useLanguage()
  const t = copy[lang] ?? copy.ru

  return (
    <div className="public-container">
      <div className="section public-section about-page-content">
        <h1 className="hero__title">{t.title}</h1>
        {t.paragraphs.map((p, i) => (
          <p className="about-page-content__text" key={i}>{p}</p>
        ))}
        <>
          <div className="panel" style={{ marginTop: '1.5rem' }}>
            <h2 className="panel-title">{t.purposeTitle}</h2>
            <p className="about-page-content__text">{t.purpose}</p>
            <ul className="list">{t.tasks.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="panel" style={{ marginTop: '1rem' }}>
            <h2 className="panel-title">{t.scopeTitle}</h2>
            <p className="about-page-content__text">{t.scopeIntro}</p>
            <ul className="list">{t.scope.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          {t.postScopeParagraphs.map((p, i) => (
            <p className="about-page-content__text" key={`post-scope-${i}`}>{p}</p>
          ))}
        </>
      </div>
    </div>
  )
}
