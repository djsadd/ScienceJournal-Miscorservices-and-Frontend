import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { getArticleLanguageLabel, getArticleLanguageOptions } from '../shared/articleLanguages'
import { getCountryLabel } from '../shared/countries'
import { toApiFilesUrl } from '../shared/url'

interface ApiKeyword {
  id: number
  title_kz: string
  title_en: string
  title_ru: string
}
type Keyword = { id?: number; ru: string; kz: string; en: string }

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
  doi?: string | null
}

const normalizeKeywordValue = (value: string) => value.trim()
const articleLanguageOptions = getArticleLanguageOptions('ru').map((option) => ({
  value: option.code,
  label: option.label,
}))

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
  const [me, setMe] = useState<{ role?: string; roles?: string[] } | null>(null)
  useEffect(() => {
    api.get<{ role?: string; roles?: string[] }>('/auth/me').then(setMe).catch(() => {})
  }, [])
  const isEditor = (me?.role === 'editor') || (me?.roles?.includes('editor'))
  const [article, setArticle] = useState<ApiArticle | null>(null)
  const canEdit = Boolean(isEditor && article?.status === 'published')
  const [myFiles, setMyFiles] = useState<ApiMyFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  // keywords state similar to submission form
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [kwModalOpen, setKwModalOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState<Keyword>({ ru: '', kz: '', en: '' })
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [allAuthors, setAllAuthors] = useState<ApiAuthor[]>([])
  const [authorQuery, setAuthorQuery] = useState('')
  const [authorForm, setAuthorForm] = useState<AuthorForm>(createEmptyAuthorForm())
  const [authorList, setAuthorList] = useState<AuthorForm[]>([])
  const [editingAuthorIndex, setEditingAuthorIndex] = useState<number | null>(null)
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
    setAllAuthors((prev) => {
      const next = [...prev]
      const existingIndex = next.findIndex((item) => item.id === savedAuthor.id)
      if (existingIndex >= 0) next[existingIndex] = savedAuthor
      else next.push(savedAuthor)
      return next
    })

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

  const handleUpdate = async () => {
    if (!article) return
    try {
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
        doi: article.doi || null,
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
      alert(`Статья "${updated.title_ru || updated.title_en || updated.title_kz}" успешно обновлена.`)
    } catch (e) {
      console.error('Ошибка при обновлении статьи', e)
      alert('Не удалось обновить статью. Попробуйте позже.')
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
    if (!newKeyword.ru.trim()) return
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
              <label className="form-label">Заголовок (RU)</label>
              <input
                className="text-input"
                value={article.title_ru}
                onChange={(e) => setArticle({ ...article, title_ru: e.target.value })}
                placeholder="Заголовок на русском"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Title (EN)</label>
              <input
                className="text-input"
                value={article.title_en}
                onChange={(e) => setArticle({ ...article, title_en: e.target.value })}
                placeholder="Title in English"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Тақырып (KZ)</label>
              <input
                className="text-input"
                value={article.title_kz}
                onChange={(e) => setArticle({ ...article, title_kz: e.target.value })}
                placeholder="Тақырып қазақ тілінде"
              />
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
            <div className="form-hint">
              {article.status === 'published'
                ? 'Опубликовано'
                : article.status === 'withdrawn'
                  ? 'Отозвано'
                  : article.status === 'revisions'
                    ? 'Правки'
                    : (article.status === 'send_for_revision' || article.status === 'sent_for_revision')
                      ? 'Отправлено на доработку'
                      : article.status}
            </div>
          </div>
          <div className="form-field">
            <div className="form-label">Тип статьи</div>
            <div className="form-hint">
              {article.article_type === 'original' ? 'Оригинальная статья' : article.article_type}
            </div>
          </div>
          <div className="form-field">
            <div className="form-label">Дата создания</div>
            <div className="form-hint">{new Date(article.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Язык статьи</div>
            {canEdit ? (
              <select
                className="text-input"
                value={article.article_language ?? ''}
                onChange={(e) => setArticle({ ...article, article_language: e.target.value || null })}
              >
                <option value="">Не указан</option>
                {articleLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              <label className="form-label">Аннотация (RU)</label>
              <textarea
                className="text-input"
                rows={4}
                value={article.abstract_ru}
                onChange={(e) => setArticle({ ...article, abstract_ru: e.target.value })}
                placeholder="Аннотация на русском"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Abstract (EN)</label>
              <textarea
                className="text-input"
                rows={4}
                value={article.abstract_en}
                onChange={(e) => setArticle({ ...article, abstract_en: e.target.value })}
                placeholder="Abstract in English"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Аңдатпа (KZ)</label>
              <textarea
                className="text-input"
                rows={4}
                value={article.abstract_kz}
                onChange={(e) => setArticle({ ...article, abstract_kz: e.target.value })}
                placeholder="Аңдатпа қазақ тілінде"
              />
            </div>
          </>
        ) : (
          <div className="form-field">
            <div className="form-label">
              {lang === 'ru' ? 'Аннотация (RU)' : lang === 'en' ? 'Abstract (EN)' : 'Аңдатпа (KZ)'}
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
        <p className="eyebrow">Ключевые слова</p>
        {canEdit ? (
          <>
            {selectedKeywords.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {selectedKeywords.map((kw, index) => (
                  <div key={`${kw.id ?? 'new'}-${index}`} className="panel panel--compact" style={{ margin: 0 }}>
                    <div className="grid grid-3">
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">Русский</label>
                        <input
                          className="text-input"
                          value={kw.ru}
                          onChange={(e) => updateKeywordField(index, 'ru', e.target.value)}
                          placeholder="Ключевое слово на русском"
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">Қазақша</label>
                        <input
                          className="text-input"
                          value={kw.kz}
                          onChange={(e) => updateKeywordField(index, 'kz', e.target.value)}
                          placeholder="Қазақ тіліндегі кілт сөз"
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">English</label>
                        <input
                          className="text-input"
                          value={kw.en}
                          onChange={(e) => updateKeywordField(index, 'en', e.target.value)}
                          placeholder="Keyword in English"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="form-hint">
                        Просмотр: {lang === 'ru' ? kw.ru || 'Не заполнено' : lang === 'en' ? kw.en || 'Не заполнено' : kw.kz || 'Не заполнено'}
                      </div>
                      <button
                        type="button"
                        className="button button--ghost button--compact"
                        onClick={() => removeKeyword(kw)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table__empty">Ключевые слова не выбраны.</div>
            )}
            <button type="button" className="button button--ghost" onClick={() => setKwModalOpen(true)}>
              Добавить ключевое слово
            </button>
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
            <div className="form-label">Не публиковалась ранее</div>
            <div className="form-hint">{article.not_published_elsewhere ? 'Да' : 'Нет'}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Без плагиата</div>
            <div className="form-hint">{article.plagiarism_free ? 'Да' : 'Нет'}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Все авторы согласны</div>
            <div className="form-hint">{article.authors_agree ? 'Да' : 'Нет'}</div>
          </div>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <div className="form-label">Использование генеративного ИИ</div>
            <div className="form-hint">{article.generative_ai_info || 'Не указано'}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Авторы</p>
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
            <div className="section-heading">
              <div>
                <h3 className="panel-title">Редактирование состава авторов</h3>
              </div>
              <button className="button button--primary button--compact" type="button" onClick={openCreateAuthorModal}>
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
                          if (!exists) setAuthorList((prev) => [...prev, mapApiAuthorToForm(a)])
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
                  <span>Действия</span>
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
                      <div className="table__cell">
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button className="button button--ghost button--compact" type="button" onClick={() => openEditAuthorModal(idx)}>
                            Редактировать
                          </button>
                          <button className="button button--ghost button--compact" type="button" onClick={() => removeAuthor(idx)}>
                            Убрать
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">Файлы</p>
        <div className="grid grid-3">
          <div className="form-field">
            <div className="form-label">Рукопись</div>
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
                <input type="file" className="file-input" onChange={(e) => setFileManuscript(e.target.files?.[0] ?? null)} />
                {fileManuscript ? <div className="form-hint">Новый файл: {fileManuscript.name}</div> : null}
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
            <div className="form-label">Данные автора</div>
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
                <input type="file" className="file-input" onChange={(e) => setFileAuthorInfo(e.target.files?.[0] ?? null)} />
                {fileAuthorInfo ? <div className="form-hint">Новый файл: {fileAuthorInfo.name}</div> : null}
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
            {article.status === 'withdrawn' ? (
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
              <p className="eyebrow">Действия редактора</p>
              <h3 className="panel-title">Сохранить изменения</h3>
            </div>
          </div>
          <div className="pill-list">
            <button
              type="button"
              className="button button--primary"
              onClick={handleUpdate}
            >
              Сохранить
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
          <Link className="button button--ghost button--compact" to="/cabinet/editorial2">
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

      {kwModalOpen ? (
        <div className="modal-backdrop" onClick={() => setKwModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Новое ключевое слово</h3>
              <button className="modal__close" onClick={() => setKwModalOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-label">На русском</label>
                <input
                  className="text-input"
                  value={newKeyword.ru}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, ru: e.target.value }))}
                  placeholder="Например: Искусственный интеллект"
                />
              </div>
              <div className="form-field">
                <label className="form-label">На казахском</label>
                <input
                  className="text-input"
                  value={newKeyword.kz}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, kz: e.target.value }))}
                  placeholder="Аналитика деректері"
                />
              </div>
              <div className="form-field">
                <label className="form-label">На английском</label>
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
              <button className="button button--primary" type="button" onClick={saveNewKeyword} disabled={!newKeyword.ru.trim()}>
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
    </div>
  )
}


