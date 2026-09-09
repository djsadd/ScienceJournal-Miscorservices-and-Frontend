import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { getArticleLanguageLabel, getArticleLanguageOptions } from '../shared/articleLanguages'
import { getCountryLabel, type CountryValue } from '../shared/countries'
import { toApiFilesUrl } from '../shared/url'

interface ApiKeyword {
  id: number
  title_kz: string
  title_en: string
  title_ru: string
}
type Keyword = { id?: number; ru: string; kz: string; en: string }
type ArticleType = 'original' | 'review'

interface ApiAuthor {
  id: number
  email: string
  prefix: string
  first_name: string
  patronymic: string | null
  last_name: string
  phone: string
  address: string
  country: CountryValue
  affiliation1: string
  affiliation2: string
  affiliation3: string
  is_corresponding: boolean
  orcid: string
  scopus_author_id: string
  researcher_id: string
}

interface ApiArticle {
  id: number
  title_kz: string
  title_en: string
  title_ru: string
  abstract_kz: string
  abstract_en: string
  abstract_ru: string
  article_language: string | null
  doi: string | null
  status: string
  article_type: string
  responsible_user_id: number
  antiplagiarism_file_url: string | null
  not_published_elsewhere: boolean
  plagiarism_free: boolean
  authors_agree: boolean
  generative_ai_info: string | null
  manuscript_file_url: string | null
  author_info_file_url: string | null
  cover_letter_file_url: string | null
  created_at: string
  updated_at: string | null
  versions: unknown[]
  keywords: ApiKeyword[]
  authors: ApiAuthor[]
}

interface ApiMyFile {
  article_id: number
  file_id: string
  download_url: string
  filename: string
  file_size: number
  content_type: string
  uploaded_at: string
  kind: 'manuscript' | 'antiplagiarism' | 'author_info' | 'cover_letter' | string
}

interface WithdrawResponse {
  id: number
  status: string
  message: string
}

interface ArticleUpdatePayload {
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  abstract_kz?: string | null
  abstract_en?: string | null
  abstract_ru?: string | null
  article_language?: string | null
  article_type?: ArticleType | null
  doi?: string | null
  not_published_elsewhere?: boolean | null
  plagiarism_free?: boolean | null
  authors_agree?: boolean | null
  generative_ai_info?: string | null
}

const RequiredMark = () => <span className="required-star" aria-hidden="true">{'\u00a0'}*</span>
const editableArticleStatuses = ['withdrawn', 'revisions', 'send_for_revision', 'sent_for_revision', 'draft']
const articleTypeOptions: ArticleType[] = ['original', 'review']
const articleLanguageOptions = getArticleLanguageOptions('ru').map((option) => ({
  value: option.code,
  label: option.label,
}))

const updateErrorText = {
  invalidForm: 'Пожалуйста, заполните обязательные поля и повторите отправку статьи.',
  articleType: 'Выберите тип статьи',
  articleLanguage: 'Выберите язык статьи',
  title: 'Заполните название статьи',
  abstract: 'Заполните аннотацию',
  keywords: 'Добавьте минимум 5 ключевых слов и заполните каждое слово на трех языках',
  authors: 'Добавьте сведения об авторах',
  manuscript: 'Загрузите рукопись',
  authorInfo: 'Загрузите файл со сведениями об авторах',
  copyright: 'Подтвердите, что статья ранее не публиковалась и не рассматривается другим журналом',
  originality: 'Подтвердите отсутствие плагиата',
  consent: 'Подтвердите согласие всех авторов',
}

