import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Keyword = { id?: number; ru: string; kz: string; en: string }
type Lang = 'ru' | 'kz' | 'en'
type LocaleKey = 'ru' | 'en' | 'kz'
type ArticleType = 'original' | 'review'

type AuthorApi = {
  id: number
  email: string
  prefix?: string | null
  first_name: string
  patronymic?: string | null
  last_name: string
  phone?: string | null
  address?: string | null
  country: string
  affiliation1: string
  affiliation2?: string | null
  affiliation3?: string | null
  is_corresponding: boolean
  orcid?: string | null
  scopus_author_id?: string | null
  researcher_id?: string | null
}

type FileOut = {
  id: string
  original_name: string
  content_type: string
  size_bytes: number
  url: string
  created_at: string
}

type AuthorForm = {
  id?: number
  email: string
  prefix: string
  firstName: string
  middleName: string
  lastName: string
  phone: string
  address: string
  country: string
  affiliation1: string
  affiliation2: string
  affiliation3: string
  isCorresponding: boolean
  orcid: string
  scopusId: string
  researcherId: string
}

const pageCopy: Record<LocaleKey, any> = {
  ru: {
    pageTitle: 'Загрузите рукопись',
    pageSubtitle: 'Заполните данные о статье, выберите ключевые слова и прикрепите файлы.',
    backToCabinet: 'Вернуться в кабинет',
    formLanguagesLabel: 'Язык формы',
    formLanguagesHint: 'Этот переключатель меняет только поля статьи. Язык страницы меняется в сайдбаре.',
    formLanguages: { ru: 'Русский', kz: 'Казахский', en: 'Английский' },
    titleLabel: 'Название статьи',
    abstractLabel: 'Аннотация',
    titlePlaceholders: { ru: 'Заголовок на русском', kz: 'Заголовок на казахском', en: 'Title in English' },
    abstractPlaceholders: { ru: 'Аннотация на русском', kz: 'Аннотация на казахском', en: 'Abstract in English' },
    articleTypeLabel: 'Выберите тип статьи',
    articleTypePlaceholder: '---------',
    articleTypes: { original: 'Оригинальная статья', review: 'Обзорная статья' },
    articleLanguage: {
      label: 'Язык статьи',
      hint: 'Выберите основной язык рукописи. Это поле будет сохранено в карточке статьи.',
      options: {
        ru: { title: 'Русский', subtitle: 'Для рукописей на русском языке' },
        kz: { title: 'Қазақша', subtitle: 'Қазақ тіліндегі қолжазбалар үшін' },
        en: { title: 'English', subtitle: 'For manuscripts written in English' },
      },
    },
    keywords: {
      label: 'Выберите ключевые слова',
      empty: 'Ключевые слова пока не добавлены.',
      add: 'Добавить ключевые слова',
      edit: 'Редактировать ключевые слова',
      removeAria: 'Удалить ключевое слово',
      hint: 'Добавьте минимум 5 ключевых слов. Каждое слово нужно заполнить на русском, казахском и английском.',
      modalTitle: 'Ключевые слова статьи',
      modalEyebrow: 'Ключевые слова',
      modalHint: 'Заполните минимум 5 ключевых слов на трех языках. Кнопка плюс добавляет дополнительные слова.',
      rowTitle: 'Ключевое слово',
      languageLabels: { ru: 'На русском', kz: 'На казахском', en: 'На английском' },
      placeholders: { ru: 'Например: искусственный интеллект', kz: 'Мысалы: жасанды интеллект', en: 'Example: artificial intelligence' },
      addRow: '+ Добавить еще ключевое слово',
    },
    files: {
      manuscript: 'Загрузить рукопись (.docx)',
      antiplagiarism: 'Загрузить файл антиплагиата',
      authorInfo: 'Файл со сведениями об авторах (*.doc, *.docx)',
      coverLetter: 'Сопроводительное письмо (*.pdf)',
    },
    aiInfoLabel: 'Сведения о применении генеративного ИИ',
    aiInfoPlaceholder: 'Опишите, где и как использовался генеративный ИИ, если он применялся.',
    confirmations: {
      copyright: 'Статья ранее не публиковалась и не рассматривается другим журналом',
      originality: 'В статье отсутствует плагиат',
      consent: 'Все авторы подтверждают согласие с поданной версией',
      labels: {
        copyright: 'Отсутствует параллельная подача',
        originality: 'Отсутствует плагиат',
        consent: 'Есть согласие авторов',
      },
    },
    submit: 'Отправить статью',
    authors: {
      eyebrow: 'Авторы статьи',
      title: 'Состав авторов',
      add: 'Добавить автора',
      empty: 'Авторы пока не добавлены.',
      columns: { name: 'Имя', affiliations: 'Аффилиации', corresponding: 'Корр. автор', actions: 'Действия' },
      yes: 'Да',
      no: 'Нет',
      remove: 'Удалить',
      modalTitle: 'Добавить автора',
      modalEyebrow: 'Карточка автора',
      modalHint: 'Заполните обязательные поля, затем при необходимости добавьте аффилиации и научные идентификаторы.',
      fields: {
        prefix: 'Префикс',
        firstName: 'Имя *',
        middleName: 'Отчество',
        lastName: 'Фамилия *',
        phone: 'Телефон',
        address: 'Адрес',
        country: 'Страна *',
        affiliation1: 'Аффилиация 1 *',
        affiliation2: 'Аффилиация 2',
        affiliation3: 'Аффилиация 3',
        corresponding: 'Соответствующий автор',
      },
      save: 'Сохранить автора',
    },
    common: {
      close: 'Закрыть',
      cancel: 'Отмена',
      save: 'Сохранить',
      notSpecified: '—',
      uploaded: 'Загружен',
      yes: 'Да',
      no: 'Нет',
      notAvailable: '?',
    },
    confirm: {
      title: 'Подтверждение данных статьи',
      columns: { field: 'Поле', value: 'Значение' },
      previewLanguage: 'Язык просмотра',
      articleTitle: 'Название статьи',
      abstract: 'Аннотация',
      articleType: 'Тип статьи',
      articleLanguage: 'Язык статьи',
      keywords: 'Ключевые слова',
      responsibleAuthor: 'Ответственный автор',
      authors: 'Авторы',
      manuscript: 'Файл рукописи',
      antiplagiarism: 'Антиплагиат',
      authorInfo: 'Сведения об авторах',
      coverLetter: 'Сопроводительное письмо',
      aiInfo: 'Генеративный ИИ',
      confirmations: 'Подтверждения',
      comments: 'Комментарии',
      hint: 'Проверьте данные перед отправкой статьи в редакцию.',
      edit: 'Назад',
      submit: 'Подтвердить и отправить',
    },
    errors: {
      server: 'Ошибка сервера',
      submitFailed: 'Не удалось отправить статью. Данные формы сохранены, исправьте ошибку и попробуйте снова.',
      articleType: 'Выберите тип статьи',
      title: 'Заполните заголовок',
      abstract: 'Заполните аннотацию',
      keywordsMin: 'Добавьте минимум 5 ключевых слов',
      keywordsFull: 'Добавьте минимум 5 ключевых слов и заполните каждое слово на трех языках',
      authors: 'Добавьте минимум одного автора',
      manuscript: 'Загрузите файл рукописи в формате .docx',
      manuscriptExt: 'Поддерживается только формат .docx',
      antiplagiarism: 'Загрузите файл антиплагиата',
      authorInfo: 'Загрузите сведения об авторах',
      coverLetter: 'Загрузите сопроводительное письмо',
      copyright: 'Подтвердите отсутствие параллельной подачи',
      originality: 'Подтвердите отсутствие плагиата',
      consent: 'Подтвердите согласие всех авторов',
    },
  },
  en: {
    pageTitle: 'Upload manuscript',
    pageSubtitle: 'Fill in the article details, select keywords, and attach the files.',
    backToCabinet: 'Back to cabinet',
    formLanguagesLabel: 'Form language',
    formLanguagesHint: 'This switch changes only the article fields. The page language is controlled from the sidebar.',
    formLanguages: { ru: 'Russian', kz: 'Kazakh', en: 'English' },
    titleLabel: 'Article title',
    abstractLabel: 'Abstract',
    titlePlaceholders: { ru: 'Title in Russian', kz: 'Title in Kazakh', en: 'Title in English' },
    abstractPlaceholders: { ru: 'Abstract in Russian', kz: 'Abstract in Kazakh', en: 'Abstract in English' },
    articleTypeLabel: 'Select article type',
    articleTypePlaceholder: '---------',
    articleTypes: { original: 'Original article', review: 'Review article' },
    articleLanguage: {
      label: 'Article language',
      hint: 'Select the primary manuscript language. This value will be saved in the article record.',
      options: {
        ru: { title: 'Russian', subtitle: 'For manuscripts written in Russian' },
        kz: { title: 'Kazakh', subtitle: 'For manuscripts written in Kazakh' },
        en: { title: 'English', subtitle: 'For manuscripts written in English' },
      },
    },
    keywords: {
      label: 'Select keywords',
      empty: 'No keywords added yet.',
      add: 'Add keywords',
      edit: 'Edit keywords',
      removeAria: 'Remove keyword',
      hint: 'Add at least 5 keywords. Each keyword must be filled in Russian, Kazakh, and English.',
      modalTitle: 'Article keywords',
      modalEyebrow: 'Keywords',
      modalHint: 'Fill in at least 5 keywords in three languages. The plus button adds more keywords.',
      rowTitle: 'Keyword',
      languageLabels: { ru: 'In Russian', kz: 'In Kazakh', en: 'In English' },
      placeholders: { ru: 'Example: artificial intelligence', kz: 'Example: жасанды интеллект', en: 'Example: artificial intelligence' },
      addRow: '+ Add another keyword',
    },
    files: {
      manuscript: 'Upload manuscript (.docx)',
      antiplagiarism: 'Upload anti-plagiarism file',
      authorInfo: 'Author information file (*.doc, *.docx)',
      coverLetter: 'Cover letter (*.pdf)',
    },
    aiInfoLabel: 'Generative AI usage details',
    aiInfoPlaceholder: 'Describe where and how generative AI was used, if applicable.',
    confirmations: {
      copyright: 'The article has not been published before and is not under review by another journal',
      originality: 'The article contains no plagiarism',
      consent: 'All authors confirm consent to the submitted version',
      labels: { copyright: 'No parallel submission', originality: 'No plagiarism', consent: 'Authors consent confirmed' },
    },
    submit: 'Submit article',
    authors: {
      eyebrow: 'Article authors',
      title: 'Author list',
      add: 'Add author',
      empty: 'No authors added yet.',
      columns: { name: 'Name', affiliations: 'Affiliations', corresponding: 'Corresponding', actions: 'Actions' },
      yes: 'Yes',
      no: 'No',
      remove: 'Remove',
      modalTitle: 'Add author',
      modalEyebrow: 'Author card',
      modalHint: 'Fill in the required fields, then add affiliations and research identifiers if needed.',
      fields: {
        prefix: 'Prefix',
        firstName: 'First name *',
        middleName: 'Middle name',
        lastName: 'Last name *',
        phone: 'Phone',
        address: 'Address',
        country: 'Country *',
        affiliation1: 'Affiliation 1 *',
        affiliation2: 'Affiliation 2',
        affiliation3: 'Affiliation 3',
        corresponding: 'Corresponding author',
      },
      save: 'Save author',
    },
    common: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      notSpecified: '—',
      uploaded: 'Uploaded',
      yes: 'Yes',
      no: 'No',
      notAvailable: '?',
    },
    confirm: {
      title: 'Confirm article data',
      columns: { field: 'Field', value: 'Value' },
      previewLanguage: 'Preview language',
      articleTitle: 'Article title',
      abstract: 'Abstract',
      articleType: 'Article type',
      articleLanguage: 'Article language',
      keywords: 'Keywords',
      responsibleAuthor: 'Responsible author',
      authors: 'Authors',
      manuscript: 'Manuscript',
      antiplagiarism: 'Anti-plagiarism',
      authorInfo: 'Author information',
      coverLetter: 'Cover letter',
      aiInfo: 'Generative AI',
      confirmations: 'Confirmations',
      comments: 'Comments',
      hint: 'Review the data before sending the article to the editorial office.',
      edit: 'Back',
      submit: 'Confirm and submit',
    },
    errors: {
      server: 'Server error',
      submitFailed: 'Failed to submit the article. Form data was kept, fix the issue and try again.',
      articleType: 'Select article type',
      title: 'Fill in the title',
      abstract: 'Fill in the abstract',
      keywordsMin: 'Add at least 5 keywords',
      keywordsFull: 'Add at least 5 keywords and fill each keyword in all three languages',
      authors: 'Add at least one author',
      manuscript: 'Upload the manuscript file in .docx format',
      manuscriptExt: 'Only .docx format is supported',
      antiplagiarism: 'Upload the anti-plagiarism file',
      authorInfo: 'Upload the author information file',
      coverLetter: 'Upload the cover letter',
      copyright: 'Confirm that there is no parallel submission',
      originality: 'Confirm that there is no plagiarism',
      consent: 'Confirm consent of all authors',
    },
  },
  kz: {
    pageTitle: 'Қолжазбаны жүктеңіз',
    pageSubtitle: 'Мақала деректерін толтырып, кілт сөздерді таңдап, файлдарды тіркеңіз.',
    backToCabinet: 'Кабинетке оралу',
    formLanguagesLabel: 'Форма тілі',
    formLanguagesHint: 'Бұл ауыстырғыш тек мақала өрістерін өзгертеді. Бет тілі сайдбар арқылы ауысады.',
    formLanguages: { ru: 'Орысша', kz: 'Қазақша', en: 'Ағылшынша' },
    titleLabel: 'Мақала атауы',
    abstractLabel: 'Аңдатпа',
    titlePlaceholders: { ru: 'Орыс тіліндегі атау', kz: 'Қазақ тіліндегі атау', en: 'Title in English' },
    abstractPlaceholders: { ru: 'Орыс тіліндегі аңдатпа', kz: 'Қазақ тіліндегі аңдатпа', en: 'Abstract in English' },
    articleTypeLabel: 'Мақала түрін таңдаңыз',
    articleTypePlaceholder: '---------',
    articleTypes: { original: 'Түпнұсқа мақала', review: 'Шолу мақаласы' },
    articleLanguage: {
      label: 'Мақала тілі',
      hint: 'Қолжазбаның негізгі тілін таңдаңыз. Бұл мән мақала карточкасында сақталады.',
      options: {
        ru: { title: 'Русский', subtitle: 'Орыс тіліндегі қолжазбалар үшін' },
        kz: { title: 'Қазақша', subtitle: 'Қазақ тіліндегі қолжазбалар үшін' },
        en: { title: 'English', subtitle: 'Ағылшын тіліндегі қолжазбалар үшін' },
      },
    },
    keywords: {
      label: 'Кілт сөздерді таңдаңыз',
      empty: 'Кілт сөздер әлі қосылмады.',
      add: 'Кілт сөздерді қосу',
      edit: 'Кілт сөздерді өңдеу',
      removeAria: 'Кілт сөзді өшіру',
      hint: 'Кемінде 5 кілт сөз қосыңыз. Әр сөз орыс, қазақ және ағылшын тілдерінде толтырылуы керек.',
      modalTitle: 'Мақаланың кілт сөздері',
      modalEyebrow: 'Кілт сөздер',
      modalHint: 'Үш тілде кемінде 5 кілт сөзді толтырыңыз. Плюс батырмасы қосымша сөздерді енгізеді.',
      rowTitle: 'Кілт сөз',
      languageLabels: { ru: 'Орыс тілінде', kz: 'Қазақ тілінде', en: 'Ағылшын тілінде' },
      placeholders: { ru: 'Мысалы: жасанды интеллект', kz: 'Мысалы: жасанды интеллект', en: 'Example: artificial intelligence' },
      addRow: '+ Тағы бір кілт сөз қосу',
    },
    files: {
      manuscript: 'Қолжазбаны жүктеу (.docx)',
      antiplagiarism: 'Антиплагиат файлын жүктеу',
      authorInfo: 'Авторлар туралы файл (*.doc, *.docx)',
      coverLetter: 'Ілеспе хат (*.pdf)',
    },
    aiInfoLabel: 'Генеративті ЖИ қолдану туралы мәлімет',
    aiInfoPlaceholder: 'Егер қолданылса, генеративті ЖИ қай жерде және қалай пайдаланылғанын сипаттаңыз.',
    confirmations: {
      copyright: 'Мақала бұрын жарияланбаған және басқа журналда қарастырылып жатқан жоқ',
      originality: 'Мақалада плагиат жоқ',
      consent: 'Барлық авторлар жіберілген нұсқамен келіседі',
      labels: { copyright: 'Қатар жіберілім жоқ', originality: 'Плагиат жоқ', consent: 'Авторлардың келісімі бар' },
    },
    submit: 'Мақаланы жіберу',
    authors: {
      eyebrow: 'Мақала авторлары',
      title: 'Авторлар құрамы',
      add: 'Автор қосу',
      empty: 'Авторлар әлі қосылмады.',
      columns: { name: 'Аты', affiliations: 'Аффилиациялар', corresponding: 'Байланыс авторы', actions: 'Әрекеттер' },
      yes: 'Иә',
      no: 'Жоқ',
      remove: 'Өшіру',
      modalTitle: 'Автор қосу',
      modalEyebrow: 'Автор картасы',
      modalHint: 'Міндетті өрістерді толтырыңыз, қажет болса аффилиациялар мен ғылыми идентификаторларды қосыңыз.',
      fields: {
        prefix: 'Префикс',
        firstName: 'Аты *',
        middleName: 'Әкесінің аты',
        lastName: 'Тегі *',
        phone: 'Телефон',
        address: 'Мекенжай',
        country: 'Ел *',
        affiliation1: 'Аффилиация 1 *',
        affiliation2: 'Аффилиация 2',
        affiliation3: 'Аффилиация 3',
        corresponding: 'Байланыс авторы',
      },
      save: 'Авторды сақтау',
    },
    common: {
      close: 'Жабу',
      cancel: 'Бас тарту',
      save: 'Сақтау',
      notSpecified: '—',
      uploaded: 'Жүктелді',
      yes: 'Иә',
      no: 'Жоқ',
      notAvailable: '?',
    },
    confirm: {
      title: 'Мақала деректерін растау',
      columns: { field: 'Өріс', value: 'Мәні' },
      previewLanguage: 'Қарау тілі',
      articleTitle: 'Мақала атауы',
      abstract: 'Аңдатпа',
      articleType: 'Мақала түрі',
      articleLanguage: 'Мақала тілі',
      keywords: 'Кілт сөздер',
      responsibleAuthor: 'Жауапты автор',
      authors: 'Авторлар',
      manuscript: 'Қолжазба',
      antiplagiarism: 'Антиплагиат',
      authorInfo: 'Авторлар туралы мәлімет',
      coverLetter: 'Ілеспе хат',
      aiInfo: 'Генеративті ЖИ',
      confirmations: 'Растаулар',
      comments: 'Түсініктемелер',
      hint: 'Мақаланы редакцияға жібермес бұрын деректерді тексеріңіз.',
      edit: 'Артқа',
      submit: 'Растау және жіберу',
    },
    errors: {
      server: 'Сервер қатесі',
      submitFailed: 'Мақаланы жіберу мүмкін болмады. Форма деректері сақталды, қатені түзетіп, қайта көріңіз.',
      articleType: 'Мақала түрін таңдаңыз',
      title: 'Атауды толтырыңыз',
      abstract: 'Аңдатпаны толтырыңыз',
      keywordsMin: 'Кемінде 5 кілт сөз қосыңыз',
      keywordsFull: 'Кемінде 5 кілт сөз қосып, әр сөзді үш тілде толтырыңыз',
      authors: 'Кемінде бір автор қосыңыз',
      manuscript: '.docx форматындағы қолжазба файлын жүктеңіз',
      manuscriptExt: 'Тек .docx форматы қолдау табады',
      antiplagiarism: 'Антиплагиат файлын жүктеңіз',
      authorInfo: 'Авторлар туралы файлды жүктеңіз',
      coverLetter: 'Ілеспе хатты жүктеңіз',
      copyright: 'Қатар жіберілім жоқ екенін растаңыз',
      originality: 'Плагиат жоқ екенін растаңыз',
      consent: 'Барлық авторлардың келісімін растаңыз',
    },
  },
}

