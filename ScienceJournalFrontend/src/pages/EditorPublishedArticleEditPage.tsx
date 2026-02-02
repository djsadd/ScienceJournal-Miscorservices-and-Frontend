import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
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
  doi?: string | null
}

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

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      api.getEditorArticleDetail<ApiArticle>(id),
      api.get<ApiKeyword[]>(`/articles/keywords`).catch(() => []),
    ])
      .then(([articleData, keywordsData]) => {
        console.log('Р”РµС‚Р°Р»СЊРЅР°СЏ СЃС‚Р°С‚СЊСЏ /articles/my/{id}:', articleData)
        setArticle(articleData)
        setMyFiles([])
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
          country: a.country,
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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃС‚Р°С‚СЊРё', err)
        setError('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃС‚Р°С‚СЊСЋ')
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
      .catch((e) => console.error('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РІС‚РѕСЂРѕРІ', e))
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="app-container">
        <div className="panel">
          <p className="panel-title">Р—Р°РіСЂСѓР·РєР° СЃС‚Р°С‚СЊРё...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="app-container">
        <div className="panel">
          <p className="panel-title">{error ?? 'РЎС‚Р°С‚СЊСЏ РЅРµ РЅР°Р№РґРµРЅР°'}</p>
          <button className="button button--ghost" onClick={() => navigate(-1)}>
            РќР°Р·Р°Рґ
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
      setRevokeMessage(res.message || 'РЎС‚Р°С‚СЊСЏ Р±С‹Р»Р° СѓСЃРїРµС€РЅРѕ РѕС‚РѕР·РІР°РЅР°.')
      setTimeout(() => {
        setShowRevokeConfirm(false)
      }, 1500)
    } catch (e) {
      console.error('РћС€РёР±РєР° РїСЂРё РѕС‚Р·С‹РІРµ СЃС‚Р°С‚СЊРё', e)
      setRevokeMessage('РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РѕР·РІР°С‚СЊ СЃС‚Р°С‚СЊСЋ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.')
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
        doi: article.doi || null,
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
      const updated = await api.updateEditorPublishedArticle<ApiArticle>(article.id, extended)
      setArticle(updated)
      alert(`РЎС‚Р°С‚СЊСЏ "${updated.title_ru || updated.title_en || updated.title_kz}" СѓСЃРїРµС€РЅРѕ РѕР±РЅРѕРІР»РµРЅР°.`)
    } catch (e) {
      console.error('РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё СЃС‚Р°С‚СЊРё', e)
      alert('РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ СЃС‚Р°С‚СЊСЋ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.')
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
    if (!newKeyword.ru.trim()) return
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
      console.error('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ', err)
    }
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">РњРѕСЏ СЃС‚Р°С‚СЊСЏ</p>
          <h1 className="page-title">
            {lang === 'ru' ? article.title_ru : lang === 'en' ? article.title_en : article.title_kz}
          </h1>
          <p className="subtitle">Р”РµС‚Р°Р»СЊРЅР°СЏ СЃС‚СЂР°РЅРёС†Р° СЂСѓРєРѕРїРёСЃРё. РћС‚РѕР±СЂР°Р¶Р°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РІС‹Р±СЂР°РЅРЅС‹Р№ СЏР·С‹Рє.</p>
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
              РћС‚РѕР·РІР°С‚СЊ СЃС‚Р°С‚СЊСЋ
            </button>
          )}
        </div>
      </section>

      <div className="panel panel--compact">
        <div className="lang-toggle-row">
          <span className="lang-toggle-row__label">РЇР·С‹Рє СЂСѓРєРѕРїРёСЃРё</span>
          <div className="lang-toggle">
            <button
              type="button"
              className={`lang-toggle__item ${lang === 'ru' ? 'lang-toggle__item--active' : ''}`}
              onClick={() => setLang('ru')}
            >
              Р СѓСЃСЃРєРёР№
            </button>
            <button
              type="button"
              className={`lang-toggle__item ${lang === 'kz' ? 'lang-toggle__item--active' : ''}`}
              onClick={() => setLang('kz')}
            >
              РљР°Р·Р°С…СЃРєРёР№
            </button>
            <button
              type="button"
              className={`lang-toggle__item ${lang === 'en' ? 'lang-toggle__item--active' : ''}`}
              onClick={() => setLang('en')}
            >
              РђРЅРіР»РёР№СЃРєРёР№
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Р—Р°РіРѕР»РѕРІРѕРє</p>
        {canEdit ? (
          <>
            <div className="form-field">
              <label className="form-label">Р—Р°РіРѕР»РѕРІРѕРє (RU)</label>
              <input
                className="text-input"
                value={article.title_ru}
                onChange={(e) => setArticle({ ...article, title_ru: e.target.value })}
                placeholder="Р—Р°РіРѕР»РѕРІРѕРє РЅР° СЂСѓСЃСЃРєРѕРј"
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
              <label className="form-label">РўР°Т›С‹СЂС‹Рї (KZ)</label>
              <input
                className="text-input"
                value={article.title_kz}
                onChange={(e) => setArticle({ ...article, title_kz: e.target.value })}
                placeholder="РўР°Т›С‹СЂС‹Рї Т›Р°Р·Р°Т› С‚С–Р»С–РЅРґРµ"
              />
            </div>
          </>
        ) : (
          <div className="form-field">
            <div className="form-label">{lang === 'ru' ? 'Р—Р°РіРѕР»РѕРІРѕРє (RU)' : lang === 'en' ? 'Title (EN)' : 'РўР°Т›С‹СЂС‹Рї (KZ)'}</div>
            <div className="form-hint">
              {lang === 'ru' && article.title_ru}
              {lang === 'en' && article.title_en}
              {lang === 'kz' && article.title_kz}
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">РћСЃРЅРѕРІРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ</p>
        <div className="grid grid-2">
          <div className="form-field">
            <div className="form-label">РЎС‚Р°С‚СѓСЃ</div>
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
            <div className="form-label">РўРёРї СЃС‚Р°С‚СЊРё</div>
            <div className="form-hint">
              {article.article_type === 'original' ? 'РћСЂРёРіРёРЅР°Р»СЊРЅР°СЏ СЃС‚Р°С‚СЊСЏ' : article.article_type}
            </div>
          </div>
          <div className="form-field">
            <div className="form-label">Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ</div>
            <div className="form-hint">{new Date(article.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
          <div className="form-field">
            <div className="form-label">DOI</div>
            {canEdit ? (
              <input
                className="text-input"
                value={article.doi ?? ''}
                onChange={(e) => setArticle({ ...article, doi: e.target.value || null })}
                placeholder="РќР°РїСЂРёРјРµСЂ: 10.1234/abcd.2025.01"
              />
            ) : (
              <div className="form-hint">{article.doi ?? 'РќРµ РїСЂРёСЃРІРѕРµРЅ'}</div>
            )}
          </div>
        </div>
        {/* РљРЅРѕРїРєСѓ РѕС‚Р·С‹РІР° РїРµСЂРµРЅРµСЃР»Рё РІ РІРµСЂС…РЅРёР№ Р·Р°РіРѕР»РѕРІРѕРє РґР»СЏ Р»СѓС‡С€РµР№ РІРёРґРёРјРѕСЃС‚Рё */}
      </div>

      <div className="panel">
        <p className="eyebrow">РђРЅРЅРѕС‚Р°С†РёСЏ</p>
        {canEdit ? (
          <>
            <div className="form-field">
              <label className="form-label">РђРЅРЅРѕС‚Р°С†РёСЏ (RU)</label>
              <textarea
                className="text-input"
                rows={4}
                value={article.abstract_ru}
                onChange={(e) => setArticle({ ...article, abstract_ru: e.target.value })}
                placeholder="РђРЅРЅРѕС‚Р°С†РёСЏ РЅР° СЂСѓСЃСЃРєРѕРј"
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
              <label className="form-label">РђРЅРЅРѕС‚Р°С†РёСЏ (KZ)</label>
              <textarea
                className="text-input"
                rows={4}
                value={article.abstract_kz}
                onChange={(e) => setArticle({ ...article, abstract_kz: e.target.value })}
                placeholder="РђРЅРЅРѕС‚Р°С†РёСЏ РЅР° РєР°Р·Р°С…СЃРєРѕРј"
              />
            </div>
          </>
        ) : (
          <div className="form-field">
            <div className="form-label">
              {lang === 'ru' ? 'РђРЅРЅРѕС‚Р°С†РёСЏ (RU)' : lang === 'en' ? 'Abstract (EN)' : 'РђРЅРЅРѕС‚Р°С†РёСЏ (KZ)'}
            </div>
            <p className="article-abstract">
              {lang === 'ru' && (article.abstract_ru || 'РђРЅРЅРѕС‚Р°С†РёСЏ РЅРµ Р·Р°РїРѕР»РЅРµРЅР°.')}
              {lang === 'en' && (article.abstract_en || 'РђРЅРЅРѕС‚Р°С†РёСЏ РЅРµ Р·Р°РїРѕР»РЅРµРЅР°.')}
              {lang === 'kz' && (article.abstract_kz || 'РђРЅРЅРѕС‚Р°С†РёСЏ РЅРµ Р·Р°РїРѕР»РЅРµРЅР°.')}
            </p>
          </div>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°</p>
        {canEdit ? (
          <>
            {selectedKeywords.length > 0 ? (
              <div className="pill-list" style={{ marginBottom: '0.5rem' }}>
                {selectedKeywords.map((kw) => (
                  <span key={kw.id ?? kw.ru} className="pill pill--ghost">
                    {lang === 'ru' ? kw.ru : lang === 'en' ? kw.en : kw.kz}
                    <button
                      type="button"
                      aria-label="РЈРґР°Р»РёС‚СЊ"
                      className="pill__close"
                      onClick={() => removeKeyword(kw)}
                      style={{ marginLeft: 8 }}
                    >
                      Г—
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="table__empty">РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° РЅРµ РІС‹Р±СЂР°РЅС‹.</div>
            )}
            <div className="form-field">
              <input
                className="text-input"
                placeholder="Р’РІРµРґРёС‚Рµ РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ"
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
                  <span className="table__empty">РЎРѕРІРїР°РґРµРЅРёР№ РЅРµ РЅР°Р№РґРµРЅРѕ.</span>
                )}
              </div>
            ) : null}
            {keywordInput.trim() && computeKeywordMatches().length === 0 ? (
              <button type="button" className="button button--ghost" onClick={() => setKwModalOpen(true)}>
                Р”РѕР±Р°РІРёС‚СЊ РЅРѕРІРѕРµ РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ
              </button>
            ) : null}
          </>
        ) : (
          <>
            {article.keywords.length === 0 ? (
              <div className="table__empty">РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° РЅРµ СѓРєР°Р·Р°РЅС‹.</div>
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
        <p className="eyebrow">РЎРѕРіР»Р°СЃРёСЏ Рё РїСЂРѕРІРµСЂРєРё</p>
        <div className="grid grid-3">
          <div className="form-field">
            <div className="form-label">РќРµ РїСѓР±Р»РёРєРѕРІР°Р»Р°СЃСЊ СЂР°РЅРµРµ</div>
            <div className="form-hint">{article.not_published_elsewhere ? 'Р”Р°' : 'РќРµС‚'}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Р‘РµР· РїР»Р°РіРёР°С‚Р°</div>
            <div className="form-hint">{article.plagiarism_free ? 'Р”Р°' : 'РќРµС‚'}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Р’СЃРµ Р°РІС‚РѕСЂС‹ СЃРѕРіР»Р°СЃРЅС‹</div>
            <div className="form-hint">{article.authors_agree ? 'Р”Р°' : 'РќРµС‚'}</div>
          </div>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <div className="form-label">РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РіРµРЅРµСЂР°С‚РёРІРЅРѕРіРѕ РР</div>
            <div className="form-hint">{article.generative_ai_info || 'РќРµ СѓРєР°Р·Р°РЅРѕ'}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">РђРІС‚РѕСЂС‹</p>
        {(!canEdit) ? (
          <>
            {article.authors.length === 0 ? (
              <div className="table__empty">РЎРїРёСЃРѕРє Р°РІС‚РѕСЂРѕРІ РЅРµ Р·Р°РїРѕР»РЅРµРЅ.</div>
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
                        {a.affiliation2 ? <span className="dot">В·</span> : null}
                        {a.affiliation2 ? <span>{a.affiliation2}</span> : null}
                        {a.country ? (
                          <>
                            <span className="dot">В·</span>
                            <span>{a.country}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {a.is_corresponding ? <span className="pill">РћС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№ Р°РІС‚РѕСЂ</span> : null}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <h3 className="panel-title">Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ СЃРѕСЃС‚Р°РІР° Р°РІС‚РѕСЂРѕРІ</h3>
              </div>
              <button className="button button--primary button--compact" type="button" onClick={() => setAuthorModalOpen(true)}>
                Р”РѕР±Р°РІРёС‚СЊ Р°РІС‚РѕСЂР°
              </button>
            </div>
            <div className="form-field">
              <label className="form-label">РџРѕРёСЃРє Р°РІС‚РѕСЂР° РІ Р±Р°Р·Рµ</label>
              <input
                className="text-input"
                value={authorQuery}
                onChange={(e) => setAuthorQuery(e.target.value)}
                placeholder="РќР°С‡РЅРёС‚Рµ РІРІРѕРґРёС‚СЊ Р¤РРћ РёР»Рё email Р°РІС‚РѕСЂР°"
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
                                country: a.country,
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
              <div className="table__empty">РђРІС‚РѕСЂС‹ РїРѕРєР° РЅРµ РґРѕР±Р°РІР»РµРЅС‹.</div>
            ) : (
              <div className="table">
                <div className="table__head">
                  <span>РРјСЏ</span>
                  <span>Email</span>
                  <span>РђС„С„РёР»РёР°С†РёРё</span>
                  <span>РљРѕСЂСЂ. Р°РІС‚РѕСЂ</span>
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
                      <div className="table__cell">{[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || 'вЂ”'}</div>
                      <div className="table__cell">{a.isCorresponding ? 'Р”Р°' : 'РќРµС‚'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">Р¤Р°Р№Р»С‹</p>
        <div className="grid grid-3">
          <div className="form-field">
            <div className="form-label">Р СѓРєРѕРїРёСЃСЊ</div>
            {myFiles.find((f) => f.kind === 'manuscript') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'manuscript') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'РЎРєР°С‡Р°С‚СЊ СЂСѓРєРѕРїРёСЃСЊ'}
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
                РЎРєР°С‡Р°С‚СЊ
              </a>
            ) : (
              <div className="form-hint">РќРµ Р·Р°РіСЂСѓР¶РµРЅРѕ</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input type="file" className="file-input" onChange={(e) => setFileManuscript(e.target.files?.[0] ?? null)} />
                {fileManuscript ? <div className="form-hint">РќРѕРІС‹Р№ С„Р°Р№Р»: {fileManuscript.name}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="form-field">
            <div className="form-label">РђРЅС‚РёРїР»Р°РіРёР°С‚</div>
            {myFiles.find((f) => f.kind === 'antiplagiarism') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'antiplagiarism') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'РЎРєР°С‡Р°С‚СЊ С„Р°Р№Р»'}
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
                РЎРєР°С‡Р°С‚СЊ
              </a>
            ) : (
              <div className="form-hint">РќРµ Р·Р°РіСЂСѓР¶РµРЅРѕ</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input type="file" className="file-input" onChange={(e) => setFileAntiplagiarism(e.target.files?.[0] ?? null)} />
                {fileAntiplagiarism ? <div className="form-hint">РќРѕРІС‹Р№ С„Р°Р№Р»: {fileAntiplagiarism.name}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="form-field">
            <div className="form-label">Р”Р°РЅРЅС‹Рµ Р°РІС‚РѕСЂР°</div>
            {myFiles.find((f) => f.kind === 'author_info') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'author_info') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'РЎРєР°С‡Р°С‚СЊ С„Р°Р№Р»'}
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
                РЎРєР°С‡Р°С‚СЊ
              </a>
            ) : (
              <div className="form-hint">РќРµ Р·Р°РіСЂСѓР¶РµРЅРѕ</div>
            )}
            {canEdit ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input type="file" className="file-input" onChange={(e) => setFileAuthorInfo(e.target.files?.[0] ?? null)} />
                {fileAuthorInfo ? <div className="form-hint">РќРѕРІС‹Р№ С„Р°Р№Р»: {fileAuthorInfo.name}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="form-field">
            <div className="form-label">РЎРѕРїСЂРѕРІРѕРґРёС‚РµР»СЊРЅРѕРµ РїРёСЃСЊРјРѕ</div>
            {myFiles.find((f) => f.kind === 'cover_letter') ? (
              (() => {
                const f = myFiles.find((file) => file.kind === 'cover_letter') as ApiMyFile
                const url = toApiFilesUrl(f.download_url)
                return (
                  <div className="form-hint">
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {f.filename || 'РЎРєР°С‡Р°С‚СЊ С„Р°Р№Р»'}
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
                РЎРєР°С‡Р°С‚СЊ
              </a>
            ) : (
              <div className="form-hint">РќРµ Р·Р°РіСЂСѓР¶РµРЅРѕ</div>
            )}
            {article.status === 'withdrawn' ? (
              <div style={{ marginTop: '0.5rem' }}>
                <input type="file" className="file-input" onChange={(e) => setFileCoverLetter(e.target.files?.[0] ?? null)} />
                {fileCoverLetter ? <div className="form-hint">РќРѕРІС‹Р№ С„Р°Р№Р»: {fileCoverLetter.name}</div> : null}
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
            <p className="eyebrow">Р‘С‹СЃС‚СЂС‹Рµ РґРµР№СЃС‚РІРёСЏ</p>
            <h3 className="panel-title">РќР°РІРёРіР°С†РёСЏ</h3>
          </div>
          <div className="pill pill--ghost">РњРѕРё СЃС‚Р°С‚СЊРё</div>
        </div>
        <div className="pill-list">
          <Link className="button button--ghost button--compact" to="/cabinet/editorial2">
            Рљ СЃРїРёСЃРєСѓ СЃС‚Р°С‚РµР№
          </Link>
        </div>
      </div>

      {showRevokeConfirm && (
        <div className="modal-backdrop" onClick={() => setShowRevokeConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <p className="eyebrow">РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РґРµР№СЃС‚РІРёСЏ</p>
              <button className="modal__close" onClick={() => setShowRevokeConfirm(false)} aria-label="Р—Р°РєСЂС‹С‚СЊ">Г—</button>
            </div>
            <div className="modal__body">
              <h3 className="panel-title" style={{ marginTop: 0 }}>РћС‚РѕР·РІР°С‚СЊ СЃС‚Р°С‚СЊСЋ?</h3>
              <p className="subtitle">
                Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ РѕС‚РѕР·РІР°С‚СЊ СЌС‚Сѓ СЃС‚Р°С‚СЊСЋ? РџРѕСЃР»Рµ РѕС‚Р·С‹РІР° СЂРµРґР°РєС†РёСЏ РїСЂРёРѕСЃС‚Р°РЅРѕРІРёС‚ СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРµ
                СЂСѓРєРѕРїРёСЃРё.
              </p>
              {revokeMessage && <div className="alert alert--success">{revokeMessage}</div>}
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setShowRevokeConfirm(false)}
              >
                РћС‚РјРµРЅР°
              </button>
              <button
                type="button"
                className="button button--danger"
                disabled={revokeLoading}
                onClick={handleWithdraw}
              >
                {revokeLoading ? 'РћС‚Р·С‹РІР°РµРјвЂ¦' : 'РћС‚РѕР·РІР°С‚СЊ СЃС‚Р°С‚СЊСЋ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {kwModalOpen ? (
        <div className="modal-backdrop" onClick={() => setKwModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>РќРѕРІРѕРµ РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ</h3>
              <button className="modal__close" onClick={() => setKwModalOpen(false)} aria-label="Р—Р°РєСЂС‹С‚СЊ">Г—</button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-label">РќР° СЂСѓСЃСЃРєРѕРј</label>
                <input
                  className="text-input"
                  value={newKeyword.ru}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, ru: e.target.value }))}
                  placeholder="РќР°РїСЂРёРјРµСЂ: РСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹Р№ РёРЅС‚РµР»Р»РµРєС‚"
                />
              </div>
              <div className="form-field">
                <label className="form-label">РќР° РєР°Р·Р°С…СЃРєРѕРј</label>
                <input
                  className="text-input"
                  value={newKeyword.kz}
                  onChange={(e) => setNewKeyword((p) => ({ ...p, kz: e.target.value }))}
                  placeholder="РђРЅР°Р»РёС‚РёРєР° РґРµСЂРµРєС‚РµСЂС–"
                />
              </div>
              <div className="form-field">
                <label className="form-label">РќР° Р°РЅРіР»РёР№СЃРєРѕРј</label>
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
                РћС‚РјРµРЅР°
              </button>
              <button className="button button--primary" type="button" onClick={saveNewKeyword} disabled={!newKeyword.ru.trim()}>
                Р”РѕР±Р°РІРёС‚СЊ
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authorModalOpen ? (
        <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Р”РѕР±Р°РІРёС‚СЊ Р°РІС‚РѕСЂР°</h3>
              <button className="modal__close" onClick={() => setAuthorModalOpen(false)} aria-label="Р—Р°РєСЂС‹С‚СЊ">
                Г—
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
                <label className="form-label">РџСЂРµС„РёРєСЃ</label>
                <input
                  className="text-input"
                  value={authorForm.prefix}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, prefix: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">РРјСЏ *</label>
                <input
                  className="text-input"
                  value={authorForm.firstName}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">РћС‚С‡РµСЃС‚РІРѕ</label>
                <input
                  className="text-input"
                  value={authorForm.middleName}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, middleName: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Р¤Р°РјРёР»РёСЏ *</label>
                <input
                  className="text-input"
                  value={authorForm.lastName}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">РўРµР»РµС„РѕРЅ</label>
                <input
                  className="text-input"
                  value={authorForm.phone}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="form-field form-field--span-2">
                <label className="form-label">РђРґСЂРµСЃ</label>
                <input
                  className="text-input"
                  value={authorForm.address}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">РЎС‚СЂР°РЅР° *</label>
                <input
                  className="text-input"
                  value={authorForm.country}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, country: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label className="form-label">РђС„С„РёР»РёР°С†РёСЏ 1 *</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={authorForm.affiliation1}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation1: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">РђС„С„РёР»РёР°С†РёСЏ 2</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={authorForm.affiliation2}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation2: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">РђС„С„РёР»РёР°С†РёСЏ 3</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={authorForm.affiliation3}
                  onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation3: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label className="form-label">РЎРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РёР№ Р°РІС‚РѕСЂ</label>
                <div className="pill-list">
                  <button
                    type="button"
                    className={`button button--ghost button--compact ${authorForm.isCorresponding ? 'button--active' : ''}`}
                    onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: true }))}
                  >
                    Р”Р°
                  </button>
                  <button
                    type="button"
                    className={`button button--ghost button--compact ${!authorForm.isCorresponding ? 'button--active' : ''}`}
                    onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: false }))}
                  >
                    РќРµС‚
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
                РћС‚РјРµРЅР°
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={async () => {
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
                        country: created.country,
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
                disabled={!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()}
              >
                РЎРѕС…СЂР°РЅРёС‚СЊ Р°РІС‚РѕСЂР°
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


