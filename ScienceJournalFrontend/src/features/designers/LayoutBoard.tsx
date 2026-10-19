import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { toApiFilesUrl } from '../../shared/url'

type LayoutTask = { id: string; article_id: number; article_title: string; source_file_url?: string | null; instructions?: string | null; status: 'pending' | 'in_progress' | 'completed' }
type FileOut = { id: string; url?: string }
const labels = { pending: 'Ожидает', in_progress: 'В работе', completed: 'Завершена' }

export function LayoutBoard() {
  const [tasks, setTasks] = useState<LayoutTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})

  useEffect(() => {
    api.getLayoutTasks<LayoutTask[]>().then(setTasks).catch((e: any) => setError(String(e?.bodyJson?.detail || e?.message || 'Не удалось загрузить задачи'))).finally(() => setLoading(false))
  }, [])

  const claim = async (task: LayoutTask) => {
    setBusyId(task.id); setError(null)
    try { const next = await api.claimLayoutTask<LayoutTask>(task.id); setTasks((all) => all.map((item) => item.id === task.id ? next : item)) }
    catch (e: any) { setError(String(e?.bodyJson?.detail || e?.message || 'Не удалось взять задачу')) }
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

  return <div className="app-container">
    <section className="section-header"><div><p className="eyebrow">Верстальщик</p><h1 className="page-title">Очередь вёрстки</h1><p className="subtitle">Задачи редакции и отправка готовых файлов.</p></div></section>
    {error && <div className="alert error">{error}</div>}
    <div className="panel"><div className="table">
      <div className="table__head"><span>Статья</span><span>Статус</span><span>Исходник</span><span>Действия</span></div>
      <div className="table__body">
        {loading && <div className="table__empty">Загрузка…</div>}
        {!loading && tasks.map((task) => <div className="table__row table__row--align" key={task.id}>
          <div className="table__cell table__cell--title"><div className="table__title">{task.article_title}</div><div className="table__meta">#{task.article_id}{task.instructions ? ` · ${task.instructions}` : ''}</div></div>
          <div className="table__cell"><span className={`status-chip status-chip--${task.status === 'completed' ? 'accepted' : 'in_review'}`}>{labels[task.status]}</span></div>
          <div className="table__cell">{task.source_file_url ? <a className="button button--ghost button--compact" href={toApiFilesUrl(task.source_file_url)} target="_blank" rel="noreferrer">Скачать</a> : '—'}</div>
          <div className="table__cell table__cell--actions">
            {task.status === 'pending' && <button className="button button--ghost button--compact" disabled={busyId === task.id} onClick={() => claim(task)}>Взять в работу</button>}
            {task.status === 'in_progress' && <div className="actions"><input type="file" accept=".pdf,.doc,.docx,.zip" onChange={(e) => setFiles((all) => ({ ...all, [task.id]: e.target.files?.[0] }))}/><button className="button button--primary button--compact" disabled={!files[task.id] || busyId === task.id} onClick={() => complete(task)}>{busyId === task.id ? 'Отправка…' : 'Отправить вёрстку'}</button></div>}
            {task.status === 'completed' && <span>Файл отправлен редактору</span>}
          </div>
        </div>)}
        {!loading && tasks.length === 0 && <div className="table__empty">Новых задач пока нет.</div>}
      </div>
    </div></div>
  </div>
}