export function MyArticleDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<ApiArticle | null>(null)
  const [myFiles, setMyFiles] = useState<ApiMyFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  // keywords state similar to submission form
  const [allKeywords, setAllKeywords] = useState<Keyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [kwModalOpen, setKwModalOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState<Keyword>({ ru: '', kz: '', en: '' })
  // authors edit state (reused from submission page)
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
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [allAuthors, setAllAuthors] = useState<ApiAuthor[]>([])
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
  // file replacement state
  const [fileManuscript, setFileManuscript] = useState<File | null>(null)
  const [fileAntiplagiarism, setFileAntiplagiarism] = useState<File | null>(null)
  const [fileAuthorInfo, setFileAuthorInfo] = useState<File | null>(null)
  const [fileCoverLetter, setFileCoverLetter] = useState<File | null>(null)
  const [lang, setLang] = useState<'ru' | 'en' | 'kz'>(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('lang') as 'ru' | 'en' | 'kz' | null
    return fromQuery && ['ru', 'en', 'kz'].includes(fromQuery) ? fromQuery : 'ru'
  })
  const canEdit = Boolean(article && editableArticleStatuses.includes(article.status))

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      api.get<ApiArticle>(`/articles/my/${id}`),
      api.get<unknown>(`/articles/my/${id}/file`).catch((err: Error) => {
        console.warn('Не удалось загрузить файлы автора', err)
        return null as unknown
      }),
      api.get<ApiKeyword[]>(`/articles/keywords`).catch(() => []),
    ])
      .then(([articleData, filesData, keywordsData]) => {
        console.log('Детальная статья /articles/my/{id}:', articleData)
        console.log('Файлы автора /articles/my/{id}/file:', filesData)
        setArticle(articleData)
        const safeFiles = Array.isArray(filesData) ? (filesData as ApiMyFile[]) : []
        setMyFiles(safeFiles)
        const mappedAll = Array.isArray(keywordsData)
          ? (keywordsData as ApiKeyword[]).map((k) => ({ id: k.id, ru: k.title_ru, kz: k.title_kz, en: k.title_en }))
          : []
        setAllKeywords(mappedAll)
        const mappedSelected = (articleData.keywords ?? []).map((k) => ({ id: k.id, ru: k.title_ru, kz: k.title_kz, en: k.title_en }))
        setSelectedKeywords(mappedSelected)
        // initialize authors list for editing
        const initAuthors: AuthorForm[] = (articleData.authors ?? []).map((a) => ({
          id: a.id,
          email: a.email,
          prefix: a.prefix ?? '',
          firstName: a.first_name,
          middleName: a.patronymic ?? '',
          lastName: a.last_name,
          phone: a.phone ?? '',
          address: a.address ?? '',
          country: getCountryLabel(a.country),
          affiliation1: a.affiliation1,
          affiliation2: a.affiliation2 ?? '',
          affiliation3: a.affiliation3 ?? '',
          isCorresponding: a.is_corresponding,
          orcid: a.orcid ?? '',
          scopusId: a.scopus_author_id ?? '',
          researcherId: a.researcher_id ?? '',
        }))
        setAuthorList(initAuthors)
      })
      .catch((err: Error) => {
        console.error('Ошибка загрузки статьи', err)
        setError('Не удалось загрузить статью')
      })
      .finally(() => setLoading(false))
  }, [id])

  // load all authors for search
  useEffect(() => {
    let mounted = true
    api
      .get<ApiAuthor[]>('/articles/authors')
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return
        setAllAuthors(data)
      })
      .catch((e) => console.error('Не удалось загрузить авторов', e))
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="app-container">
        <div className="panel">
          <p className="panel-title">Загрузка статьи...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="app-container">
        <div className="panel">
          <p className="panel-title">{error ?? 'Статья не найдена'}</p>
          <button className="button button--ghost" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    )
  }

  const handleWithdraw = async () => {
    if (!article) return
    try {
      setRevokeLoading(true)
      setRevokeMessage(null)
      const res = await api.post<WithdrawResponse>(`/articles/${article.id}/withdrawn`)
      setArticle({ ...article, status: res.status })
      setRevokeMessage(res.message || 'Статья была успешно отозвана.')
      setTimeout(() => {
        setShowRevokeConfirm(false)
      }, 1500)
    } catch (e) {
      console.error('Ошибка при отзыве статьи', e)
      setRevokeMessage('Не удалось отозвать статью. Попробуйте позже.')
    } finally {
      setRevokeLoading(false)
    }
  }

  const hasStoredFile = (kind: ApiMyFile['kind'], fileUrl: string | null) =>
    Boolean(fileUrl || myFiles.some((file) => file.kind === kind))

  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstErrorKey = Object.keys(errors)[0]
    const el = document.querySelector<HTMLElement>(`[data-error-key="${firstErrorKey}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const validateUpdate = () => {
    if (!article) return false
    const nextErrors: Record<string, string> = {}

    if (!article.article_type) nextErrors.articleType = updateErrorText.articleType
    if (!article.article_language) nextErrors.articleLanguage = updateErrorText.articleLanguage
    ;(['ru', 'kz', 'en'] as const).forEach((contentLang) => {
      const title = article[`title_${contentLang}` as keyof Pick<ApiArticle, 'title_ru' | 'title_kz' | 'title_en'>]
      const abstract = article[`abstract_${contentLang}` as keyof Pick<ApiArticle, 'abstract_ru' | 'abstract_kz' | 'abstract_en'>]
      if (!String(title ?? '').trim()) nextErrors[`title_${contentLang}`] = updateErrorText.title
      if (!String(abstract ?? '').trim()) nextErrors[`abstract_${contentLang}`] = updateErrorText.abstract
    })
    if (
      selectedKeywords.length < 5
      || selectedKeywords.some((keyword) => !keyword.ru.trim() || !keyword.kz.trim() || !keyword.en.trim())
    ) nextErrors.keywords = updateErrorText.keywords
    if (authorList.length === 0) nextErrors.authorList = updateErrorText.authors
    if (!fileManuscript && !hasStoredFile('manuscript', article.manuscript_file_url)) nextErrors.manuscript = updateErrorText.manuscript
    if (!fileAuthorInfo && !hasStoredFile('author_info', article.author_info_file_url)) nextErrors.authorInfo = updateErrorText.authorInfo
    if (!article.not_published_elsewhere) nextErrors.confirmCopyright = updateErrorText.copyright
    if (!article.plagiarism_free) nextErrors.confirmOriginality = updateErrorText.originality
    if (!article.authors_agree) nextErrors.confirmConsent = updateErrorText.consent

    setFieldErrors(nextErrors)
    setSubmitError(Object.keys(nextErrors).length ? updateErrorText.invalidForm : null)
    if (Object.keys(nextErrors).length) {
      scrollToFirstError(nextErrors)
      return false
    }
    return true
  }

  const handleUpdate = async () => {
    if (!article) return
    if (!validateUpdate()) return
    try {
      setSubmitError(null)
      // optionally upload newly selected files
      const uploadFile = async (file: File) => {
        const formData = new FormData()
        formData.append('upload', file)
        return api.request<{ id: string }>('/files', 'POST', { body: formData })
      }

      let manuscript_file_id: string | null | undefined
      let author_info_file_id: string | null | undefined
      let cover_letter_file_id: string | null | undefined
      let antiplagiarism_file_id: string | null | undefined

      if (fileManuscript) manuscript_file_id = (await uploadFile(fileManuscript)).id
      if (fileAuthorInfo) author_info_file_id = (await uploadFile(fileAuthorInfo)).id
      if (fileCoverLetter) cover_letter_file_id = (await uploadFile(fileCoverLetter)).id
      if (fileAntiplagiarism) antiplagiarism_file_id = (await uploadFile(fileAntiplagiarism)).id

      const payload: ArticleUpdatePayload = {
        title_kz: article.title_kz || null,
        title_en: article.title_en || null,
        title_ru: article.title_ru || null,
        abstract_kz: article.abstract_kz || null,
        abstract_en: article.abstract_en || null,
        abstract_ru: article.abstract_ru || null,
        article_language: article.article_language || null,
        article_type: (article.article_type || null) as ArticleType | null,
        doi: article.doi || null,
        not_published_elsewhere: article.not_published_elsewhere,
        plagiarism_free: article.plagiarism_free,
        authors_agree: article.authors_agree,
        generative_ai_info: article.generative_ai_info || null,
      }
      const extended: any = {
        ...payload,
        keyword_ids: selectedKeywords.map((k) => k.id).filter((id): id is number => typeof id === 'number'),
        author_ids: authorList.map((a) => a.id).filter((id): id is number => typeof id === 'number'),
      }
      // Include file field ids only if new files selected
      if (manuscript_file_id !== undefined) extended.manuscript_file_id = manuscript_file_id
      if (author_info_file_id !== undefined) extended.author_info_file_id = author_info_file_id
      if (cover_letter_file_id !== undefined) extended.cover_letter_file_id = cover_letter_file_id
      if (antiplagiarism_file_id !== undefined) extended.antiplagiarism_file_id = antiplagiarism_file_id
      const updated = await api.put<ApiArticle>(`/articles/${article.id}`, extended)
      setArticle(updated)
      alert(`Статья "${updated.title_ru || updated.title_en || updated.title_kz}" успешно обновлена.`)
    } catch (e) {
      console.error('Ошибка при обновлении статьи', e)
      alert('Не удалось обновить статью. Попробуйте позже.')
    }
  }

  const computeKeywordMatches = (): Keyword[] => {
    const q = keywordInput.trim().toLowerCase()
    if (!q) return []
    return allKeywords.filter((kw) => {
      const title = kw.ru.toLowerCase()
      const exists = selectedKeywords.some((s) => (s.id ?? s.ru) === (kw.id ?? kw.ru))
      return !exists && title.includes(q)
    })
  }

  const addKeyword = (kw: Keyword) => {
    const exists = selectedKeywords.some((s) => (s.id ?? s.ru) === (kw.id ?? kw.ru))
    if (exists) return
    setSelectedKeywords((prev) => [...prev, kw])
    setKeywordInput('')
  }

  const removeKeyword = (kw: Keyword) => {
    setSelectedKeywords((prev) => prev.filter((s) => (s.id ?? s.ru) !== (kw.id ?? kw.ru)))
  }

  const saveNewKeyword = async () => {
    if (!newKeyword.ru.trim() || !newKeyword.kz.trim() || !newKeyword.en.trim()) return
    try {
      const created = await api.post<ApiKeyword>('/articles/keywords', {
        title_ru: newKeyword.ru.trim(),
        title_kz: newKeyword.kz.trim(),
        title_en: newKeyword.en.trim(),
      })
      const mapped: Keyword = { id: created.id, ru: created.title_ru, kz: created.title_kz, en: created.title_en }
      setAllKeywords((prev) => [...prev, mapped])
      setSelectedKeywords((prev) => [...prev, mapped])
      setNewKeyword({ ru: '', kz: '', en: '' })
      setKwModalOpen(false)
      setKeywordInput('')
    } catch (err) {
      console.error('Не удалось создать ключевое слово', err)
    }
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Моя статья</p>
          <h1 className="page-title">
            {lang === 'ru' ? article.title_ru : lang === 'en' ? article.title_en : article.title_kz}
          </h1>
          <p className="subtitle">Детальная страница рукописи. Отображается только выбранный язык.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="pill">#{article.id}</div>
          {article.status === 'submitted' && (
            <button
              type="button"
              className="button button--danger"
              style={{ fontWeight: 600 }}
              onClick={() => setShowRevokeConfirm(true)}
            >
              Отозвать статью
            </button>
          )}
        </div>
      </section>

      {submitError && canEdit ? (
        <div className="alert error" style={{ marginBottom: '1rem' }}>
          {submitError}
        </div>
      ) : null}

      <div className="panel panel--compact">
        <div className="lang-toggle-row">
          <span className="lang-toggle-row__label">Язык рукописи</span>
          <div className="lang-toggle">
            <button
              type="button"
              className={`lang-toggle__item ${lang === 'ru' ? 'lang-toggle__item--active' : ''}`}
              onClick={() => setLang('ru')}
            >
              Русский
            </button>
            <button
              type="button"
              className={`lang-toggle__item ${lang === 'kz' ? 'lang-toggle__item--active' : ''}`}
              onClick={() => setLang('kz')}
            >
              Казахский
            </button>
            <button
              type="button"
              className={`lang-toggle__item ${lang === 'en' ? 'lang-toggle__item--active' : ''}`}
              onClick={() => setLang('en')}
            >
              Английский
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Заголовок</p>
        {canEdit ? (
          <>
            <div className="form-field">
              <label className="form-label">Заголовок (RU)<RequiredMark /></label>
              <input
                className={`text-input ${fieldErrors.title_ru ? 'text-input--error' : ''}`}
                value={article.title_ru}
                onChange={(e) => setArticle({ ...article, title_ru: e.target.value })}
                placeholder="Заголовок на русском"
                data-error-key="title_ru"
              />
              {fieldErrors.title_ru ? <span className="form-error-text">{fieldErrors.title_ru}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label">Title (EN)<RequiredMark /></label>
              <input
                className={`text-input ${fieldErrors.title_en ? 'text-input--error' : ''}`}
                value={article.title_en}
                onChange={(e) => setArticle({ ...article, title_en: e.target.value })}
                placeholder="Title in English"
                data-error-key="title_en"
              />
              {fieldErrors.title_en ? <span className="form-error-text">{fieldErrors.title_en}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label">Тақырып (KZ)<RequiredMark /></label>
              <input
                className={`text-input ${fieldErrors.title_kz ? 'text-input--error' : ''}`}
                value={article.title_kz}
                onChange={(e) => setArticle({ ...article, title_kz: e.target.value })}
                placeholder="Тақырып қазақ тілінде"
                data-error-key="title_kz"
              />
              {fieldErrors.title_kz ? <span className="form-error-text">{fieldErrors.title_kz}</span> : null}
            </div>
          </>
        ) : (
          <div className="form-field">
            <div className="form-label">{lang === 'ru' ? 'Заголовок (RU)' : lang === 'en' ? 'Title (EN)' : 'Тақырып (KZ)'}</div>
            <div className="form-hint">
              {lang === 'ru' && article.title_ru}
              {lang === 'en' && article.title_en}
              {lang === 'kz' && article.title_kz}
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">Основная информация</p>
        <div className="grid grid-2">
          <div className="form-field">
            <div className="form-label">Статус</div>
            <div
              className={
                ['withdrawn', 'revisions', 'send_for_revision', 'sent_for_revision'].includes(article.status)
                  ? 'status-badge status-badge--withdrawn'
                  : 'form-hint'
              }
            >
              {article.status === 'withdrawn' ? 'Отозвано' :
               article.status === 'revisions' ? 'Правки' :
               (article.status === 'send_for_revision' || article.status === 'sent_for_revision') ? 'Отправлено на доработку' : article.status}
            </div>
          </div>
          <div className="form-field">
            <div className="form-label">Тип статьи{canEdit ? <RequiredMark /> : null}</div>
            {canEdit ? (
              <>
                <select
                  className={`text-input ${fieldErrors.articleType ? 'text-input--error' : ''}`}
                  value={article.article_type ?? ''}
                  onChange={(e) => setArticle({ ...article, article_type: e.target.value })}
                  data-error-key="articleType"
                >
                  <option value="">---------</option>
                  {articleTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === 'original' ? 'Оригинальная статья' : 'Обзорная статья'}
                    </option>
                  ))}
                </select>
                {fieldErrors.articleType ? <span className="form-error-text">{fieldErrors.articleType}</span> : null}
              </>
            ) : (
              <div className="form-hint">
                {article.article_type === 'original' ? 'Оригинальная статья' : article.article_type}
              </div>
            )}
          </div>
          <div className="form-field">
            <div className="form-label">Дата создания</div>
            <div className="form-hint">{new Date(article.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Язык статьи{canEdit ? <RequiredMark /> : null}</div>
            {canEdit ? (
              <>
                <select
                  className={`text-input ${fieldErrors.articleLanguage ? 'text-input--error' : ''}`}
                  value={article.article_language ?? ''}
                  onChange={(e) => setArticle({ ...article, article_language: e.target.value || null })}
                  data-error-key="articleLanguage"
                >
                  <option value="">Не указан</option>
                  {articleLanguageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.articleLanguage ? <span className="form-error-text">{fieldErrors.articleLanguage}</span> : null}
              </>
            ) : (
              <div className="form-hint">
                {getArticleLanguageLabel(article.article_language, 'ru') || 'Не указан'}
              </div>
            )}
          </div>
          <div className="form-field">
            <div className="form-label">DOI</div>
            {canEdit ? (
              <input
                className="text-input"
                value={article.doi ?? ''}
                onChange={(e) => setArticle({ ...article, doi: e.target.value || null })}
                placeholder="Например: 10.1234/abcd.2025.01"
              />
            ) : (
              <div className="form-hint">{article.doi ?? 'Не присвоен'}</div>
            )}
          </div>
        </div>
        {/* Кнопку отзыва перенесли в верхний заголовок для лучшей видимости */}
      </div>

      <div className="panel">
        <p className="eyebrow">Аннотация</p>
        {canEdit ? (
          <>
            <div className="form-field">
              <label className="form-label">Аннотация (RU)<RequiredMark /></label>
              <textarea
                className={`text-input ${fieldErrors.abstract_ru ? 'text-input--error' : ''}`}
                rows={4}
                value={article.abstract_ru}
                onChange={(e) => setArticle({ ...article, abstract_ru: e.target.value })}
                placeholder="Аннотация на русском"
                data-error-key="abstract_ru"
              />
              {fieldErrors.abstract_ru ? <span className="form-error-text">{fieldErrors.abstract_ru}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label">Abstract (EN)<RequiredMark /></label>
              <textarea
                className={`text-input ${fieldErrors.abstract_en ? 'text-input--error' : ''}`}
                rows={4}
                value={article.abstract_en}
                onChange={(e) => setArticle({ ...article, abstract_en: e.target.value })}
                placeholder="Abstract in English"
                data-error-key="abstract_en"
              />
              {fieldErrors.abstract_en ? <span className="form-error-text">{fieldErrors.abstract_en}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label">Аннотация (KZ)<RequiredMark /></label>
              <textarea
                className={`text-input ${fieldErrors.abstract_kz ? 'text-input--error' : ''}`}
                rows={4}
                value={article.abstract_kz}
                onChange={(e) => setArticle({ ...article, abstract_kz: e.target.value })}
                placeholder="Аннотация на казахском"
                data-error-key="abstract_kz"
              />
              {fieldErrors.abstract_kz ? <span className="form-error-text">{fieldErrors.abstract_kz}</span> : null}
            </div>
          </>
        ) : (
          <div className="form-field">
            <div className="form-label">
              {lang === 'ru' ? 'Аннотация (RU)' : lang === 'en' ? 'Abstract (EN)' : 'Аннотация (KZ)'}
            </div>
            <p className="article-abstract">
              {lang === 'ru' && (article.abstract_ru || 'Аннотация не заполнена.')}
              {lang === 'en' && (article.abstract_en || 'Аннотация не заполнена.')}
              {lang === 'kz' && (article.abstract_kz || 'Аннотация не заполнена.')}
            </p>
          </div>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow" data-error-key="keywords">Ключевые слова{canEdit ? <RequiredMark /> : null}</p>
        {canEdit ? (
          <>
            {selectedKeywords.length > 0 ? (
              <div className="pill-list" style={{ marginBottom: '0.5rem' }}>
                {selectedKeywords.map((kw) => (
                  <span key={kw.id ?? kw.ru} className="pill pill--ghost">
                    {lang === 'ru' ? kw.ru : lang === 'en' ? kw.en : kw.kz}
                    <button
                      type="button"
                      aria-label="Удалить"
                      className="pill__close"
                      onClick={() => removeKeyword(kw)}
                      style={{ marginLeft: 8 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="table__empty">Ключевые слова не выбраны.</div>
            )}
            <div className="form-field">
              <input
                className="text-input"
                placeholder="Введите ключевое слово"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
            </div>
            {keywordInput.trim() ? (
              <div className="pill-list">
                {computeKeywordMatches().length > 0 ? (
                  computeKeywordMatches().map((kw) => (
                    <button
                      key={kw.id ?? kw.ru}
                      type="button"
                      className="status-chip status-chip--submitted"
                      onClick={() => addKeyword(kw)}
                    >
                      {kw.ru}
                    </button>
                  ))
                ) : (
                  <span className="table__empty">Совпадений не найдено.</span>
                )}
              </div>
            ) : null}
            {keywordInput.trim() && computeKeywordMatches().length === 0 ? (
              <button type="button" className="button button--ghost" onClick={() => setKwModalOpen(true)}>
                Добавить новое ключевое слово
              </button>
            ) : null}
            {fieldErrors.keywords ? <span className="form-error-text">{fieldErrors.keywords}</span> : null}
          </>
        ) : (
          <>
            {article.keywords.length === 0 ? (
              <div className="table__empty">Ключевые слова не указаны.</div>
            ) : (
              <div className="pill-list">
                {article.keywords.map((kw) => (
                  <span key={kw.id} className="pill pill--ghost">
                    {lang === 'ru' && kw.title_ru}
                    {lang === 'en' && kw.title_en}
                    {lang === 'kz' && kw.title_kz}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">Согласия и проверки</p>
        <div className="grid grid-3">
          <div className="form-field">
            {canEdit ? (
              <>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={article.not_published_elsewhere}
                    onChange={(e) => setArticle({ ...article, not_published_elsewhere: e.target.checked })}
                    data-error-key="confirmCopyright"
                  />{' '}
                  Не публиковалась ранее<RequiredMark />
                </label>
                {fieldErrors.confirmCopyright ? <span className="form-error-text">{fieldErrors.confirmCopyright}</span> : null}
              </>
            ) : (
              <>
                <div className="form-label">Не публиковалась ранее</div>
                <div className="form-hint">{article.not_published_elsewhere ? 'Да' : 'Нет'}</div>
              </>
            )}
          </div>
          <div className="form-field">
            {canEdit ? (
              <>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={article.plagiarism_free}
                    onChange={(e) => setArticle({ ...article, plagiarism_free: e.target.checked })}
                    data-error-key="confirmOriginality"
                  />{' '}
                  Без плагиата<RequiredMark />
                </label>
                {fieldErrors.confirmOriginality ? <span className="form-error-text">{fieldErrors.confirmOriginality}</span> : null}
              </>
            ) : (
              <>
                <div className="form-label">Без плагиата</div>
                <div className="form-hint">{article.plagiarism_free ? 'Да' : 'Нет'}</div>
              </>
            )}
          </div>
          <div className="form-field">
            {canEdit ? (
              <>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={article.authors_agree}
                    onChange={(e) => setArticle({ ...article, authors_agree: e.target.checked })}
                    data-error-key="confirmConsent"
                  />{' '}
                  Все авторы согласны<RequiredMark />
                </label>
                {fieldErrors.confirmConsent ? <span className="form-error-text">{fieldErrors.confirmConsent}</span> : null}
              </>
            ) : (
              <>
                <div className="form-label">Все авторы согласны</div>
                <div className="form-hint">{article.authors_agree ? 'Да' : 'Нет'}</div>
              </>
            )}
          </div>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <div className="form-label">Использование генеративного ИИ</div>
            {canEdit ? (
              <textarea
                className="text-input"
                rows={3}
                value={article.generative_ai_info ?? ''}
                onChange={(e) => setArticle({ ...article, generative_ai_info: e.target.value || null })}
                placeholder="Опишите, где и как использовался генеративный ИИ, если он применялся."
              />
            ) : (
              <div className="form-hint">{article.generative_ai_info || 'Не указано'}</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow" data-error-key="authorList">Авторы{canEdit ? <RequiredMark /> : null}</p>
        {!canEdit ? (
          <>
            {article.authors.length === 0 ? (
              <div className="table__empty">Список авторов не заполнен.</div>
            ) : (
              <div className="assignment-list">
                {article.authors.map((a) => (
                  <div className="assignment-row" key={a.id}>
                    <div>
                      <div className="assignment-title">
                        {a.last_name} {a.first_name} {a.patronymic ?? ''}
                      </div>
                      <div className="article-meta">
                        <span>{a.affiliation1}</span>
                        {a.affiliation2 ? <span className="dot">·</span> : null}
                        {a.affiliation2 ? <span>{a.affiliation2}</span> : null}
                        {getCountryLabel(a.country) ? (
                          <>
                            <span className="dot">·</span>
                            <span>{getCountryLabel(a.country)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {a.is_corresponding ? <span className="pill">Ответственный автор</span> : null}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <h3 className="panel-title">Редактирование состава авторов</h3>
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
                  {allAuthors
                    .filter((a) => {
                      const full = [a.prefix, a.first_name, a.patronymic, a.last_name].filter(Boolean).join(' ').toLowerCase()
                      return full.includes(authorQuery.trim().toLowerCase()) || a.email.toLowerCase().includes(authorQuery.trim().toLowerCase())
                    })
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="status-chip status-chip--submitted"
                        onClick={() => {
                          const exists = authorList.some((x) => x.email === a.email)
                          if (!exists) {
                            setAuthorList((prev) => [
                              ...prev,
                              {
                                id: a.id,
                                email: a.email,
                                prefix: a.prefix ?? '',
                                firstName: a.first_name,
                                middleName: a.patronymic ?? '',
                                lastName: a.last_name,
                                phone: a.phone ?? '',
                                address: a.address ?? '',
                                country: getCountryLabel(a.country),
                                affiliation1: a.affiliation1,
                                affiliation2: a.affiliation2 ?? '',
                                affiliation3: a.affiliation3 ?? '',
                                isCorresponding: a.is_corresponding,
                                orcid: a.orcid ?? '',
                                scopusId: a.scopus_author_id ?? '',
                                researcherId: a.researcher_id ?? '',
                              },
                            ])
                          }
                          setAuthorQuery('')
                        }}
                      >
                        {[a.prefix, a.first_name, a.patronymic, a.last_name].filter(Boolean).join(' ')} ({a.email})
                      </button>
                    ))}
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
                      <div className="table__cell">{[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || '—'}</div>
                      <div className="table__cell">{a.isCorresponding ? 'Да' : 'Нет'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {fieldErrors.authorList ? <span className="form-error-text">{fieldErrors.authorList}</span> : null}
          </>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">Файлы</p>
        <div className="grid grid-3">
          <div className="form-field">
            <div className="form-label" data-error-key="manuscript">Рукопись{canEdit ? <RequiredMark /> : null}</div>
            {myFiles.find((f) => f.kind === 'manuscript') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'manuscript') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'Скачать рукопись'}
                    </a>
                  </div>
                )
              })()
            ) : article.manuscript_file_url ? (
              <a
                className="link"
                href={toApiFilesUrl(article.manuscript_file_url)}
                target="_blank"
                rel="noreferrer"
              >
                Скачать
              </a>
            ) : (
              <div className="form-hint">Не загружено</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="file"
                  className={`file-input ${fieldErrors.manuscript ? 'file-input--error' : ''}`}
                  onChange={(e) => setFileManuscript(e.target.files?.[0] ?? null)}
                />
                {fileManuscript ? <div className="form-hint">Новый файл: {fileManuscript.name}</div> : null}
                {fieldErrors.manuscript ? <span className="form-error-text">{fieldErrors.manuscript}</span> : null}
              </div>
            ) : null}
          </div>
          <div className="form-field">
            <div className="form-label">Антиплагиат</div>
            {myFiles.find((f) => f.kind === 'antiplagiarism') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'antiplagiarism') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'Скачать файл'}
                    </a>
                  </div>
                )
              })()
            ) : article.antiplagiarism_file_url ? (
              <a
                className="link"
                href={toApiFilesUrl(article.antiplagiarism_file_url)}
                target="_blank"
                rel="noreferrer"
              >
                Скачать
              </a>
            ) : (
              <div className="form-hint">Не загружено</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input type="file" className="file-input" onChange={(e) => setFileAntiplagiarism(e.target.files?.[0] ?? null)} />
                {fileAntiplagiarism ? <div className="form-hint">Новый файл: {fileAntiplagiarism.name}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="form-field">
            <div className="form-label" data-error-key="authorInfo">Данные автора{canEdit ? <RequiredMark /> : null}</div>
            {myFiles.find((f) => f.kind === 'author_info') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'author_info') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'Скачать файл'}
                    </a>
                  </div>
                )
              })()
            ) : article.author_info_file_url ? (
              <a
                className="link"
                href={toApiFilesUrl(article.author_info_file_url)}
                target="_blank"
                rel="noreferrer"
              >
                Скачать
              </a>
            ) : (
              <div className="form-hint">Не загружено</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="file"
                  className={`file-input ${fieldErrors.authorInfo ? 'file-input--error' : ''}`}
                  onChange={(e) => setFileAuthorInfo(e.target.files?.[0] ?? null)}
                />
                {fileAuthorInfo ? <div className="form-hint">Новый файл: {fileAuthorInfo.name}</div> : null}
                {fieldErrors.authorInfo ? <span className="form-error-text">{fieldErrors.authorInfo}</span> : null}
              </div>
            ) : null}
          </div>
          <div className="form-field">
            <div className="form-label">Сопроводительное письмо</div>
            {myFiles.find((f) => f.kind === 'cover_letter') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'cover_letter') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'Скачать файл'}
                    </a>
                  </div>
                )
              })()
            ) : article.cover_letter_file_url ? (
              <a
                className="link"
                href={toApiFilesUrl(article.cover_letter_file_url)}
                target="_blank"
                rel="noreferrer"
              >
                Скачать
              </a>
            ) : (
              <div className="form-hint">Не загружено</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input type="file" className="file-input" onChange={(e) => setFileCoverLetter(e.target.files?.[0] ?? null)} />
                {fileCoverLetter ? <div className="form-hint">Новый файл: {fileCoverLetter.name}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Действия автора</p>
              <h3 className="panel-title">Отправить обновлённую рукопись</h3>
            </div>
          </div>
          <div className="pill-list">
            <button
              type="button"
              className="button button--primary"
              onClick={handleUpdate}
            >
              Отправить
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Быстрые действия</p>
            <h3 className="panel-title">Навигация</h3>
          </div>
          <div className="pill pill--ghost">Мои статьи</div>
        </div>
        <div className="pill-list">
          <Link className="button button--ghost button--compact" to="/cabinet/submissions">
            К списку статей
          </Link>
        </div>
      </div>

      {showRevokeConfirm && (
        <div className="modal-backdrop" onClick={() => setShowRevokeConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <p className="eyebrow">Подтверждение действия</p>
              <button className="modal__close" onClick={() => setShowRevokeConfirm(false)} aria-label="Закрыть">×</button>
            </div>
            <div className="modal__body">
              <h3 className="panel-title" style={{ marginTop: 0 }}>Отозвать статью?</h3>
              <p className="subtitle">
                Вы уверены, что хотите отозвать эту статью? После отзыва редакция приостановит рассмотрение
                рукописи.
              </p>
              {revokeMessage && <div className="alert alert--success">{revokeMessage}</div>}
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setShowRevokeConfirm(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="button button--danger"
                disabled={revokeLoading}
                onClick={handleWithdraw}
              >
                {revokeLoading ? 'Отзываем…' : 'Отозвать статью'}
              </button>
            </div>
          </div>
        </div>
      )}

      {kwModalOpen ? (
        <div className="modal-backdrop" onClick={() => setKwModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Новое ключевое слово</h3>
              <button className="modal__close" onClick={() => setKwModalOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-label">На русском<RequiredMark /></label>
                <input
                  className="text-input"
                  value={newKeyword.ru}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, ru: e.target.value }))}
                  placeholder="Например: Искусственный интеллект"
                />
              </div>
              <div className="form-field">
                <label className="form-label">На казахском<RequiredMark /></label>
                <input
                  className="text-input"
                  value={newKeyword.kz}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, kz: e.target.value }))}
                  placeholder="Аналитика деректері"
                />
              </div>
              <div className="form-field">
                <label className="form-label">На английском<RequiredMark /></label>
                <input
                  className="text-input"
                  value={newKeyword.en}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, en: e.target.value }))}
                  placeholder="Artificial Intelligence"
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setKwModalOpen(false)}>
                Отмена
              </button>
              <button className="button button--primary" type="button" onClick={saveNewKeyword} disabled={!newKeyword.ru.trim() || !newKeyword.kz.trim() || !newKeyword.en.trim()}>
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
                <label className="form-label">Email<RequiredMark /></label>
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
                <label className="form-label">Имя<RequiredMark /></label>
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
                <label className="form-label">Фамилия<RequiredMark /></label>
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
                <label className="form-label">Страна<RequiredMark /></label>
                <input
                  className="text-input"
                  value={authorForm.country}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, country: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Аффилиация 1<RequiredMark /></label>
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
                onClick={async () => {
                  if (!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim() || !authorForm.country.trim() || !authorForm.affiliation1.trim()) return
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
                    const created = await api.post<ApiAuthor>('/articles/authors', payload)
                    setAllAuthors((prev) => [...prev, created])
                    setAuthorList((prev) => [
                      ...prev,
                      {
                        id: created.id,
                        email: created.email,
                        prefix: created.prefix ?? '',
                        firstName: created.first_name,
                        middleName: created.patronymic ?? '',
                        lastName: created.last_name,
                        phone: created.phone ?? '',
                        address: created.address ?? '',
                        country: getCountryLabel(created.country),
                        affiliation1: created.affiliation1,
                        affiliation2: created.affiliation2 ?? '',
                        affiliation3: created.affiliation3 ?? '',
                        isCorresponding: created.is_corresponding,
                        orcid: created.orcid ?? '',
                        scopusId: created.scopus_author_id ?? '',
                        researcherId: created.researcher_id ?? '',
                      },
                    ])
                    setAuthorModalOpen(false)
                  } catch (err) {
                    console.error('Failed to create author', err)
                  }
                }}
                disabled={!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim() || !authorForm.country.trim() || !authorForm.affiliation1.trim()}
              >
                Сохранить автора
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
