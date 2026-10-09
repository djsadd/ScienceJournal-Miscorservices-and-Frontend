import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import './VolumesPage.css'

const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const title = (a: Article) => a.title_ru || a.title_kz || a.title_en || `Статья #${a.id}`
const authors = (a: Article) => Array.isArray(a.authors) && a.authors.length ? a.authors.map((x:any) => [x.last_name,x.first_name].filter(Boolean).join(' ')).join(', ') : 'Авторы не указаны'

export default function VolumesPage() {
  const [volumes,setVolumes] = useState<Volume[]>([])
  const [selectedId,setSelectedId] = useState<number>()
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string|null>(null)
  const [showAll,setShowAll] = useState(false)
  const [draggedId,setDraggedId] = useState<string|null>(null)
  const [dragOverId,setDragOverId] = useState<string|null>(null)
  const [reordering,setReordering] = useState(false)
  const [creating,setCreating] = useState(false)
  const [form,setForm] = useState({year:String(new Date().getFullYear()),number:'',month:'',planned_publication_date:'',target_article_count:'',title_ru:'',description:'',is_active:true})

  useEffect(() => { api.getVolumes<Volume[]>({active_only:false}).then(data => { setVolumes(data); setSelectedId(data[0]?.id) }).catch((e:any) => setError(e?.message || 'Не удалось загрузить выпуски')).finally(() => setLoading(false)) },[])
  const selected = useMemo(() => volumes.find(v => v.id === selectedId) || volumes[0],[volumes,selectedId])
  const articles = selected?.articles || []

  async function create(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    try { const item = await api.createVolume<Volume>({year:Number(form.year),number:form.number,month:form.month?Number(form.month):undefined,planned_publication_date:form.planned_publication_date||undefined,target_article_count:form.target_article_count?Number(form.target_article_count):undefined,title_ru:form.title_ru||undefined,description:form.description||undefined,is_active:form.is_active}); setVolumes(v => [item,...v]); setSelectedId(item.id); setCreating(false) }
    catch(e:any){ setError(e?.message || 'Не удалось создать выпуск') } finally { setLoading(false) }
  }

  async function dropArticle(targetId: string) {
    if (!selected?.id || draggedId === null || draggedId === targetId || reordering) {
      setDraggedId(null); setDragOverId(null); return
    }
    const from = articles.findIndex(a => a.id === draggedId)
    const to = articles.findIndex(a => a.id === targetId)
    if (from < 0 || to < 0) return
    setReordering(true); setError(null)
    try {
      let updated = selected
      const direction = to < from ? 'up' : 'down'
      for (let step = 0; step < Math.abs(to - from); step++) updated = await api.reorderVolumeArticle<Volume>(selected.id, draggedId, direction)
      setVolumes(list => list.map(v => v.id === updated.id ? updated : v))
    } catch (e:any) { setError(e?.message || 'Не удалось изменить порядок статей') }
    finally { setDraggedId(null); setDragOverId(null); setReordering(false) }
  }

  return <div className="volumes-page">
    <header className="volumes-heading"><h1>Выпуски</h1><p>Редакционная рабочая область журнала</p></header>
    {error && <div className="volumes-message volumes-message--error">{error}</div>}
    {loading && !volumes.length && <div className="volumes-message">Загрузка выпусков…</div>}
    {!loading && !volumes.length && <div className="volumes-message volumes-empty"><span>Выпусков пока нет</span><button className="v-button v-button--primary" onClick={() => setCreating(true)}>Создать выпуск</button></div>}
    {selected && <div className="volumes-layout">
      <aside className="volumes-nav">
        <div className="volumes-nav__head"><div><strong>Выпуски</strong><span>Архив и план публикаций</span></div><button onClick={() => setCreating(true)} aria-label="Создать выпуск">+</button></div>
        {volumes.map(v => { const count=v.articles?.length||0; const done=v.articles?.filter(a=>a.doi).length||0; return <button key={v.id ?? `${v.year}-${v.number}`} className={`volume-tab ${v.id===selected.id?'volume-tab--active':''}`} onClick={() => {setSelectedId(v.id);setShowAll(false)}}>
          <span className="volume-tab__top"><strong>№ {v.number}, {v.year}</strong><em className={v.is_active?'published':'in-progress'}>{v.is_active?'Активен':'Неактивен'}</em></span>
          <small>{v.planned_publication_date ? new Date(`${v.planned_publication_date}T00:00:00`).toLocaleDateString('ru-RU') : `${v.month?months[v.month-1]+' ':''}${v.year}`} · {count}{v.target_article_count ? ` из ${v.target_article_count}` : ''} статей</small><i><span style={{width:`${v.target_article_count?Math.min(count/v.target_article_count*100,100):(count?done/count*100:8)}%`}} /></i>
        </button>})}
      </aside>
      <main className="volume-main">
        <section className="volume-hero">
          <div className="volume-hero__top"><div><span className="volume-kicker">НАУЧНЫЙ ЖУРНАЛ · ВЫПУСК</span><h2>№ {selected.number}, {selected.year}</h2>{selected.title_ru && <p>{selected.title_ru}</p>}</div><div className="volume-actions"><Link className="v-button" to={`/archive/volumes/${selected.id}`}>Предпросмотр</Link><Link className="v-button v-button--primary" to={`/cabinet/volumes/${selected.id}/edit`}>Настроить выпуск</Link></div></div>
        </section>
        <section className="volume-content">
          <div className="volume-content__head"><div><h3>Содержание выпуска</h3><p>Порядок материалов и готовность к публикации</p></div><Link className="v-button" to={`/cabinet/volumes/${selected.id}/edit`}>+ Добавить статью</Link></div>
          {!articles.length ? <div className="volume-content__empty">В выпуске пока нет статей. Добавьте первый материал через настройки.</div> : <div>{(showAll?articles:articles.slice(0,4)).map((a,index) => { const progress=a.doi?100:a.layout_file_url?75:a.manuscript_file_url?50:25; return <div className={`volume-article ${draggedId===a.id?'volume-article--dragging':''} ${dragOverId===a.id?'volume-article--drag-over':''}`} key={a.id} onDragOver={e=>{e.preventDefault();setDragOverId(a.id)}} onDragLeave={()=>setDragOverId(id=>id===a.id?null:id)} onDrop={e=>{e.preventDefault();void dropArticle(a.id)}}><span className="grip" draggable={!reordering} title="Перетащите, чтобы изменить порядок" onDragStart={e=>{e.dataTransfer.effectAllowed='move';setDraggedId(a.id)}} onDragEnd={()=>{setDraggedId(null);setDragOverId(null)}}>⠿</span><span className="article-no">{String(index+1).padStart(2,'0')}</span><div className="article-info"><strong>{title(a)}</strong><span>{authors(a)}{a.article_type?` · ${a.article_type}`:''}</span></div><div className="article-progress"><span>Готовность <b>{progress}%</b></span><i><em style={{width:`${progress}%`}} /></i></div><Link className="article-menu" to={`/cabinet/editorial2/${a.id}`}>•••</Link></div>})}{articles.length>4&&<button className="show-all" onClick={() => setShowAll(v=>!v)}>{showAll?'Свернуть список':`Показать все ${articles.length} материалов`}</button>}</div>}
        </section>
      </main>
    </div>}
    {creating&&<div className="volume-modal"><form onSubmit={create}><div className="volume-modal__head"><h2>Новый выпуск</h2><button type="button" onClick={()=>setCreating(false)}>×</button></div><div className="volume-modal__grid"><label>Год<input type="number" required value={form.year} onChange={e=>setForm({...form,year:e.target.value})}/></label><label>Номер выпуска<input required placeholder="Например, 2 (34)" value={form.number} onChange={e=>setForm({...form,number:e.target.value})}/></label><label>Месяц<select value={form.month} onChange={e=>setForm({...form,month:e.target.value})}><option value="">Не выбран</option>{months.map((m,i)=><option value={i+1} key={m}>{m}</option>)}</select></label><label>Плановая дата выпуска<input type="date" value={form.planned_publication_date} onChange={e=>setForm({...form,planned_publication_date:e.target.value})}/></label><label>Нужное количество статей<input type="number" min="1" required value={form.target_article_count} onChange={e=>setForm({...form,target_article_count:e.target.value})} placeholder="Например, 10"/></label><label>Статус<select value={form.is_active?'active':'inactive'} onChange={e=>setForm({...form,is_active:e.target.value==='active'})}><option value="active">Активен</option><option value="inactive">Неактивен</option></select></label></div><label>Название<input value={form.title_ru} onChange={e=>setForm({...form,title_ru:e.target.value})}/></label><label>Описание<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="volume-modal__actions"><button type="button" className="v-button" onClick={()=>setCreating(false)}>Отмена</button><button className="v-button v-button--primary" disabled={loading}>Создать выпуск</button></div></form></div>}
  </div>
}
