import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../api/client'
import Alert from '../../shared/components/Alert'
import { useLanguage } from '../../shared/LanguageContext'
import { toApiFilesUrl } from '../../shared/url'
import './LayoutBoard.css'

type LayoutStatus = 'pending' | 'in_progress' | 'completed'
type StatusTab = LayoutStatus | 'all'
type LayoutTask = { id: string; article_id: number; article_title: string; source_file_url?: string | null; instructions?: string | null; status: LayoutStatus; created_at?: string | null }
type FileOut = { id: string; url?: string }
type Filters = { title: string; articleId: string; instructions: string }

const PAGE_SIZE = 10
const emptyFilters: Filters = { title: '', articleId: '', instructions: '' }
const statusTabs: StatusTab[] = ['all', 'pending', 'in_progress', 'completed']
const tones: Record<LayoutStatus, string> = { pending: 'amber', in_progress: 'blue', completed: 'green' }
const dateLocale = { ru: 'ru-RU', en: 'en-GB', kz: 'kk-KZ' } as const

const copy = {
  ru: {
    title: 'Доска макетов',
    subtitle: 'Задачи на вёрстку и отправка готовых файлов',
    statuses: { all: 'Все', pending: 'Ожидает', in_progress: 'В работе', completed: 'Завершена' },
    statusGroup: 'Фильтр по статусу',
    articleTitle: 'Название',
    titlePlaceholder: 'Введите название статьи',
    articleId: 'ID статьи',
    articleIdPlaceholder: 'Например: 125',
    comment: 'Комментарий',
    commentPlaceholder: 'Текст задания от редактора',
    reset: 'Сбросить',
    columns: { number: 'ID', task: 'Задача', status: 'Статус', date: 'Дата', source: 'Исходник', actions: 'Действия' },
    sortNewest: 'Сначала новые',
    sortOldest: 'Сначала старые',
    noInstructions: 'Без дополнительных указаний',
    download: 'Скачать',
    noSource: 'Не прикреплён',
    claim: 'Взять в работу',
    chooseFile: 'Выбрать готовый файл',
    send: 'Отправить вёрстку',
    sending: 'Отправка…',
    done: 'Файл отправлен редактору',
    loading: 'Загрузка задач…',
    empty: 'Задач пока нет',
    emptyFiltered: 'По выбранным фильтрам задач нет',
    shown: 'Показано',
    of: 'из',
    pagination: 'Страницы',
    previous: 'Предыдущая страница',
    next: 'Следующая страница',
    page: 'Страница',
    loadError: 'Не удалось загрузить задачи',
    claimError: 'Не удалось взять задачу',
    sendError: 'Не удалось отправить вёрстку',
  },
  en: {
    title: 'Layout board',
    subtitle: 'Layout tasks and delivery of finished files',
    statuses: { all: 'All', pending: 'Pending', in_progress: 'In progress', completed: 'Completed' },
    statusGroup: 'Filter by status',
    articleTitle: 'Title',
    titlePlaceholder: 'Enter the article title',
    articleId: 'Article ID',
    articleIdPlaceholder: 'For example: 125',
    comment: 'Comment',
    commentPlaceholder: 'Editor instructions',
    reset: 'Reset',
    columns: { number: 'ID', task: 'Task', status: 'Status', date: 'Date', source: 'Source', actions: 'Actions' },
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    noInstructions: 'No additional instructions',
    download: 'Download',
    noSource: 'Not attached',
    claim: 'Take task',
    chooseFile: 'Choose finished file',
    send: 'Send layout',
    sending: 'Sending…',
    done: 'File sent to the editor',
    loading: 'Loading tasks…',
    empty: 'There are no tasks yet',
    emptyFiltered: 'No tasks match the selected filters',
    shown: 'Showing',
    of: 'of',
    pagination: 'Pages',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page',
    loadError: 'Could not load tasks',
    claimError: 'Could not take the task',
    sendError: 'Could not send the layout',
  },
  kz: {
    title: 'Макет тақтасы',
    subtitle: 'Беттеу тапсырмалары және дайын файлдарды жіберу',
    statuses: { all: 'Барлығы', pending: 'Күтуде', in_progress: 'Жұмыста', completed: 'Аяқталды' },
    statusGroup: 'Күйі бойынша сүзгі',
    articleTitle: 'Атауы',
    titlePlaceholder: 'Мақала атауын енгізіңіз',
    articleId: 'Мақала ID',
    articleIdPlaceholder: 'Мысалы: 125',
    comment: 'Түсініктеме',
    commentPlaceholder: 'Редактор тапсырмасының мәтіні',
    reset: 'Тазарту',
    columns: { number: 'ID', task: 'Тапсырма', status: 'Күйі', date: 'Күні', source: 'Бастапқы файл', actions: 'Әрекеттер' },
    sortNewest: 'Алдымен жаңалары',
    sortOldest: 'Алдымен ескілері',
    noInstructions: 'Қосымша нұсқаулар жоқ',
    download: 'Жүктеп алу',
    noSource: 'Тіркелмеген',
    claim: 'Жұмысқа алу',
    chooseFile: 'Дайын файлды таңдау',
    send: 'Беттеуді жіберу',
    sending: 'Жіберілуде…',
    done: 'Файл редакторға жіберілді',
    loading: 'Тапсырмалар жүктелуде…',
    empty: 'Әзірге тапсырмалар жоқ',
    emptyFiltered: 'Таңдалған сүзгілер бойынша тапсырмалар жоқ',
    shown: 'Көрсетілді',
    of: '/',
    pagination: 'Беттер',
    previous: 'Алдыңғы бет',
    next: 'Келесі бет',
    page: 'Бет',
    loadError: 'Тапсырмаларды жүктеу мүмкін болмады',
    claimError: 'Тапсырманы алу мүмкін болмады',
    sendError: 'Беттеуді жіберу мүмкін болмады',
  },
} as const

