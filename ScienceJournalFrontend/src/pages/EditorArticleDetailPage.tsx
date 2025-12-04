import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { toApiFilesUrl } from '../shared/url'
import { formatArticleStatus, formatArticleType } from '../shared/labels'
import ConfirmModal from '../shared/components/ConfirmModal'
import Toast from '../shared/components/Toast'

// Minimal interfaces matching backend ArticleOut
interface KeywordOut {
  id: number
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
}

interface AuthorOut {
  id: number
  email: string
  prefix?: string | null
  first_name: string
  patronymic?: string | null
  last_name: string
  phone?: string | null
  address?: string | null
  country?: string | null
  affiliation1?: string | null
  affiliation2?: string | null
  affiliation3?: string | null
  is_corresponding: boolean
  orcid?: string | null
  scopus_author_id?: string | null
  researcher_id?: string | null
}

interface ArticleVersionOut {
  id: number
  created_at: string
  updated_at?: string | null
  // relaxed fields; backend may include authors/keywords
  authors?: AuthorOut[]
  keywords?: KeywordOut[]
}

interface ArticleOut {
  id: number
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  abstract_kz?: string | null
  abstract_en?: string | null
  abstract_ru?: string | null
  doi?: string | null
  status: string
  article_type: string
  responsible_user_id?: number
  antiplagiarism_file_url?: string | null
  not_published_elsewhere?: boolean
  plagiarism_free?: boolean
  authors_agree?: boolean
  generative_ai_info?: string | null
  manuscript_file_url?: string | null
  author_info_file_url?: string | null
  cover_letter_file_url?: string | null
  created_at: string
  updated_at?: string | null
  versions: ArticleVersionOut[]
  keywords: KeywordOut[]
  authors: AuthorOut[]
}

