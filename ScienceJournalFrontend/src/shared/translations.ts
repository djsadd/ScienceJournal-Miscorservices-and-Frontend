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

type LoginCopy = {
  headerEyebrow: string
  headerTitle: string
  headerSubtitle: string
  alertTitle: string
  fields: { identifierLabel: string; identifierPlaceholder: string; passwordLabel: string; passwordPlaceholder: string }
  rememberDevice: string
  needHelp: string
  submitIdle: string
  submitBusy: string
  footerPrompt: string
  footerRegister: string
  asideEyebrow: string
  asideTitle: string
  asideSubtitle: string
  badges: [string, string, string]
  steps: { title: string; text: string }[]
  errors: {
    pendingApproval: string
    accessDenied: string
    invalidCreds: string
    apiFail: string
    networkFail: string
  }
}

type RegisterCopy = {
  headerEyebrow: string
  headerTitle: string
  headerSubtitle: string
  fields: {
    firstName: { label: string; placeholder: string }
    lastName: { label: string; placeholder: string }
    username: { label: string; placeholder: string }
    organization: { label: string; placeholder: string }
    institution: { label: string; placeholder: string }
    email: { label: string; placeholder: string }
    role: { label: string; options: { author: string; reviewer: string; editor: string } }
    password: { label: string; placeholder: string; hint: string }
    confirm: { label: string; placeholder: string }
    accept: string
    notify: string
  }
  submitIdle: string
  submitBusy: string
  footerPrompt: string
  footerLogin: string
  asideEyebrow: string
  asideTitle: string
  asideSubtitle: string
  steps: { title: string; text: string }[]
  meta: [string, string, string]
  errors: { passwordMismatch: string; acceptRequired: string }
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

export const loginCopy: Record<Lang, LoginCopy> = {
  ru: {
    headerEyebrow: 'Вход',
    headerTitle: 'Войти и продолжить работу',
    headerSubtitle:
      'Используйте учетные данные Science Journal, чтобы получить доступ к кабинету, заданиям и публикациям.',
    alertTitle: 'Нет доступа',
    fields: {
      identifierLabel: 'Username или Email',
      identifierPlaceholder: 'username или name@example.com',
      passwordLabel: 'Пароль',
      passwordPlaceholder: 'Введите пароль',
    },
    rememberDevice: 'Запомнить устройство',
    needHelp: 'Нужна помощь?',
    submitIdle: 'Войти',
    submitBusy: 'Отправляем...',
    footerPrompt: 'Еще нет аккаунта?',
    footerRegister: 'Зарегистрироваться',
    asideEyebrow: 'Для чего входить',
    asideTitle: 'Работа с материалами',
    asideSubtitle:
      'Получайте доступ к заявкам, рецензиям, верстке и редактированию. Сохраняем ваши действия под защищенным токеном.',
    badges: ['Безопасное подключение', 'Разграничение ролей', 'Работа в одном окне'],
    steps: [
      { title: 'Войти в кабинет', text: 'Вводите username или email и пароль, чтобы открыть инструменты.' },
      { title: 'Работайте с заявками', text: 'Отвечайте, публикуйте и рецензируйте в одном интерфейсе.' },
      { title: 'Сохраняйте прогресс', text: 'Данные защищены токенами доступа и обновления.' },
    ],
    errors: {
      pendingApproval: 'Ваш аккаунт ожидает подтверждения администратором. Доступ будет открыт после проверки.',
      accessDenied: 'Доступ в систему закрыт. Обратитесь к администратору или в поддержку.',
      invalidCreds: 'Неверные учетные данные. Проверьте email/username и пароль.',
      apiFail: 'Не удалось выполнить вход. Повторите попытку позже.',
      networkFail: 'Не удалось выполнить вход. Проверьте подключение и попробуйте снова.',
    },
  },
  en: {
    headerEyebrow: 'Login',
    headerTitle: 'Sign in to continue',
    headerSubtitle:
      'Use your Science Journal credentials to access your dashboard, tasks and publications.',
    alertTitle: 'Access denied',
    fields: {
      identifierLabel: 'Username or Email',
      identifierPlaceholder: 'username or name@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
    },
    rememberDevice: 'Remember this device',
    needHelp: 'Need help?',
    submitIdle: 'Log in',
    submitBusy: 'Submitting...',
    footerPrompt: 'No account yet?',
    footerRegister: 'Register',
    asideEyebrow: 'Why sign in',
    asideTitle: 'Work with submissions',
    asideSubtitle:
      'Access submissions, reviews, layout and editing. Your actions are saved under a secure token.',
    badges: ['Secure connection', 'Role-based access', 'Single workspace'],
    steps: [
      { title: 'Sign in to cabinet', text: 'Enter username or email and password to unlock tools.' },
      { title: 'Work with submissions', text: 'Respond, publish and review in one interface.' },
      { title: 'Save progress', text: 'Data protected with access and refresh tokens.' },
    ],
    errors: {
      pendingApproval: 'Your account is pending administrator approval. Access will open after review.',
      accessDenied: 'Access to the system is closed. Contact the administrator or support.',
      invalidCreds: 'Invalid credentials. Check your email/username and password.',
      apiFail: 'Failed to log in. Please try again later.',
      networkFail: 'Failed to log in. Check your connection and try again.',
    },
  },
  kz: {
    headerEyebrow: 'Кіру',
    headerTitle: 'Жұмысты жалғастыру үшін кіріңіз',
    headerSubtitle:
      'Science Journal тіркелгі деректерін пайдаланып, кабинетке, тапсырмаларға және жарияланымдарға қол жеткізіңіз.',
    alertTitle: 'Қол жеткізу жоқ',
    fields: {
      identifierLabel: 'Пайдаланушы аты немесе Email',
      identifierPlaceholder: 'username немесе name@example.com',
      passwordLabel: 'Құпиясөз',
      passwordPlaceholder: 'Құпиясөзіңізді енгізіңіз',
    },
    rememberDevice: 'Құрылғыны есте сақтау',
    needHelp: 'Көмек керек пе?',
    submitIdle: 'Кіру',
    submitBusy: 'Жіберілуде...',
    footerPrompt: 'Әлі тіркелген жоқсыз ба?',
    footerRegister: 'Тіркелу',
    asideEyebrow: 'Неліктен кіру керек',
    asideTitle: 'Материалдармен жұмыс',
    asideSubtitle:
      'Өтінімдерге, рецензияларға, беттеу және редакциялауға қол жеткізіңіз. Әрекеттеріңіз қауіпсіз токенмен сақталады.',
    badges: ['Қауіпсіз қосылу', 'Рөлдер бойынша қолжетімділік', 'Бір терезе'],
    steps: [
      { title: 'Кабинетке кіру', text: 'Құралдарды ашу үшін username немесе email мен құпиясөзді енгізіңіз.' },
      { title: 'Өтінімдермен жұмыс', text: 'Жауап беріңіз, жариялаңыз және рецензиялаңыз — бір интерфейсте.' },
      { title: 'Прогресті сақтау', text: 'Деректерге қолжетімділік және жаңарту токендерімен қорғалады.' },
    ],
    errors: {
      pendingApproval: 'Тіркелгіңіз әкімші мақұлдауын күтуде. Қараудан кейін қол жеткізу ашылады.',
      accessDenied: 'Жүйеге қолжетімділік жабық. Әкімшімен немесе қолдау қызметімен байланысыңыз.',
      invalidCreds: 'Деректер қате. Email/username және құпиясөзді тексеріңіз.',
      apiFail: 'Кіру сәтсіз. Кейінірек қайталап көріңіз.',
      networkFail: 'Кіру сәтсіз. Қосылымды тексеріп, қайталап көріңіз.',
    },
  },
}

export const registerCopy: Record<Lang, RegisterCopy> = {
  ru: {
    headerEyebrow: 'Новый аккаунт',
    headerTitle: 'Регистрация в Science Journal',
    headerSubtitle:
      'Создайте профиль автора, редактора или рецензента. После подтверждения мы пришлём инструкции на электронную почту.',
    fields: {
      firstName: { label: 'Имя', placeholder: 'Ваше имя' },
      lastName: { label: 'Фамилия', placeholder: 'Ваша фамилия' },
      username: { label: 'Username', placeholder: 'Логин / username' },
      organization: { label: 'Организация', placeholder: 'Университет, компания' },
      institution: { label: 'Подразделение', placeholder: 'Кафедра, лаборатория, институт' },
      email: { label: 'Рабочий email', placeholder: 'name@example.com' },
      role: { label: 'Роль', options: { author: 'Автор', reviewer: 'Рецензент', editor: 'Редактор' } },
      password: {
        label: 'Пароль',
        placeholder: 'Минимум 8 символов',
        hint: 'Используйте буквы, цифры и специальные символы.',
      },
      confirm: { label: 'Подтвердите пароль', placeholder: 'Повторите пароль ещё раз' },
      accept: 'Я принимаю оферту и политику конфиденциальности',
      notify: 'Присылать обновления и письма',
    },
    submitIdle: 'Зарегистрироваться',
    submitBusy: 'Отправляем...',
    footerPrompt: 'Уже есть аккаунт?',
    footerLogin: 'Войти',
    asideEyebrow: 'Перед стартом',
    asideTitle: 'Укажите роль и профиль',
    asideSubtitle:
      'Регистрация открывает доступ к инструментам автора, рецензента или редактора. Мы сверяем профиль с требованиями журнала, чтобы подобрать нужные права.',
    steps: [
      { title: 'Заполните профиль', text: 'Укажите контакты и организацию, чтобы редакция могла связаться.' },
      { title: 'Выберите роль', text: 'Автор, редактор или рецензент — права настроим после проверки.' },
      { title: 'Получите подтверждение', text: 'Отправим письмо с подтверждением и дальнейшими шагами.' },
    ],
    meta: [
      'Поддержка: support@sciencejournal.kz',
      'Среднее время активации — 1 рабочий день',
      'Профиль и контакты можно обновить в любой момент',
    ],
    errors: {
      passwordMismatch: 'Пароли не совпадают',
      acceptRequired: 'Примите условия оферты и политику конфиденциальности',
    },
  },
  en: {
    headerEyebrow: 'New account',
    headerTitle: 'Register in Science Journal',
    headerSubtitle:
      'Create a profile as an author, editor or reviewer. We will email further instructions after approval.',
    fields: {
      firstName: { label: 'First name', placeholder: 'Your first name' },
      lastName: { label: 'Last name', placeholder: 'Your last name' },
      username: { label: 'Username', placeholder: 'Login / username' },
      organization: { label: 'Organization', placeholder: 'University, company' },
      institution: { label: 'Institution', placeholder: 'Department, lab, institute' },
      email: { label: 'Work email', placeholder: 'name@example.com' },
      role: { label: 'Role', options: { author: 'Author', reviewer: 'Reviewer', editor: 'Editor' } },
      password: {
        label: 'Password',
        placeholder: 'Minimum 8 characters',
        hint: 'Use letters, numbers, and special symbols.',
      },
      confirm: { label: 'Confirm password', placeholder: 'Repeat password once more' },
      accept: 'I accept the offer and privacy policy',
      notify: 'Send me updates and emails',
    },
    submitIdle: 'Register',
    submitBusy: 'Sending...',
    footerPrompt: 'Already have an account?',
    footerLogin: 'Sign in',
    asideEyebrow: 'Before you start',
    asideTitle: 'Select role and profile',
    asideSubtitle:
      'Registration opens access to author, reviewer or editor tools. We align your profile with journal requirements to grant proper permissions.',
    steps: [
      { title: 'Fill out profile', text: 'Provide contacts and organization so the editorial team can reach you.' },
      { title: 'Choose a role', text: 'Author, editor or reviewer — permissions set after verification.' },
      { title: 'Get confirmation', text: 'We will send an email with confirmation and next steps.' },
    ],
    meta: [
      'Support: support@sciencejournal.kz',
      'Average activation time — 1 business day',
      'You can update profile and contacts at any time',
    ],
    errors: {
      passwordMismatch: 'Passwords do not match',
      acceptRequired: 'Please accept the terms and privacy policy',
    },
  },
  kz: {
    headerEyebrow: 'Жаңа аккаунт',
    headerTitle: 'Science Journal жүйесінде тіркелу',
    headerSubtitle:
      'Автор, редактор немесе рецензент ретінде профиль жасаңыз. Мақұлдаудан кейін нұсқауларды электрондық поштамен жібереміз.',
    fields: {
      firstName: { label: 'Аты', placeholder: 'Атыңыз' },
      lastName: { label: 'Тегі', placeholder: 'Тегіңіз' },
      username: { label: 'Пайдаланушы аты', placeholder: 'Логин / username' },
      organization: { label: 'Ұйым', placeholder: 'Университет, компания' },
      institution: { label: 'Бөлімше', placeholder: 'Кафедра, зертхана, институт' },
      email: { label: 'Жұмыс email', placeholder: 'name@example.com' },
      role: { label: 'Рөл', options: { author: 'Автор', reviewer: 'Рецензент', editor: 'Редактор' } },
      password: {
        label: 'Құпиясөз',
        placeholder: 'Ең аз 8 таңба',
        hint: 'Әріптер, цифрлар және арнайы таңбаларды қолданыңыз.',
      },
      confirm: { label: 'Құпиясөзді растау', placeholder: 'Құпиясөзді қайта енгізіңіз' },
      accept: 'Мен оферта мен құпиялылық саясатын қабылдаймын',
      notify: 'Маған жаңартулар мен хаттарды жіберіңіз',
    },
    submitIdle: 'Тіркелу',
    submitBusy: 'Жіберілуде...',
    footerPrompt: 'Аккаунт бар ма?',
    footerLogin: 'Кіру',
    asideEyebrow: 'Бастамас бұрын',
    asideTitle: 'Рөл мен профильді көрсетіңіз',
    asideSubtitle:
      'Тіркелу автор, рецензент немесе редактор құралдарына қол жеткізуді ашады. Біз профильді журнал талаптарымен сәйкестендіріп, тиісті құқықтар береміз.',
    steps: [
      { title: 'Профильді толтырыңыз', text: 'Редакция байланысуы үшін контактілер мен ұйымды көрсетіңіз.' },
      { title: 'Рөлді таңдаңыз', text: 'Автор, редактор немесе рецензент — құқықтар тексерістен кейін беріледі.' },
      { title: 'Растау алыңыз', text: 'Тіркеуді растау және келесі қадамдар туралы хат жібереміз.' },
    ],
    meta: [
      'Қолдау: support@sciencejournal.kz',
      'Белсендірудің орташа уақыты — 1 жұмыс күні',
      'Профиль мен контактілерді кез келген уақытта жаңартуға болады',
    ],
    errors: {
      passwordMismatch: 'Құпиясөздер сәйкес емес',
      acceptRequired: 'Оферта мен құпиялылық саясатын қабылдаңыз',
    },
  },
}
