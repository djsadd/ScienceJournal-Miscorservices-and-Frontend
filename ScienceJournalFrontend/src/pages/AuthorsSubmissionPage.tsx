import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const articleTypes = ['Оригинальная статья', 'Обзорная статья']
const mapArticleTypeToApi: Record<string, 'original' | 'review'> = {
  'Оригинальная статья': 'original',
  'Обзорная статья': 'review',
}

type ApiKeyword = { id?: number; title_ru: string; title_kz: string; title_en: string }
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
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState<Keyword>({ ru: '', kz: '', en: '' })
  const [activeLang, setActiveLang] = useState<Lang>('ru')
  const [titles, setTitles] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [abstracts, setAbstracts] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [authors, setAuthors] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [articleType, setArticleType] = useState('')
  const [comments, setComments] = useState('')
  void setComments
  const [generativeAiInfo, setGenerativeAiInfo] = useState('')
  const [confirmCopyright, setConfirmCopyright] = useState(false)
  const [confirmOriginality, setConfirmOriginality] = useState(false)
  const [confirmConsent, setConfirmConsent] = useState(false)
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [allAuthors, setAllAuthors] = useState<AuthorApi[]>([])
  const [authorQuery, setAuthorQuery] = useState('')
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
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const loadKeywords = async () => {
      try {
        const data = await api.get<ApiKeyword[]>('/articles/keywords')
        if (!isMounted) return
        const mapped =
          data?.map((item) => ({
            id: item.id,
            ru: item.title_ru,
            kz: item.title_kz,
            en: item.title_en,
          })) ?? []
        setKeywords(mapped)
      } catch (error) {
        console.error('Failed to load keywords', error)
      }
    }
    loadKeywords()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadAuthors = async () => {
      try {
        const data = await api.get<AuthorApi[]>('/articles/authors')
        if (!isMounted || !Array.isArray(data)) return
        setAllAuthors(data)
      } catch (error) {
        console.error('Failed to load authors', error)
      }
    }
    loadAuthors()
    return () => {
      isMounted = false
    }
  }, [])

  const matches = useMemo(
    () => {
      const query = keywordInput.trim().toLowerCase()
      if (!query) return []
      return keywords.filter((kw) => {
        const titleRu = kw.ru.toLowerCase()
        const titleKz = kw.kz.toLowerCase()
        const titleEn = kw.en.toLowerCase()
        const isSelected = selectedKeywords.some(
          (selected) => (selected.id ?? selected.ru) === (kw.id ?? kw.ru),
        )
        return (
          !isSelected && (titleRu.includes(query) || titleKz.includes(query) || titleEn.includes(query))
        )
      })
    },
    [keywords, keywordInput, selectedKeywords],
  )

  const handleAddKeyword = (keyword: Keyword) => {
    const exists = selectedKeywords.some(
      (selected) => (selected.id ?? selected.ru) === (keyword.id ?? keyword.ru),
    )
    if (exists) return
    setSelectedKeywords((prev) => [...prev, keyword])
    setKeywordInput('')
  }

  const handleRemoveKeyword = (keyword: Keyword) => {
    setSelectedKeywords((prev) =>
      prev.filter(
        (k) => (k.id ?? k.ru) !== (keyword.id ?? keyword.ru),
      ),
    )
  }

  const authorMatches = useMemo(
    () => {
      const query = authorQuery.trim().toLowerCase()
      if (!query) return []
      return allAuthors.filter((a) => {
        const fullName = [a.prefix, a.first_name, a.patronymic, a.last_name].filter(Boolean).join(' ').toLowerCase()
        return fullName.includes(query) || a.email.toLowerCase().includes(query)
      })
    },
    [allAuthors, authorQuery],
  )

  const handleAttachExistingAuthor = (apiAuthor: AuthorApi) => {
    const mapped = mapApiAuthorToForm(apiAuthor)
    setAuthorList((prev) => {
      if (prev.some((a) => a.email === mapped.email)) return prev
      return [...prev, mapped]
    })
    setAuthorQuery('')
  }

  const handleSaveKeyword = async () => {
    if (!newKeyword.ru.trim()) return
    try {
      const created = await api.post<ApiKeyword>('/articles/keywords', {
        title_ru: newKeyword.ru.trim(),
        title_kz: newKeyword.kz.trim(),
        title_en: newKeyword.en.trim(),
      })
      const keyword: Keyword = {
        id: created.id,
        ru: created.title_ru,
        kz: created.title_kz,
        en: created.title_en,
      }
      // Add to available list and immediately select it
      setKeywords((prev) => [...prev, keyword])
      setSelectedKeywords((prev) => [...prev, keyword])
      setKeywordInput('')
      setNewKeyword({ ru: '', kz: '', en: '' })
      setModalOpen(false)
    } catch (error) {
      console.error('Failed to create keyword', error)
    }
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
      setAllAuthors((prev) => [...prev, created])
      resetAuthorForm()
      setAuthorModalOpen(false)
    } catch (error) {
      console.error('Failed to create author', error)
    }
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
  const authorsPlaceholders: Record<Lang, string> = {
    ru: 'Авторы на русском',
    kz: 'Авторы на казахском',
    en: 'Authors in English',
  }

  const selectedKeywordsValue = useMemo(
    () => selectedKeywords.map((kw) => kw.ru).join(', '),
    [selectedKeywords],
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

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!articleType) nextErrors.articleType = 'Выберите тип статьи'
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((lang) => {
      if (!titles[lang]?.trim()) nextErrors[`title_${lang}`] = 'Заполните заголовок'
      if (!abstracts[lang]?.trim()) nextErrors[`abstract_${lang}`] = 'Заполните аннотацию'
      if (!authors[lang]?.trim()) nextErrors[`authors_${lang}`] = 'Укажите авторов'
    })
    if (selectedKeywords.length === 0) nextErrors.keywords = 'Добавьте хотя бы одно ключевое слово'
    if (authorList.length === 0) nextErrors.authorList = 'Добавьте минимум одного автора'
    const manuscript = getFileNameFromInputIndex(0)
    const antiplag = getFileNameFromInputIndex(3)
    const authorInfo = getFileNameFromInputIndex(1)
    const coverLetter = getFileNameFromInputIndex(2)
    if (!manuscript) nextErrors.manuscript = 'Загрузите файл рукописи в формате .docx'
    else if (!manuscript.toLowerCase().endsWith('.docx')) nextErrors.manuscript = 'Поддерживается только формат .docx'
    if (!antiplag) nextErrors.antiplagiarism = 'Загрузите файл антиплагиата в формате .pdf'
    else if (!antiplag.toLowerCase().endsWith('.pdf')) nextErrors.antiplagiarism = 'Поддерживается только формат .pdf'
    if (!authorInfo) nextErrors.authorInfo = 'Загрузите сведения об авторах'
    if (!coverLetter) nextErrors.coverLetter = 'Загрузите сопроводительное письмо в формате .pdf'
    else if (!coverLetter.toLowerCase().endsWith('.pdf')) nextErrors.coverLetter = 'Поддерживается только формат .pdf'
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
                if (!validateForm()) return
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

                  authors_text: authors,
                  keyword_ids: selectedKeywords
                    .map((k) => k.id)
                    .filter((id): id is number => typeof id === 'number'),
                  // Передаём названия новых ключевых слов для авто-создания и привязки
                  keywords: selectedKeywords
                    .filter((k) => !k.id)
                    .map((k) => ({ title_ru: k.ru, title_kz: k.kz, title_en: k.en })),
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
                console.error('Failed to submit article', error)
              }
            }}
          >
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
            <label className="form-label">Выберите ключевые слова</label>
            <div className="form-field">
              {selectedKeywords.length > 0 ? (
                <div className="pill-list">
                  {selectedKeywords.map((kw) => (
                    <span
                      key={kw.id ?? kw.ru}
                      className="status-chip status-chip--submitted"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {kw.ru} / {kw.kz} / {kw.en}
                      <button
                        type="button"
                        aria-label="Удалить ключевое слово"
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
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <input
                className="text-input"
                placeholder={
                  activeLang === 'ru'
                    ? 'Введите ключевое слово'
                    : activeLang === 'kz'
                    ? 'Кілт сөзді енгізіңіз'
                    : 'Enter a keyword'
                }
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                data-error-key="keywords"
                style={errors.keywords ? { borderColor: 'red' } : undefined}
              />
              <input type="hidden" name="keywords" value={selectedKeywordsValue} />
            </div>
            {keywordInput.trim() ? (
              <div className="pill-list">
    {matches.length > 0 ? (
      matches.map((kw) => (
        <button
          key={kw.id ?? kw.ru}
          type="button"
          className="status-chip status-chip--submitted"
          onClick={() => handleAddKeyword(kw)}
        >
          {kw.ru} / {kw.kz} / {kw.en}
        </button>
      ))
    ) : (
      <span className="table__empty">Совпадений не найдено.</span>
    )}
  </div>
) : null}

            {keywordInput.trim() && matches.length === 0 ? (
              <button type="button" className="button button--ghost" onClick={() => setModalOpen(true)}>
                Добавить новое ключевое слово
              </button>
            ) : null}
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
            <label className="form-label">Авторы статьи ({langLabels[activeLang]})</label>
            <input
              className="text-input"
              placeholder={authorsPlaceholders[activeLang]}
              value={authors[activeLang]}
              onChange={(e) => setAuthors((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`authors_${activeLang}`}
              style={errors[`authors_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`authors_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`authors_${activeLang}`]}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">Загрузить рукопись (*.docx)</label>
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
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="antiplagiarism" accept=".pdf" style={errors.antiplagiarism ? { outline: '2px solid red' } : undefined} />
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
            <p className="eyebrow">Авторы статьи</p>
            <h2 className="panel-title">Состав авторов</h2>
          </div>
          <button className="button button--primary button--compact" type="button" onClick={() => setAuthorModalOpen(true)}>
            Добавить автора
          </button>
          </div>
          <div className="form-field">
            <label className="form-label">Поиск автора в базе</label>
            <input
              className="text-input"
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
              placeholder="Начните вводить ФИО или email автора"
            />
            {authorQuery.trim() ? (
              <div className="pill-list">
                {authorMatches.length > 0 ? (
                  authorMatches.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="status-chip status-chip--submitted"
                      onClick={() => handleAttachExistingAuthor(a)}
                    >
                      {[a.prefix, a.first_name, a.patronymic, a.last_name].filter(Boolean).join(' ')} ({a.email})
                    </button>
                  ))
                ) : (
                  <span className="table__empty">Авторы не найдены.</span>
                )}
              </div>
            ) : null}
          </div>
          {authorList.length === 0 ? (
          <div className="table__empty">Авторы пока не добавлены.</div>
        ) : (
          <div className="table">
            <div className="table__head">
              <span>Имя</span>
              <span>Email</span>
              <span>Аффилиации</span>
              <span>Корр. автор</span>
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
                  <div className="table__cell">{a.isCorresponding ? 'Да' : 'Нет'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {errors.authorList ? (<p className="form-hint" style={{ color: 'red' }}>{errors.authorList}</p>) : null}

      {modalOpen ? (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Новое ключевое слово</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-label">На русском</label>
                <input
                  className="text-input"
                  value={newKeyword.ru}
                  onChange={(e) => setNewKeyword((prev) => ({ ...prev, ru: e.target.value }))}
                  placeholder="Например: Искусственный интеллект"
                />
              </div>
              <div className="form-field">
                <label className="form-label">На казахском</label>
                <input
                  className="text-input"
                  value={newKeyword.kz}
                  onChange={(e) => setNewKeyword((prev) => ({ ...prev, kz: e.target.value }))}
                  placeholder="Аналитика деректері"
                />
              </div>
              <div className="form-field">
                <label className="form-label">На английском</label>
                <input
                  className="text-input"
                  value={newKeyword.en}
                  onChange={(e) => setNewKeyword((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="Artificial Intelligence"
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setModalOpen(false)}>
                Отмена
              </button>
              <button className="button button--primary" type="button" onClick={handleSaveKeyword} disabled={!newKeyword.ru.trim()}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authorModalOpen ? (
        <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Добавить автора</h3>
              <button className="modal__close" onClick={() => setAuthorModalOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="modal__body author-grid">
              <div className="form-field">
                <label className="form-label">Email *</label>
                <input
                  className="text-input"
                  value={authorForm.email}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Префикс</label>
                <input
                  className="text-input"
                  value={authorForm.prefix}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, prefix: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Имя *</label>
                <input
                  className="text-input"
                  value={authorForm.firstName}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Отчество</label>
                <input
                  className="text-input"
                  value={authorForm.middleName}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, middleName: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Фамилия *</label>
                <input
                  className="text-input"
                  value={authorForm.lastName}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Телефон</label>
                <input
                  className="text-input"
                  value={authorForm.phone}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="form-field form-field--span-2">
                <label className="form-label">Адрес</label>
                <input
                  className="text-input"
                  value={authorForm.address}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Страна *</label>
                <input
                  className="text-input"
                  value={authorForm.country}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, country: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Аффилиация 1 *</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={authorForm.affiliation1}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation1: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Аффилиация 2</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={authorForm.affiliation2}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation2: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Аффилиация 3</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={authorForm.affiliation3}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation3: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Соответствующий автор</label>
                <div className="pill-list">
                  <button
                    type="button"
                    className={`button button--ghost button--compact ${authorForm.isCorresponding ? 'button--active' : ''}`}
                    onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: true }))}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    className={`button button--ghost button--compact ${!authorForm.isCorresponding ? 'button--active' : ''}`}
                    onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: false }))}
                  >
                    Нет
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">ORCID</label>
                <input
                  className="text-input"
                  value={authorForm.orcid}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, orcid: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Scopus Author ID</label>
                <input
                  className="text-input"
                  value={authorForm.scopusId}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, scopusId: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Researcher ID</label>
                <input
                  className="text-input"
                  value={authorForm.researcherId}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, researcherId: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setAuthorModalOpen(false)}>
                Отмена
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={saveAuthor}
                disabled={!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()}
              >
                Сохранить автора
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmModalOpen && pendingPayload ? (
        <div className="modal-backdrop" onClick={() => setConfirmModalOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Подтверждение создания статьи</h3>
              <button className="modal__close" onClick={() => setConfirmModalOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="modal__body">
              <div className="table">
                <div className="table__head">
                  <span>Поле</span>
                  <span>Значение</span>
                </div>
                <div className="table__body">
                  <div className="table__row"><div className="table__cell">Язык</div><div className="table__cell">
                    <div className="lang-switch">
                      {(['ru','kz','en'] as Lang[]).map(code => (
                        <button
                          key={code}
                          type="button"
                          className={`lang-chip ${confirmLang === code ? 'lang-chip--active' : ''}`}
                          onClick={() => setConfirmLang(code)}
                        >{langLabels[code]}</button>
                      ))}
                    </div>
                  </div></div>
                  <div className="table__row"><div className="table__cell">Заголовок</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.title_ru) || (confirmLang === 'kz' && pendingPayload.title_kz) || (confirmLang === 'en' && pendingPayload.title_en) || '—'}</div></div>
                  <div className="table__row"><div className="table__cell">Аннотация</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.abstract_ru) || (confirmLang === 'kz' && pendingPayload.abstract_kz) || (confirmLang === 'en' && pendingPayload.abstract_en) || '—'}</div></div>
                  <div className="table__row"><div className="table__cell">Тип статьи</div><div className="table__cell">{articleType || '—'}</div></div>
                  <div className="table__row"><div className="table__cell">Ключевые слова</div><div className="table__cell">
                    {selectedKeywords.length
                      ? selectedKeywords
                          .map(kw =>
                            confirmLang === 'ru' ? kw.ru : confirmLang === 'kz' ? kw.kz : kw.en,
                          )
                          .filter(Boolean)
                          .join(', ')
                      : '—'}
                  </div></div>
                  <div className="table__row"><div className="table__cell">Ответственный автор</div><div className="table__cell">
                    {(() => {
                      const responsible = authorList.find(a => a.id === pendingPayload.responsible_user_id)
                      if (!responsible) return pendingPayload.responsible_user_id ?? '—'
                      const name = [responsible.prefix, responsible.firstName, responsible.middleName, responsible.lastName].filter(Boolean).join(' ')
                      return `${name} (${responsible.email})`
                    })()}
                  </div></div>
                  <div className="table__row"><div className="table__cell">Авторы (список)</div><div className="table__cell">
                    {authorList.length
                      ? authorList.map(a => [a.prefix, a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')).join('; ')
                      : '—'}
                  </div></div>
                  <div className="table__row"><div className="table__cell">Файл рукописи</div><div className="table__cell">{getFileNameFromInputIndex(0) || (pendingPayload.manuscript_file_id ? 'загружен' : '—')}</div></div>
                  <div className="table__row"><div className="table__cell">Антиплагиат</div><div className="table__cell">{getFileNameFromInputIndex(3) || (pendingPayload.antiplagiarism_file_id ? 'загружен' : '—')}</div></div>
                  <div className="table__row"><div className="table__cell">Сведения об авторах</div><div className="table__cell">{getFileNameFromInputIndex(1) || (pendingPayload.author_info_file_id ? 'загружены' : '—')}</div></div>
                  <div className="table__row"><div className="table__cell">Сопроводительное письмо</div><div className="table__cell">{getFileNameFromInputIndex(2) || (pendingPayload.cover_letter_file_id ? 'загружено' : '—')}</div></div>
                  <div className="table__row"><div className="table__cell">Генеративный ИИ</div><div className="table__cell">{pendingPayload.generative_ai_info || '—'}</div></div>
                  <div className="table__row"><div className="table__cell">Подтверждения</div><div className="table__cell">{pendingPayload.confirmations ? ['copyright','originality','consent'].filter((k)=>pendingPayload.confirmations[k]).join(', ') : '—'}</div></div>
                  <div className="table__row"><div className="table__cell">Комментарии</div><div className="table__cell">{pendingPayload.comments || '—'}</div></div>
                </div>
              </div>
              <p className="form-hint" style={{ marginTop: 12 }}>Вы действительно уверены, что хотите создать статью с указанными данными?</p>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setConfirmModalOpen(false)}>Отмена</button>
              <button
                className="button button--primary"
                type="button"
                onClick={async () => {
                  try {
                    await api.post('/articles', pendingPayload)
                    setConfirmModalOpen(false)
                    setPendingPayload(null)
                    navigate('/cabinet/submissions')
                  } catch (error) {
                    console.error('Failed to submit article', error)
                  }
                }}
              >Подтвердить и создать</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
