import type { Lang } from './labels'

type NavCopy = {
  brandAlt: string
  home: string
  about: string
  archive: string
  search: string
  contacts: string
  editorial: { title: string; board: string; policies: string }
  policies: { title: string; ethics: string; ai: string; review: string }
  authors: { title: string; requirements: string; contract: string }
  cabinet: string
  searchModal: {
    title: string
    placeholder: string
    hints: [string, string]
    cancel: string
    submit: string
    close: string
  }
  theme: { light: string; dark: string; ariaLight: string; ariaDark: string; iconLight: string; iconDark: string }
  mobileMenu: { ariaOpen: string; ariaClose: string }
}

type HomeCopy = {
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    statsTitle: string
    statsDescription: string
    buttons: {
      authedPrimary: string
      authedSecondary: string
      guestPrimary: string
      guestSecondary: string
    }
    stats: { value: string; label: string }[]
  }
  about: { eyebrow: string; title: string; paragraphs: string[]; cta: string }
  purpose: { eyebrow: string; title: string; paragraph: string; cta: string }
  editorial: {
    eyebrow: string
    title: string
    cta: string
    board: { name: string; role: string; field: string }[]
  }
  rules: { eyebrow: string; title: string; cta: string; list: string[] }
  registry: {
    eyebrow: string
    title: string
    cta: string
    items: { title: string; text: string }[]
  }
  contacts: {
    eyebrow: string
    title: string
    subtitle: string
    emailLabel: string
    phoneLabel: string
    addressLabel: string
    phoneValue: string
    addressValue: string
  }
}

export const publicNavCopy: Record<Lang, NavCopy> = {
  ru: {
    brandAlt: 'Логотип журнала',
    home: 'Главная',
    about: 'О журнале',
    archive: 'Архив',
    search: 'Поиск',
    contacts: 'Контакты',
    editorial: { title: 'Редакция', board: 'Состав редакции', policies: 'Политики издания' },
    policies: {
      title: 'Политики и этика',
      ethics: 'Этическая политика',
      ai: 'Политика по ИИ',
      review: 'Процесс рецензирования',
    },
    authors: { title: 'Авторам', requirements: 'Требования к статьям', contract: 'Публикационный договор' },
    cabinet: 'Кабинет',
    searchModal: {
      title: 'Поиск',
      placeholder: 'Введите запрос',
      hints: ['ФИО или заголовок', 'Ключевые слова, DOI, дата'],
      cancel: 'Отмена',
      submit: 'Перейти к поиску',
      close: 'Закрыть поиск',
    },
    theme: {
      light: 'Светло',
      dark: 'Темно',
      ariaLight: 'Включить светлую тему',
      ariaDark: 'Включить тёмную тему',
      iconLight: '☀️',
      iconDark: '🌙',
    },
    mobileMenu: { ariaOpen: 'Открыть меню', ariaClose: 'Закрыть меню' },
  },
  en: {
    brandAlt: 'Journal logo',
    home: 'Home',
    about: 'About',
    archive: 'Archive',
    search: 'Search',
    contacts: 'Contacts',
    editorial: { title: 'Editorial', board: 'Editorial board', policies: 'Journal policies' },
    policies: {
      title: 'Policies & ethics',
      ethics: 'Ethics policy',
      ai: 'AI disclosure',
      review: 'Peer review process',
    },
    authors: { title: 'For authors', requirements: 'Submission guidelines', contract: 'Publishing agreement' },
    cabinet: 'Dashboard',
    searchModal: {
      title: 'Search',
      placeholder: 'Type your query',
      hints: ['Name or article title', 'Keywords, DOI, date'],
      cancel: 'Cancel',
      submit: 'Go to search',
      close: 'Close search',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      ariaLight: 'Switch to light theme',
      ariaDark: 'Switch to dark theme',
      iconLight: '☀️',
      iconDark: '🌙',
    },
    mobileMenu: { ariaOpen: 'Open menu', ariaClose: 'Close menu' },
  },
  kz: {
    brandAlt: 'Журнал логотипы',
    home: 'Басты бет',
    about: 'Журнал туралы',
    archive: 'Мұрағат',
    search: 'Іздеу',
    contacts: 'Байланыс',
    editorial: { title: 'Редакция', board: 'Редколлегия құрамы', policies: 'Журнал саясаты' },
    policies: {
      title: 'Саясат және этика',
      ethics: 'Этикалық саясат',
      ai: 'ЖИ туралы ақпарат',
      review: 'Рецензиялау үдерісі',
    },
    authors: { title: 'Авторларға', requirements: 'Мақала талаптары', contract: 'Баспа келісімі' },
    cabinet: 'Кабинет',
    searchModal: {
      title: 'Іздеу',
      placeholder: 'Сұранысты енгізіңіз',
      hints: ['Аты-жөні немесе тақырып', 'Кілт сөздер, DOI, күн'],
      cancel: 'Бас тарту',
      submit: 'Іздеуге көшу',
      close: 'Іздеуді жабу',
    },
    theme: {
      light: 'Жарық',
      dark: 'Қараңғы',
      ariaLight: 'Жарық тақырыпты қосу',
      ariaDark: 'Қараңғы тақырыпты қосу',
      iconLight: '☀️',
      iconDark: '🌙',
    },
    mobileMenu: { ariaOpen: 'Мәзірді ашу', ariaClose: 'Мәзірді жабу' },
  },
}