export function AuthorsSubmissionPage() {
  const { lang } = useLanguage()
  const locale: LocaleKey = lang === 'en' || lang === 'kz' ? lang : 'ru'
  const t = pageCopy[locale]
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKeywords, setModalKeywords] = useState<Keyword[]>([])
  const [activeLang, setActiveLang] = useState<Lang>('ru')
  const [titles, setTitles] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [abstracts, setAbstracts] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [articleType, setArticleType] = useState<ArticleType | ''>('')
  const [articleLanguage, setArticleLanguage] = useState<Lang>(locale)
  const [comments, setComments] = useState('')
  void setComments
  const [generativeAiInfo, setGenerativeAiInfo] = useState('')
  const [confirmCopyright, setConfirmCopyright] = useState(false)
  const [confirmOriginality, setConfirmOriginality] = useState(false)
  const [confirmConsent, setConfirmConsent] = useState(false)
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [authorForm, setAuthorForm] = useState<AuthorForm>({
    email: '',
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    address: '',
    country: '',
    affiliation1: '',
    affiliation2: '',
    affiliation3: '',
    isCorresponding: true,
    orcid: '',
    scopusId: '',
    researcherId: '',
  })
  const [authorList, setAuthorList] = useState<AuthorForm[]>([])
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any | null>(null)
  const [confirmLang, setConfirmLang] = useState<Lang>('ru')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const articleTypeOptions: ArticleType[] = ['original', 'review']
  const langLabels: Record<Lang, string> = t.formLanguages

  const getApiErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      const body = error.bodyJson as any
      if (typeof body?.detail === 'string' && body.detail.trim()) return body.detail
      if (typeof body?.message === 'string' && body.message.trim()) return body.message
      if (typeof error.bodyText === 'string' && error.bodyText.trim()) return error.bodyText
      return `${t.errors.server} (${error.status})`
    }
    if (error instanceof Error && error.message.trim()) return error.message
    return t.errors.submitFailed
  }

  const handleRemoveKeyword = (keyword: Keyword) => {
    setSelectedKeywords((prev) =>
      prev.filter(
        (k) => (k.id ?? k.ru) !== (keyword.id ?? keyword.ru),
      ),
    )
  }

  const createEmptyKeyword = (): Keyword => ({ ru: '', kz: '', en: '' })

  const ensureMinimumKeywords = (items: Keyword[]) => {
    const next = [...items]
    while (next.length < 5) next.push(createEmptyKeyword())
    return next
  }

  const openKeywordModal = () => {
    setModalKeywords(ensureMinimumKeywords(selectedKeywords.map((keyword) => ({ ...keyword }))))
    setModalOpen(true)
  }

  const handleKeywordDraftChange = (index: number, field: Lang, value: string) => {
    setModalKeywords((prev) =>
      prev.map((keyword, keywordIndex) =>
        keywordIndex === index ? { ...keyword, [field]: value } : keyword,
      ),
    )
  }

  const handleAddKeywordRow = () => {
    setModalKeywords((prev) => [...prev, createEmptyKeyword()])
  }

  const handleRemoveKeywordRow = (index: number) => {
    setModalKeywords((prev) => {
      if (prev.length <= 5) return prev
      return prev.filter((_, keywordIndex) => keywordIndex !== index)
    })
  }

  const handleSaveKeywords = () => {
    const normalizedKeywords = modalKeywords.map((keyword) => ({
      ru: keyword.ru.trim(),
      kz: keyword.kz.trim(),
      en: keyword.en.trim(),
    }))

    const hasIncompleteKeyword = normalizedKeywords.some(
      (keyword) => !keyword.ru || !keyword.kz || !keyword.en,
    )

    if (normalizedKeywords.length < 5 || hasIncompleteKeyword) {
      setErrors((prev) => ({
        ...prev,
        keywords: 'Добавьте минимум 5 ключевых слов и заполните каждое слово на трех языках',
      }))
      return
    }

    setSelectedKeywords(normalizedKeywords)
    setErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.keywords
      return nextErrors
    })
    setModalOpen(false)
  }

  const resetAuthorForm = () =>
    setAuthorForm({
      email: '',
      prefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      phone: '',
      address: '',
      country: '',
      affiliation1: '',
      affiliation2: '',
      affiliation3: '',
      isCorresponding: true,
      orcid: '',
      scopusId: '',
      researcherId: '',
    })

  const mapApiAuthorToForm = (a: AuthorApi): AuthorForm => ({
    id: a.id,
    email: a.email,
    prefix: a.prefix ?? '',
    firstName: a.first_name,
    middleName: a.patronymic ?? '',
    lastName: a.last_name,
    phone: a.phone ?? '',
    address: a.address ?? '',
    country: a.country,
    affiliation1: a.affiliation1,
    affiliation2: a.affiliation2 ?? '',
    affiliation3: a.affiliation3 ?? '',
    isCorresponding: a.is_corresponding,
    orcid: a.orcid ?? '',
    scopusId: a.scopus_author_id ?? '',
    researcherId: a.researcher_id ?? '',
  })

  const saveAuthor = async () => {
    if (!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()) return
    try {
      const payload = {
        email: authorForm.email.trim(),
        prefix: authorForm.prefix.trim() || null,
        first_name: authorForm.firstName.trim(),
        patronymic: authorForm.middleName.trim() || null,
        last_name: authorForm.lastName.trim(),
        phone: authorForm.phone.trim() || null,
        address: authorForm.address.trim() || null,
        country: authorForm.country.trim(),
        affiliation1: authorForm.affiliation1.trim(),
        affiliation2: authorForm.affiliation2.trim() || null,
        affiliation3: authorForm.affiliation3.trim() || null,
        is_corresponding: authorForm.isCorresponding,
        orcid: authorForm.orcid.trim() || null,
        scopus_author_id: authorForm.scopusId.trim() || null,
        researcher_id: authorForm.researcherId.trim() || null,
      }
      const created = await api.post<AuthorApi>('/articles/authors', payload)
      const mapped = mapApiAuthorToForm(created)
      setAuthorList((prev) => {
        if (prev.some((a) => a.email === mapped.email)) return prev
        return [...prev, mapped]
      })
      resetAuthorForm()
      setAuthorModalOpen(false)
    } catch (error) {
      console.error('Failed to create author', error)
    }
  }

  const removeAuthor = (email: string) => {
    setAuthorList((prev) => prev.filter((author) => author.email !== email))
  }

  const selectedKeywordsValue = useMemo(
    () => selectedKeywords.map((kw) => kw.ru).join(', '),
    [selectedKeywords],
  )

  const authorsText = useMemo<Record<Lang, string>>(
    () => {
      const fullNames = authorList
        .map((author) => [author.prefix, author.firstName, author.middleName, author.lastName].filter(Boolean).join(' '))
        .filter(Boolean)
        .join('; ')
      return { ru: fullNames, kz: fullNames, en: fullNames }
    },
    [authorList],
  )

  const uploadFile = async (file: File): Promise<FileOut> => {
    const formData = new FormData()
    formData.append('upload', file)
    return api.request<FileOut>('/files', 'POST', { body: formData })
  }

  const getFileNameFromInputIndex = (idx: number): string | null => {
    try {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"].file-input[data-upload-slot="article-file"]'))
      const file = inputs[idx]?.files?.[0]
      return file ? file.name : null
    } catch {
      return null
    }
  }

  const validateSubmissionFields = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!articleType) nextErrors.articleType = t.errors.articleType
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((contentLang) => {
      if (!titles[contentLang]?.trim()) nextErrors[`title_${contentLang}`] = t.errors.title
      if (!abstracts[contentLang]?.trim()) nextErrors[`abstract_${contentLang}`] = t.errors.abstract
    })
    if (selectedKeywords.length < 5) nextErrors.keywords = t.errors.keywordsMin
    if (authorList.length === 0) nextErrors.authorList = t.errors.authors
    if (!confirmCopyright) nextErrors.confirmCopyright = t.errors.copyright
    if (!confirmOriginality) nextErrors.confirmOriginality = t.errors.originality
    if (!confirmConsent) nextErrors.confirmConsent = t.errors.consent

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstErrorKey = Object.keys(nextErrors)[0]
      const el = document.querySelector<HTMLElement>(`[data-error-key="${firstErrorKey}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!articleType) nextErrors.articleType = t.errors.articleType
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((contentLang) => {
      if (!titles[contentLang]?.trim()) nextErrors[`title_${contentLang}`] = t.errors.title
      if (!abstracts[contentLang]?.trim()) nextErrors[`abstract_${contentLang}`] = t.errors.abstract
    })
    if (selectedKeywords.length < 5) nextErrors.keywords = t.errors.keywordsMin
    if (authorList.length === 0) nextErrors.authorList = t.errors.authors
    const manuscript = getFileNameFromInputIndex(0)
    const antiplag = getFileNameFromInputIndex(3)
    const authorInfo = getFileNameFromInputIndex(1)
    const coverLetter = getFileNameFromInputIndex(2)
    if (!manuscript) nextErrors.manuscript = t.errors.manuscript
    else if (!manuscript.toLowerCase().endsWith('.docx')) nextErrors.manuscript = t.errors.manuscriptExt
    if (!antiplag) nextErrors.antiplagiarism = t.errors.antiplagiarism
    if (!authorInfo) nextErrors.authorInfo = t.errors.authorInfo
    if (!coverLetter) nextErrors.coverLetter = t.errors.coverLetter
    if (!confirmCopyright) nextErrors.confirmCopyright = t.errors.copyright
    if (!confirmOriginality) nextErrors.confirmOriginality = t.errors.originality
    if (!confirmConsent) nextErrors.confirmConsent = t.errors.consent

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstErrorKey = Object.keys(nextErrors)[0]
      const el = document.querySelector<HTMLElement>(`[data-error-key="${firstErrorKey}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }
  void validateForm

  return (
    <div className="public-container">
      {false && (
      <div className="section public-section">
        <p className="eyebrow">Подача статьи</p>
        <h1 className="hero__title">Загрузите рукопись</h1>
        <p className="subtitle">Заполните данные о статье, выберите ключевые слова и прикрепите файлы.</p>
        <Link to="/cabinet/submissions" className="button button--ghost">
          Вернуться в кабинет
        </Link>
      </div>
      )}

      <div className="section public-section" style={{ display: 'none' }}>
        <h1 className="hero__title">Загрузите рукопись</h1>
        <p className="subtitle">
          Заполните данные о статье, выберите ключевые слова и прикрепите файлы.
        </p>
        <Link to="/cabinet/submissions" className="button button--ghost">
          Вернуться в кабинет
        </Link>
      </div>

        <div className="section public-section">
          <h1 className="hero__title">{t.pageTitle}</h1>
          <p className="subtitle">{t.pageSubtitle}</p>
          <Link to="/cabinet/submissions" className="button button--ghost">
            {t.backToCabinet}
          </Link>
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                setSubmitError(null)
                if (!validateSubmissionFields()) return
                const form = e.currentTarget as HTMLFormElement
                const fileInputs = Array.from(
                  form.querySelectorAll<HTMLInputElement>('input[type="file"].file-input[data-upload-slot="article-file"]'),
                )
                const manuscriptFile = fileInputs[0]?.files?.[0] ?? null
                const authorInfoFile = fileInputs[1]?.files?.[0] ?? null
                const coverLetterFile = fileInputs[2]?.files?.[0] ?? null
                const antiplagiarismFile = fileInputs[3]?.files?.[0] ?? null

                const manuscriptFileId = manuscriptFile ? (await uploadFile(manuscriptFile)).id : null
                const authorInfoFileId = authorInfoFile ? (await uploadFile(authorInfoFile)).id : null
                const coverLetterFileId = coverLetterFile ? (await uploadFile(coverLetterFile)).id : null
                const antiplagiarismFileId = antiplagiarismFile ? (await uploadFile(antiplagiarismFile)).id : null

                const payload = {
                  // соответствие контракту backend
                  title_kz: titles.kz || null,
                  title_en: titles.en || null,
                  title_ru: titles.ru || null,

                  abstract_kz: abstracts.kz || null,
                  abstract_en: abstracts.en || null,
                  abstract_ru: abstracts.ru || null,
                  article_language: articleLanguage,

                  doi: null,
                  status: 'draft',
                  article_type: articleType || 'original',

                  // пока берём id первого автора как ответственного
                  responsible_user_id: authorList[0]?.id ?? null,

                  antiplagiarism_file_id: antiplagiarismFileId,
                  manuscript_file_id: manuscriptFileId,
                  author_info_file_id: authorInfoFileId,
                  cover_letter_file_id: coverLetterFileId,

                  not_published_elsewhere: true,
                  plagiarism_free: true,
                  authors_agree: true,
                  generative_ai_info: generativeAiInfo.trim() || null,

                  authors_text: authorsText,
                  keyword_ids: [],
                  keywords: selectedKeywords.map((k) => ({
                    title_ru: k.ru,
                    title_kz: k.kz,
                    title_en: k.en,
                  })),
                  author_ids: authorList
                    .map((a) => a.id)
                    .filter((id): id is number => typeof id === 'number'),
                  comments: comments.trim() || null,
                  confirmations: {
                    copyright: confirmCopyright,
                    originality: confirmOriginality,
                    consent: confirmConsent,
                  },
                }
                // Открываем модальное окно подтверждения с отчётом
                setPendingPayload(payload)
                setConfirmModalOpen(true)
              } catch (error) {
                setSubmitError(getApiErrorMessage(error))
                console.error('Failed to submit article', error)
              }
            }}
          >
          {submitError ? (
            <div className="alert error" style={{ marginBottom: '1rem' }}>
              {submitError}
            </div>
          ) : null}
          {false && (
          <div className="form-field">
            <label className="form-label">Язык формы</label>
            <div className="lang-switch">
              {(['ru', 'kz', 'en'] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-chip ${activeLang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => setActiveLang(code)}
                >
                  {langLabels[code]}
                </button>
              ))}
            </div>
            <p className="form-hint">
              Выберите язык для заполнения названия, аннотации и авторов.
            </p>
          </div>
          )}
          <div className="form-field">
            <label className="form-label">{t.articleTypeLabel}</label>
              <select
                className="chip-select"
                value={articleType}
                onChange={(e) => setArticleType((e.target.value || '') as ArticleType | '')}
                data-error-key="articleType"
                style={errors.articleType ? { borderColor: 'red' } : undefined}
              >
              <option value="">{t.articleTypePlaceholder}</option>
              {articleTypeOptions.map((type) => (
                <option key={type} value={type}>{t.articleTypes[type]}</option>
              ))}
            </select>
            {errors.articleType ? (<p className="form-hint" style={{ color: 'red' }}>{errors.articleType}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.articleLanguage.label}</label>
            <div className="article-language-picker" role="radiogroup" aria-label={t.articleLanguage.label}>
              {(['ru', 'kz', 'en'] as Lang[]).map((code) => {
                const option = t.articleLanguage.options[code]
                const isActive = articleLanguage === code
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`article-language-card ${isActive ? 'article-language-card--active' : ''}`}
                    onClick={() => setArticleLanguage(code)}
                  >
                    <span className="article-language-card__top">
                      <span className="article-language-card__title">{option.title}</span>
                      <span className="article-language-card__code">{code.toUpperCase()}</span>
                    </span>
                    <span className="article-language-card__subtitle">{option.subtitle}</span>
                  </button>
                )
              })}
            </div>
            <p className="form-hint">{t.articleLanguage.hint}</p>
          </div>

          <div className="form-field form-field--article-file">
            <label className="form-label">{t.keywords.label}</label>
            <div className="form-field">
              {selectedKeywords.length > 0 ? (
                <div className="pill-list">
                  {selectedKeywords.map((kw, index) => (
                    <span
                      key={`${kw.ru}-${kw.kz}-${kw.en}-${index}`}
                      className="status-chip status-chip--submitted"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {kw.ru} / {kw.kz} / {kw.en}
                      <button
                        type="button"
                        aria-label={t.keywords.removeAria}
                        onClick={() => handleRemoveKeyword(kw)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'inherit',
                          fontSize: 14,
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        {'\u00d7'}
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="table__empty">{t.keywords.empty}</div>
              )}
              <button
                type="button"
                className="button button--ghost"
                onClick={openKeywordModal}
                data-error-key="keywords"
                style={errors.keywords ? { borderColor: 'red', color: 'red' } : undefined}
              >
                {selectedKeywords.length > 0
                  ? t.keywords.edit
                  : t.keywords.add}
              </button>
              <input type="hidden" name="keywords" value={selectedKeywordsValue} />
            </div>
            <p className="form-hint">{t.keywords.hint}</p>
            {errors.keywords ? (<p className="form-hint" style={{ color: 'red' }}>{errors.keywords}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.formLanguagesLabel}</label>
            <div className="lang-switch">
              {(['ru', 'kz', 'en'] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-chip ${activeLang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => setActiveLang(code)}
                >
                  {langLabels[code]}
                </button>
              ))}
            </div>
            <p className="form-hint">{t.formLanguagesHint}</p>
          </div>

          <div className="form-field">
            <label className="form-label">{t.titleLabel} ({langLabels[activeLang]})</label>
            <input
              className="text-input"
              placeholder={t.titlePlaceholders[activeLang]}
              value={titles[activeLang]}
              onChange={(e) => setTitles((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`title_${activeLang}`}
              style={errors[`title_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`title_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`title_${activeLang}`]}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.abstractLabel} ({langLabels[activeLang]})</label>
            <textarea
              className="text-input"
              rows={4}
              placeholder={t.abstractPlaceholders[activeLang]}
              value={abstracts[activeLang]}
              onChange={(e) => setAbstracts((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`abstract_${activeLang}`}
              style={errors[`abstract_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`abstract_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`abstract_${activeLang}`]}</p>) : null}
          </div>


          <div className="form-field">
            <label className="form-label">{t.files.manuscript}</label>
            <input
              type="file"
              className="file-input"
              data-upload-slot="article-file"
              data-error-key="manuscript"
              accept=".docx"
              style={errors.manuscript ? { outline: '2px solid red' } : undefined}
            />
            {errors.manuscript ? (<p className="form-hint" style={{ color: 'red' }}>{errors.manuscript}</p>) : null}
          </div>
          <div className="form-field">
            <label className="form-label">{t.files.antiplagiarism}</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="antiplagiarism" style={errors.antiplagiarism ? { outline: '2px solid red' } : undefined} />
            {errors.antiplagiarism ? (<p className="form-hint" style={{ color: 'red' }}>{errors.antiplagiarism}</p>) : null}
          </div>

          {false && (
          <div className="form-field">
            <label className="form-label">Рукопись (*.doc, *.docx)</label>
            <input type="file" className="file-input" data-upload-slot="article-file" />
          </div>
          )}
          <div className="form-field">
            <label className="form-label">{t.files.authorInfo}</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="authorInfo" style={errors.authorInfo ? { outline: '2px solid red' } : undefined} />
            {errors.authorInfo ? (<p className="form-hint" style={{ color: 'red' }}>{errors.authorInfo}</p>) : null}
          </div>
          <div className="form-field">
            <label className="form-label">{t.files.coverLetter}</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="coverLetter" accept=".pdf" style={errors.coverLetter ? { outline: '2px solid red' } : undefined} />
            {errors.coverLetter ? (<p className="form-hint" style={{ color: 'red' }}>{errors.coverLetter}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.aiInfoLabel}</label>
            <textarea
              className="text-input"
              rows={3}
              value={generativeAiInfo}
              onChange={(e) => setGenerativeAiInfo(e.target.value)}
              placeholder={t.aiInfoPlaceholder}
            />
          </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmCopyright}
                onChange={(e) => setConfirmCopyright(e.target.checked)}
                data-error-key="confirmCopyright"
              />{' '}
              {t.confirmations.copyright}
            </label>
            {errors.confirmCopyright ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmCopyright}</p>) : null}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmOriginality}
                onChange={(e) => setConfirmOriginality(e.target.checked)}
                data-error-key="confirmOriginality"
              />{' '}
              {t.confirmations.originality}
            </label>
            {errors.confirmOriginality ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmOriginality}</p>) : null}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmConsent}
                onChange={(e) => setConfirmConsent(e.target.checked)}
                data-error-key="confirmConsent"
              />{' '}
              {t.confirmations.consent}
            </label>
            {errors.confirmConsent ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmConsent}</p>) : null}

          <button className="button button--primary" type="submit">
            {t.submit}
          </button>
        </form>
      </div>

      <div className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.authors.eyebrow}</p>
            <h2 className="panel-title">{t.authors.title}</h2>
          </div>
          <button className="button button--primary button--compact" type="button" onClick={() => setAuthorModalOpen(true)}>
            {t.authors.add}
          </button>
        </div>
        {authorList.length === 0 ? (
          <div className="table__empty">{t.authors.empty}</div>
        ) : (
          <div className="table">
            <div className="table__head">
              <span>{t.authors.columns.name}</span>
              <span>Email</span>
              <span>{t.authors.columns.affiliations}</span>
              <span>{t.authors.columns.corresponding}</span>
              <span>{t.authors.columns.actions}</span>
            </div>
            <div className="table__body">
              {authorList.map((a, idx) => (
                <div className="table__row" key={`${a.email}-${idx}`}>
                  <div className="table__cell">
                    <div className="table__title">
                      {a.prefix ? `${a.prefix} ` : ''}
                      {a.firstName} {a.middleName} {a.lastName}
                    </div>
                    <div className="table__meta">{a.phone}</div>
                  </div>
                  <div className="table__cell">{a.email}</div>
                  <div className="table__cell">
                    {[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || t.common.notSpecified}
                  </div>
                  <div className="table__cell">{a.isCorresponding ? t.authors.yes : t.authors.no}</div>
                  <div className="table__cell">
                    <button type="button" className="button button--ghost button--compact" onClick={() => removeAuthor(a.email)}>
                      {t.authors.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {errors.authorList ? (<p className="form-hint" style={{ color: 'red' }}>{errors.authorList}</p>) : null}

      {modalOpen ? (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal modal--wide keyword-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t.keywords.modalTitle}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)} aria-label={t.common.close}>
                {'\u00d7'}
              </button>
            </div>
            <div className="modal__body keyword-modal__body">
              <div className="keyword-modal__intro">
                <p className="keyword-modal__eyebrow">{t.keywords.modalEyebrow}</p>
                <p className="form-hint" style={{ margin: 0 }}>
                {t.keywords.modalHint}
                </p>
              </div>
              <div className="keyword-modal__list">
                {modalKeywords.map((keyword, index) => (
                  <div key={`keyword-row-${index}`} className="keyword-row">
                    <div className="keyword-row__header">
                      <div className="keyword-row__title">
                        <span className="keyword-row__index">{index + 1}</span>
                        <strong>{t.keywords.rowTitle}</strong>
                      </div>
                      {index >= 5 ? (
                        <button
                          type="button"
                          className="button button--ghost button--compact"
                          onClick={() => handleRemoveKeywordRow(index)}
                        >
                          {t.authors.remove}
                        </button>
                      ) : null}
                    </div>
                    <div className="keyword-row__grid">
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{t.keywords.languageLabels.ru}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.ru}
                          onChange={(e) => handleKeywordDraftChange(index, 'ru', e.target.value)}
                          placeholder={t.keywords.placeholders.ru}
                        />
                      </div>
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{t.keywords.languageLabels.kz}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.kz}
                          onChange={(e) => handleKeywordDraftChange(index, 'kz', e.target.value)}
                          placeholder={t.keywords.placeholders.kz}
                        />
                      </div>
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{t.keywords.languageLabels.en}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.en}
                          onChange={(e) => handleKeywordDraftChange(index, 'en', e.target.value)}
                          placeholder={t.keywords.placeholders.en}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={handleAddKeywordRow}
                style={{ justifySelf: 'start' }}
              >
                {t.keywords.addRow}
              </button>
              {errors.keywords ? (<p className="form-hint" style={{ color: 'red', margin: 0 }}>{errors.keywords}</p>) : null}
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setModalOpen(false)}>
                {t.common.cancel}
              </button>
              <button className="button button--primary" type="button" onClick={handleSaveKeywords}>
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authorModalOpen ? (
        <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
          <div className="modal modal--wide author-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t.authors.modalTitle}</h3>
              <button className="modal__close" onClick={() => setAuthorModalOpen(false)} aria-label={t.common.close}>
                {'\u00d7'}
              </button>
            </div>
            <div className="modal__body author-modal__body">
              <div className="author-modal__intro">
                <p className="author-modal__eyebrow">{t.authors.modalEyebrow}</p>
                <p className="author-modal__hint">{t.authors.modalHint}</p>
              </div>
              <div className="author-grid">
                <div className="form-field">
                  <label className="form-label">Email *</label>
                  <input className="text-input" value={authorForm.email} onChange={(e) => setAuthorForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.prefix}</label>
                  <input className="text-input" value={authorForm.prefix} onChange={(e) => setAuthorForm((p) => ({ ...p, prefix: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.firstName}</label>
                  <input className="text-input" value={authorForm.firstName} onChange={(e) => setAuthorForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.middleName}</label>
                  <input className="text-input" value={authorForm.middleName} onChange={(e) => setAuthorForm((p) => ({ ...p, middleName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.lastName}</label>
                  <input className="text-input" value={authorForm.lastName} onChange={(e) => setAuthorForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.phone}</label>
                  <input className="text-input" value={authorForm.phone} onChange={(e) => setAuthorForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-field form-field--span-2">
                  <label className="form-label">{t.authors.fields.address}</label>
                  <input className="text-input" value={authorForm.address} onChange={(e) => setAuthorForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.country}</label>
                  <input className="text-input" value={authorForm.country} onChange={(e) => setAuthorForm((p) => ({ ...p, country: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.affiliation1}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation1} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation1: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.affiliation2}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation2} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation2: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.affiliation3}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation3} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation3: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.corresponding}</label>
                  <div className="pill-list">
                    <button type="button" className={`button button--ghost button--compact ${authorForm.isCorresponding ? 'button--active' : ''}`} onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: true }))}>{t.common.yes}</button>
                    <button type="button" className={`button button--ghost button--compact ${!authorForm.isCorresponding ? 'button--active' : ''}`} onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: false }))}>{t.common.no}</button>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">ORCID</label>
                  <input className="text-input" value={authorForm.orcid} onChange={(e) => setAuthorForm((p) => ({ ...p, orcid: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Scopus Author ID</label>
                  <input className="text-input" value={authorForm.scopusId} onChange={(e) => setAuthorForm((p) => ({ ...p, scopusId: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Researcher ID</label>
                  <input className="text-input" value={authorForm.researcherId} onChange={(e) => setAuthorForm((p) => ({ ...p, researcherId: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal__footer author-modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setAuthorModalOpen(false)}>{t.common.cancel}</button>
              <button className="button button--primary" type="button" onClick={saveAuthor} disabled={!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()}>{t.authors.save}</button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmModalOpen && pendingPayload ? (
        <div className="modal-backdrop" onClick={() => setConfirmModalOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t.confirm.title}</h3>
              <button className="modal__close" onClick={() => setConfirmModalOpen(false)} aria-label={t.common.close}>?</button>
            </div>
            <div className="modal__body">
              <div className="table">
                <div className="table__head">
                  <span>{t.confirm.columns.field}</span>
                  <span>{t.confirm.columns.value}</span>
                </div>
                <div className="table__body">
                  <div className="table__row"><div className="table__cell">{t.confirm.previewLanguage}</div><div className="table__cell"><div className="lang-switch">{(['ru', 'kz', 'en'] as Lang[]).map((code) => (<button key={code} type="button" className={`lang-chip ${confirmLang === code ? 'lang-chip--active' : ''}`} onClick={() => setConfirmLang(code)}>{langLabels[code]}</button>))}</div></div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.articleTitle}</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.title_ru) || (confirmLang === 'kz' && pendingPayload.title_kz) || (confirmLang === 'en' && pendingPayload.title_en) || t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.abstract}</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.abstract_ru) || (confirmLang === 'kz' && pendingPayload.abstract_kz) || (confirmLang === 'en' && pendingPayload.abstract_en) || t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.articleType}</div><div className="table__cell">{articleType ? t.articleTypes[articleType] : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.articleLanguage}</div><div className="table__cell">{pendingPayload.article_language ? t.articleLanguage.options[pendingPayload.article_language as Lang]?.title ?? pendingPayload.article_language : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.keywords}</div><div className="table__cell">{selectedKeywords.length ? selectedKeywords.map((kw) => confirmLang === 'ru' ? kw.ru : confirmLang === 'kz' ? kw.kz : kw.en).filter(Boolean).join(', ') : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.responsibleAuthor}</div><div className="table__cell">{(() => { const responsible = authorList.find((a) => a.id === pendingPayload.responsible_user_id); if (!responsible) return pendingPayload.responsible_user_id ?? t.common.notAvailable; const name = [responsible.prefix, responsible.firstName, responsible.middleName, responsible.lastName].filter(Boolean).join(' '); return `${name} (${responsible.email})`; })()}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.authors}</div><div className="table__cell">{authorList.length ? authorList.map((a) => [a.prefix, a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')).join('; ') : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.manuscript}</div><div className="table__cell">{getFileNameFromInputIndex(0) || (pendingPayload.manuscript_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.antiplagiarism}</div><div className="table__cell">{getFileNameFromInputIndex(3) || (pendingPayload.antiplagiarism_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.authorInfo}</div><div className="table__cell">{getFileNameFromInputIndex(1) || (pendingPayload.author_info_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.coverLetter}</div><div className="table__cell">{getFileNameFromInputIndex(2) || (pendingPayload.cover_letter_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.aiInfo}</div><div className="table__cell">{pendingPayload.generative_ai_info || t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.confirmations}</div><div className="table__cell">{pendingPayload.confirmations ? (['copyright', 'originality', 'consent'] as const).filter((k) => pendingPayload.confirmations[k]).map((k) => t.confirmations.labels[k]).join(', ') || t.common.notAvailable : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.comments}</div><div className="table__cell">{pendingPayload.comments || t.common.notAvailable}</div></div>
                </div>
              </div>
              <p className="form-hint" style={{ marginTop: 12 }}>{t.confirm.hint}</p>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setConfirmModalOpen(false)}>{t.confirm.edit}</button>
              <button className="button button--primary" type="button" onClick={async () => { try { setSubmitError(null); await api.post('/articles', pendingPayload); setConfirmModalOpen(false); setPendingPayload(null); navigate('/cabinet/submissions'); } catch (error) { setSubmitError(getApiErrorMessage(error)); console.error('Failed to submit article', error); } }}>{t.confirm.submit}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}





