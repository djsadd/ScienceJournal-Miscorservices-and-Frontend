import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import { formatArticleStatus } from '../shared/labels'
import type { Article, ArticleStatus, PagedResponse, Pagination } from '../shared/types'

const PAGE_SIZE = 20

type SearchFilters = { title: string; author: string; keywords: string }
const emptySearchFilters: SearchFilters = { title: '', author: '', keywords: '' }

const searchCopy = {
  ru: { title: 'Название', titlePlaceholder: 'Введите название статьи', author: 'Автор', authorPlaceholder: 'Имя или фамилия автора', keywords: 'Ключевые слова', keywordsPlaceholder: 'Например: экономика, ИИ', apply: 'Применить', applying: 'Поиск…' },
  en: { title: 'Title', titlePlaceholder: 'Enter article title', author: 'Author', authorPlaceholder: 'Author name or surname', keywords: 'Keywords', keywordsPlaceholder: 'For example: economics, AI', apply: 'Apply', applying: 'Searching…' },
  kz: { title: 'Атауы', titlePlaceholder: 'Мақала атауын енгізіңіз', author: 'Автор', authorPlaceholder: 'Автордың аты немесе тегі', keywords: 'Кілт сөздер', keywordsPlaceholder: 'Мысалы: экономика, ЖИ', apply: 'Қолдану', applying: 'Іздеу…' },
} as const

const copy = {
  ru: { title: 'Редакторская очередь', subtitle: 'Рукописи, требующие вашего внимания', all: 'Все статусы', loading: 'Загрузка рукописей…', empty: 'В этой очереди пока нет рукописей', error: 'Не удалось загрузить рукописи', priority: 'Приоритет', today: 'сегодня', day: ['день', 'дня', 'дней'], untitled: 'Без названия', author: 'Автор не указан', field: 'Направление не указано', open: 'Открыть рукопись', statusFilter: 'Фильтр по статусу' },
  en: { title: 'Editorial queue', subtitle: 'Manuscripts that require your attention', all: 'All statuses', loading: 'Loading manuscripts…', empty: 'There are no manuscripts in this queue', error: 'Unable to load manuscripts', priority: 'Priority', today: 'today', day: ['day', 'days', 'days'], untitled: 'Untitled', author: 'Author not specified', field: 'Field not specified', open: 'Open manuscript', statusFilter: 'Filter by status' },
  kz: { title: 'Редактор кезегі', subtitle: 'Назар аударуды қажет ететін қолжазбалар', all: 'Барлық күйлер', loading: 'Қолжазбалар жүктелуде…', empty: 'Бұл кезекте қолжазбалар жоқ', error: 'Қолжазбаларды жүктеу мүмкін болмады', priority: 'Басымдық', today: 'бүгін', day: ['күн', 'күн', 'күн'], untitled: 'Атаусыз', author: 'Автор көрсетілмеген', field: 'Бағыт көрсетілмеген', open: 'Қолжазбаны ашу', statusFilter: 'Күй бойынша сүзгі' },
} as const

const statusMeta: Record<string, { ru: string; en: string; kz: string; tone: string }> = {
  submitted: { ru: 'Первичная проверка', en: 'Initial review', kz: 'Алғашқы тексеру', tone: 'rose' },
  editor_check: { ru: 'Решение редактора', en: 'Editor decision', kz: 'Редактор шешімі', tone: 'blue' },
  under_review: { ru: 'На рецензировании', en: 'Under review', kz: 'Рецензияда', tone: 'amber' },
  review_completed: { ru: 'Рецензирование завершено', en: 'Review completed', kz: 'Рецензия аяқталды', tone: 'green' },
  reviewer_check: { ru: 'Поиск рецензента', en: 'Reviewer search', kz: 'Рецензент іздеу', tone: 'amber' },
  in_review: { ru: 'На рецензировании', en: 'Under review', kz: 'Рецензияда', tone: 'amber' },
  sent_for_revision: { ru: 'После доработки', en: 'After revision', kz: 'Түзетуден кейін', tone: 'lilac' },
  revisions: { ru: 'После доработки', en: 'After revision', kz: 'Түзетуден кейін', tone: 'lilac' },
  accepted: { ru: 'Принято', en: 'Accepted', kz: 'Қабылданды', tone: 'green' },
  rejected: { ru: 'Отклонено', en: 'Rejected', kz: 'Қабылданбады', tone: 'gray' },
  published: { ru: 'Опубликовано', en: 'Published', kz: 'Жарияланды', tone: 'green' },
  withdrawn: { ru: 'Отозвано', en: 'Withdrawn', kz: 'Қайтарылды', tone: 'gray' },
  draft: { ru: 'Черновик', en: 'Draft', kz: 'Жоба', tone: 'gray' },
}