export default function EditorArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ArticleOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'ru' | 'en' | 'kz'>(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('lang') as 'ru' | 'en' | 'kz' | null
    return fromQuery && ['ru', 'en', 'kz'].includes(fromQuery) ? fromQuery : 'ru'
  })
  // Status update (reject) states
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  // Confirm modal + toast
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  // Accept to publication modal
  const [isAcceptOpen, setIsAcceptOpen] = useState(false)
  const [volumes, setVolumes] = useState<import('../shared/types').Volume[] | null>(null)
  const [volumesLoading, setVolumesLoading] = useState(false)
  const [volumesError, setVolumesError] = useState<string | null>(null)
  const [addingToVolumeId, setAddingToVolumeId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAcceptOpen) return
    setVolumesLoading(true)
    setVolumesError(null)
    api.getVolumes<import('../shared/types').Volume[]>({ active_only: true })
      .then(setVolumes)
      .catch((e: any) => {
        const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить тома'
        setVolumesError(String(message))
      })
      .finally(() => setVolumesLoading(false))
  }, [isAcceptOpen])

  const handleReject = async () => {
    if (!data) return
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const res = await api.changeArticleStatus<{ id: number; status: string }>(data.id, 'rejected')
      setData({ ...data, status: res.status })
      setToastMessage('Статья успешно отклонена')
      setToastOpen(true)
    } catch (e: any) {
      const message = e?.bodyJson && (e.bodyJson as any).detail ? (e.bodyJson as any).detail : e?.message || 'Не удалось изменить статус'
      setStatusError(String(message))
    } finally {
      setStatusUpdating(false)
      setShowRejectConfirm(false)
    }
  }

  const handleTakeToWork = async () => {
    if (!data) return
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const res = await api.changeArticleStatus<{ id: number; status: string }>(data.id, 'editor_check')
      setData({ ...data, status: res.status })
      setToastMessage('Статья взята в работу (Проверка редактора)')
      setToastOpen(true)
    } catch (e: any) {
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось изменить статус'
      setStatusError(String(message))
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSendForRevision = async () => {
    if (!data) return
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const res = await api.changeArticleStatus<{ id: number; status: string }>(data.id, 'sent_for_revision')
      setData({ ...data, status: res.status })
      setToastMessage('Отправлено автору на доработку')
      setToastOpen(true)
    } catch (e: any) {
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось изменить статус'
      setStatusError(String(message))
    } finally {
      setStatusUpdating(false)
    }
  }

  const title = useMemo(() => {
    if (!data) return ''
    return (lang === 'ru' ? data.title_ru : lang === 'en' ? data.title_en : data.title_kz) || data.title_ru || data.title_en || data.title_kz || 'Без заголовка'
  }, [data, lang])

  const abstract = useMemo(() => {
    if (!data) return null
    return (lang === 'ru' ? data.abstract_ru : lang === 'en' ? data.abstract_en : data.abstract_kz) || data.abstract_ru || data.abstract_en || data.abstract_kz || null
  }, [data, lang])

  type ReviewerFullInfo = {
    // From User Profile Service
    id: number
    user_id: number
    full_name: string
    phone?: string | null
    organization?: string | null
    roles: string[]
    preferred_language: 'ru' | 'kz' | 'en'
    is_active?: boolean | null
    // From Auth - Identity Service
    username?: string | null
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    institution?: string | null
  }
  type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'resubmission' | string
  type ArticleReviewerAssignment = {
    id: number
    reviewer_id: number
    deadline?: string | null
    reviewer?: ReviewerFullInfo
    status?: ReviewStatus
    recommendation?: string | null
    updated_at?: string | null
    has_content?: boolean
  }
  interface ReviewOut {
    id: number
    article_id: number
    reviewer_id: number
    comments?: string | null
    recommendation?: string | null
    status: ReviewStatus
    deadline?: string | null
    importance_applicability?: string | null
    novelty_application?: string | null
    originality?: string | null
    innovation_product?: string | null
    results_significance?: string | null
    coherence?: string | null
    style_quality?: string | null
    editorial_compliance?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  const [reviewList, setReviewList] = useState<ArticleReviewerAssignment[]>([])
  const [reviewListLoading, setReviewListLoading] = useState(false)
  const [reviewListError, setReviewListError] = useState<string | null>(null)
  const [isAddReviewerOpen, setIsAddReviewerOpen] = useState(false)
  const [availableReviewers, setAvailableReviewers] = useState<ReviewerFullInfo[]>([])
  const [availableLoading, setAvailableLoading] = useState(false)
  const [availableError, setAvailableError] = useState<string | null>(null)
  const [assigningReviewerId, setAssigningReviewerId] = useState<number | null>(null)
  const [assignDeadline, setAssignDeadline] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewDetails, setReviewDetails] = useState<ReviewOut | null>(null)
  const [resubDeadlineLocal, setResubDeadlineLocal] = useState('')
  const [resubmitting, setResubmitting] = useState(false)
  const [resubError, setResubError] = useState<string | null>(null)
  const [resubSuccess, setResubSuccess] = useState<string | null>(null)
  // Current user info for role-based gating
  const [me, setMe] = useState<{ role?: string; roles?: string[] } | null>(null)
  useEffect(() => {
    // Silent fetch of /auth/me for role gating; errors are ignored
    api.get<{ role?: string; roles?: string[] }>('/auth/me')
      .then(setMe)
      .catch(() => {})
  }, [])
  const isEditor = (me?.role === 'editor') || (me?.roles?.includes('editor'))

  // Upload layout states (editor-only UI)
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [layoutUploading, setLayoutUploading] = useState(false)
  const [layoutUploadError, setLayoutUploadError] = useState<string | null>(null)
  const [layoutUploadSuccess, setLayoutUploadSuccess] = useState<string | null>(null)
  const [layoutDragActive, setLayoutDragActive] = useState(false)

  type FileOut = {
    id: string
    original_name?: string
    content_type?: string | null
    size_bytes?: number
    url?: string
    created_at?: string
  }

  // Layout records fetched from Layout Service
  type LayoutRecordOut = {
    id: string
    article_id?: number | null
    volume_id?: number | null
    file_id?: string | null
    file_url?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  const [layoutRecords, setLayoutRecords] = useState<LayoutRecordOut[]>([])
  const [layoutRecordsLoading, setLayoutRecordsLoading] = useState(false)
  const [layoutRecordsError, setLayoutRecordsError] = useState<string | null>(null)
  // Author details modal state
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorOut | null>(null)

  const fetchLayoutRecords = async (articleId: number) => {
    setLayoutRecordsLoading(true)
    setLayoutRecordsError(null)
    try {
      const recs = await api.getLayoutRecordsByArticle<LayoutRecordOut[]>(articleId)
      try { console.log('[LayoutRecords] fetched:', recs) } catch {}
      setLayoutRecords(Array.isArray(recs) ? recs : [])
    } catch (e: any) {
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить вёрстку'
      setLayoutRecordsError(String(message))
    } finally {
      setLayoutRecordsLoading(false)
    }
  }

  const parseDeadlineToISO = (input: string): string | null => {
    const trimmed = input.trim()
    if (!trimmed) return null
    const m = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (!m) return null
    const d = Number(m[1])
    const mo = Number(m[2])
    const y = Number(m[3])
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    const date = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59))
    if (
      date.getUTCFullYear() !== y ||
      date.getUTCMonth() !== mo - 1 ||
      date.getUTCDate() !== d
    ) {
      return null
    }
    return date.toISOString()
  }

  useEffect(() => {
    if (!isAddReviewerOpen) return
    setAvailableLoading(true)
    setAvailableError(null)
    api.getReviewers<ReviewerFullInfo[]>()
      .then((list) => {
        try { console.log('[Reviewers] fetched', list) } catch {}
        setAvailableReviewers(list)
      })
      .catch((e: any) => {
        const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить рецензентов'
        setAvailableError(String(message))
      })
      .finally(() => setAvailableLoading(false))
  }, [isAddReviewerOpen])

  const fetchArticleReviewers = async (articleId: string) => {
    setReviewListLoading(true)
    setReviewListError(null)
    try {
      const res = await api.getArticleReviewers<{ article_id: number; reviews: ArticleReviewerAssignment[] }>(articleId)
      try { console.log('[ArticleReviewers] fetched', res) } catch {}
      setReviewList(res.reviews || [])
    } catch (e: any) {
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить рецензентов статьи'
      setReviewListError(String(message))
    } finally {
      setReviewListLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api
      .getEditorArticleDetail<ArticleOut>(id)
      .then((res) => {
        try { console.log('[EditorDetail] Article:', res) } catch {}
        setData(res)
        // Fetch layout records for this article
        if (res?.id) fetchLayoutRecords(res.id)
      })
      .catch((e: any) => {
        const message = e?.bodyJson?.detail || e?.message || 'Failed to load'
        try { console.error('[EditorDetail] Error:', e) } catch {}
        setError(String(message))
      })
      .finally(() => setLoading(false))
    // Fetch article reviewers
    fetchArticleReviewers(id)
  }, [id])

  // Auto-open review modal if URL has ?review_id=123
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rid = params.get('review_id')
    if (rid && /^\d+$/.test(rid)) {
      try { console.log('[EditorDetail] auto-open review_id from URL', rid) } catch {}
      openReviewModal(Number(rid))
    }
  }, [id])

  const openReviewModal = async (reviewId: number) => {
    setIsReviewModalOpen(true)
    setReviewLoading(true)
    setReviewError(null)
    setReviewDetails(null)
    try {
      try { console.log(`[ReviewDetails] request GET /reviews/${reviewId}`) } catch {}
      const details = await api.getReviewById<ReviewOut>(reviewId)
      try { console.log(`GET /reviews/${reviewId} response:`, details) } catch {}
      setReviewDetails(details)
    } catch (e: any) {
      try { console.error(`GET /reviews/${reviewId} error:`, e) } catch {}
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить рецензию'
      setReviewError(String(message))
    } finally {
      setReviewLoading(false)
    }
  }

  const getReviewIdFromAssignment = (r: ArticleReviewerAssignment): number | null => {
    const anyR: any = r as any
    const candidates = [anyR.id, anyR.review_id, anyR.reviewId, anyR.assignment_id]
    const found = candidates.find((v) => typeof v === 'number' && Number.isFinite(v))
    return (found as number) ?? null
  }

  const renderStatusBadge = (status?: ReviewStatus) => {
    const s = (status as string) || 'pending'
    if (s === 'pending') return <span className="badge badge--muted">Ожидает</span>
    if (s === 'in_progress') return <span className="badge badge--warn">В работе</span>
    if (s === 'completed') return <span className="badge badge--success">Готово</span>
    if (s === 'resubmission') return <span className="badge">Повторная рецензия</span>
    return <span className="badge badge--ghost">{s}</span>
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
        </div>
        <div className="lang-switch">
          {(['ru','en','kz'] as const).map((l) => (
            <button key={l} className={`lang-chip ${lang === l ? 'lang-chip--active' : ''}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
      </section>

      {error && <div className="alert error">Ошибка: {error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {data && (
        <section className="section">
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>{title}</h2>
              {data.status !== 'rejected' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {data.status === 'submitted' ? (
                    <>
                      <button
                        className="button button--ghost"
                        disabled={statusUpdating}
                        onClick={() => setShowRejectConfirm(true)}
                      >
                        Отклонить
                      </button>
                      <button
                        className="button button--primary"
                        disabled={statusUpdating}
                        onClick={handleTakeToWork}
                      >
                        Взять в работу
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="button button--ghost"
                        disabled={statusUpdating}
                        onClick={() => setShowRejectConfirm(true)}
                      >
                        Отклонить
                      </button>
                      <button className="button button--warn" disabled={statusUpdating} onClick={handleSendForRevision}>
                        Отправить на доработку
                      </button>
                          <button className="button button--primary" onClick={() => setIsAcceptOpen(true)}>
                            Принять к публикации
                          </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="article-meta">
              <span className="meta-label">Тип:</span> {formatArticleType(data.article_type, lang)}
              <span className="dot">•</span>
              <span className="meta-label">Статус:</span> {formatArticleStatus(data.status, lang)}
              <span className="dot">•</span>
              <span className="meta-label">DOI:</span> {data.doi || '—'}
              <span className="dot">•</span>
              <span className="meta-label">Создано:</span> {new Date(data.created_at).toLocaleString()}
            </div>
            {statusError && (
              <div className="alert error" style={{ marginTop: '0.75rem' }}>Ошибка смены статуса: {statusError}</div>
            )}
            {abstract && (
              <div style={{ marginTop: '1.5rem', lineHeight: '1.6', color: '#444' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#555' }}>
                  {lang === 'ru' ? 'Аннотация' : lang === 'en' ? 'Abstract' : 'Аңдатпа'}
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{abstract}</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Авторы</h3>
            {data.authors.length === 0 ? (
              <div className="table__empty">Авторы пока не добавлены.</div>
            ) : (
              <div className="table">
                <div className="table__head">
                  <span>Имя</span>
                  <span>Email</span>
                  <span>Аффилиация</span>
                  <span>Контактный?</span>
                </div>
                <div className="table__body">
                  {data.authors.map((a) => (
                    <div className="table__row" key={a.id}>
                      <div className="table__cell">
                        <div className="table__title">
                          <a href="#" style={{ textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setSelectedAuthor(a); setAuthorModalOpen(true) }}>
                            {`${a.last_name} ${a.first_name}${a.patronymic ? ' ' + a.patronymic : ''}`}
                          </a>
                        </div>
                        <div className="table__meta">{a.prefix || ''}</div>
                      </div>
                      <div className="table__cell">{a.email}</div>
                      <div className="table__cell">{[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || '—'}</div>
                      <div className="table__cell">{a.is_corresponding ? 'Да' : 'Нет'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Ключевые слова</h3>
            {data.keywords.length === 0 ? (
              <div className="table__empty">Ключевые слова не указаны.</div>
            ) : (
              <div className="pill-list">
                {data.keywords.map((k) => (
                  <span key={k.id} className="pill pill--ghost">{k.title_ru || k.title_en || k.title_kz}</span>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Файлы</h3>
            <div className="actions">
              <a className="button button--ghost button--compact" href={toApiFilesUrl(data.manuscript_file_url) || '#'} target="_blank" rel="noreferrer">Рукопись</a>
              {data.antiplagiarism_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.antiplagiarism_file_url)} target="_blank" rel="noreferrer">Антиплагиат</a>
              )}
              {data.author_info_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.author_info_file_url)} target="_blank" rel="noreferrer">Автор инфо</a>
              )}
              {data.cover_letter_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.cover_letter_file_url)} target="_blank" rel="noreferrer">Письмо</a>
              )}
              {/* Render layout files if exist */}
              {layoutRecordsLoading && (
                <span className="button button--ghost button--compact" style={{ opacity: 0.6, pointerEvents: 'none' }}>Вёрстка: загрузка…</span>
              )}
              {layoutRecordsError && (
                <span className="button button--ghost button--compact" style={{ color: '#b00020' }} title={layoutRecordsError}>Вёрстка: ошибка</span>
              )}
              {layoutRecords && layoutRecords.length > 0 && layoutRecords.map((r, idx) => {
                const href = toApiFilesUrl(r.file_url || (r.file_id ? `/files/${r.file_id}/download` : undefined)) || '#'
                const label = `Вёрстка${layoutRecords.length > 1 ? ` ${idx + 1}` : ''}`
                return (
                  <a key={r.id} className="button button--ghost button--compact" href={href} target="_blank" rel="noreferrer">{label}</a>
                )
              })}
            </div>

            {isEditor && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Загрузка вёрстки рукописи</h4>
                <p className="form-hint" style={{ marginTop: 0 }}>Поддерживаемые форматы: PDF, DOC, DOCX, ZIP. Максимум зависит от сервера.</p>
                {layoutUploadError && <div className="alert error" style={{ marginBottom: '0.5rem' }}>Ошибка: {layoutUploadError}</div>}
                {layoutUploadSuccess && <div className="alert" style={{ marginBottom: '0.5rem' }}>{layoutUploadSuccess}</div>}
                <div
                  onDragOver={(e) => { e.preventDefault(); setLayoutDragActive(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setLayoutDragActive(false) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setLayoutDragActive(false)
                    setLayoutUploadError(null)
                    setLayoutUploadSuccess(null)
                    const f = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null
                    if (f) setLayoutFile(f)
                  }}
                  style={{
                    border: '2px dashed ' + (layoutDragActive ? '#4a90e2' : '#ccc'),
                    borderRadius: 8,
                    padding: '1rem',
                    background: layoutDragActive ? 'rgba(74,144,226,0.06)' : '#fafafa',
                    transition: 'all 0.15s ease',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      id="layout-file-input"
                      type="file"
                      accept="application/pdf,.pdf,.doc,.docx,.zip"
                      onChange={(e) => {
                        setLayoutUploadError(null)
                        setLayoutUploadSuccess(null)
                        const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                        setLayoutFile(f)
                      }}
                    />
                    <label htmlFor="layout-file-input" className="button button--ghost button--compact">Выбрать файл</label>
                    <span style={{ color: '#666' }}>или перетащите сюда</span>
                  </div>
                  {layoutFile && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge">{layoutFile.name}</span>
                      <span className="form-hint">{(layoutFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <button className="button button--ghost button--compact" onClick={() => setLayoutFile(null)}>Очистить</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="button button--primary"
                    disabled={!layoutFile || layoutUploading}
                    onClick={async () => {
                      if (!layoutFile || !data?.id) return
                      setLayoutUploading(true)
                      setLayoutUploadError(null)
                      setLayoutUploadSuccess(null)
                      try {
                        const uploaded = await api.uploadFile<FileOut>(layoutFile)
                        try { console.log('[LayoutUpload] /api/files response:', uploaded) } catch {}
                        try {
                          const rec = await api.createLayoutRecord<LayoutRecordOut>({
                            article_id: data.id,
                            file_id: uploaded.id,
                            file_url: uploaded.url,
                          })
                          try { console.log('[LayoutUpload] /api/layout/records response:', rec) } catch {}
                          setLayoutRecords((prev) => [rec, ...prev])
                        } catch (e: any) {
                          try { console.warn('[LayoutUpload] create layout record failed:', e) } catch {}
                          try { await fetchLayoutRecords(data.id) } catch {}
                        }
                        setLayoutUploadSuccess('Файл загружен. См. консоль для ответа API.')
                        setToastMessage('Вёрстка загружена')
                        setToastOpen(true)
                        setLayoutFile(null)
                      } catch (e: any) {
                        const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить файл'
                        setLayoutUploadError(String(message))
                      } finally {
                        setLayoutUploading(false)
                      }
                    }}
                  >{layoutUploading ? 'Загружается...' : 'Загрузить вёрстку'}</button>
                  <button
                    className="button button--ghost"
                    disabled={!layoutFile || layoutUploading}
                    onClick={() => setLayoutFile(null)}
                  >Отмена</button>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Версии</h3>
            {data.versions.length === 0 ? (
              <div className="table__empty">Версий пока нет.</div>
            ) : (
              <div className="table">
                <div className="table__head">
                  <span>ID</span>
                  <span>Создано</span>
                  <span>К-во авторов</span>
                  <span>К-во ключ. слов</span>
                </div>
                <div className="table__body">
                  {data.versions.map((v) => (
                    <div className="table__row" key={v.id}>
                      <div className="table__cell">
                        <a
                          href={`/cabinet/editorial2/${data.id}/versions/${v.id}`}
                          style={{ textDecoration: 'underline' }}
                        >{v.id}</a>
                      </div>
                      <div className="table__cell">{new Date(v.created_at).toLocaleString()}</div>
                      <div className="table__cell">{v.authors?.length ?? 0}</div>
                      <div className="table__cell">{v.keywords?.length ?? 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>



          <div className="panel">
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <h3 className="panel-title" style={{ margin: 0 }}>Рецензенты</h3>
              {data.status !== 'rejected' && (
                <button className="button button--primary" onClick={() => setIsAddReviewerOpen(true)}>Добавить рецензента</button>
              )}
            </div>
            {reviewListError && <div className="alert error">Ошибка: {reviewListError}</div>}
            {reviewListLoading ? (
              <div className="loading">Загрузка рецензентов...</div>
            ) : reviewList.length === 0 ? (
              <div className="table__empty">Рецензенты пока не назначены.</div>
            ) : (
              <div className="table">
                <div className="table__head">
                  <span>Рецензент</span>
                  <span>Email</span>
                  <span>Дедлайн</span>
                  <span>Статус</span>
                </div>
                <div className="table__body">
                  {reviewList.map((r) => {
                    const rid = getReviewIdFromAssignment(r)
                    const fullName = r.reviewer?.full_name || `ID: ${r.reviewer_id}`
                    const email = r.reviewer?.email || '—'
                    const deadline = r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'
                    return (
                      <div className="table__row table__row--align" key={`${r.reviewer_id}-${r.deadline ?? ''}`}>
                        <div className="table__cell">
                          <div className="table__title">
                            {rid ? (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  try { console.log('[ReviewDetails] open from reviewer name', { reviewer_id: r.reviewer_id, review_id: rid, status: r.status }) } catch {}
                                  openReviewModal(rid)
                                }}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              >{fullName}</a>
                            ) : (
                              <span style={{ opacity: 0.7 }}>{fullName}</span>
                            )}
                          </div>
                          <div className="table__meta">ID: {r.reviewer?.id ?? r.reviewer_id}{rid ? ` • ReviewID: ${rid}` : ''}</div>
                        </div>
                        <div className="table__cell">{email}</div>
                        <div className="table__cell">{deadline}</div>
                        <div className="table__cell">{renderStatusBadge(r.status)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      {authorModalOpen && selectedAuthor && (
        <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Автор</h3>
              <button className="modal__close" onClick={() => setAuthorModalOpen(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="details-grid">
                <div><strong>ФИО:</strong> {`${selectedAuthor.last_name} ${selectedAuthor.first_name}${selectedAuthor.patronymic ? ' ' + selectedAuthor.patronymic : ''}`}</div>
                <div><strong>Префикс:</strong> {selectedAuthor.prefix || '—'}</div>
                <div><strong>Email:</strong> {selectedAuthor.email}</div>
                <div><strong>Телефон:</strong> {selectedAuthor.phone || '—'}</div>
                <div><strong>Адрес:</strong> {selectedAuthor.address || '—'}</div>
                <div><strong>Страна:</strong> {selectedAuthor.country || '—'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Аффилиация(и):</strong><br/>{[selectedAuthor.affiliation1, selectedAuthor.affiliation2, selectedAuthor.affiliation3].filter(Boolean).join('; ') || '—'}</div>
                <div><strong>Контактный автор:</strong> {selectedAuthor.is_corresponding ? 'Да' : 'Нет'}</div>
                <div><strong>ORCID:</strong> {selectedAuthor.orcid || '—'}</div>
                <div><strong>Scopus Author ID:</strong> {selectedAuthor.scopus_author_id || '—'}</div>
                <div><strong>ResearcherID:</strong> {selectedAuthor.researcher_id || '—'}</div>
              </div>
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="button button--primary" onClick={() => setAuthorModalOpen(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {isAcceptOpen && (
        <div className="modal-backdrop" onClick={() => setIsAcceptOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Добавить статью в том</h3>
              <button className="modal__close" onClick={() => setIsAcceptOpen(false)}>×</button>
            </div>
            <div className="modal__body">
              {volumesError && <div className="alert error">Ошибка: {volumesError}</div>}
              {volumesLoading && <div className="loading">Загрузка томов...</div>}
              {!volumesLoading && !volumesError && volumes && volumes.length === 0 && (
                <div className="table__empty">Активных томов не найдено.</div>
              )}
              {!volumesLoading && !volumesError && volumes && volumes.length > 0 && (
                <div className="table">
                  <div className="table__head">
                    <span>Том</span>
                    <span>Заголовок</span>
                    <span>Статей</span>
                    <span>Действия</span>
                  </div>
                  <div className="table__body">
                    {volumes.map((v) => (
                      <div className="table__row table__row--align" key={String(v.id ?? `${v.year}-${v.number}-${v.month ?? 'm'}`)}>
                        <div className="table__cell">
                          <div className="table__title">Том {v.number} / {v.year}{v.month ? ` (${v.month} мес.)` : ''}</div>
                        </div>
                        <div className="table__cell">{v.title_ru || v.title_en || v.title_kz || '—'}</div>
                        <div className="table__cell">{v.articles?.length ?? 0}</div>
                        <div className="table__cell">
                          <button
                            className="button button--primary button--compact"
                            disabled={addingToVolumeId === (v.id ?? null) || statusUpdating}
                            onClick={async () => {
                              if (!data?.id || v.id == null) return
                              setAddingToVolumeId(v.id)
                              setStatusError(null)
                              try {
                                // First, set status to published
                                const res = await api.changeArticleStatus<{ id: number; status: string }>(data.id, 'published')
                                setData({ ...data, status: res.status })
                                // Then, add to selected volume
                                const currentIds = (v.articles || []).map((a) => Number((a as any).id)).filter((n) => Number.isFinite(n))
                                const nextIds = Array.from(new Set([...currentIds, Number(data.id)]))
                                await api.updateVolume(v.id, { article_ids: nextIds })
                                setToastMessage('Статья опубликована и добавлена в том')
                                setToastOpen(true)
                                // Refresh volumes in modal to reflect new counts
                                try {
                                  const updated = await api.getVolumes<import('../shared/types').Volume[]>({ active_only: true })
                                  setVolumes(updated)
                                } catch {}
                                setIsAcceptOpen(false)
                              } catch (e: any) {
                                const detail = e?.bodyJson?.detail
                                const message = detail || e?.message || 'Не удалось выполнить публикацию или добавление в том'
                                setStatusError(String(message))
                              } finally {
                                setAddingToVolumeId(null)
                              }
                            }}
                          >Добавить в том</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="button button--ghost" onClick={() => setIsAcceptOpen(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Removed old review details modal tied to mock data */}

      {isAddReviewerOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddReviewerOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Добавить рецензента</h3>
              <button className="modal__close" onClick={() => setIsAddReviewerOpen(false)}>×</button>
            </div>
            <div className="modal__body">

              {availableError && <div className="alert error">Ошибка: {availableError}</div>}
              {assignError && <div className="alert error">Ошибка назначения: {assignError}</div>}
              {assignSuccess && <div className="alert">{assignSuccess}</div>}
              {availableLoading ? (
                <div className="loading">Загрузка рецензентов...</div>
              ) : (
              <div className="table table--reviewers">
                <div className="table__head">
                  <span>Рецензент</span>
                  <span>Email</span>
                  <span>Организация</span>
                  <span>Язык</span>
                  <span>ID</span>
                  <span>Активен</span>
                  <span>Действия</span>
                </div>
                <div className="table__body">
                  {availableReviewers.length === 0 ? (
                    <div className="table__row">
                      <div className="table__cell" style={{ gridColumn: '1 / -1' }}>Ничего не найдено.</div>
                    </div>
                  ) : (
                    availableReviewers.map((r) => (
                      <div className="table__row table__row--align" key={r.id}>
                        <div className="table__cell">
                          <div className="table__title">{r.full_name}</div>
                        </div>
                        <div className="table__cell">{r.email ?? '—'}</div>
                        <div className="table__cell">{r.organization ?? '—'}</div>
                        <div className="table__cell">{r.preferred_language?.toUpperCase?.() ?? '—'}</div>
                        <div className="table__cell">{r.id}</div>
                        <div className="table__cell">{r.is_active == null ? '—' : r.is_active ? 'Да' : 'Нет'}</div>
                        <div className="table__cell table__cell--actions">
                          {data!.status !== 'rejected' && assigningReviewerId === r.id ? (
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                className="text-input"
                                type="text"
                                placeholder="ДД.ММ.ГГГГ (например, 31.12.2025)"
                                value={assignDeadline}
                                onChange={(e) => setAssignDeadline(e.target.value)}
                                style={{ maxWidth: '260px' }}
                              />
                              <span className="form-hint">Формат: ДД.ММ.ГГГГ</span>
                              <button
                                className="button button--primary button--compact"
                                disabled={assignLoading}
                                onClick={async () => {
                                  if (!id) return
                                  setAssignLoading(true)
                                  setAssignError(null)
                                  setAssignSuccess(null)
                                  try {
                                    const payload: { reviewer_ids: number[]; deadline?: string } = {
                                      reviewer_ids: [r.id],
                                    }
                                    if (assignDeadline.trim()) {
                                      const iso = parseDeadlineToISO(assignDeadline)
                                      if (!iso) {
                                        setAssignError('Некорректная дата. Формат: ДД.ММ.ГГГГ')
                                        setAssignLoading(false)
                                        return
                                      }
                                      payload.deadline = iso
                                    }
                                    const res = await api.assignReviewers<{ message: string; article_id: number; reviewer_ids: number[] }>(id, payload)
                                    try { console.log('[AssignReviewer] success', res) } catch {}
                                    setAssignSuccess('Рецензент назначен успешно')
                                    setAssigningReviewerId(null)
                                    setAssignDeadline('')
                                    await fetchArticleReviewers(id)
                                  } catch (e: any) {
                                    const message = e?.bodyJson?.detail || e?.message || 'Не удалось назначить рецензента'
                                    setAssignError(String(message))
                                  } finally {
                                    setAssignLoading(false)
                                  }
                                }}
                              >Назначить</button>
                              <button
                                className="button button--ghost button--compact"
                                onClick={() => { setAssigningReviewerId(null); setAssignDeadline('') }}
                              >Отмена</button>
                            </div>
                          ) : data!.status !== 'rejected' ? (
                            <button
                              className="button button--primary button--compact"
                              onClick={() => { setAssigningReviewerId(r.id); setAssignError(null); setAssignSuccess(null); }}
                            >Назначить</button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="button button--ghost" onClick={() => setIsAddReviewerOpen(false)}>Отмена</button>
              <button className="button button--primary" onClick={() => setIsAddReviewerOpen(false)}>Готово</button>
            </div>
          </div>
        </div>
      )}

      {isReviewModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsReviewModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Рецензия</h3>
              <button className="modal__close" onClick={() => setIsReviewModalOpen(false)}>×</button>
            </div>
            <div className="modal__body">
              {reviewError && <div className="alert error">Ошибка: {reviewError}</div>}
              {reviewLoading && <div className="loading">Загрузка...</div>}
              {!reviewLoading && reviewDetails && (
                <div className="details-grid">
                  <div><strong>ID:</strong> {reviewDetails.id}</div>
                  <div><strong>Статья:</strong> {reviewDetails.article_id}</div>
                  <div><strong>Рецензент:</strong> {reviewDetails.reviewer_id}</div>
                  <div><strong>Статус:</strong> {renderStatusBadge(reviewDetails.status)}</div>
                  <div><strong>Рекомендация:</strong> {reviewDetails.recommendation || '—'}</div>
                  <div><strong>Дедлайн:</strong> {reviewDetails.deadline ? new Date(reviewDetails.deadline).toLocaleString() : '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Комментарии:</strong><br/>{reviewDetails.comments || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Практическая значимость:</strong><br/>{reviewDetails.importance_applicability || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Новизна применения:</strong><br/>{reviewDetails.novelty_application || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Оригинальность:</strong><br/>{reviewDetails.originality || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Инновационный продукт:</strong><br/>{reviewDetails.innovation_product || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Значимость результатов:</strong><br/>{reviewDetails.results_significance || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Логичность:</strong><br/>{reviewDetails.coherence || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Качество стиля:</strong><br/>{reviewDetails.style_quality || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Соответствие требованиям:</strong><br/>{reviewDetails.editorial_compliance || '—'}</div>
                  <div><strong>Создано:</strong> {reviewDetails.created_at ? new Date(reviewDetails.created_at).toLocaleString() : '—'}</div>
                  <div><strong>Обновлено:</strong> {reviewDetails.updated_at ? new Date(reviewDetails.updated_at).toLocaleString() : '—'}</div>
                  {isEditor && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        <label style={{ fontWeight: 600 }}>Новый дедлайн (опционально):</label>
                        <input
                          className="text-input"
                          type="datetime-local"
                          value={resubDeadlineLocal}
                          onChange={(e) => setResubDeadlineLocal(e.target.value)}
                          style={{ maxWidth: '260px' }}
                        />
                        <span className="form-hint">Если не указать — статус всё равно станет resubmission</span>
                      </div>
                      {resubError && <div className="alert error" style={{ marginTop: '0.5rem' }}>Ошибка: {resubError}</div>}
                      {resubSuccess && <div className="alert" style={{ marginTop: '0.5rem' }}>{resubSuccess}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {reviewDetails && isEditor && (
                <button
                  className="button button--warn"
                  disabled={resubmitting}
                  onClick={async () => {
                    if (!reviewDetails?.id) return
                    setResubmitting(true)
                    setResubError(null)
                    setResubSuccess(null)
                    try {
                      const deadlineIso = resubDeadlineLocal ? new Date(resubDeadlineLocal).toISOString() : undefined
                      const updated = await api.requestReviewResubmission<typeof reviewDetails>(reviewDetails.id, deadlineIso)
                      setReviewDetails(updated as any)
                      setResubSuccess('Статус обновлён: повторная рецензия запрошена')
                      // refresh list to reflect deadline/status changes
                      if (id) await fetchArticleReviewers(id)
                    } catch (e: any) {
                      const message = e?.bodyJson?.detail || e?.message || 'Не удалось запросить повторную рецензию'
                      setResubError(String(message))
                    } finally {
                      setResubmitting(false)
                    }
                  }}
                >Повторная рецензия</button>
              )}
              <button className="button button--primary" onClick={() => setIsReviewModalOpen(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={showRejectConfirm}
        title="Отклонение статьи"
        message="Вы действительно хотите отклонить эту статью? Это действие необратимо."
        confirmText={statusUpdating ? 'Отклоняем...' : 'Отклонить'}
        cancelText="Отмена"
        onConfirm={handleReject}
        onCancel={() => (!statusUpdating && setShowRejectConfirm(false))}
      />
      <Toast
        open={toastOpen}
        message={toastMessage}
        onClose={() => { setToastOpen(false); setToastMessage('') }}
        durationMs={4000}
      />
    </div>
  )
}
