export type Role = 'author' | 'editor' | 'reviewer'

// Legacy statuses removed; using API statuses

export interface User {
  id: string
  name: string
  role: Role
  affiliation?: string
  expertise?: string[]
}

export interface Author {
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

export interface Keyword {
  id: number
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
}

export interface Article {
  id: string
  // Legacy fields used across UI
  title: string
  abstract: string
  specialty?: string
  submittedAt: string
  editorId?: string
  version?: number
  reviews?: Review[]
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  abstract_kz?: string | null
  abstract_en?: string | null
  abstract_ru?: string | null
  doi?: string | null
  status: 'submitted' | 'under_review' | 'accepted' | 'published' | 'withdrawn' | 'draft' | 'in_review' | 'revisions' | 'rejected'
  article_type?: 'original' | 'review'
  responsible_user_id?: number | null
  manuscript_file_url?: string | null
  antiplagiarism_file_url?: string | null
  author_info_file_url?: string | null
  cover_letter_file_url?: string | null
  // Верстка (если доступна для опубликованных статей)
  layout_file_url?: string | null
  not_published_elsewhere?: boolean
  plagiarism_free?: boolean
  authors_agree?: boolean
  generative_ai_info?: string | null
  created_at?: string
  updated_at?: string
  current_version_id?: number | null
  // Some mock data uses string[]; relax to any[] to satisfy both
  authors: any[]
  keywords?: Keyword[]
  versions?: unknown[]
}

export interface Pagination {
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PagedResponse<T> {
  items: T[]
  pagination: Pagination
}

// Legacy/demo types needed by mockData and UI
export interface Review {
  id: string
  articleId: string
  reviewerId: string
  recommendation: 'accept' | 'minor' | 'major' | 'reject'
  submittedAt: string
  comments: string
  round: number
  isAnonymous: boolean
}

export interface ReviewAssignment {
  id: string
  articleId: string
  reviewerId: string
  dueAt: string
  round: number
  isAnonymous: boolean
}

export interface JournalData {
  users: User[]
  articles: Article[]
  assignments: ReviewAssignment[]
}

// Removed legacy demo types (Review, ReviewAssignment, JournalData) to avoid conflicts

// API: Review item returned by `/reviews/my-reviews`
export interface ReviewItem {
  id: number
  article_id: number
  reviewer_id: number
  comments: string | null
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject' | string
  status: 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'resubmission' | string
  importance_applicability: string | null
  novelty_application: string | null
  originality: string | null
  innovation_product: string | null
  results_significance: string | null
  coherence: string | null
  style_quality: string | null
  editorial_compliance: string | null
  deadline: string | null
  created_at: string
  updated_at: string
}

// API: Detailed review response `/reviews/{review_id}/detail`
export interface ReviewDetail {
  id?: number
  article_id?: number
  article_title?: string | null
  comments: string | null
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject' | string | null
  status: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'resubmission' | string
  deadline: string | null
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

// API: Volume with embedded articles (simplified shape based on backend VolumeBase + joined articles)
export interface Volume {
  id?: number
  year: number
  number: number
  month?: number | null
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  description?: string | null
  is_active: boolean
  // When joined load includes articles with authors & keywords
  articles?: Article[]
}