const titleOf = (a: Article, fallback: string) => a.title_ru || a.title_kz || a.title_en || a.title || fallback
const authorOf = (a: Article, fallback: string) => {
  const author = a.authors?.[0]
  if (!author) return fallback
  if (typeof author === 'string') return author
  return [author.first_name, author.patronymic, author.last_name].filter(Boolean).join(' ') || author.name || fallback
}
const ageOf = (a: Article) => {
  const time = new Date(a.updated_at || a.created_at || a.submittedAt || '').getTime()
  return Number.isNaN(time) ? 0 : Math.max(0, Math.floor((Date.now() - time) / 86_400_000))
}
const pluralDay = (days: number, forms: readonly [string, string, string]) => {
  const n10 = days % 10, n100 = days % 100
  const form = n10 === 1 && n100 !== 11 ? forms[0] : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? forms[1] : forms[2]
  return `${days} ${form}`
}

export default function EditorialPortfolioPage() {
  const { lang } = useLanguage()
  const locale = lang === 'en' || lang === 'kz' ? lang : 'ru'
  const t = copy[locale]
  const searchText = searchCopy[locale]
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all')
  const [searchDraft, setSearchDraft] = useState<SearchFilters>(emptySearchFilters)
  const [appliedSearch, setAppliedSearch] = useState<SearchFilters>(emptySearchFilters)
  const [statusOptions, setStatusOptions] = useState<ArticleStatus[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.getUnassignedArticles<PagedResponse<Article>>({
      status: statusFilter,
      title: appliedSearch.title || undefined,
      author_name: appliedSearch.author || undefined,
      keywords: appliedSearch.keywords || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((response) => { if (active) { setArticles(response.items || []); setPagination(response.pagination); setError(null) } })
      .catch((reason) => { if (active) setError(reason?.bodyJson?.detail || reason?.message || t.error) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [appliedSearch, page, statusFilter, t.error])

  useEffect(() => {
    let active = true
    api.getArticleStatuses<string[]>({ scope: 'unassigned' })
      .then((statuses) => {
        if (!active) return
        setStatusOptions((Array.isArray(statuses) ? statuses : []).filter((status): status is ArticleStatus => typeof status === 'string'))
      })
      .catch(() => { if (active) setStatusOptions([]) })
    return () => { active = false }
  }, [])

  const visible = articles
  const currentPage = pagination?.page ?? page
  const totalPages = Math.max(1, pagination?.total_pages ?? 1)
  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index)
  }, [currentPage, totalPages])
  const selectStatus = (status: ArticleStatus | 'all') => {
    setStatusFilter(status)
    setPage(1)
  }
  const updateSearch = (field: keyof SearchFilters, value: string) => {
    setSearchDraft((current) => ({ ...current, [field]: value }))
  }
  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch({
      title: searchDraft.title.trim(),
      author: searchDraft.author.trim(),
      keywords: searchDraft.keywords.trim(),
    })
  }

  return <div className="editorial-queue"><section className="editorial-queue__panel">
    <header className="editorial-queue__header">
      <div><h1 className="page-title editorial-queue__title">{t.title}</h1></div>
      <div className="editorial-queue__filter" aria-label={t.statusFilter} role="group">
        <button type="button" className={`editorial-queue__filter-button ${statusFilter === 'all' ? 'editorial-queue__filter-button--active' : ''}`} aria-pressed={statusFilter === 'all'} onClick={() => selectStatus('all')}>{t.all}</button>
        {statusOptions.map((status) => <button type="button" key={status} className={`editorial-queue__filter-button ${statusFilter === status ? 'editorial-queue__filter-button--active' : ''}`} aria-pressed={statusFilter === status} onClick={() => selectStatus(status)}>{formatArticleStatus(status, locale)}</button>)}
      </div>
    </header>
    <form className="editorial-search" onSubmit={applySearch}>
      <label className="editorial-search__field">
        <span>{searchText.title}</span>
        <input type="search" value={searchDraft.title} onChange={(event) => updateSearch('title', event.target.value)} placeholder={searchText.titlePlaceholder} />
      </label>
      <label className="editorial-search__field">
        <span>{searchText.author}</span>
        <input type="search" value={searchDraft.author} onChange={(event) => updateSearch('author', event.target.value)} placeholder={searchText.authorPlaceholder} />
      </label>
      <label className="editorial-search__field">
        <span>{searchText.keywords}</span>
        <input type="search" value={searchDraft.keywords} onChange={(event) => updateSearch('keywords', event.target.value)} placeholder={searchText.keywordsPlaceholder} />
      </label>
      <button className="editorial-search__submit" type="submit" disabled={loading}>
        <span aria-hidden="true">⌕</span>{loading ? searchText.applying : searchText.apply}
      </button>
    </form>
    {error ? <div className="editorial-queue__state editorial-queue__state--error">{t.error}: {error}</div> : null}
    {loading ? <div className="editorial-queue__state">{t.loading}</div> : null}
    {!loading && !error && visible.length === 0 ? <div className="editorial-queue__state">{t.empty}</div> : null}
    {!loading && !error ? <div className="editorial-queue__list">{visible.map((article) => {
      const meta = statusMeta[article.status]
      const days = ageOf(article)
      const priority = article.status === 'submitted' && days <= 1
      const year = new Date(article.created_at || article.submittedAt || Date.now()).getFullYear()
      const code = `${year}-${String(article.id).padStart(3, '0')}`
      return <article className="manuscript-row" key={article.id}>
        <span className="manuscript-row__check" aria-hidden="true" />
        <div className="manuscript-row__main"><div className="manuscript-row__code">№ {code}{priority ? <span>{t.priority}</span> : null}</div><h2>{titleOf(article, t.untitled)}</h2><div className="manuscript-row__meta"><span>{authorOf(article, t.author)}</span><i>·</i><span>{article.specialty || t.field}</span></div></div>
        <div className="manuscript-row__status"><span className={`queue-status queue-status--${meta?.tone || 'gray'}`}>{formatArticleStatus(article.status, locale)}</span><small>{days === 0 ? t.today : pluralDay(days, t.day)}</small></div>
        <Link className="manuscript-row__open" to={`/cabinet/editorial2/${article.id}`} aria-label={`${t.open}: ${titleOf(article, t.untitled)}`}><span aria-hidden="true">›</span></Link>
      </article>
    })}</div> : null}
    {!loading && !error && pagination && pagination.total_count > 0 ? <footer className="editorial-queue__pagination">
      <span className="pagination__meta">{currentPage} / {totalPages} · {pagination.total_count}</span>
      <div className="pagination" aria-label="Pagination">
        <button type="button" className="button button--ghost button--compact" disabled={!pagination.has_prev} onClick={() => setPage(1)} aria-label="First page">«</button>
        <button type="button" className="button button--ghost button--compact" disabled={!pagination.has_prev} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page">‹</button>
        <div className="pagination__pages">
          {visiblePages.map((pageNumber) => <button key={pageNumber} type="button" className={`button button--ghost button--compact pagination__page ${pageNumber === currentPage ? 'pagination__page--active' : ''}`} aria-current={pageNumber === currentPage ? 'page' : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
        </div>
        <button type="button" className="button button--ghost button--compact" disabled={!pagination.has_next} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next page">›</button>
        <button type="button" className="button button--ghost button--compact" disabled={!pagination.has_next} onClick={() => setPage(totalPages)} aria-label="Last page">»</button>
      </div>
    </footer> : null}
  </section></div>
}
