// Prefer env-configurable API base but fall back to the current host when the
// environment was built against localhost so remote clients talk to the server.
import type { ArticleStatus } from '../shared/types'

const envApiBase = (import.meta as any)?.env?.VITE_API_BASE as string | undefined

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`)
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`)
const safeParseUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const getFallbackBase = () => {
  if (runtimeOrigin) {
    try {
      return new URL('/api/', runtimeOrigin).toString()
    } catch {
      // Fall back to localhost if origin is malformed or not available
    }
  }
  return 'http://localhost/api/'
}

const resolvedApiBase = (() => {
  const fallback = getFallbackBase()
  const rawBase = ensureTrailingSlash(envApiBase || '/api/')
  const parsed = safeParseUrl(rawBase)
  const pathOnly = parsed ? parsed.pathname || '/' : rawBase
  const normalizedPath = ensureTrailingSlash(ensureLeadingSlash(pathOnly))

  if (runtimeOrigin) {
    try {
      // Always prefer the current origin/IP; only keep the path from env
      return ensureTrailingSlash(new URL(normalizedPath, runtimeOrigin).toString())
    } catch {
      // Fall through to other fallbacks
    }
  }

  if (parsed) {
    return ensureTrailingSlash(parsed.toString())
  }

  return ensureTrailingSlash(fallback)
})()

const API_BASE = resolvedApiBase
const TOKEN_KEY = 'sj_tokens'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  json?: unknown
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  tokenType?: string
}

export class ApiError extends Error {
  status: number
  bodyText: string
  bodyJson?: unknown
  url: string

