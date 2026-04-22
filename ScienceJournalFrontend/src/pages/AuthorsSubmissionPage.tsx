import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api/client'

const articleTypes = ['Оригинальная статья', 'Обзорная статья']
const mapArticleTypeToApi: Record<string, 'original' | 'review'> = {
  'Оригинальная статья': 'original',
  'Обзорная статья': 'review',
}

type Keyword = { id?: number; ru: string; kz: string; en: string }
type Lang = 'ru' | 'kz' | 'en'

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

export function AuthorsSubmissionPage() {
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKeywords, setModalKeywords] = useState<Keyword[]>([])
  const [activeLang, setActiveLang] = useState<Lang>('ru')
  const [titles, setTitles] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [abstracts, setAbstracts] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [articleType, setArticleType] = useState('')
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

  const getApiErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      const body = error.bodyJson as any
      if (typeof body?.detail === 'string' && body.detail.trim()) return body.detail
      if (typeof body?.message === 'string' && body.message.trim()) return body.message
      if (typeof error.bodyText === 'string' && error.bodyText.trim()) return error.bodyText
      return `Ошибка сервера (${error.status})`
    }
    if (error instanceof Error && error.message.trim()) return error.message
    return 'Не удалось отправить статью. Данные формы сохранены, исправьте ошибку и попробуйте снова.'
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

  const langLabels: Record<Lang, string> = { ru: 'Русский', kz: 'Казахский', en: 'Английский' }
  const titlePlaceholders: Record<Lang, string> = {
    ru: 'Заголовок на русском',
    kz: 'Заголовок на казахском',
    en: 'Title in English',
  }
  const abstractPlaceholders: Record<Lang, string> = {
    ru: 'Аннотация на русском',
    kz: 'Аннотация на казахском',
    en: 'Abstract in English',
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
    if (!articleType) nextErrors.articleType = 'Р’С‹Р±РµСЂРёС‚Рµ С‚РёРї СЃС‚Р°С‚СЊРё'
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((lang) => {
      if (!titles[lang]?.trim()) nextErrors[`title_${lang}`] = 'Р—Р°РїРѕР»РЅРёС‚Рµ Р·Р°РіРѕР»РѕРІРѕРє'
      if (!abstracts[lang]?.trim()) nextErrors[`abstract_${lang}`] = 'Р—Р°РїРѕР»РЅРёС‚Рµ Р°РЅРЅРѕС‚Р°С†РёСЋ'
    })
    if (selectedKeywords.length < 5) nextErrors.keywords = 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј 5 РєР»СЋС‡РµРІС‹С… СЃР»РѕРІ'
    if (authorList.length === 0) nextErrors.authorList = 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј РѕРґРЅРѕРіРѕ Р°РІС‚РѕСЂР°'
    if (!confirmCopyright) nextErrors.confirmCopyright = 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ РѕС‚СЃСѓС‚СЃС‚РІРёРµ РїР°СЂР°Р»Р»РµР»СЊРЅРѕР№ РїРѕРґР°С‡Рё'
    if (!confirmOriginality) nextErrors.confirmOriginality = 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ РѕС‚СЃСѓС‚СЃС‚РІРёРµ РїР»Р°РіРёР°С‚Р°'
    if (!confirmConsent) nextErrors.confirmConsent = 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ СЃРѕРіР»Р°СЃРёРµ РІСЃРµС… Р°РІС‚РѕСЂРѕРІ'

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
    if (!articleType) nextErrors.articleType = 'Выберите тип статьи'
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((lang) => {
      if (!titles[lang]?.trim()) nextErrors[`title_${lang}`] = 'Заполните заголовок'
      if (!abstracts[lang]?.trim()) nextErrors[`abstract_${lang}`] = 'Заполните аннотацию'
    })
    if (selectedKeywords.length < 5) nextErrors.keywords = 'Добавьте минимум 5 ключевых слов'
    if (authorList.length === 0) nextErrors.authorList = 'Добавьте минимум одного автора'
    const manuscript = getFileNameFromInputIndex(0)
    const antiplag = getFileNameFromInputIndex(3)
    const authorInfo = getFileNameFromInputIndex(1)
    const coverLetter = getFileNameFromInputIndex(2)
    if (!manuscript) nextErrors.manuscript = 'Загрузите файл рукописи в формате .docx'
    else if (!manuscript.toLowerCase().endsWith('.docx')) nextErrors.manuscript = 'Поддерживается только формат .docx'
    if (!antiplag) nextErrors.antiplagiarism = 'Загрузите файл антиплагиата'
    if (!authorInfo) nextErrors.authorInfo = 'Загрузите сведения об авторах'
    if (!coverLetter) nextErrors.coverLetter = 'Загрузите сопроводительное письмо'
    if (!confirmCopyright) nextErrors.confirmCopyright = 'Подтвердите отсутствие параллельной подачи'
    if (!confirmOriginality) nextErrors.confirmOriginality = 'Подтвердите отсутствие плагиата'
    if (!confirmConsent) nextErrors.confirmConsent = 'Подтвердите согласие всех авторов'

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
          <h1 className="hero__title">Загрузите рукопись</h1>
          <p className="subtitle">
            Заполните данные о статье, выберите ключевые слова и прикрепите файлы.
          </p>
          <Link to="/cabinet/submissions" className="button button--ghost">
            Вернуться в кабинет
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

                  doi: null,
                  status: 'draft',
                  article_type: mapArticleTypeToApi[articleType] ?? 'original',

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
            <label className="form-label">Выберите тип статьи</label>
              <select
                className="chip-select"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value)}
                data-error-key="articleType"
                style={errors.articleType ? { borderColor: 'red' } : undefined}
              >
              <option value="">---------</option>
              {articleTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            {errors.articleType ? (<p className="form-hint" style={{ color: 'red' }}>{errors.articleType}</p>) : null}
          </div>

          <div className="form-field form-field--article-file">
            <label className="form-label">{'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043b\u043e\u0432\u0430'}</label>
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
                        aria-label={'\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u043b\u044e\u0447\u0435\u0432\u043e\u0435 \u0441\u043b\u043e\u0432\u043e'}
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
                <div className="table__empty">{'\u041a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043b\u043e\u0432\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b.'}</div>
              )}
              <button
                type="button"
                className="button button--ghost"
                onClick={openKeywordModal}
                data-error-key="keywords"
                style={errors.keywords ? { borderColor: 'red', color: 'red' } : undefined}
              >
                {selectedKeywords.length > 0
                  ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043b\u043e\u0432\u0430'
                  : '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043b\u043e\u0432\u0430'}
              </button>
              <input type="hidden" name="keywords" value={selectedKeywordsValue} />
            </div>
            <p className="form-hint">{'\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043c\u0438\u043d\u0438\u043c\u0443\u043c 5 \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0445 \u0441\u043b\u043e\u0432. \u041a\u0430\u0436\u0434\u043e\u0435 \u0441\u043b\u043e\u0432\u043e \u043d\u0443\u0436\u043d\u043e \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u043e\u043c, \u043a\u0430\u0437\u0430\u0445\u0441\u043a\u043e\u043c \u0438 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c.'}</p>
            {errors.keywords ? (<p className="form-hint" style={{ color: 'red' }}>{errors.keywords}</p>) : null}
          </div>

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
            <p className="form-hint">Заполните сначала на русском, затем на казахском и английском.</p>
          </div>

          <div className="form-field">
            <label className="form-label">Название статьи ({langLabels[activeLang]})</label>
            <input
              className="text-input"
              placeholder={titlePlaceholders[activeLang]}
              value={titles[activeLang]}
              onChange={(e) => setTitles((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`title_${activeLang}`}
              style={errors[`title_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`title_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`title_${activeLang}`]}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">Аннотация ({langLabels[activeLang]})</label>
            <textarea
              className="text-input"
              rows={4}
              placeholder={abstractPlaceholders[activeLang]}
              value={abstracts[activeLang]}
              onChange={(e) => setAbstracts((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`abstract_${activeLang}`}
              style={errors[`abstract_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`abstract_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`abstract_${activeLang}`]}</p>) : null}
          </div>


          <div className="form-field">
            <label className="form-label">Загрузить рукопись (любой формат текста: .docx)</label>
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
            <label className="form-label">Загрузить сведения об антиплагиате</label>
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
            <label className="form-label">Файл со сведениями об авторах (*.doc, *.docx)</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="authorInfo" style={errors.authorInfo ? { outline: '2px solid red' } : undefined} />
            {errors.authorInfo ? (<p className="form-hint" style={{ color: 'red' }}>{errors.authorInfo}</p>) : null}
          </div>
          <div className="form-field">
            <label className="form-label">Сопроводительное письмо (*.pdf)</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="coverLetter" accept=".pdf" style={errors.coverLetter ? { outline: '2px solid red' } : undefined} />
            {errors.coverLetter ? (<p className="form-hint" style={{ color: 'red' }}>{errors.coverLetter}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">Сведения о применении генеративного ИИ</label>
            <textarea
              className="text-input"
              rows={3}
              value={generativeAiInfo}
              onChange={(e) => setGenerativeAiInfo(e.target.value)}
              placeholder="Опишите, где и как использовался генеративный ИИ (если применялся)"
            />
          </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmCopyright}
                onChange={(e) => setConfirmCopyright(e.target.checked)}
                data-error-key="confirmCopyright"
              />{' '}
              Статья ранее не публиковалась и не рассматривается другим журналом
            </label>
            {errors.confirmCopyright ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmCopyright}</p>) : null}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmOriginality}
                onChange={(e) => setConfirmOriginality(e.target.checked)}
                data-error-key="confirmOriginality"
              />{' '}
              В статье отсутствует плагиат
            </label>
            {errors.confirmOriginality ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmOriginality}</p>) : null}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmConsent}
                onChange={(e) => setConfirmConsent(e.target.checked)}
                data-error-key="confirmConsent"
              />{' '}
              Все авторы подтверждают согласие с поданной версией
            </label>
            {errors.confirmConsent ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmConsent}</p>) : null}

          <button className="button button--primary" type="submit">
            Отправить статью
          </button>
        </form>
      </div>

      <div className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{'\u0410\u0432\u0442\u043e\u0440\u044b \u0441\u0442\u0430\u0442\u044c\u0438'}</p>
            <h2 className="panel-title">{'\u0421\u043e\u0441\u0442\u0430\u0432 \u0430\u0432\u0442\u043e\u0440\u043e\u0432'}</h2>
          </div>
          <button className="button button--primary button--compact" type="button" onClick={() => setAuthorModalOpen(true)}>
            {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0430\u0432\u0442\u043e\u0440\u0430'}
          </button>
        </div>
        {authorList.length === 0 ? (
          <div className="table__empty">{'\u0410\u0432\u0442\u043e\u0440\u044b \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b.'}</div>
        ) : (
          <div className="table">
            <div className="table__head">
              <span>{'\u0418\u043c\u044f'}</span>
              <span>Email</span>
              <span>{'\u0410\u0444\u0444\u0438\u043b\u0438\u0430\u0446\u0438\u0438'}</span>
              <span>{'\u041a\u043e\u0440\u0440. \u0430\u0432\u0442\u043e\u0440'}</span>
              <span>{'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'}</span>
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
                    {[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || '—'}
                  </div>
                  <div className="table__cell">{a.isCorresponding ? '\u0414\u0430' : '\u041d\u0435\u0442'}</div>
                  <div className="table__cell">
                    <button type="button" className="button button--ghost button--compact" onClick={() => removeAuthor(a.email)}>
                      {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
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
              <h3>{'\u041a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043b\u043e\u0432\u0430 \u0441\u0442\u0430\u0442\u044c\u0438'}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
                {'\u00d7'}
              </button>
            </div>
            <div className="modal__body keyword-modal__body">
              <div className="keyword-modal__intro">
                <p className="keyword-modal__eyebrow">{'\u041a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0441\u043b\u043e\u0432\u0430'}</p>
                <p className="form-hint" style={{ margin: 0 }}>
                {'\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043c\u0438\u043d\u0438\u043c\u0443\u043c 5 \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0445 \u0441\u043b\u043e\u0432 \u043d\u0430 \u0442\u0440\u0435\u0445 \u044f\u0437\u044b\u043a\u0430\u0445. \u041a\u043d\u043e\u043f\u043a\u0430 \u043f\u043b\u044e\u0441 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0441\u043b\u043e\u0432\u0430.'}
                </p>
              </div>
              <div className="keyword-modal__list">
                {modalKeywords.map((keyword, index) => (
                  <div key={`keyword-row-${index}`} className="keyword-row">
                    <div className="keyword-row__header">
                      <div className="keyword-row__title">
                        <span className="keyword-row__index">{index + 1}</span>
                        <strong>{'\u041a\u043b\u044e\u0447\u0435\u0432\u043e\u0435 \u0441\u043b\u043e\u0432\u043e'}</strong>
                      </div>
                      {index >= 5 ? (
                        <button
                          type="button"
                          className="button button--ghost button--compact"
                          onClick={() => handleRemoveKeywordRow(index)}
                        >
                          {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
                        </button>
                      ) : null}
                    </div>
                    <div className="keyword-row__grid">
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{'\u041d\u0430 \u0440\u0443\u0441\u0441\u043a\u043e\u043c'}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.ru}
                          onChange={(e) => handleKeywordDraftChange(index, 'ru', e.target.value)}
                          placeholder={'\u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: \u0438\u0441\u043a\u0443\u0441\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439 \u0438\u043d\u0442\u0435\u043b\u043b\u0435\u043a\u0442'}
                        />
                      </div>
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{'\u041d\u0430 \u043a\u0430\u0437\u0430\u0445\u0441\u043a\u043e\u043c'}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.kz}
                          onChange={(e) => handleKeywordDraftChange(index, 'kz', e.target.value)}
                          placeholder={'\u041c\u044b\u0441\u0430\u043b\u044b: \u0436\u0430\u0441\u0430\u043d\u0434\u044b \u0438\u043d\u0442\u0435\u043b\u043b\u0435\u043a\u0442'}
                        />
                      </div>
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{'\u041d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c'}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.en}
                          onChange={(e) => handleKeywordDraftChange(index, 'en', e.target.value)}
                          placeholder="Example: artificial intelligence"
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
                {'+ \u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0435\u0449\u0435 \u043a\u043b\u044e\u0447\u0435\u0432\u043e\u0435 \u0441\u043b\u043e\u0432\u043e'}
              </button>
              {errors.keywords ? (<p className="form-hint" style={{ color: 'red', margin: 0 }}>{errors.keywords}</p>) : null}
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setModalOpen(false)}>
                {'\u041e\u0442\u043c\u0435\u043d\u0430'}
              </button>
              <button className="button button--primary" type="button" onClick={handleSaveKeywords}>
                {'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authorModalOpen ? (
        <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
          <div className="modal modal--wide author-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0430\u0432\u0442\u043e\u0440\u0430'}</h3>
              <button className="modal__close" onClick={() => setAuthorModalOpen(false)} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
                {'\u00d7'}
              </button>
            </div>
            <div className="modal__body author-modal__body">
              <div className="author-modal__intro">
                <p className="author-modal__eyebrow">{'\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0430\u0432\u0442\u043e\u0440\u0430'}</p>
                <p className="author-modal__hint">{'\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u044f, \u0437\u0430\u0442\u0435\u043c \u043f\u0440\u0438 \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e\u0441\u0442\u0438 \u0434\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0430\u0444\u0444\u0438\u043b\u0438\u0430\u0446\u0438\u0438 \u0438 \u043d\u0430\u0443\u0447\u043d\u044b\u0435 \u0438\u0434\u0435\u043d\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b.'}</p>
              </div>
              <div className="author-grid">
                <div className="form-field">
                  <label className="form-label">Email *</label>
                  <input className="text-input" value={authorForm.email} onChange={(e) => setAuthorForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u041f\u0440\u0435\u0444\u0438\u043a\u0441'}</label>
                  <input className="text-input" value={authorForm.prefix} onChange={(e) => setAuthorForm((p) => ({ ...p, prefix: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">??? *</label>
                  <input className="text-input" value={authorForm.firstName} onChange={(e) => setAuthorForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e'}</label>
                  <input className="text-input" value={authorForm.middleName} onChange={(e) => setAuthorForm((p) => ({ ...p, middleName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0424\u0430\u043c\u0438\u043b\u0438\u044f *'}</label>
                  <input className="text-input" value={authorForm.lastName} onChange={(e) => setAuthorForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0422\u0435\u043b\u0435\u0444\u043e\u043d'}</label>
                  <input className="text-input" value={authorForm.phone} onChange={(e) => setAuthorForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-field form-field--span-2">
                  <label className="form-label">{'\u0410\u0434\u0440\u0435\u0441'}</label>
                  <input className="text-input" value={authorForm.address} onChange={(e) => setAuthorForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0421\u0442\u0440\u0430\u043d\u0430 *'}</label>
                  <input className="text-input" value={authorForm.country} onChange={(e) => setAuthorForm((p) => ({ ...p, country: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0410\u0444\u0444\u0438\u043b\u0438\u0430\u0446\u0438\u044f 1 *'}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation1} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation1: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0410\u0444\u0444\u0438\u043b\u0438\u0430\u0446\u0438\u044f 2'}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation2} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation2: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0410\u0444\u0444\u0438\u043b\u0438\u0430\u0446\u0438\u044f 3'}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation3} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation3: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{'\u0421\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0439 \u0430\u0432\u0442\u043e\u0440'}</label>
                  <div className="pill-list">
                    <button type="button" className={`button button--ghost button--compact ${authorForm.isCorresponding ? 'button--active' : ''}`} onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: true }))}>??</button>
                    <button type="button" className={`button button--ghost button--compact ${!authorForm.isCorresponding ? 'button--active' : ''}`} onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: false }))}>???</button>
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
              <button className="button button--ghost" type="button" onClick={() => setAuthorModalOpen(false)}>{'\u041e\u0442\u043c\u0435\u043d\u0430'}</button>
              <button className="button button--primary" type="button" onClick={saveAuthor} disabled={!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()}>{'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0430\u0432\u0442\u043e\u0440\u0430'}</button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmModalOpen && pendingPayload ? (
        <div className="modal-backdrop" onClick={() => setConfirmModalOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>????????????? ???????? ??????</h3>
              <button className="modal__close" onClick={() => setConfirmModalOpen(false)} aria-label="???????">?</button>
            </div>
            <div className="modal__body">
              <div className="table">
                <div className="table__head">
                  <span>????</span>
                  <span>????????</span>
                </div>
                <div className="table__body">
                  <div className="table__row"><div className="table__cell">???? ?????????</div><div className="table__cell"><div className="lang-switch">{(['ru', 'kz', 'en'] as Lang[]).map((code) => (<button key={code} type="button" className={`lang-chip ${confirmLang === code ? 'lang-chip--active' : ''}`} onClick={() => setConfirmLang(code)}>{langLabels[code]}</button>))}</div></div></div>
                  <div className="table__row"><div className="table__cell">?????????</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.title_ru) || (confirmLang === 'kz' && pendingPayload.title_kz) || (confirmLang === 'en' && pendingPayload.title_en) || '?'}</div></div>
                  <div className="table__row"><div className="table__cell">?????????</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.abstract_ru) || (confirmLang === 'kz' && pendingPayload.abstract_kz) || (confirmLang === 'en' && pendingPayload.abstract_en) || '?'}</div></div>
                  <div className="table__row"><div className="table__cell">??? ??????</div><div className="table__cell">{articleType || '?'}</div></div>
                  <div className="table__row"><div className="table__cell">???????? ?????</div><div className="table__cell">{selectedKeywords.length ? selectedKeywords.map((kw) => confirmLang === 'ru' ? kw.ru : confirmLang === 'kz' ? kw.kz : kw.en).filter(Boolean).join(', ') : '?'}</div></div>
                  <div className="table__row"><div className="table__cell">????????????? ?????</div><div className="table__cell">{(() => { const responsible = authorList.find((a) => a.id === pendingPayload.responsible_user_id); if (!responsible) return pendingPayload.responsible_user_id ?? '?'; const name = [responsible.prefix, responsible.firstName, responsible.middleName, responsible.lastName].filter(Boolean).join(' '); return `${name} (${responsible.email})`; })()}</div></div>
                  <div className="table__row"><div className="table__cell">??????</div><div className="table__cell">{authorList.length ? authorList.map((a) => [a.prefix, a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')).join('; ') : '?'}</div></div>
                  <div className="table__row"><div className="table__cell">???? ????????</div><div className="table__cell">{getFileNameFromInputIndex(0) || (pendingPayload.manuscript_file_id ? '????????' : '?')}</div></div>
                  <div className="table__row"><div className="table__cell">???????????</div><div className="table__cell">{getFileNameFromInputIndex(3) || (pendingPayload.antiplagiarism_file_id ? '????????' : '?')}</div></div>
                  <div className="table__row"><div className="table__cell">???????? ?? ???????</div><div className="table__cell">{getFileNameFromInputIndex(1) || (pendingPayload.author_info_file_id ? '?????????' : '?')}</div></div>
                  <div className="table__row"><div className="table__cell">???????????????? ??????</div><div className="table__cell">{getFileNameFromInputIndex(2) || (pendingPayload.cover_letter_file_id ? '?????????' : '?')}</div></div>
                  <div className="table__row"><div className="table__cell">???????????? ??</div><div className="table__cell">{pendingPayload.generative_ai_info || '?'}</div></div>
                  <div className="table__row"><div className="table__cell">?????????????</div><div className="table__cell">{pendingPayload.confirmations ? ['copyright', 'originality', 'consent'].filter((k) => pendingPayload.confirmations[k]).join(', ') : '?'}</div></div>
                  <div className="table__row"><div className="table__cell">???????????</div><div className="table__cell">{pendingPayload.comments || '?'}</div></div>
                </div>
              </div>
              <p className="form-hint" style={{ marginTop: 12 }}>?? ????????????? ???????, ??? ?????? ??????? ?????? ? ?????????? ????????</p>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setConfirmModalOpen(false)}>??????</button>
              <button className="button button--primary" type="button" onClick={async () => { try { setSubmitError(null); await api.post('/articles', pendingPayload); setConfirmModalOpen(false); setPendingPayload(null); navigate('/cabinet/submissions'); } catch (error) { setSubmitError(getApiErrorMessage(error)); console.error('Failed to submit article', error); } }}>??????????? ? ???????</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
