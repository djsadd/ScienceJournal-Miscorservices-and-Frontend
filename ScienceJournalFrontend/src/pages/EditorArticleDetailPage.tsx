import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { toApiFilesUrl } from '../shared/url'
import { formatArticleStatus, formatArticleType, formatReviewRecommendation } from '../shared/labels'
import { getCountryLabel, type CountryValue } from '../shared/countries'
import { useLanguage } from '../shared/LanguageContext'
import ConfirmModal from '../shared/components/ConfirmModal'
import Toast from '../shared/components/Toast'
import CollapsibleSection from '../shared/components/CollapsibleSection'

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
  country?: CountryValue
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
  article_language?: string | null
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

interface CorrespondenceItem {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  article_version_id?: number | null
  status: string
  created_at: string
}

export default function EditorArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { lang: pageLang } = useLanguage()
  const [data, setData] = useState<ArticleOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [correspondence, setCorrespondence] = useState<CorrespondenceItem[]>([])
  const [correspondenceLoading, setCorrespondenceLoading] = useState(false)
  const [correspondenceError, setCorrespondenceError] = useState<string | null>(null)
  const [articleFormLang, setArticleFormLang] = useState<'ru' | 'en' | 'kz'>(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('lang') as 'ru' | 'en' | 'kz' | null
    return fromQuery && ['ru', 'en', 'kz'].includes(fromQuery) ? fromQuery : 'ru'
  })
  const lang = articleFormLang
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
  const [aiReviewText, setAiReviewText] = useState('')
  const [aiReviewLoading, setAiReviewLoading] = useState(false)
  const [aiReviewError, setAiReviewError] = useState<string | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<'accept' | 'major_revision' | 'reject' | null>(null)
  const [aiModel, setAiModel] = useState<string | null>(null)
  const [isAIReviewModalOpen, setIsAIReviewModalOpen] = useState(false)

  const requestAIReview = async () => {
    if (!data || aiReviewLoading) return
    setIsAIReviewModalOpen(true)
    setAiReviewText('')
    setAiRecommendation(null)
    setAiReviewError(null)
    setAiReviewLoading(true)
    try {
      await api.streamAIReview(
        { article_id: data.id, language: articleFormLang === 'kz' ? 'kk' : articleFormLang },
        (event) => {
          if (event.type === 'started') setAiModel(event.model)
          if (event.type === 'delta') setAiReviewText((current) => current + event.text)
          if (event.type === 'completed') setAiRecommendation(event.recommendation)
          if (event.type === 'error') setAiReviewError(event.message)
        },
      )
    } catch (e: any) {
      setAiReviewError(e?.message || 'Не удалось сформировать ИИ-рецензию')
    } finally {
      setAiReviewLoading(false)
    }
  }

  const aiRecommendationLabel = aiRecommendation === 'accept'
    ? 'Рекомендовать к публикации'
    : aiRecommendation === 'major_revision'
      ? 'Рекомендовать после доработки'
      : aiRecommendation === 'reject'
        ? 'Не рекомендовать к публикации'
        : null
  const hasAIReviewer = aiReviewLoading || Boolean(aiReviewText) || Boolean(aiReviewError)

  useEffect(() => {
    if (!id) return
    api.get<Array<{
      status: string
      review_text?: string | null
      recommendation?: 'accept' | 'major_revision' | 'reject' | null
      model?: string | null
    }>>('/ai-reviews', { params: { article_id: id, limit: 1 } })
      .then((items) => {
        const latest = items[0]
        if (!latest || latest.status !== 'completed' || !latest.review_text) return
        setAiReviewText(latest.review_text)
        setAiRecommendation(latest.recommendation || null)
        setAiModel(latest.model || null)
      })
      .catch(() => {})
  }, [id])

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

  const [isRevisionOpen, setIsRevisionOpen] = useState(false)
  const [revisionComment, setRevisionComment] = useState('')

  const handleSendForRevision = async () => {
    if (!data) return
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const res = await api.changeArticleStatus<{ id: number; status: string }>(
        data.id,
        'sent_for_revision',
        revisionComment.trim() ? { comment_for_author: revisionComment.trim() } : undefined
      )
      try { console.log('[SendForRevision] PATCH /articles/'+data.id+'/status response:', res) } catch {}
      setData({ ...data, status: res.status })
      setToastMessage('Отправлено автору на доработку')
      setToastOpen(true)
      setIsRevisionOpen(false)
      setRevisionComment('')
    } catch (e: any) {
      try { console.error('[SendForRevision] error:', e) } catch {}
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
    orcid?: string | null
    reviewer_science_fields?: string[]
    reviewer_science_other?: string | null
    is_active?: boolean | null
    // From Auth - Identity Service
    username?: string | null
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    institution?: string | null
  }
  type ReviewerProfileFields = {
    orcid?: string | null
    reviewer_science_fields?: string[]
    reviewer_science_other?: string | null
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
  const [cancelReviewer, setCancelReviewer] = useState<{ id: number; name: string } | null>(null)
  const [cancelReviewerLoading, setCancelReviewerLoading] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewDetails, setReviewDetails] = useState<ReviewOut | null>(null)
  const [articleReviewComments, setArticleReviewComments] = useState<ReviewOut[]>([])
  const [resubDeadlineLocal, setResubDeadlineLocal] = useState('')
  const [resubmitting, setResubmitting] = useState(false)
  const [resubError, setResubError] = useState<string | null>(null)
  const [resubSuccess, setResubSuccess] = useState<string | null>(null)
  const formatReviewerScience = (reviewer: ReviewerFullInfo) => {
    const fieldLabels: Record<string, string> = {
      economics: 'Экономика',
      politology: 'Политология',
      jurisprudence: 'Юриспруденция',
      pedagogy: 'Педагогика',
      philology: 'Филология',
      psychology: 'Психология',
      sociology: 'Социология',
      management: 'Менеджмент',
      philosophy: 'Философия',
      cultural_studies: 'Культурология',
      information_technology: 'Информационные технологии',
      other: 'Иное',
    }
    const fields = (reviewer.reviewer_science_fields || [])
      .map((item) => {
        if (item === 'other' && reviewer.reviewer_science_other?.trim()) {
          return `Иное: ${reviewer.reviewer_science_other.trim()}`
        }
        return fieldLabels[item] || item
      })
      .filter(Boolean)

    return fields.length > 0 ? fields.join(', ') : 'Пусто'
  }
  // Current user info for role-based gating
  const [me, setMe] = useState<{ role?: string; roles?: string[] } | null>(null)
  useEffect(() => {
    // Silent fetch of /auth/me for role gating; errors are ignored
    api.get<{ role?: string; roles?: string[] }>('/auth/me')
      .then(setMe)
      .catch(() => {})
  }, [])
  const isEditor = (me?.role === 'editor') || (me?.roles?.includes('editor'))
  const assignedReviewerIds = useMemo(() => new Set(reviewList.map((item) => item.reviewer_id)), [reviewList])

  // Upload layout states (editor-only UI)
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [layoutUploading, setLayoutUploading] = useState(false)
  const [layoutUploadError, setLayoutUploadError] = useState<string | null>(null)
  const [layoutUploadSuccess, setLayoutUploadSuccess] = useState<string | null>(null)
  const [layoutDragActive, setLayoutDragActive] = useState(false)
  // Antiplagiarism upload states
  const [antiFile, setAntiFile] = useState<File | null>(null)
  const [antiUploading, setAntiUploading] = useState(false)
  const [antiError, setAntiError] = useState<string | null>(null)
  const [antiSuccess, setAntiSuccess] = useState<string | null>(null)
  const [antiDragActive, setAntiDragActive] = useState(false)

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
  const [keywordModalOpen, setKeywordModalOpen] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordOut | null>(null)

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
      .then(async (list) => {
        const reviewers = await Promise.all(
          list.map(async (reviewer) => {
            try {
              const profile = await api.get<ReviewerProfileFields>(`/users/${reviewer.user_id}`)
              return {
                ...reviewer,
                orcid: profile.orcid || reviewer.orcid || null,
                reviewer_science_fields: profile.reviewer_science_fields || reviewer.reviewer_science_fields || [],
                reviewer_science_other: profile.reviewer_science_other || reviewer.reviewer_science_other || null,
              }
            } catch {
              return reviewer
            }
          }),
        )
        try { console.log('[Reviewers] fetched', reviewers) } catch {}
        setAvailableReviewers(reviewers.filter((reviewer) => reviewer.is_active === true))
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
    setCorrespondenceLoading(true)
    setCorrespondenceError(null)
    api.getArticleCorrespondenceHistory<CorrespondenceItem[]>(id)
      .then((history) => setCorrespondence(Array.isArray(history) ? history : []))
      .catch((error: unknown) => {
        const e = error as { bodyJson?: { detail?: unknown }; message?: unknown }
        setCorrespondenceError(String(e.bodyJson?.detail || e.message || 'Не удалось загрузить историю переписки'))
      })
      .finally(() => setCorrespondenceLoading(false))
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

  useEffect(() => {
    let cancelled = false
    const reviewIds = reviewList
      .map((review) => {
        const assignment = review as ArticleReviewerAssignment & {
          review_id?: number
          reviewId?: number
          assignment_id?: number
        }
        return [assignment.id, assignment.review_id, assignment.reviewId, assignment.assignment_id]
          .find((value) => typeof value === 'number' && Number.isFinite(value)) ?? null
      })
      .filter((reviewId): reviewId is number => reviewId !== null)
    if (reviewIds.length === 0) {
      setArticleReviewComments([])
      return () => { cancelled = true }
    }
    Promise.all(reviewIds.map((reviewId) => api.getReviewById<ReviewOut>(reviewId).catch(() => null)))
      .then((reviews) => {
        if (!cancelled) {
          setArticleReviewComments(reviews.filter((review): review is ReviewOut => Boolean(review?.comments?.trim())))
        }
      })
    return () => { cancelled = true }
  }, [reviewList])

  const downloadCorrespondence = () => {
    if (!data || correspondence.length === 0) return
    const lines = [
      `История переписки по статье №${data.id}`,
      `Название: ${title}`,
      `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
      '',
      ...correspondence.flatMap((item) => [
        `[${new Date(item.created_at).toLocaleString('ru-RU')}] Редакция → автор`,
        item.title,
        item.message,
        item.article_version_id ? `Версия статьи: ${item.article_version_id}` : '',
        '',
      ].filter(Boolean)),
    ]
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `article-${data.id}-correspondence.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const renderStatusBadge = (status?: ReviewStatus) => {
    const s = (status as string) || 'pending'
    if (s === 'pending') return <span className="badge badge--muted">Ожидает</span>
    if (s === 'in_progress') return <span className="badge badge--warn">В работе</span>
    if (s === 'completed') return <span className="badge badge--success">Готово</span>
    if (s === 'resubmission') return <span className="badge">Повторная рецензия</span>
    return <span className="badge badge--ghost">{s}</span>
  }

  const renderRecommendationBadge = (recommendation?: string | null, status?: ReviewStatus) => {
    if (status !== 'completed' || !recommendation) {
      return <span className="badge badge--muted">—</span>
    }
    const badgeClass = recommendation === 'accept'
      ? 'badge--success'
      : recommendation === 'reject'
        ? 'badge--danger'
        : 'badge--warn'
    return (
      <span className={`badge review-recommendation ${badgeClass}`}>
        {formatReviewRecommendation(recommendation, lang)}
      </span>
    )
  }

  const downloadReviewAsWord = () => {
    if (!reviewDetails || reviewDetails.status !== 'completed') return
    const escapeHtml = (value: unknown) => String(value ?? '—')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
    const reviewerName = reviewList.find((item) => item.reviewer_id === reviewDetails.reviewer_id)?.reviewer?.full_name
      || `ID: ${reviewDetails.reviewer_id}`
    const fields = [
      ['Рекомендация', formatReviewRecommendation(reviewDetails.recommendation, lang)],
      ['Комментарии', reviewDetails.comments],
      ['Практическая значимость', reviewDetails.importance_applicability],
      ['Новизна применения', reviewDetails.novelty_application],
      ['Оригинальность', reviewDetails.originality],
      ['Инновационный продукт', reviewDetails.innovation_product],
      ['Значимость результатов', reviewDetails.results_significance],
      ['Логичность', reviewDetails.coherence],
      ['Качество стиля', reviewDetails.style_quality],
      ['Соответствие требованиям', reviewDetails.editorial_compliance],
    ]
    const rows = fields.map(([label, value]) => `
      <tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;font-size:11pt;color:#222}h1{font-size:18pt;color:#7a1237}
      .meta{margin:0 0 18pt}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8pt;text-align:left;vertical-align:top;white-space:pre-wrap}th{width:30%;background:#f5eef1}
    </style></head><body><h1>Рецензия на статью</h1>
      <div class="meta"><p><strong>Статья:</strong> ${escapeHtml(title)}</p><p><strong>Рецензент:</strong> ${escapeHtml(reviewerName)}</p></div>
      <table>${rows}</table></body></html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `review-${reviewDetails.id}.doc`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const downloadAIReviewAsWord = () => {
    if (!data || !aiReviewText || aiReviewLoading) return
    const escapeHtml = (value: unknown) => String(value ?? '—')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.55;color:#222;margin:32pt}
      h1{font-size:18pt;color:#7a1237;margin-bottom:18pt}.meta{padding:12pt;background:#f5f6fa;margin-bottom:18pt}
      .review{white-space:pre-wrap}.notice{margin-top:20pt;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:8pt}
    </style></head><body>
      <h1>ИИ-рецензия на научную статью</h1>
      <div class="meta">
        <p><strong>Статья:</strong> ${escapeHtml(title)}</p>
        <p><strong>ИИ-рецензент:</strong> ${escapeHtml(aiModel || 'OpenAI')}</p>
        <p><strong>Рекомендация:</strong> ${escapeHtml(aiRecommendationLabel || '—')}</p>
        <p><strong>Сформировано:</strong> ${escapeHtml(new Date().toLocaleString('ru-RU'))}</p>
      </div>
      <div class="review">${escapeHtml(aiReviewText)}</div>
      <div class="notice">ИИ-рецензия носит рекомендательный характер и не заменяет независимое рецензирование и решение редактора.</div>
    </body></html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-review-article-${data.id}.doc`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleCancelReviewer = async () => {
    if (!id || !cancelReviewer || cancelReviewerLoading) return
    setCancelReviewerLoading(true)
    setReviewListError(null)
    try {
      await api.cancelReviewerAssignment(id, cancelReviewer.id)
      await fetchArticleReviewers(id)
      setCancelReviewer(null)
      setToastMessage('Назначение рецензента отменено. Уведомление отправлено на почту.')
      setToastOpen(true)
    } catch (e: any) {
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось отменить назначение рецензента'
      setReviewListError(String(message))
      setCancelReviewer(null)
    } finally {
      setCancelReviewerLoading(false)
    }
  }

  const getKeywordLabel = (keyword: KeywordOut, targetLang: 'ru' | 'en' | 'kz' = lang) => (
    (targetLang === 'ru' ? keyword.title_ru : targetLang === 'en' ? keyword.title_en : keyword.title_kz)
    || keyword.title_ru
    || keyword.title_en
    || keyword.title_kz
    || '—'
  )

  const keywordModalText = useMemo(() => {
    if (pageLang === 'en') {
      return {
        title: 'Keyword',
        intro: 'Compare the selected keyword in all available languages.',
        labels: { ru: 'Russian', en: 'English', kz: 'Kazakh' },
        close: 'Close',
        openHint: 'View in all languages',
      }
    }
    if (pageLang === 'kz') {
      return {
        title: 'Кілт сөз',
        intro: 'Таңдалған кілт сөзді барлық қолжетімді тілдерде қарап шығыңыз.',
        labels: { ru: 'Орысша', en: 'Ағылшынша', kz: 'Қазақша' },
        close: 'Жабу',
        openHint: 'Барлық тілде қарау',
      }
    }
    return {
      title: 'Ключевое слово',
      intro: 'Просмотр выбранного ключевого слова на всех доступных языках.',
      labels: { ru: 'Русский', en: 'English', kz: 'Қазақша' },
      close: 'Закрыть',
      openHint: 'Посмотреть на всех языках',
    }
  }, [pageLang])

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
        </div>
        <div className="lang-switch editor-form-lang-switch" aria-label="Язык формы статьи">
          {(['ru','en','kz'] as const).map((l) => (
            <button
              type="button"
              key={l}
              className={`lang-chip ${lang === l ? 'lang-chip--active' : ''}`}
              aria-pressed={lang === l}
              onClick={() => setArticleFormLang(l)}
            >
              {l.toUpperCase()}
            </button>
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
              {data.status === 'published' && isEditor && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a className="button button--primary" href={`/cabinet/editorial2/${data.id}/edit`}>Редактировать</a>
                </div>
              )}
              {data.status !== 'rejected' && data.status !== 'published' && (
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
                      <button className="button button--warn" disabled={statusUpdating} onClick={() => setIsRevisionOpen(true)}>
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
              <span className="meta-label">Тип:</span> {formatArticleType(data.article_type, pageLang)}
              <span className="dot">•</span>
              <span className="meta-label">Статус:</span> {formatArticleStatus(data.status, pageLang)}
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
                  {pageLang === 'ru' ? 'Аннотация' : pageLang === 'en' ? 'Abstract' : 'Аңдатпа'}
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{abstract}</p>
              </div>
            )}
          </div>

          <CollapsibleSection title="Авторы" defaultOpen>
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
          </CollapsibleSection>

          <CollapsibleSection title="Ключевые слова" defaultOpen>
            {data.keywords.length === 0 ? (
              <div className="table__empty">Ключевые слова не указаны.</div>
            ) : (
              <div className="pill-list">
                {data.keywords.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className="pill pill--ghost keyword-pill-button"
                    title={keywordModalText.openHint}
                    onClick={() => {
                      setSelectedKeyword(k)
                      setKeywordModalOpen(true)
                    }}
                  >
                    {getKeywordLabel(k)}
                  </button>
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Файлы" defaultOpen>
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

            {isEditor && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Загрузка файла антиплагиата</h4>
                <p className="form-hint" style={{ marginTop: 0 }}>Поддерживаемые форматы: PDF, DOC, DOCX, ZIP. Файл будет привязан к статье.</p>
                {antiError && <div className="alert error" style={{ marginBottom: '0.5rem' }}>Ошибка: {antiError}</div>}
                {antiSuccess && <div className="alert" style={{ marginBottom: '0.5rem' }}>{antiSuccess}</div>}
                <div
                  onDragOver={(e) => { e.preventDefault(); setAntiDragActive(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setAntiDragActive(false) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setAntiDragActive(false)
                    setAntiError(null)
                    setAntiSuccess(null)
                    const f = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null
                    if (f) setAntiFile(f)
                  }}
                  style={{
                    border: '2px dashed ' + (antiDragActive ? '#4a90e2' : '#ccc'),
                    borderRadius: 8,
                    padding: '1rem',
                    background: antiDragActive ? 'rgba(74,144,226,0.06)' : '#fafafa',
                    transition: 'all 0.15s ease',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      id="anti-file-input"
                      type="file"
                      accept="application/pdf,.pdf,.doc,.docx,.zip"
                      onChange={(e) => {
                        setAntiError(null)
                        setAntiSuccess(null)
                        const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                        setAntiFile(f)
                      }}
                    />
                    <label htmlFor="anti-file-input" className="button button--ghost button--compact">Выбрать файл</label>
                    <span style={{ color: '#666' }}>или перетащите сюда</span>
                  </div>
                  {antiFile && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge">{antiFile.name}</span>
                      <span className="form-hint">{(antiFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <button className="button button--ghost button--compact" onClick={() => setAntiFile(null)}>Очистить</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="button button--primary"
                    disabled={!antiFile || antiUploading}
                    onClick={async () => {
                      if (!antiFile || !data?.id) return
                      setAntiUploading(true)
                      setAntiError(null)
                      setAntiSuccess(null)
                      try {
                        const uploaded = await api.uploadFile<FileOut>(antiFile)
                        try { console.log('[AntiUpload] /api/files response:', uploaded) } catch {}
                        // link to article via new endpoint
                        const updated = await api.setAntiplagiarismFile<ArticleOut>(data.id, { file_id: uploaded.id })
                        setData(updated)
                        setAntiSuccess('Файл антиплагиата загружен и привязан к статье')
                        setToastMessage('Антиплагиат загружен')
                        setToastOpen(true)
                        setAntiFile(null)
                      } catch (e: any) {
                        const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить/привязать файл антиплагиата'
                        setAntiError(String(message))
                      } finally {
                        setAntiUploading(false)
                      }
                    }}
                  >{antiUploading ? 'Загружается...' : 'Загрузить антиплагиат'}</button>
                  <button
                    className="button button--ghost"
                    disabled={!antiFile || antiUploading}
                    onClick={() => setAntiFile(null)}
                  >Отмена</button>
                </div>
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Версии" defaultOpen>
            {data.versions.length === 0 ? (
              <div className="table__empty">Версий пока нет.</div>
            ) : (
              <div className="table">
                <div className="table__head">
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
          </CollapsibleSection>



          <CollapsibleSection title="Комментарии и переписка" defaultOpen>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong>История общения по статье</strong>
                <div className="form-hint">Сообщения редакции автору и комментарии рецензентов собраны в одном месте.</div>
              </div>
              <button type="button" className="button button--ghost button--compact" disabled={correspondence.length === 0} onClick={downloadCorrespondence}>
                Скачать историю переписки
              </button>
            </div>
            {correspondenceError && <div className="alert error" style={{ marginTop: '0.75rem' }}>Ошибка: {correspondenceError}</div>}
            {correspondenceLoading ? (
              <div className="loading">Загрузка переписки...</div>
            ) : correspondence.length === 0 ? (
              <div className="table__empty">Переписки с автором пока нет.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                {correspondence.map((item) => (
                  <article key={item.id} style={{ border: '1px solid #e3e3e3', borderRadius: 8, padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <strong>{item.title}</strong>
                      <span className="table__meta">{new Date(item.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="table__meta" style={{ marginTop: '0.25rem' }}>Редакция → автор</div>
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{item.message}</p>
                  </article>
                ))}
              </div>
            )}
            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Комментарии рецензентов</h4>
            {articleReviewComments.length === 0 ? (
              <div className="table__empty">Комментариев рецензентов пока нет.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {articleReviewComments.map((review) => {
                  const reviewer = reviewList.find((item) => item.reviewer_id === review.reviewer_id)?.reviewer
                  return (
                    <article key={review.id} style={{ border: '1px solid #e3e3e3', borderRadius: 8, padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <strong>{reviewer?.full_name || `Рецензент ID: ${review.reviewer_id}`}</strong>
                        {review.updated_at && <span className="table__meta">{new Date(review.updated_at).toLocaleString('ru-RU')}</span>}
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{review.comments}</p>
                    </article>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Рецензенты" defaultOpen>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="button button--primary" disabled={aiReviewLoading} onClick={requestAIReview}>
                {aiReviewLoading ? 'ИИ формирует рецензию…' : 'Запросить ИИ-рецензию'}
              </button>
              {data.status !== 'rejected' && (
                <button className="button button--primary" onClick={() => setIsAddReviewerOpen(true)}>Добавить рецензента</button>
              )}
            </div>
            {reviewListError && <div className="alert error">Ошибка: {reviewListError}</div>}
            {reviewListLoading ? (
              <div className="loading">Загрузка рецензентов...</div>
            ) : reviewList.length === 0 && !hasAIReviewer ? (
              <div className="table__empty">Рецензенты пока не назначены.</div>
            ) : (
              <div className="table table--article-reviewers">
                <div className="table__head">
                  <span>Рецензент</span>
                  <span>Email</span>
                  <span>Дедлайн</span>
                  <span>Статус</span>
                  <span>Рекомендация рецензента</span>
                </div>
                <div className="table__body">
                  {hasAIReviewer && (
                    <div className="table__row table__row--align ai-reviewer-row">
                      <div className="table__cell">
                        <div className="table__title">
                          <button type="button" className="ai-reviewer-link" onClick={() => setIsAIReviewModalOpen(true)}>
                            ИИ-рецензент
                          </button>
                        </div>
                        <div className="table__meta">{aiModel || 'OpenAI'} · дополнительная рецензия</div>
                      </div>
                      <div className="table__cell">—</div>
                      <div className="table__cell">—</div>
                      <div className="table__cell">
                        {renderStatusBadge(aiReviewLoading ? 'in_progress' : aiReviewError ? 'failed' : 'completed')}
                      </div>
                      <div className="table__cell">
                        {aiRecommendationLabel ? (
                          <button type="button" className="ai-reviewer-link" onClick={() => setIsAIReviewModalOpen(true)}>
                            <span className={`badge ai-recommendation ai-recommendation--${aiRecommendation}`}>{aiRecommendationLabel}</span>
                          </button>
                        ) : '—'}
                      </div>
                    </div>
                  )}
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
                        <div className="table__cell">
                          {renderStatusBadge(r.status)}
                          {r.status !== 'completed' ? (
                            <button
                              type="button"
                              className="button button--danger button--compact reviewer-cancel-button"
                              onClick={() => setCancelReviewer({ id: r.reviewer_id, name: fullName })}
                            >
                              Отменить назначение
                            </button>
                          ) : null}
                        </div>
                        <div className="table__cell">{renderRecommendationBadge(r.recommendation, r.status)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CollapsibleSection>
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
                <div><strong>Страна:</strong> {getCountryLabel(selectedAuthor.country) || '—'}</div>
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

      {keywordModalOpen && selectedKeyword && (
        <div className="modal-backdrop" onClick={() => setKeywordModalOpen(false)}>
          <div className="modal keyword-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{keywordModalText.title}</h3>
              <button className="modal__close" onClick={() => setKeywordModalOpen(false)}>×</button>
            </div>
            <div className="modal__body keyword-modal__body">
              <div className="keyword-modal__intro">
                <p className="keyword-modal__eyebrow">{getKeywordLabel(selectedKeyword)}</p>
                <p style={{ margin: 0 }}>{keywordModalText.intro}</p>
              </div>
              <div className="keyword-modal__translations">
                {(['ru', 'en', 'kz'] as const).map((keywordLang) => (
                  <div key={keywordLang} className="keyword-modal__translation">
                    <div className="keyword-modal__translation-label">{keywordModalText.labels[keywordLang]}</div>
                    <div className="keyword-modal__translation-value">{getKeywordLabel(selectedKeyword, keywordLang)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="button button--primary" onClick={() => setKeywordModalOpen(false)}>{keywordModalText.close}</button>
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

      {isRevisionOpen && (
        <div className="modal-backdrop" onClick={() => setIsRevisionOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Отправить на доработку</h3>
              <button className="modal__close" onClick={() => setIsRevisionOpen(false)}>×</button>
            </div>
            <div className="modal__body">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Комментарии для автора</label>
              <textarea
                className="text-input"
                style={{ width: '100%', minHeight: '160px' }}
                placeholder="Опишите, что нужно доработать..."
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
              />
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="button button--ghost" onClick={() => setIsRevisionOpen(false)}>Отмена</button>
              <button className="button button--warn" disabled={statusUpdating} onClick={handleSendForRevision}>Отправить на доработку</button>
            </div>
          </div>
        </div>
      )}

      {/* Removed old review details modal tied to mock data */}

      {isAddReviewerOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddReviewerOpen(false)}>
          <div className="modal modal--wide modal--reviewers" onClick={(e) => e.stopPropagation()}>
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
                  <span>ORCID</span>
                  <span>Область науки</span>
                  <span>Язык</span>
                  <span>Действия</span>
                </div>
                <div className="table__body">
                  {availableReviewers.length === 0 ? (
                    <div className="table__row">
                      <div className="table__cell" style={{ gridColumn: '1 / -1' }}>Активные рецензенты не найдены.</div>
                    </div>
                  ) : (
                    availableReviewers.map((r) => {
                      const isAssigned = assignedReviewerIds.has(r.id)
                      return (
                      <div className={`table__row table__row--align reviewer-modal__row${isAssigned ? ' reviewer-modal__row--assigned' : ''}`} key={r.id}>
                        <div className="table__cell reviewer-modal__cell reviewer-modal__identity">
                          <div className="table__title">{r.full_name}</div>
                          {r.phone ? <div className="table__meta">{r.phone}</div> : null}
                        </div>
                        <div className="table__cell">{r.email ?? '—'}</div>
                        <div className="table__cell">{r.organization ?? '—'}</div>
                        <div className="table__cell reviewer-modal__mono">
                          {r.orcid ? (
                            <a href={`https://orcid.org/${r.orcid}`} target="_blank" rel="noreferrer">{r.orcid}</a>
                          ) : '—'}
                        </div>
                        <div className="table__cell">{formatReviewerScience(r)}</div>
                        <div className="table__cell">{r.preferred_language?.toUpperCase?.() ?? '—'}</div>
                        <div className="table__cell table__cell--actions reviewer-modal__actions">
                          {isAssigned ? (
                            <span className="badge badge--success">Назначен</span>
                          ) : data!.status !== 'rejected' && assigningReviewerId === r.id ? (
                            <div className="reviewer-modal__assign-form">
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
                    )})
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

      {isAIReviewModalOpen && (
        <div className="modal-backdrop" onClick={() => !aiReviewLoading && setIsAIReviewModalOpen(false)}>
          <div className="modal modal--review-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0 }}>Рецензия ИИ-рецензента</h3>
                <div className="form-hint">{aiModel || 'OpenAI'} · дополнительная рецензия</div>
              </div>
              <button className="modal__close" disabled={aiReviewLoading} onClick={() => setIsAIReviewModalOpen(false)}>×</button>
            </div>
            <div className="modal__body" aria-live="polite">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div><strong>Статус:</strong> {renderStatusBadge(aiReviewLoading ? 'in_progress' : aiReviewError ? 'failed' : 'completed')}</div>
                {aiRecommendationLabel && (
                  <span className={`badge ai-recommendation ai-recommendation--${aiRecommendation}`}>{aiRecommendationLabel}</span>
                )}
              </div>
              {aiReviewError && <div className="alert error">Ошибка: {aiReviewError}</div>}
              {aiReviewText ? <div className="ai-review-text">{aiReviewText}</div> : !aiReviewError && <div className="loading">Подготовка рецензии…</div>}
              {aiReviewLoading && <div className="ai-stream-cursor" aria-hidden="true" />}
              <div className="form-hint" style={{ marginTop: '1rem' }}>
                ИИ-рецензия носит рекомендательный характер и не заменяет независимых рецензентов и решение редактора.
              </div>
            </div>
            <div className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="button button--ghost" type="button" disabled={aiReviewLoading || !aiReviewText} onClick={downloadAIReviewAsWord}>
                Скачать рецензию в Word
              </button>
              <button className="button button--primary" disabled={aiReviewLoading} onClick={() => setIsAIReviewModalOpen(false)}>
                {aiReviewLoading ? 'Формируется…' : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isReviewModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsReviewModalOpen(false)}>
          <div className="modal modal--review-detail" onClick={(e) => e.stopPropagation()}>
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
                  <div className="review-detail__recommendation">
                    <strong>Рекомендация:</strong>
                    {renderRecommendationBadge(reviewDetails.recommendation, reviewDetails.status)}
                  </div>
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
              {reviewDetails?.status === 'completed' && (
                <button className="button button--ghost" type="button" onClick={downloadReviewAsWord}>
                  Скачать рецензию в Word
                </button>
              )}
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
        open={cancelReviewer !== null}
        title="Отмена рецензирования"
        message={`Вы уверены, что хотите отменить назначение рецензента ${cancelReviewer?.name || ''}? Рецензент получит уведомление и письмо на почту.`}
        confirmText={cancelReviewerLoading ? 'Отменяем...' : 'Отменить назначение'}
        cancelText="Назад"
        onConfirm={handleCancelReviewer}
        onCancel={() => (!cancelReviewerLoading && setCancelReviewer(null))}
      />
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