export const homeCopy: Record<Lang, HomeCopy> = {
  ru: {
    hero: {
      eyebrow: 'Научный журнал университета',
      title: 'Известия университета «Туран-Астана»',
      subtitle:
        'Рецензируемый журнал о цифровой трансформации, управлении и экономике. Мы публикуем результаты исследований, практические кейсы и обзорные статьи — от теории до прикладных проектов.',
      statsTitle: 'Основные сведения',
      statsDescription:
        'Международное издание, посвящённое исследованиям в области цифровых технологий, управления и экономики.',
      buttons: {
        authedPrimary: 'Кабинет',
        authedSecondary: 'Профиль',
        guestPrimary: 'Войти',
        guestSecondary: 'Регистрация',
      },
      stats: [
        { value: '2019', label: 'Год основания' },
        { value: '2663-631X', label: 'ISSN' },
        { value: '4', label: 'Выпусков в год' },
      ],
    },
    about: {
      eyebrow: 'О журнале',
      title: 'Издание о науке и инновациях',
      paragraphs: [
        'Science Journal — площадка для публикаций о цифровой трансформации, менеджменте, экономике и образовании. Мы объединяем исследователей, преподавателей и практиков.',
        'Мы поддерживаем открытость, соблюдаем международные стандарты рецензирования и публикуем материалы на русском, английском и казахском языках.',
      ],
      cta: 'Связаться с редакцией',
    },
    purpose: {
      eyebrow: 'Цель и задачи',
      title: 'Повышаем качество исследований',
      paragraph:
        'Наша миссия — помогать авторам улучшать статьи, а читателям получать проверенные данные. Мы продвигаем культуру академической добросовестности и прозрачности.',
      cta: 'Требования к авторам',
    },
    editorial: {
      eyebrow: 'Редколлегия',
      title: 'Эксперты и академики в составе',
      cta: 'Правила подачи материалов',
      board: [
        { name: 'Айман Оспанова', role: 'Главный редактор', field: 'Цифровая трансформация' },
        { name: 'Данил Ержанов', role: 'Заместитель главного редактора', field: 'Государственное управление' },
        { name: 'Карина Исатаева', role: 'Ответственный секретарь', field: 'Аналитика данных и ИИ' },
      ],
    },
    rules: {
      eyebrow: 'Требования',
      title: 'Основные правила подачи материалов',
      cta: 'Подать статью',
      list: [
        'Оригинальность и отсутствие плагиата.',
        'Соответствие формату журнала и теме выпуска.',
        'Двойное слепое рецензирование обязательно.',
        'Соблюдение сроков ответов и доработок.',
      ],
    },
    registry: {
      eyebrow: 'Журнал в индексах',
      title: 'Реестры и регистрационные данные',
      cta: 'Связаться с редакцией',
      items: [
        { title: 'Регистрация СМИ', text: 'Свидетельство №17458-Ж, выдано 14.01.2019.' },
        { title: 'ISSN', text: '2663-631X — печатная версия журнала.' },
        {
          title: 'Периодичность',
          text: '4 выпуска в год. Материалы публикуются на русском, английском и казахском языках.',
        },
      ],
    },
    contacts: {
      eyebrow: 'Мы на связи',
      title: 'Контакты',
      subtitle: 'Пишите нам по вопросам публикаций, сотрудничества и приглашений в рецензенты.',
      emailLabel: 'Email',
      phoneLabel: 'Телефон',
      addressLabel: 'Адрес',
      phoneValue: '+7 (7172) 123-456',
      addressValue: 'Астана, проспект Туран, 1',
    },
  },
  en: {
    hero: {
      eyebrow: 'University research journal',
      title: 'Bulletin of Turan-Astana University',
      subtitle:
        'Peer-reviewed journal on digital transformation, management and economics. We publish research findings, case studies and reviews — from theory to applied projects.',
      statsTitle: 'Key facts',
      statsDescription:
        'An international journal for research on digital technologies, management and economics.',
      buttons: {
        authedPrimary: 'Dashboard',
        authedSecondary: 'Profile',
        guestPrimary: 'Log in',
        guestSecondary: 'Register',
      },
      stats: [
        { value: '2019', label: 'Founded' },
        { value: '2663-631X', label: 'ISSN' },
        { value: '4', label: 'Issues per year' },
      ],
    },
    about: {
      eyebrow: 'About',
      title: 'A journal about science and innovation',
      paragraphs: [
        'Science Journal is a venue for publications on digital transformation, management, economics and education. We connect researchers, faculty and practitioners.',
        'We support openness, follow international peer-review standards and publish in English, Russian and Kazakh.',
      ],
      cta: 'Contact the editorial team',
    },
    purpose: {
      eyebrow: 'Purpose',
      title: 'Raising research quality',
      paragraph:
        'Our mission is to help authors strengthen their papers and to give readers trustworthy findings. We promote academic integrity and transparency.',
      cta: 'Author guidelines',
    },
    editorial: {
      eyebrow: 'Editorial board',
      title: 'Experts and scholars on the team',
      cta: 'Submission rules',
      board: [
        { name: 'Aiman Ospanova', role: 'Editor-in-chief', field: 'Digital transformation' },
        { name: 'Danil Erzhanov', role: 'Deputy editor', field: 'Public administration' },
        { name: 'Karina Isatayeva', role: 'Managing editor', field: 'Data analytics & AI' },
      ],
    },
    rules: {
      eyebrow: 'Guidelines',
      title: 'Core submission rules',
      cta: 'Submit an article',
      list: [
        'Original content with zero plagiarism.',
        'Fit to journal scope and issue topics.',
        'Double-blind peer review is required.',
        'Deadlines for responses and revisions are mandatory.',
      ],
    },
    registry: {
      eyebrow: 'Indexes',
      title: 'Registry and publishing data',
      cta: 'Contact the editorial team',
      items: [
        { title: 'Media registration', text: 'Certificate No. 17458-Ж, issued 14.01.2019.' },
        { title: 'ISSN', text: '2663-631X — print edition of the journal.' },
        {
          title: 'Frequency',
          text: '4 issues a year. Articles are published in Kazakh, Russian and English.',
        },
      ],
    },
    contacts: {
      eyebrow: 'Stay in touch',
      title: 'Contacts',
      subtitle: 'Reach us about submissions, cooperation or reviewer invitations.',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      addressLabel: 'Address',
      phoneValue: '+7 (7172) 123-456',
      addressValue: 'Astana, Turan avenue, 1',
    },
  },
  kz: {
    hero: {
      eyebrow: 'Университеттің ғылыми журналы',
      title: '«Туран-Астана» университетінің хабаршысы',
      subtitle:
        'Сандық трансформация, менеджмент және экономика жөнінде рецензияланатын журнал. Біз зерттеу нәтижелерін, тәжірибелік кейстерді және шолу мақалаларды жариялаймыз.',
      statsTitle: 'Негізгі деректер',
      statsDescription:
        'Цифрлық технология, менеджмент және экономика саласындағы зерттеулерге арналған халықаралық басылым.',
      buttons: {
        authedPrimary: 'Кабинет',
        authedSecondary: 'Профиль',
        guestPrimary: 'Кіру',
        guestSecondary: 'Тіркелу',
      },
      stats: [
        { value: '2019', label: 'Құрылған жыл' },
        { value: '2663-631X', label: 'ISSN' },
        { value: '4', label: 'Жылына шығарылымдар' },
      ],
    },
    about: {
      eyebrow: 'Журнал туралы',
      title: 'Ғылым мен инновацияға арналған басылым',
      paragraphs: [
        'Science Journal — сандық трансформация, менеджмент, экономика және білім саласындағы зерттеулер алаңы. Біз зерттеушілерді, оқытушыларды және практиктерді біріктіреміз.',
        'Біз ашықтықты қолдаймыз, халықаралық рецензиялау стандарттарын ұстанамыз және материалдарды қазақ, орыс және ағылшын тілдерінде жариялаймыз.',
      ],
      cta: 'Редакциямен байланысу',
    },
    purpose: {
      eyebrow: 'Мақсат',
      title: 'Зерттеу сапасын арттыру',
      paragraph:
        'Біздің міндетіміз — авторларға мақаланы жақсартуға, ал оқырмандарға сенімді дерек алуға көмектесу. Біз академиялық адалдық пен ашықтықты дамытамыз.',
      cta: 'Авторларға арналған талаптар',
    },
    editorial: {
      eyebrow: 'Редколлегия',
      title: 'Тәжірибелі мамандар құрамы',
      cta: 'Материал жіберу ережелері',
      board: [
        { name: 'Айман Оспанова', role: 'Бас редактор', field: 'Сандық трансформация' },
        { name: 'Данил Ержанов', role: 'Бас редактордың орынбасары', field: 'Мемлекеттік басқару' },
        { name: 'Карина Исатаева', role: 'Атқарушы редактор', field: 'Деректер аналитикасы және ЖИ' },
      ],
    },
    rules: {
      eyebrow: 'Талаптар',
      title: 'Материал тапсырудың негізгі қағидалары',
      cta: 'Мақала жіберу',
      list: [
        'Плагиатсыз түпнұсқа мәтін.',
        'Журнал форматы мен тақырыбына сәйкестік.',
        'Қос соқыр рецензиялау міндетті.',
        'Жауап пен түзетулер мерзімін сақтау.',
      ],
    },
    registry: {
      eyebrow: 'Индекстеу',
      title: 'Тіркеу және баспа деректері',
      cta: 'Редакциямен байланысу',
      items: [
        { title: 'БАҚ тіркеуі', text: 'Куәлік №17458-Ж, 14.01.2019 жылы берілді.' },
        { title: 'ISSN', text: '2663-631X — журналдың баспа нұсқасы.' },
        {
          title: 'Мерзімділік',
          text: 'Жылына 4 шығарылым. Материалдар қазақ, орыс және ағылшын тілдерінде жарияланады.',
        },
      ],
    },
    contacts: {
      eyebrow: 'Байланыста болыңыз',
      title: 'Контактілер',
      subtitle: 'Мақала, ынтымақтастық немесе рецензент болу жайлы сұрақтарыңызды жазыңыз.',
      emailLabel: 'Email',
      phoneLabel: 'Телефон',
      addressLabel: 'Мекенжай',
      phoneValue: '+7 (7172) 123-456',
      addressValue: 'Астана, Тұран даңғылы, 1',
    },
  },
}
