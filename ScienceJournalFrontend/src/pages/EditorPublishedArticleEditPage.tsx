import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { getArticleLanguageLabel, getArticleLanguageOptions } from '../shared/articleLanguages'
import { getCountryLabel } from '../shared/countries'
import { toApiFilesUrl } from '../shared/url'
import { formatArticleStatus, formatArticleType } from '../shared/labels'
import { useLanguage } from '../shared/LanguageContext'

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
  country: string
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
  include_in_history?: boolean
  status?: string
  created_at?: string
}

const RequiredMark = () => <span className="required-star" aria-hidden="true">{'\u00a0'}*</span>

const normalizeKeywordValue = (value: string) => value.trim()
const articleTypeOptions: ArticleType[] = ['original', 'review']
const articleStatusOptions = ['draft', 'submitted', 'editor_check', 'reviewer_check', 'under_review', 'review_completed', 'sent_for_revision', 'accepted', 'rejected', 'published', 'withdrawn'] as const
const articleLanguageOptions = getArticleLanguageOptions('ru').map((option) => ({
  value: option.code,
  label: option.label,
}))

const updateErrorText = {
  invalidForm: 'Пожалуйста, заполните обязательные поля и повторите сохранение статьи.',
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

const createEmptyAuthorForm = (): AuthorForm => ({
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

const mapApiAuthorToForm = (author: ApiAuthor): AuthorForm => ({
  id: author.id,
  email: author.email,
  prefix: author.prefix ?? '',
  firstName: author.first_name,
  middleName: author.patronymic ?? '',
  lastName: author.last_name,
  phone: author.phone ?? '',
  address: author.address ?? '',
  country: getCountryLabel(author.country),
  affiliation1: author.affiliation1,
  affiliation2: author.affiliation2 ?? '',
  affiliation3: author.affiliation3 ?? '',
  isCorresponding: author.is_corresponding,
  orcid: author.orcid ?? '',
  scopusId: author.scopus_author_id ?? '',
  researcherId: author.researcher_id ?? '',
})

export default function EditorPublishedArticleEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang: interfaceLanguage } = useLanguage()
  const [article, setArticle] = useState<ApiArticle | null>(null)
  // This route is editor-only on the backend; do not hide controls while /auth/me is still loading.
  const canEdit = Boolean(article)
  const [myFiles, setMyFiles] = useState<ApiMyFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [excludeFromHistory, setExcludeFromHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<{ title: string; includedInHistory: boolean } | null>(null)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  // keywords state similar to submission form
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [kwModalOpen, setKwModalOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState<Keyword>({ ru: '', kz: '', en: '' })
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [authorForm, setAuthorForm] = useState<AuthorForm>(createEmptyAuthorForm())
  const [authorList, setAuthorList] = useState<AuthorForm[]>([])
  const [editingAuthorIndex, setEditingAuthorIndex] = useState<number | null>(null)
  const [authorDeleteDialog, setAuthorDeleteDialog] = useState<{ index: number; name: string; status: 'confirm' | 'success' } | null>(null)
  // file replacement state
  const [fileManuscript, setFileManuscript] = useState<File | null>(null)
  const [fileAntiplagiarism, setFileAntiplagiarism] = useState<File | null>(null)
  const [fileAuthorInfo, setFileAuthorInfo] = useState<File | null>(null)
  const [fileCoverLetter, setFileCoverLetter] = useState<File | null>(null)
  const [activeEditSection, setActiveEditSection] = useState<'main' | 'content' | 'keywords' | 'authors' | 'files'>('main')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api
      .getEditorArticleDetail<ApiArticle>(id)
      .then((articleData) => {
        console.log('Детальная статья /articles/my/{id}:', articleData)
        setArticle(articleData)
        setMyFiles([])
        const mappedSelected = (articleData.keywords ?? []).map((k) => ({ id: k.id, ru: k.title_ru, kz: k.title_kz, en: k.title_en }))
        setSelectedKeywords(mappedSelected)
        // initialize authors list for editing
        const initAuthors: AuthorForm[] = (articleData.authors ?? []).map(mapApiAuthorToForm)
        setAuthorList(initAuthors)
      })
      .catch((err: Error) => {
        console.error('Ошибка загрузки статьи', err)
        setError('Не удалось загрузить статью')
      })
      .finally(() => setLoading(false))
  }, [id])

  const openCreateAuthorModal = () => {
    setEditingAuthorIndex(null)
    setAuthorForm(createEmptyAuthorForm())
    setAuthorModalOpen(true)
  }

  const openEditAuthorModal = (index: number) => {
    setEditingAuthorIndex(index)
    setAuthorForm({ ...authorList[index] })
    setAuthorModalOpen(true)
  }

  const closeAuthorModal = () => {
    setAuthorModalOpen(false)
    setEditingAuthorIndex(null)
    setAuthorForm(createEmptyAuthorForm())
  }

  const syncAuthorInCollections = (savedAuthor: ApiAuthor, listIndex: number | null) => {
    const mapped = mapApiAuthorToForm(savedAuthor)
    setAuthorList((prev) => {
      if (listIndex === null) return [...prev, mapped]
      return prev.map((item, index) => (index === listIndex ? mapped : item))
    })

    setArticle((prev) => {
      if (!prev) return prev
      const nextAuthors = [...(prev.authors ?? [])]
      if (listIndex === null) nextAuthors.push(savedAuthor)
      else nextAuthors[listIndex] = savedAuthor
      return { ...prev, authors: nextAuthors }
    })
  }

  const saveAuthor = async () => {
    if (
      !authorForm.email.trim()
      || !authorForm.firstName.trim()
      || !authorForm.lastName.trim()
      || !authorForm.country.trim()
      || !authorForm.affiliation1.trim()
    ) return
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

    try {
      if (editingAuthorIndex !== null && authorForm.id) {
        const updated = await api.updateAuthor<ApiAuthor>(authorForm.id, payload)
        syncAuthorInCollections(updated, editingAuthorIndex)
      } else {
        const created = await api.post<ApiAuthor>('/articles/authors', payload)
        syncAuthorInCollections(created, null)
      }
      closeAuthorModal()
    } catch (err) {
      console.error('Failed to save author', err)
      alert('Не удалось сохранить автора. Попробуйте позже.')
    }
  }

  const removeAuthor = (index: number) => {
    setAuthorList((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
    setArticle((prev) => {
      if (!prev) return prev
      return { ...prev, authors: (prev.authors ?? []).filter((_, itemIndex) => itemIndex !== index) }
    })
    setAuthorDeleteDialog((current) => current ? { ...current, status: 'success' } : null)
  }

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
      const firstError = Object.keys(nextErrors)[0]
      const nextSection = firstError === 'keywords'
        ? 'keywords'
        : firstError === 'authorList'
          ? 'authors'
          : ['manuscript', 'authorInfo'].includes(firstError)
            ? 'files'
            : firstError.startsWith('title_') || firstError.startsWith('abstract_')
              ? 'content'
              : 'main'
      setActiveEditSection(nextSection)
      window.requestAnimationFrame(() => scrollToFirstError(nextErrors))
      return false
    }
    return true
  }

  const handleUpdate = async () => {
    if (!article) return
    if (!validateUpdate()) return
    try {
      setSaving(true)
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
        status: article.status,
        created_at: article.created_at,
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
      const originalKeywordMap = new Map(
        (article.keywords ?? []).map((keyword) => [
          keyword.id,
          {
            ru: normalizeKeywordValue(keyword.title_ru),
            kz: normalizeKeywordValue(keyword.title_kz),
            en: normalizeKeywordValue(keyword.title_en),
          },
        ]),
      )
      const normalizedKeywords = selectedKeywords
        .map((keyword) => ({
          ...keyword,
          ru: normalizeKeywordValue(keyword.ru),
          kz: normalizeKeywordValue(keyword.kz),
          en: normalizeKeywordValue(keyword.en),
        }))
        .filter((keyword) => keyword.ru || keyword.kz || keyword.en)

      const unchangedKeywordIds = normalizedKeywords
        .filter((keyword) => {
          if (typeof keyword.id !== 'number') return false
          const original = originalKeywordMap.get(keyword.id)
          if (!original) return false
          return original.ru === keyword.ru && original.kz === keyword.kz && original.en === keyword.en
        })
        .map((keyword) => keyword.id as number)

      const editedOrNewKeywords = normalizedKeywords
        .filter((keyword) => typeof keyword.id !== 'number' || !unchangedKeywordIds.includes(keyword.id))
        .map((keyword) => ({
          title_ru: keyword.ru,
          title_kz: keyword.kz,
          title_en: keyword.en,
        }))

      const extended: any = {
        ...payload,
        include_in_history: !excludeFromHistory,
        keyword_ids: unchangedKeywordIds,
        keywords: editedOrNewKeywords,
        author_ids: authorList.map((a) => a.id).filter((id): id is number => typeof id === 'number'),
      }
      // Include file field ids only if new files selected
      if (manuscript_file_id !== undefined) extended.manuscript_file_id = manuscript_file_id
      if (author_info_file_id !== undefined) extended.author_info_file_id = author_info_file_id
      if (cover_letter_file_id !== undefined) extended.cover_letter_file_id = cover_letter_file_id
      if (antiplagiarism_file_id !== undefined) extended.antiplagiarism_file_id = antiplagiarism_file_id
      const updated = await api.updateEditorPublishedArticle<ApiArticle>(article.id, extended)
      setArticle(updated)
      setSelectedKeywords((updated.keywords ?? []).map((k) => ({ id: k.id, ru: k.title_ru, kz: k.title_kz, en: k.title_en })))
      setAuthorList((updated.authors ?? []).map(mapApiAuthorToForm))
      const includedInHistory = !excludeFromHistory
      setShowSaveConfirm(false)
      setExcludeFromHistory(false)
      setSaveSuccess({
        title: updated.title_ru || updated.title_en || updated.title_kz || `Статья №${updated.id}`,
        includedInHistory,
      })
    } catch (e) {
      console.error('Ошибка при обновлении статьи', e)
      setSubmitError('Не удалось обновить статью. Исправьте данные или попробуйте позже.')
      alert('Не удалось обновить статью. Попробуйте позже.')
    } finally {
      setSaving(false)
    }
  }

  const addKeyword = (kw: Keyword) => {
    const exists = selectedKeywords.some((s) => (s.id ?? s.ru) === (kw.id ?? kw.ru))
    if (exists) return
    setSelectedKeywords((prev) => [...prev, kw])
  }

  const removeKeyword = (kw: Keyword) => {
    setSelectedKeywords((prev) => prev.filter((s) => (s.id ?? s.ru) !== (kw.id ?? kw.ru)))
  }

  const updateKeywordField = (index: number, field: keyof Omit<Keyword, 'id'>, value: string) => {
    setSelectedKeywords((prev) =>
      prev.map((keyword, keywordIndex) => (keywordIndex === index ? { ...keyword, [field]: value } : keyword)),
    )
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
      addKeyword(mapped)
      setNewKeyword({ ru: '', kz: '', en: '' })
      setKwModalOpen(false)
    } catch (err) {
      console.error('Не удалось создать ключевое слово', err)
    }
  }

  return (
    <div className="app-container app-container--wide manuscript-detail manuscript-edit">
      <section className="manuscript-detail__toolbar">
        <Link className="manuscript-detail__back" to={`/cabinet/editorial2/${article.id}`}>
          <span aria-hidden="true">←</span> Вернуться к просмотру статьи
        </Link>
        <span className="manuscript-edit__mode">Режим редактирования</span>
      </section>

      <section className="section manuscript-detail__sheet">
      <div className="panel manuscript-hero">
        <div className="manuscript-hero__badges">
          <span className="manuscript-hero__number">№ {String(article.id).padStart(6, '0')}</span>
          <span className="manuscript-status">{formatArticleStatus(article.status, interfaceLanguage)}</span>
          <span className="manuscript-type">{formatArticleType(article.article_type, interfaceLanguage)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="manuscript-hero__heading">
            <p className="eyebrow">Редактирование рукописи</p>
            <h1>{article.title_ru || article.title_kz || article.title_en}</h1>
            <p>Измените сведения статьи и сохраните их одной кнопкой внизу страницы.</p>
          </div>
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
        <div className="manuscript-meta">
          <div><span>Язык</span><strong>{article.article_language || 'Не указан'}</strong></div>
          <div><span>Поступила</span><strong>{new Date(article.created_at).toLocaleDateString('ru-RU')}</strong></div>
          <div><span>Обновлена</span><strong>{new Date(article.updated_at || article.created_at).toLocaleDateString('ru-RU')}</strong></div>
          <div><span>DOI</span><strong>{article.doi || 'Не присвоен'}</strong></div>
        </div>
      </div>

      {submitError && canEdit ? (
        <div className="alert error" style={{ marginBottom: '1rem' }}>
          {submitError}
        </div>
      ) : null}

      <nav className="manuscript-tabs manuscript-edit__tabs" aria-label="Разделы редактирования">
        <button className={activeEditSection === 'main' ? 'is-active' : ''} type="button" onClick={() => setActiveEditSection('main')}>Основные данные</button>
        <button className={activeEditSection === 'content' ? 'is-active' : ''} type="button" onClick={() => setActiveEditSection('content')}>Заголовки и аннотации</button>
        <button className={activeEditSection === 'keywords' ? 'is-active' : ''} type="button" onClick={() => setActiveEditSection('keywords')}>Ключевые слова</button>
        <button className={activeEditSection === 'authors' ? 'is-active' : ''} type="button" onClick={() => setActiveEditSection('authors')}>Авторы · {authorList.length}</button>
        <button className={activeEditSection === 'files' ? 'is-active' : ''} type="button" onClick={() => setActiveEditSection('files')}>Файлы</button>
      </nav>

      <div className="panel manuscript-edit__text-panel" id="edit-content" hidden={activeEditSection !== 'content'}>
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
            <div className="form-label">Заголовки</div>
            <div className="form-hint">RU: {article.title_ru}<br />KZ: {article.title_kz}<br />EN: {article.title_en}</div>
          </div>
        )}
      </div>

      <div className="panel" id="edit-main" hidden={activeEditSection !== 'main'}>
        <p className="eyebrow">Основная информация</p>
        <div className="grid grid-2">
          <label className="form-field manuscript-edit__field-card">
            <span className="form-label">Статус статьи</span>
            <select className="text-input" value={article.status} onChange={(e) => setArticle({ ...article, status: e.target.value })}>
              {articleStatusOptions.map((value) => <option value={value} key={value}>{formatArticleStatus(value, interfaceLanguage)}</option>)}
            </select>
            <small>Статус определяет положение статьи в редакционном процессе.</small>
          </label>
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
          <label className="form-field manuscript-edit__field-card">
            <span className="form-label">Дата и время создания</span>
            <input
              className="text-input"
              type="datetime-local"
              value={article.created_at ? article.created_at.slice(0, 16) : ''}
              onChange={(e) => setArticle({ ...article, created_at: e.target.value })}
            />
            <small>Используется как дата первоначального поступления статьи.</small>
          </label>
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

      <div className="panel manuscript-edit__text-panel" hidden={activeEditSection !== 'content'}>
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
              <label className="form-label">Аңдатпа (KZ)<RequiredMark /></label>
              <textarea
                className={`text-input ${fieldErrors.abstract_kz ? 'text-input--error' : ''}`}
                rows={4}
                value={article.abstract_kz}
                onChange={(e) => setArticle({ ...article, abstract_kz: e.target.value })}
                placeholder="Аңдатпа қазақ тілінде"
                data-error-key="abstract_kz"
              />
              {fieldErrors.abstract_kz ? <span className="form-error-text">{fieldErrors.abstract_kz}</span> : null}
            </div>
          </>
        ) : (
          <div className="form-field">
            <div className="form-label">Аннотации</div>
            <p className="article-abstract">RU: {article.abstract_ru || 'Не заполнено'}<br />KZ: {article.abstract_kz || 'Не заполнено'}<br />EN: {article.abstract_en || 'Не заполнено'}</p>
          </div>
        )}
      </div>

      <div className="panel" id="edit-keywords" hidden={activeEditSection !== 'keywords'}>
        <p className="eyebrow" data-error-key="keywords">Ключевые слова{canEdit ? <RequiredMark /> : null}</p>
        {canEdit ? (
          <>
            {selectedKeywords.length > 0 ? (
              <div className="manuscript-keyword-list">
                {selectedKeywords.map((kw, index) => (
                  <div key={`${kw.id ?? 'new'}-${index}`} className="manuscript-keyword-editor">
                    <div className="manuscript-keyword-editor__head">
                      <span>Ключевое слово {index + 1}</span>
                      <button type="button" onClick={() => removeKeyword(kw)} aria-label="Удалить ключевое слово">×</button>
                    </div>
                    <div className="manuscript-keyword-editor__fields">
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">RU<RequiredMark /></label>
                        <input
                          className={`text-input ${fieldErrors.keywords ? 'text-input--error' : ''}`}
                          value={kw.ru}
                          onChange={(e) => updateKeywordField(index, 'ru', e.target.value)}
                          placeholder="Ключевое слово на русском"
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">KZ<RequiredMark /></label>
                        <input
                          className={`text-input ${fieldErrors.keywords ? 'text-input--error' : ''}`}
                          value={kw.kz}
                          onChange={(e) => updateKeywordField(index, 'kz', e.target.value)}
                          placeholder="Қазақ тіліндегі кілт сөз"
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">EN<RequiredMark /></label>
                        <input
                          className={`text-input ${fieldErrors.keywords ? 'text-input--error' : ''}`}
                          value={kw.en}
                          onChange={(e) => updateKeywordField(index, 'en', e.target.value)}
                          placeholder="Keyword in English"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table__empty">Ключевые слова не выбраны.</div>
            )}
            <button type="button" className="button button--ghost button--compact" onClick={() => setKwModalOpen(true)}>
              Добавить ключевое слово
            </button>
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
                    {kw.title_ru} / {kw.title_kz} / {kw.title_en}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel" hidden={activeEditSection !== 'main'}>
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

      <div className="panel" id="edit-authors" hidden={activeEditSection !== 'authors'}>
        <p className="eyebrow" data-error-key="authorList">Авторы{canEdit ? <RequiredMark /> : null}</p>
        {(!canEdit) ? (
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
            {authorList.length === 0 ? (
              <div className="table__empty">Авторы пока не добавлены.</div>
            ) : (
              <div className="author-cards manuscript-edit-author-cards">
                {authorList.map((a, idx) => (
                  <div className="author-card author-card--editable" key={`${a.email}-${idx}`}>
                    <span className="author-card__avatar">{a.firstName.charAt(0)}{a.lastName.charAt(0)}</span>
                    <span className="author-card__content">
                      <strong>{a.lastName} {a.firstName} {a.middleName}</strong>
                      <small>{a.email}</small>
                      <small>{[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join(' · ') || 'Аффилиация не указана'}</small>
                    </span>
                    {a.isCorresponding && <span className="author-card__badge">Ответственный автор</span>}
                    <span className="author-card__actions">
                      <button type="button" onClick={() => openEditAuthorModal(idx)} title="Редактировать автора" aria-label="Редактировать автора">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>
                      </button>
                      <button className="is-danger" type="button" onClick={() => setAuthorDeleteDialog({ index: idx, name: `${a.lastName} ${a.firstName} ${a.middleName}`.trim(), status: 'confirm' })} title="Удалить автора" aria-label="Удалить автора">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button className="manuscript-author-add" type="button" onClick={openCreateAuthorModal}>
              <span aria-hidden="true">+</span>
              <b>Добавить автора</b>
            </button>
            {fieldErrors.authorList ? <span className="form-error-text">{fieldErrors.authorList}</span> : null}
          </>
        )}
      </div>

      <div className="panel" id="edit-files" hidden={activeEditSection !== 'files'}>
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
        <div className="panel manuscript-edit__save">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Действия редактора</p>
              <h3 className="panel-title">Сохранить изменения</h3>
            </div>
          </div>
          <div className="pill-list">
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                if (validateUpdate()) setShowSaveConfirm(true)
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="modal-backdrop" onClick={() => !saving && setShowSaveConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <p className="eyebrow">Сохранение статьи</p>
              <button className="modal__close" disabled={saving} onClick={() => setShowSaveConfirm(false)} aria-label="Закрыть">×</button>
            </div>
            <div className="modal__body">
              <h3 className="panel-title" style={{ marginTop: 0 }}>Сохранить изменения?</h3>
              <p className="subtitle">Обычно при сохранении создаётся новая версия статьи, которую можно посмотреть в истории.</p>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={excludeFromHistory}
                  disabled={saving}
                  onChange={(e) => setExcludeFromHistory(e.target.checked)}
                />
                <span>Не учитывать это изменение в истории статьи</span>
              </label>
            </div>
            <div className="modal__footer">
              <button type="button" className="button button--ghost" disabled={saving} onClick={() => setShowSaveConfirm(false)}>Отмена</button>
              <button type="button" className="button button--primary" disabled={saving} onClick={handleUpdate}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="modal-backdrop manuscript-save-success__backdrop" onClick={() => setSaveSuccess(null)}>
          <div className="modal manuscript-save-success" role="dialog" aria-modal="true" aria-labelledby="save-success-title" onClick={(e) => e.stopPropagation()}>
            <div className="manuscript-save-success__icon" aria-hidden="true">✓</div>
            <div className="modal__body manuscript-save-success__body">
              <p className="eyebrow">Изменения сохранены</p>
              <h3 id="save-success-title">Статья успешно обновлена</h3>
              <p className="manuscript-save-success__title">{saveSuccess.title}</p>
              <div className="manuscript-save-success__note">
                {saveSuccess.includedInHistory
                  ? 'Создана новая версия статьи — изменения доступны во вкладке «Версии».'
                  : 'Изменения применены без создания новой записи в истории статьи.'}
              </div>
            </div>
            <div className="modal__footer manuscript-save-success__actions">
              <button type="button" className="button button--ghost" onClick={() => setSaveSuccess(null)}>Продолжить редактирование</button>
              <button type="button" className="button button--primary" onClick={() => navigate(`/cabinet/editorial2/${article.id}`)}>Вернуться к статье</button>
            </div>
          </div>
        </div>
      )}

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
                Вы уверены, что хотите отозвать эту статью? После отзыва редакция приостановит рассмотрение рукописи.
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

      {authorDeleteDialog && (
        <div className="modal-backdrop" onClick={() => setAuthorDeleteDialog(null)}>
          <div className="modal manuscript-author-delete" role="dialog" aria-modal="true" aria-labelledby="author-delete-title" onClick={(e) => e.stopPropagation()}>
            {authorDeleteDialog.status === 'confirm' ? (
              <>
                <div className="modal__header">
                  <p className="eyebrow">Удаление автора</p>
                  <button className="modal__close" type="button" onClick={() => setAuthorDeleteDialog(null)} aria-label="Закрыть">×</button>
                </div>
                <div className="modal__body">
                  <div className="manuscript-author-delete__icon" aria-hidden="true">!</div>
                  <h3 id="author-delete-title">Удалить автора из статьи?</h3>
                  <p>Вы действительно хотите удалить <strong>{authorDeleteDialog.name}</strong> из списка авторов?</p>
                  <div className="manuscript-author-delete__warning">Автор будет убран из формы. Чтобы применить изменение к статье, после этого нажмите «Сохранить изменения».</div>
                </div>
                <div className="modal__footer">
                  <button type="button" className="button button--ghost" onClick={() => setAuthorDeleteDialog(null)}>Отмена</button>
                  <button type="button" className="button button--danger" onClick={() => removeAuthor(authorDeleteDialog.index)}>Удалить автора</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal__body manuscript-author-delete__result">
                  <div className="manuscript-author-delete__icon manuscript-author-delete__icon--success" aria-hidden="true">✓</div>
                  <p className="eyebrow">Готово</p>
                  <h3 id="author-delete-title">Автор удалён из формы</h3>
                  <p><strong>{authorDeleteDialog.name}</strong> больше не указан в составе авторов.</p>
                  <div className="manuscript-author-delete__success">Не забудьте сохранить статью, чтобы изменение применилось.</div>
                </div>
                <div className="modal__footer">
                  <button type="button" className="button button--primary" onClick={() => setAuthorDeleteDialog(null)}>Понятно</button>
                </div>
              </>
            )}
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
        <div className="modal-backdrop" onClick={closeAuthorModal}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editingAuthorIndex !== null ? 'Редактировать автора' : 'Добавить автора'}</h3>
              <button className="modal__close" onClick={closeAuthorModal} aria-label="Закрыть">
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
              <button className="button button--ghost" type="button" onClick={closeAuthorModal}>
                Отмена
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={saveAuthor}
                disabled={
                  !authorForm.email.trim()
                  || !authorForm.firstName.trim()
                  || !authorForm.lastName.trim()
                  || !authorForm.country.trim()
                  || !authorForm.affiliation1.trim()
                }
              >
                {editingAuthorIndex !== null ? 'Сохранить изменения' : 'Сохранить автора'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </section>
    </div>
  )
}


