import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../shared/components/Badge'
import Alert from '../../shared/components/Alert'
import ConfirmModal from '../../shared/components/ConfirmModal'
import { useLanguage } from '../../shared/LanguageContext'
import { formatArticleStatus, formatArticleType, type Lang } from '../../shared/labels'
import { api } from '../../api/client'
import './AuthorSubmissions.css'

type AuthorDto = {
  id: number
  last_name: string
  last_name_ru?: string | null
  last_name_en?: string | null
  last_name_kz?: string | null
}

type ArticleDto = {
  id: number
  title_ru?: string | null
  title_en?: string | null
  title_kz?: string | null
  status: string
  article_type: string
  created_at: string
  authors?: AuthorDto[]
}

interface WithdrawResponse {
  id: number
  status: string
  message: string
}

type StatusGroup = 'all' | 'editable' | 'inProgress' | 'finished'
type Notice = 'loadError' | 'withdrawError' | 'withdrawn'

const ALL_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'review_completed',
  'editor_check',
  'reviewer_check',
  'sent_for_revision',
  'accepted',
  'published',
  'rejected',
  'withdrawn',
]
// Matches the statuses the backend accepts in PUT /articles/{id} from the author
const EDITABLE_STATUSES = ['sent_for_revision', 'withdrawn']
const ARTICLE_TYPES = ['original', 'review']

const statusGroups: Record<StatusGroup, string[]> = {
  all: ALL_STATUSES,
  editable: EDITABLE_STATUSES,
  inProgress: ['draft', 'submitted', 'under_review', 'review_completed', 'editor_check', 'reviewer_check', 'accepted'],
  finished: ['published', 'rejected'],
}
const groupOrder: StatusGroup[] = ['all', 'editable', 'inProgress', 'finished']

const copy = {
  ru: {
    title: 'Мои статьи',
    subtitle: 'Статусы рукописей и действия по ним.',
    submit: 'Подать статью',
    groups: { all: 'Все', editable: 'Можно редактировать', inProgress: 'На рассмотрении', finished: 'Завершённые' },
    search: 'Поиск',
    searchPlaceholder: 'Название или номер статьи',
    status: 'Статус',
    type: 'Тип',
    year: 'Год',
    any: 'Все',
    reset: 'Сбросить',
    shown: 'Показано',
    of: 'из',
    columns: { number: '№', article: 'Статья', type: 'Тип', status: 'Статус', date: 'Дата подачи', actions: 'Действия' },
    sortNewest: 'Сначала новые',
    sortOldest: 'Сначала старые',
    view: 'Просмотреть',
    edit: 'Редактировать',
    withdraw: 'Отозвать',
    loading: 'Загрузка…',
    empty: 'У вас пока нет статей',
    emptyFiltered: 'Ничего не найдено по выбранным фильтрам',
    loadError: 'Не удалось загрузить статьи',
    withdrawError: 'Не удалось отозвать статью. Попробуйте позже.',
    withdrawn: 'Статья отозвана. Теперь её можно отредактировать.',
    withdrawTitle: 'Отозвать статью?',
    withdrawMessage: 'После отзыва редакция приостановит рассмотрение рукописи.',
    cancel: 'Отмена',
  },
  en: {
    title: 'My articles',
    subtitle: 'Manuscript statuses and available actions.',
    submit: 'Submit article',
    groups: { all: 'All', editable: 'Editable', inProgress: 'In progress', finished: 'Finished' },
    search: 'Search',
    searchPlaceholder: 'Article title or number',
    status: 'Status',
    type: 'Type',
    year: 'Year',
    any: 'All',
    reset: 'Reset',
    shown: 'Showing',
    of: 'of',
    columns: { number: 'No.', article: 'Article', type: 'Type', status: 'Status', date: 'Submitted', actions: 'Actions' },
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    view: 'View',
    edit: 'Edit',
    withdraw: 'Withdraw',
    loading: 'Loading…',
    empty: 'You have no articles yet',
    emptyFiltered: 'Nothing matches the selected filters',
    loadError: 'Failed to load articles',
    withdrawError: 'Failed to withdraw the article. Please try again later.',
    withdrawn: 'The article was withdrawn. You can now edit it.',
    withdrawTitle: 'Withdraw this article?',
    withdrawMessage: 'After withdrawal the editorial office will suspend the review of the manuscript.',
    cancel: 'Cancel',
  },
  kz: {
    title: 'Менің мақалаларым',
    subtitle: 'Қолжазба мәртебелері және олар бойынша әрекеттер.',
    submit: 'Мақала жіберу',
    groups: { all: 'Барлығы', editable: 'Өңдеуге болады', inProgress: 'Қаралуда', finished: 'Аяқталған' },
    search: 'Іздеу',
    searchPlaceholder: 'Мақала атауы немесе нөмірі',
    status: 'Мәртебе',
    type: 'Түрі',
    year: 'Жыл',
    any: 'Барлығы',
    reset: 'Тазарту',
    shown: 'Көрсетілді',
    of: '/',
    columns: { number: '№', article: 'Мақала', type: 'Түрі', status: 'Мәртебе', date: 'Жіберілген күні', actions: 'Әрекеттер' },
    sortNewest: 'Алдымен жаңалары',
    sortOldest: 'Алдымен ескілері',
    view: 'Қарау',
    edit: 'Өңдеу',
    withdraw: 'Кері қайтару',
    loading: 'Жүктелуде…',
    empty: 'Сізде әлі мақала жоқ',
    emptyFiltered: 'Таңдалған сүзгілер бойынша ештеңе табылмады',
    loadError: 'Мақалаларды жүктеу мүмкін болмады',
    withdrawError: 'Мақаланы кері қайтару мүмкін болмады. Кейінірек қайталап көріңіз.',
    withdrawn: 'Мақала кері қайтарылды. Енді оны өңдеуге болады.',
    withdrawTitle: 'Мақаланы кері қайтару керек пе?',
    withdrawMessage: 'Кері қайтарылғаннан кейін редакция қолжазбаны қарауды тоқтата тұрады.',
    cancel: 'Болдырмау',
  },
} satisfies Record<Lang, unknown>

