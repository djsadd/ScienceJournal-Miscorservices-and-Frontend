import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { toApiFilesUrl } from '../../shared/url'

type LayoutStatus = 'pending' | 'in_progress' | 'completed'
type LayoutTask = { id: string; article_id: number; article_title: string; source_file_url?: string | null; instructions?: string | null; status: LayoutStatus }
type FileOut = { id: string; url?: string }
type Filters = { title: string; articleId: string; instructions: string }

const emptyFilters: Filters = { title: '', articleId: '', instructions: '' }
const statuses: LayoutStatus[] = ['pending', 'in_progress', 'completed']
const labels: Record<LayoutStatus, string> = { pending: 'Ожидает', in_progress: 'В работе', completed: 'Завершена' }
const tones: Record<LayoutStatus, string> = { pending: 'amber', in_progress: 'blue', completed: 'green' }

export function LayoutBoard() {
  const [tasks, setTasks] = useState<LayoutTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})
  const [statusFilter, setStatusFilter] = useState<LayoutStatus | 'all'>('all')
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [filters, setFilters] = useState<Filters>(emptyFilters)

  useEffect(() => {
    let active = true
    api.getLayoutTasks<LayoutTask[]>()
      .then((items) => { if (active) { setTasks(items); setError(null) } })
      .catch((e: any) => { if (active) setError(String(e?.bodyJson?.detail || e?.message || 'Не удалось загрузить задачи')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const title = filters.title.toLocaleLowerCase()
    const instructions = filters.instructions.toLocaleLowerCase()
    return (statusFilter === 'all' || task.status === statusFilter)
      && (!title || task.article_title.toLocaleLowerCase().includes(title))
      && (!filters.articleId || String(task.article_id).includes(filters.articleId))
      && (!instructions || (task.instructions || '').toLocaleLowerCase().includes(instructions))
  }), [filters, statusFilter, tasks])

  const claim = async (task: LayoutTask) => {
    setBusyId(task.id); setError(null)
    try {
      const next = await api.claimLayoutTask<LayoutTask>(task.id)
      setTasks((all) => all.map((item) => item.id === task.id ? next : item))
    } catch (e: any) { setError(String(e?.bodyJson?.detail || e?.message || 'Не удалось взять задачу')) }
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
    } catch (e: any) { setError(String(e?.bodyJson?.detail || e?.message || 'Не удалось отправить вёрстку')) }
    finally { setBusyId(null) }
  }

  const applyFilters = (event: FormEvent) => {
    event.preventDefault()
    setFilters({ title: draft.title.trim(), articleId: draft.articleId.trim(), instructions: draft.instructions.trim() })
  }

  return <div className="editorial-queue layout-board"><section className="editorial-queue__panel">
    <header className="editorial-queue__header">
      <div><h1 className="page-title editorial-queue__title">Доска макетов</h1><p className="editorial-queue__subtitle">Задачи на вёрстку и отправка готовых файлов</p></div>
      <div className="editorial-queue__filter" role="group" aria-label="Фильтр по статусу">
        <button type="button" className={`editorial-queue__filter-button ${statusFilter === 'all' ? 'editorial-queue__filter-button--active' : ''}`} onClick={() => setStatusFilter('all')}>Все статусы</button>
        {statuses.map((status) => <button type="button" key={status} className={`editorial-queue__filter-button ${statusFilter === status ? 'editorial-queue__filter-button--active' : ''}`} onClick={() => setStatusFilter(status)}>{labels[status]}</button>)}
      </div>
    </header>
    <form className="editorial-search" onSubmit={applyFilters}>
      <label className="editorial-search__field"><span>Название</span><input type="search" value={draft.title} onChange={(e) => setDraft((value) => ({ ...value, title: e.target.value }))} placeholder="Введите название статьи" /></label>
      <label className="editorial-search__field"><span>ID статьи</span><input type="search" inputMode="numeric" value={draft.articleId} onChange={(e) => setDraft((value) => ({ ...value, articleId: e.target.value }))} placeholder="Например: 125" /></label>
      <label className="editorial-search__field"><span>Комментарий</span><input type="search" value={draft.instructions} onChange={(e) => setDraft((value) => ({ ...value, instructions: e.target.value }))} placeholder="Текст задания от редактора" /></label>
      <button className="editorial-search__submit" type="submit"><span aria-hidden="true">⌕</span>Применить</button>
    </form>
    {error && <div className="editorial-queue__state editorial-queue__state--error">{error}</div>}
    {loading && <div className="editorial-queue__state">Загрузка задач…</div>}
    {!loading && !error && visibleTasks.length === 0 && <div className="editorial-queue__state">По выбранным фильтрам задач нет</div>}
    {!loading && !error && <div className="editorial-queue__list">{visibleTasks.map((task) => <article className="manuscript-row layout-task-row" key={task.id}>
      <span className="manuscript-row__check" aria-hidden="true" />
      <div className="manuscript-row__main"><div className="manuscript-row__code">Задача #{task.article_id}</div><h2>{task.article_title}</h2><div className="manuscript-row__meta"><span>{task.instructions || 'Без дополнительных указаний'}</span></div></div>
      <div className="manuscript-row__status"><span className={`queue-status queue-status--${tones[task.status]}`}>{labels[task.status]}</span>{task.source_file_url ? <a className="layout-task-row__source" href={toApiFilesUrl(task.source_file_url)} target="_blank" rel="noreferrer">Скачать исходник</a> : <small>Исходник не прикреплён</small>}</div>
      <div className="layout-task-row__actions">
        {task.status === 'pending' && <button className="button button--primary button--compact" disabled={busyId === task.id} onClick={() => claim(task)}>Взять в работу</button>}
        {task.status === 'in_progress' && <><label className="layout-task-row__file"><input type="file" accept=".pdf,.doc,.docx,.zip" onChange={(e) => setFiles((all) => ({ ...all, [task.id]: e.target.files?.[0] }))} /><span>{files[task.id]?.name || 'Выбрать готовый файл'}</span></label><button className="button button--primary button--compact" disabled={!files[task.id] || busyId === task.id} onClick={() => complete(task)}>{busyId === task.id ? 'Отправка…' : 'Отправить вёрстку'}</button></>}
        {task.status === 'completed' && <span className="layout-task-row__done">✓ Файл отправлен редактору</span>}
      </div>
    </article>)}</div>}
  </section></div>
}