  constructor(message: string, opts: { status: number; bodyText: string; bodyJson?: unknown; url: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.bodyText = opts.bodyText
    this.bodyJson = opts.bodyJson
    this.url = opts.url
  }
}

const buildUrl = (path: string, params?: RequestOptions['params']) => {
  const base = API_BASE
  const isAbsolute = /^https?:\/\//i.test(path)
  const url = isAbsolute
    ? new URL(path)
    : new URL(path.replace(/^\//, ''), base)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

const readTokens = (): AuthTokens | null => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as AuthTokens) : null
  } catch (e) {
    console.error('Failed to read tokens', e)
    return null
  }
}

const persistTokens = (tokens: AuthTokens | null) => {
  if (!tokens) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

let currentTokens = readTokens()
let refreshPromise: Promise<AuthTokens | null> | null = null

const doRefresh = async (): Promise<AuthTokens | null> => {
  if (!currentTokens?.refreshToken) return null
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: currentTokens?.refreshToken }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as { access_token: string; refresh_token?: string; token_type?: string }
        const tokens: AuthTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? currentTokens?.refreshToken,
          tokenType: data.token_type ?? 'bearer',
        }
        currentTokens = tokens
        persistTokens(tokens)
        return tokens
      } catch (err) {
        console.error('Token refresh failed', err)
        currentTokens = null
        persistTokens(null)
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

const request = async <T>(path: string, method: HttpMethod = 'GET', options: RequestOptions = {}): Promise<T> => {
  const { params, json, headers, ...rest } = options
  const url = buildUrl(path, params)
  const started = Date.now()

  try { console.log('[API] =>', method, url, json ? { body: json } : undefined) } catch {}

  const makeRequest = async () => {
    const isFormData = rest.body instanceof FormData

    const resolvedHeaders: HeadersInit = {
      ...(json && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      Accept: 'application/json',
      ...(currentTokens?.accessToken ? { Authorization: `Bearer ${currentTokens.accessToken}` } : {}),
      ...(headers || {}),
    }

    return fetch(url, {
      method,
      headers: resolvedHeaders,
      body: json ? JSON.stringify(json) : rest.body,
      ...rest,
    })
  }

  let response = await makeRequest()
  if (response.status === 401) {
    const refreshed = await doRefresh()
    if (refreshed) {
      try { console.log('[API] token refreshed, retrying', method, url) } catch {}
      response = await makeRequest()
    }
  }

  if (!response.ok) {
    const text = await response.text()
    let parsed: unknown | undefined
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = undefined
    }
    try { console.error('[API] <=', response.status, method, url, `${Date.now()-started}ms`, parsed ?? text) } catch {}
    const message = `API error ${response.status}`
    throw new ApiError(message, { status: response.status, bodyText: text, bodyJson: parsed, url })
  }

  if (response.status === 204) {
    try { console.log('[API] <=', response.status, method, url, `${Date.now()-started}ms`, '(no content)') } catch {}
    return undefined as T
  }
  const data = (await response.json()) as T
  try { console.log('[API] <=', response.status, method, url, `${Date.now()-started}ms`, data) } catch {}
  return data
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, 'GET', options),
  post: <T>(path: string, json?: unknown, options?: RequestOptions) => request<T>(path, 'POST', { ...options, json }),
  put: <T>(path: string, json?: unknown, options?: RequestOptions) => request<T>(path, 'PUT', { ...options, json }),
  patch: <T>(path: string, json?: unknown, options?: RequestOptions) => request<T>(path, 'PATCH', { ...options, json }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, 'DELETE', options),
  request,
  baseUrl: API_BASE,
  setTokens: (tokens: AuthTokens | null) => {
    currentTokens = tokens
    persistTokens(tokens)
  },
  getTokens: () => currentTokens,
  refreshTokens: () => doRefresh(),
  logout: () => {
    currentTokens = null
    persistTokens(null)
  },
  // File upload to File Storage (via API Gateway /api/files)
  uploadFile: async <T>(file: File) => {
    const fd = new FormData()
    // Endpoint expects field name "upload"
    fd.append('upload', file)
    return request<T>('/files/', 'POST', { body: fd })
  },
  // Layout records helper (optional, used by editor UI)
  createLayoutRecord: <T>(body: { article_id: number; volume_id?: number | null; file_id: string; file_url?: string }) =>
    request<T>('/layout/records', 'POST', { json: body }),
  getLayoutRecordsByArticle: <T>(articleId: number | string) =>
    request<T>(`/layout/articles/${articleId}/records`, 'GET'),
  // Domain-specific helpers
  getAuthors: <T>() => request<T>('/articles/authors', 'GET'),
  updateAuthor: <T>(authorId: number | string, body: Partial<{
    email: string | null
    prefix: string | null
    first_name: string | null
    patronymic: string | null
    last_name: string | null
    phone: string | null
    address: string | null
    country: string | null
    affiliation1: string | null
    affiliation2: string | null
    affiliation3: string | null
    is_corresponding: boolean | null
    orcid: string | null
    scopus_author_id: string | null
    researcher_id: string | null
  }>) => request<T>(`/articles/authors/${authorId}`, 'PATCH', { json: body }),
  getKeywords: <T>() => request<T>('/articles/keywords', 'GET'),
  getArticleStatuses: <T>(params?: { scope?: 'unassigned' }) => request<T>('/articles/statuses', 'GET', { params }),
  getUnassignedArticles: <T>(params?: {
    status?: ArticleStatus | 'all'
    author_name?: string
    year?: number
    article_type?: 'original' | 'review'
    keywords?: string
    search?: string
    page?: number
    page_size?: number
  }) => request<T>('/articles/unassigned', 'GET', { params }),
  getEditorArticleDetail: <T>(id: string | number) => request<T>(`/articles/editor/${id}`, 'GET'),
  getEditorArticleVersion: <T>(articleId: string | number, versionId: string | number) =>
    request<T>(`/articles/editor/${articleId}/versions/${versionId}`, 'GET'),
  // Editor-only update for published articles (keeps status = published, creates a new version snapshot)
  updateEditorPublishedArticle: <T>(articleId: string | number, body: Partial<{
    title_kz: string | null
    title_en: string | null
    title_ru: string | null
    abstract_kz: string | null
    abstract_en: string | null
    abstract_ru: string | null
    article_language: string | null
    doi: string | null
    article_type: 'original' | 'review' | null
    not_published_elsewhere: boolean | null
    plagiarism_free: boolean | null
    authors_agree: boolean | null
    generative_ai_info: string | null
    keyword_ids: number[] | null
    keywords: Array<{ title_kz?: string; title_en?: string; title_ru?: string }>
    author_ids: number[] | null
  }>) => request<T>(`/articles/editor/${articleId}`, 'PUT', { json: body }),
  // Fast article publication for editors
  quickPublishArticle: <T>(body: {
    title_kz: string
    title_en: string
    title_ru: string
    abstract_kz?: string
    abstract_en?: string
    abstract_ru?: string
    article_language?: string
    doi?: string
    article_type?: 'original' | 'review'
    layout_file_id?: string
    manuscript_file_id?: string
    author_info_file_id?: string
    generative_ai_info?: string
    keyword_ids?: number[]
    author_ids?: number[]
    keywords?: Array<{ title_kz?: string; title_en?: string; title_ru?: string }>
  }) => request<T>('/articles/quick-publish', 'POST', { json: body }),
  assignReviewers: <T>(articleId: string | number, body: { reviewer_ids: number[]; deadline?: string }) =>
    request<T>(`/articles/${articleId}/assign_reviewers`, 'POST', { json: body }),
  getArticleReviewers: <T>(articleId: string | number) => request<T>(`/articles/${articleId}/reviewers`, 'GET'),
  getReviewers: <T>(language?: 'ru' | 'kz') => request<T>('/users/reviewers', 'GET', { params: { language } }),
  getAdminUsers: <T>() => request<T>('/auth/admin/users', 'GET'),
  getAdminUserDetail: <T>(userId: number | string) => request<T>(`/auth/admin/users/${userId}`, 'GET'),
  updateMyContactProfile: <T>(body: { full_name?: string | null; phone?: string | null; organization?: string | null }) =>
    request<T>('/users/me/contact', 'PATCH', { json: body }),
  updateMyLanguage: <T>(preferredLanguage: 'ru' | 'en' | 'kz' | Array<'ru' | 'en' | 'kz'>) =>
    request<T>('/users/me/language', 'PATCH', { json: { preferred_language: preferredLanguage } }),
  updateMyProfileDetails: <T>(body: { academic_degrees: string[]; orcid?: string | null }) =>
    request<T>('/users/me/details', 'PATCH', { json: body }),
  updateMyReviewerScience: <T>(body: { reviewer_science_fields: string[]; reviewer_science_other?: string | null }) =>
    request<T>('/users/me/reviewer-science', 'PATCH', { json: body }),
  requestMyRole: <T>(role: string) =>
    request<T>('/users/me/role-requests', 'POST', { json: { role } }),
  getMyRoleRequests: <T>() => request<T>('/users/me/role-requests', 'GET'),
  getRoleRequests: <T>(status?: string) => request<T>('/users/role-requests', 'GET', { params: { status } }),
  decideRoleRequest: <T>(requestId: number | string, stage: 'editor' | 'admin', decision: 'approve' | 'reject', reason?: string) =>
    request<T>(`/users/role-requests/${requestId}/decision`, 'PATCH', {
      json: { stage, decision, ...(reason ? { reason } : {}) },
    }),
  getAdminUserStats: <T>() => request<T>('/auth/admin/users/stats', 'GET'),
  activateAdminUser: <T>(userId: number | string, isActive: boolean) =>
    request<T>(`/auth/admin/users/${userId}/activate`, 'PATCH', { json: { is_active: isActive } }),
  updateAdminUserRole: <T>(userId: number | string, role: string) =>
    request<T>(`/auth/admin/users/${userId}/role`, 'PATCH', { json: { role } }),
  resetAdminUserPassword: <T>(userId: number | string, newPassword?: string) =>
    request<T>(`/auth/admin/users/${userId}/reset-password`, 'POST', {
      json: newPassword ? { new_password: newPassword } : {},
    }),
  deleteAdminUser: <T>(userId: number | string) =>
    request<T>(`/auth/admin/users/${userId}`, 'DELETE'),
  // Change article status (editor role required)
  changeArticleStatus: <T>(articleId: string | number, status: string, options?: { comment_for_author?: string }) =>
    request<T>(`/articles/${articleId}/status`, 'PATCH', { json: { status, ...(options?.comment_for_author ? { comment_for_author: options.comment_for_author } : {}) } }),
  // Set antiplagiarism file (editor-only)
  setAntiplagiarismFile: <T>(articleId: string | number, body: { file_id?: string; file_url?: string }) =>
    request<T>(`/articles/${articleId}/antiplagiarism`, 'POST', { json: body }),
  // Reviews
  getReviewById: <T>(reviewId: number | string) => request<T>(`/reviews/${reviewId}`, 'GET'),
  getMyReviews: <T>(params?: { page?: number; page_size?: number }) => request<T>('/reviews/my-reviews', 'GET', { params }),
  getReviewDetail: <T>(reviewId: number | string) => request<T>(`/reviews/${reviewId}/detail`, 'GET'),
  updateReview: <T>(reviewId: number | string, body: unknown) => request<T>(`/reviews/${reviewId}`, 'PATCH', { json: body }),
  // Request resubmission for a review (editor role required)
  requestReviewResubmission: <T>(reviewId: number | string, deadlineIso?: string) => {
    const path = `/reviews/${reviewId}/request-resubmission`
    // Backend accepts empty PATCH or JSON with optional deadline
    return deadlineIso
      ? request<T>(path, 'PATCH', { json: { deadline: deadlineIso } })
      : request<T>(path, 'PATCH')
  },
  // Volumes (editor section "Мои тома")
  getVolumes: <T>(params?: { year?: number; number?: string; month?: number; active_only?: boolean }) =>
    request<T>('/volumes', 'GET', { params }),
  getVolumeById: <T>(id: number | string) => request<T>(`/volumes/${id}`, 'GET'),
  // Public volumes (guest archive)
  getPublicVolumes: <T>(params?: { year?: number; number?: string; month?: number }) =>
    request<T>('/volumes/public', 'GET', { params }),
  getPublicVolumeById: <T>(id: number | string) => request<T>(`/volumes/public/${id}`, 'GET'),
  createVolume: <T>(body: {
    year: number
    number: string
    month?: number | null
    title_kz?: string | null
    title_en?: string | null
    title_ru?: string | null
    description?: string | null
    is_active?: boolean
    article_ids?: number[]
    complete_issue_file_id?: string | null
    cover_file_id?: string | null
    contents_file_id?: string | null
    complete_issue_file_url?: string | null
    cover_file_url?: string | null
    contents_file_url?: string | null
  }) => request<T>('/volumes', 'POST', { json: body }),
  updateVolume: <T>(id: number | string, body: Partial<{
    year: number
    number: string
    month: number | null
    title_kz: string | null
    title_en: string | null
    title_ru: string | null
    description: string | null
    complete_issue_file_id: string | null
    cover_file_id: string | null
    contents_file_id: string | null
    complete_issue_file_url: string | null
    cover_file_url: string | null
    contents_file_url: string | null
    is_active: boolean
    article_ids: number[]
  }>) => request<T>(`/volumes/${id}`, 'PATCH', { json: body }),
  reorderVolumeArticle: <T>(volumeId: number | string, articleId: number | string, direction: 'up' | 'down') =>
    request<T>(`/volumes/${volumeId}/articles/${articleId}/order`, 'PATCH', { json: { direction } }),
  // Notifications
  getNotifications: <T>(params?: { status?: 'unread' | 'read'; limit?: number; offset?: number }) =>
    request<T>('/notifications', 'GET', { params }),
  markNotificationRead: <T>(id: number | string) =>
    request<T>(`/notifications/${id}/read`, 'POST'),
  deleteNotification: <T>(id: number | string) =>
    request<T>(`/notifications/${id}`, 'DELETE'),
}