const dateLocale: Record<Lang, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
}

const icons = {
  view: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4',
  withdraw: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  reset: 'M6 6l12 12M18 6 6 18',
  sortDown: 'M12 5v14M6 13l6 6 6-6',
  sortUp: 'M12 19V5M6 11l6-6 6 6',
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h6',
}

const Icon = ({ path }: { path: string }) => (
  <svg
    className="author-articles-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
)

const getTitle = (article: ArticleDto, lang: Lang) =>
  article[`title_${lang}`] || article.title_ru || article.title_en || article.title_kz || ''

const getAuthors = (article: ArticleDto, lang: Lang) =>
  (article.authors ?? []).map((author) => author[`last_name_${lang}`] || author.last_name).join(', ')

const formatNumber = (id: number) => String(id).padStart(6, '0')

export function AuthorSubmissions() {
  const { lang } = useLanguage()
  const t = copy[lang]
  const [articles, setArticles] = useState<ArticleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [group, setGroup] = useState<StatusGroup>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [withdrawId, setWithdrawId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    api
      .get<ArticleDto[]>('/articles/my')
      .then(setArticles)
      .catch((error) => {
        console.error('Ошибка при загрузке /articles/my', error)
        setNotice('loadError')
      })
      .finally(() => setLoading(false))
  }, [])

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          articles
            .map((article) => new Date(article.created_at).getFullYear())
            .filter((year) => !Number.isNaN(year)),
        ),
      )
        .sort((a, b) => b - a)
        .map(String),
    [articles],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return articles
      .filter((article) => {
        const matchesGroup = statusGroups[group].includes(article.status)
        const matchesStatus = statusFilter === 'all' || article.status === statusFilter
        const matchesType = typeFilter === 'all' || article.article_type === typeFilter
        const matchesYear = yearFilter === 'all' || new Date(article.created_at).getFullYear().toString() === yearFilter
        const matchesQuery = [article.title_ru, article.title_en, article.title_kz, formatNumber(article.id)].some(
          (value) => value?.toLowerCase().includes(normalizedQuery),
        )
        return matchesGroup && matchesStatus && matchesType && matchesYear && matchesQuery
      })
      .sort((a, b) => {
        const difference = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return newestFirst ? -difference : difference
      })
  }, [articles, group, statusFilter, typeFilter, yearFilter, query, newestFirst])

  const hasActiveFilters = query !== '' || statusFilter !== 'all' || typeFilter !== 'all' || yearFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setYearFilter('all')
  }

  const changeGroup = (next: StatusGroup) => {
    setGroup(next)
    // The status list depends on the group, so the previous choice may not exist in it
    setStatusFilter('all')
  }

  const confirmWithdraw = async () => {
    if (withdrawId === null) return
    const id = withdrawId
    setWithdrawId(null)
    setBusyId(id)
    setNotice(null)
    try {
      const res = await api.post<WithdrawResponse>(`/articles/${id}/withdraw`)
      setArticles((prev) => prev.map((article) => (article.id === res.id ? { ...article, status: res.status } : article)))
      setNotice('withdrawn')
    } catch (e) {
      console.error('Ошибка при отзыве статьи', e)
      setNotice('withdrawError')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page author-articles">
      <header className="author-articles__header">
        <div>
          <h1 className="page-title">{t.title}</h1>
          <p className="author-articles__subtitle">{t.subtitle}</p>
        </div>
        <Link className="button button--primary" to="/cabinet/submission">
          <Icon path={icons.plus} />
          {t.submit}
        </Link>
      </header>

      <div className="author-articles-tabs" role="group" aria-label={t.status}>
        {groupOrder.map((key) => (
          <button
            key={key}
            type="button"
            className={`author-articles-tabs__tab ${group === key ? 'author-articles-tabs__tab--active' : ''}`}
            aria-pressed={group === key}
            onClick={() => changeGroup(key)}
          >
            {t.groups[key]}
            <span className="author-articles-tabs__count">
              {articles.filter((article) => statusGroups[key].includes(article.status)).length}
            </span>
          </button>
        ))}
      </div>

      <div className="author-articles-filters">
        <label className="author-articles-field author-articles-field--search">
          <span className="author-articles-field__label">{t.search}</span>
          <span className="author-articles-search">
            <Icon path={icons.search} />
            <input
              type="search"
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </span>
        </label>

        <label className="author-articles-field">
          <span className="author-articles-field__label">{t.status}</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t.any}</option>
            {statusGroups[group].map((status) => (
              <option key={status} value={status}>
                {formatArticleStatus(status, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="author-articles-field">
          <span className="author-articles-field__label">{t.type}</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{t.any}</option>
            {ARTICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatArticleType(type, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="author-articles-field">
          <span className="author-articles-field__label">{t.year}</span>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="all">{t.any}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="button button--ghost" onClick={resetFilters} disabled={!hasActiveFilters}>
          <Icon path={icons.reset} />
          {t.reset}
        </button>
      </div>

      {notice ? (
        <Alert variant={notice === 'withdrawn' ? 'success' : 'error'}>{t[notice]}</Alert>
      ) : null}

      {filtered.length > 0 ? (
        <>
          <div className="author-articles-table-wrap">
            <table className="author-articles-table">
              <thead>
                <tr>
                  <th scope="col">{t.columns.number}</th>
                  <th scope="col">{t.columns.article}</th>
                  <th scope="col">{t.columns.type}</th>
                  <th scope="col">{t.columns.status}</th>
                  <th scope="col" aria-sort={newestFirst ? 'descending' : 'ascending'}>
                    <button
                      type="button"
                      className="author-articles-table__sort"
                      title={newestFirst ? t.sortNewest : t.sortOldest}
                      onClick={() => setNewestFirst((prev) => !prev)}
                    >
                      {t.columns.date}
                      <Icon path={newestFirst ? icons.sortDown : icons.sortUp} />
                    </button>
                  </th>
                  <th scope="col" className="author-articles-table__actions-head">{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => {
                  const title = getTitle(article, lang)
                  const authors = getAuthors(article, lang)
                  const canEdit = EDITABLE_STATUSES.includes(article.status)
                  return (
                    <tr key={article.id} className={canEdit ? 'author-articles-table__row--editable' : undefined}>
                      <td className="author-articles-table__number">{formatNumber(article.id)}</td>
                      <td className="author-articles-table__article">
                        <Link className="author-articles-table__title" to={`/cabinet/my-articles/${article.id}`}>
                          {title}
                        </Link>
                        {authors ? <div className="author-articles-table__authors">{authors}</div> : null}
                      </td>
                      <td data-label={t.columns.type}>{formatArticleType(article.article_type, lang)}</td>
                      <td data-label={t.columns.status}>
                        <Badge status={article.status} label={formatArticleStatus(article.status, lang)} />
                      </td>
                      <td data-label={t.columns.date} className="author-articles-table__date">
                        <time dateTime={article.created_at}>
                          {new Date(article.created_at).toLocaleDateString(dateLocale[lang], {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </time>
                      </td>
                      <td className="author-articles-table__actions">
                        <Link
                          className="button button--ghost author-articles-button--icon"
                          to={`/cabinet/my-articles/${article.id}`}
                          title={t.view}
                          aria-label={`${t.view}: ${title}`}
                        >
                          <Icon path={icons.view} />
                        </Link>
                        {canEdit ? (
                          <Link
                            className="button button--ghost author-articles-button--icon"
                            to={`/cabinet/my-articles/${article.id}/edit`}
                            title={t.edit}
                            aria-label={`${t.edit}: ${title}`}
                          >
                            <Icon path={icons.edit} />
                          </Link>
                        ) : null}
                        {article.status === 'submitted' ? (
                          <button
                            type="button"
                            className="button button--ghost author-articles-button--icon author-articles-button--danger"
                            title={t.withdraw}
                            aria-label={`${t.withdraw}: ${title}`}
                            disabled={busyId === article.id}
                            onClick={() => setWithdrawId(article.id)}
                          >
                            <Icon path={icons.withdraw} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="author-articles__count">
            {t.shown} {filtered.length} {t.of} {articles.length}
          </p>
        </>
      ) : notice === 'loadError' ? null : (
        <div className="author-articles-empty">
          {loading ? (
            t.loading
          ) : (
            <>
              <Icon path={icons.document} />
              {articles.length === 0 ? t.empty : t.emptyFiltered}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        open={withdrawId !== null}
        title={t.withdrawTitle}
        message={t.withdrawMessage}
        confirmText={t.withdraw}
        cancelText={t.cancel}
        onConfirm={confirmWithdraw}
        onCancel={() => setWithdrawId(null)}
      />
    </div>
  )
}