const icons = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  reset: 'M6 6l12 12M18 6 6 18',
  sortDown: 'M12 5v14M6 13l6 6 6-6',
  sortUp: 'M12 19V5M6 11l6-6 6 6',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  check: 'M5 12.5 10 17 19 7',
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h6',
  previous: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
}

const Icon = ({ path }: { path: string }) => (
  <svg
    className="layout-board-icon"
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

const formatNumber = (id: number) => String(id).padStart(6, '0')

const getCreatedTime = (task: LayoutTask) => (task.created_at ? new Date(task.created_at).getTime() : 0)

// First, last and neighbouring pages; the rest collapse into a gap
const getPageItems = (current: number, total: number) => {
  const items: (number | 'gap')[] = []
  let previous = 0
  for (let page = 1; page <= total; page += 1) {
    if (page !== 1 && page !== total && Math.abs(page - current) > 1) continue
    if (page - previous > 1) items.push('gap')
    items.push(page)
    previous = page
  }
  return items
}

export function LayoutBoard() {
  const { lang } = useLanguage()
  const t = copy[lang] || copy.ru
  const [tasks, setTasks] = useState<LayoutTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [newestFirst, setNewestFirst] = useState(true)
  const [page, setPage] = useState(1)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    api.getLayoutTasks<LayoutTask[]>()
      .then((items) => { if (active) { setTasks(items); setError(null) } })
      .catch((e: any) => { if (active) setError(String(e?.bodyJson?.detail || e?.message || t.loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // The fallback text does not justify loading the tasks again when the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleTasks = useMemo(() => {
    const title = filters.title.trim().toLocaleLowerCase()
    const articleId = filters.articleId.trim()
    const instructions = filters.instructions.trim().toLocaleLowerCase()
    return tasks
      .filter((task) => (statusFilter === 'all' || task.status === statusFilter)
        && (!title || task.article_title.toLocaleLowerCase().includes(title))
        && (!articleId || String(task.article_id).includes(articleId))
        && (!instructions || (task.instructions || '').toLocaleLowerCase().includes(instructions)))
      .sort((a, b) => {
        const difference = getCreatedTime(a) - getCreatedTime(b)
        return newestFirst ? -difference : difference
      })
  }, [filters, newestFirst, statusFilter, tasks])

  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / PAGE_SIZE))
  // A claimed or sent task can leave the current tab and shorten the list
  const currentPage = Math.min(page, totalPages)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const pageTasks = visibleTasks.slice(firstIndex, firstIndex + PAGE_SIZE)
  const hasActiveFilters = Object.values(filters).some((value) => value.trim() !== '')

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const changeStatus = (status: StatusTab) => {
    setStatusFilter(status)
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setPage(1)
  }

  const toggleSort = () => {
    setNewestFirst((prev) => !prev)
    setPage(1)
  }

  const changePage = (next: number) => {
    setPage(next)
    tableRef.current?.scrollIntoView({ block: 'nearest' })
  }

  const claim = async (task: LayoutTask) => {
    setBusyId(task.id); setError(null)
    try {
      const next = await api.claimLayoutTask<LayoutTask>(task.id)
      setTasks((all) => all.map((item) => item.id === task.id ? next : item))
    } catch (e: any) { setError(String(e?.bodyJson?.detail || e?.message || t.claimError)) }
    finally { setBusyId(null) }
  }

  const complete = async (task: LayoutTask) => {
    const file = files[task.id]
    if (!file) return
    setBusyId(task.id); setError(null)
    try {
      const uploaded = await api.uploadFile<FileOut>(file)
      const next = await api.completeLayoutTask<LayoutTask>(task.id, { file_id: uploaded.id, file_url: uploaded.url })
      setTasks((all) => all.map((item) => item.id === task.id ? next : item))
      setFiles((all) => ({ ...all, [task.id]: undefined }))
    } catch (e: any) { setError(String(e?.bodyJson?.detail || e?.message || t.sendError)) }
    finally { setBusyId(null) }
  }

  return (
    <div className="layout-board">
      <header>
        <h1 className="layout-board__title">{t.title}</h1>
        <p className="layout-board__subtitle">{t.subtitle}</p>
      </header>

      <div className="layout-board-tabs" role="group" aria-label={t.statusGroup}>
        {statusTabs.map((status) => (
          <button
            key={status}
            type="button"
            className={`layout-board-tabs__tab ${statusFilter === status ? 'layout-board-tabs__tab--active' : ''}`}
            aria-pressed={statusFilter === status}
            onClick={() => changeStatus(status)}
          >
            {t.statuses[status]}
            <span className="layout-board-tabs__count">
              {status === 'all' ? tasks.length : tasks.filter((task) => task.status === status).length}
            </span>
          </button>
        ))}
      </div>

      <div className="layout-board-filters">
        <label className="layout-board-field">
          <span className="layout-board-field__label">{t.articleTitle}</span>
          <span className="layout-board-search">
            <Icon path={icons.search} />
            <input type="search" value={filters.title} onChange={(e) => updateFilter('title', e.target.value)} placeholder={t.titlePlaceholder} />
          </span>
        </label>
        <label className="layout-board-field">
          <span className="layout-board-field__label">{t.articleId}</span>
          <span className="layout-board-search">
            <input type="search" inputMode="numeric" value={filters.articleId} onChange={(e) => updateFilter('articleId', e.target.value)} placeholder={t.articleIdPlaceholder} />
          </span>
        </label>
        <label className="layout-board-field">
          <span className="layout-board-field__label">{t.comment}</span>
          <span className="layout-board-search">
            <input type="search" value={filters.instructions} onChange={(e) => updateFilter('instructions', e.target.value)} placeholder={t.commentPlaceholder} />
          </span>
        </label>
        <button type="button" className="button button--ghost" onClick={resetFilters} disabled={!hasActiveFilters}>
          <Icon path={icons.reset} />
          {t.reset}
        </button>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {pageTasks.length > 0 ? (
        <>
          <button type="button" className="layout-board-sort" onClick={toggleSort}>
            <Icon path={newestFirst ? icons.sortDown : icons.sortUp} />
            {newestFirst ? t.sortNewest : t.sortOldest}
          </button>
          <div className="layout-board-table-wrap" ref={tableRef}>
            <table className="layout-board-table">
              <thead>
                <tr>
                  <th scope="col">{t.columns.number}</th>
                  <th scope="col">{t.columns.task}</th>
                  <th scope="col">{t.columns.status}</th>
                  <th scope="col" aria-sort={newestFirst ? 'descending' : 'ascending'}>
                    <button
                      type="button"
                      className="layout-board-table__sort"
                      title={newestFirst ? t.sortNewest : t.sortOldest}
                      onClick={toggleSort}
                    >
                      {t.columns.date}
                      <Icon path={newestFirst ? icons.sortDown : icons.sortUp} />
                    </button>
                  </th>
                  <th scope="col">{t.columns.source}</th>
                  <th scope="col" className="layout-board-table__actions-head">{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {pageTasks.map((task) => (
                  <tr key={task.id} className={task.status === 'in_progress' ? 'layout-board-table__row--active' : undefined}>
                    <td className="layout-board-table__number">{formatNumber(task.article_id)}</td>
                    <td className="layout-board-table__task">
                      <div className="layout-board-table__title">{task.article_title}</div>
                      <div className="layout-board-table__instructions">{task.instructions || t.noInstructions}</div>
                    </td>
                    <td data-label={t.columns.status}>
                      <span className={`queue-status queue-status--${tones[task.status]}`}>{t.statuses[task.status]}</span>
                    </td>
                    <td data-label={t.columns.date} className="layout-board-table__date">
                      {task.created_at ? (
                        <time dateTime={task.created_at}>
                          {new Date(task.created_at).toLocaleDateString(dateLocale[lang], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </time>
                      ) : '—'}
                    </td>
                    <td data-label={t.columns.source}>
                      {task.source_file_url ? (
                        <a className="layout-board-table__source" href={toApiFilesUrl(task.source_file_url)} target="_blank" rel="noreferrer">
                          <Icon path={icons.download} />
                          {t.download}
                        </a>
                      ) : <span className="layout-board-table__muted">{t.noSource}</span>}
                    </td>
                    <td className="layout-board-table__actions">
                      <div className="layout-board-actions">
                        {task.status === 'pending' && (
                          <button type="button" className="button button--primary" disabled={busyId === task.id} onClick={() => claim(task)}>{t.claim}</button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <label className="layout-board-file">
                              <input type="file" accept=".pdf,.doc,.docx,.zip" onChange={(e) => setFiles((all) => ({ ...all, [task.id]: e.target.files?.[0] }))} />
                              <span title={files[task.id]?.name}><Icon path={icons.upload} /><em>{files[task.id]?.name || t.chooseFile}</em></span>
                            </label>
                            <button type="button" className="button button--primary" disabled={!files[task.id] || busyId === task.id} onClick={() => complete(task)}>
                              {busyId === task.id ? t.sending : t.send}
                            </button>
                          </>
                        )}
                        {task.status === 'completed' && (
                          <span className="layout-board-actions__done"><Icon path={icons.check} />{t.done}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="layout-board-footer">
            <p className="layout-board-footer__count">
              {t.shown} {firstIndex + 1}–{firstIndex + pageTasks.length} {t.of} {visibleTasks.length}
            </p>
            {totalPages > 1 && (
              <nav className="layout-board-pagination" aria-label={t.pagination}>
                <button type="button" className="button button--ghost layout-board-button--icon" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} title={t.previous} aria-label={t.previous}>
                  <Icon path={icons.previous} />
                </button>
                {getPageItems(currentPage, totalPages).map((item, index) => item === 'gap' ? (
                  <span className="layout-board-pagination__gap" key={`gap-${index}`} aria-hidden="true">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`button layout-board-button--icon ${item === currentPage ? 'button--primary' : 'button--ghost'}`}
                    aria-label={`${t.page} ${item}`}
                    aria-current={item === currentPage ? 'page' : undefined}
                    onClick={() => changePage(item)}
                  >
                    {item}
                  </button>
                ))}
                <button type="button" className="button button--ghost layout-board-button--icon" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} title={t.next} aria-label={t.next}>
                  <Icon path={icons.next} />
                </button>
              </nav>
            )}
          </div>
        </>
      ) : error && tasks.length === 0 ? null : (
        <div className="layout-board-empty">
          {loading ? t.loading : (
            <>
              <Icon path={icons.document} />
              {tasks.length === 0 ? t.empty : t.emptyFiltered}
            </>
          )}
        </div>
      )}
    </div>
  )
}
