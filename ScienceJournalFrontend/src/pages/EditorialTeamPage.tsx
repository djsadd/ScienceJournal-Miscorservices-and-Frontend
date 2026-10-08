import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import ConfirmModal from '../shared/components/ConfirmModal'

type EditorialGroup = 'collegium' | 'council'
type EditorialMember = {
  id: number
  group: EditorialGroup
  full_name: string
  status?: string | null
  workplace?: string | null
  citizenship?: string | null
  h_index_wos?: number | null
  h_index_scopus?: number | null
  orcid?: string | null
  scopus_author_id?: string | null
  researcher_id?: string | null
  sort_order: number
}

type MemberDraft = Omit<EditorialMember, 'id'>

const emptyDraft = (group: EditorialGroup): MemberDraft => ({
  group,
  full_name: '',
  status: '',
  workplace: '',
  citizenship: '',
  h_index_wos: null,
  h_index_scopus: null,
  orcid: '',
  scopus_author_id: '',
  researcher_id: '',
  sort_order: 0,
})

export default function EditorialTeamPage() {
  const [group, setGroup] = useState<EditorialGroup>('collegium')
  const [members, setMembers] = useState<EditorialMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MemberDraft | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EditorialMember | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setMembers(await api.getEditorialMembers<EditorialMember[]>())
    } catch (reason) {
      setError(reason instanceof ApiError ? `Не удалось загрузить состав (${reason.status})` : 'Не удалось загрузить состав редакции')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visibleMembers = useMemo(() => members.filter((member) => member.group === group), [members, group])
  const openCreate = () => { setEditingId(null); setDraft(emptyDraft(group)) }
  const openEdit = (member: EditorialMember) => {
    setEditingId(member.id)
    setDraft({ ...member })
  }
  const update = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setDraft((current) => current ? { ...current, [key]: value } : current)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft?.full_name.trim()) return
    setSaving(true)
    setError(null)
    const payload = {
      ...draft,
      full_name: draft.full_name.trim(),
      h_index_wos: draft.h_index_wos === null ? null : Number(draft.h_index_wos),
      h_index_scopus: draft.h_index_scopus === null ? null : Number(draft.h_index_scopus),
      sort_order: Number(draft.sort_order) || 0,
    }
    try {
      if (editingId) await api.updateEditorialMember(editingId, payload)
      else await api.createEditorialMember(payload)
      setDraft(null)
      setEditingId(null)
      await load()
    } catch (reason) {
      setError(reason instanceof ApiError ? `Не удалось сохранить запись (${reason.status})` : 'Не удалось сохранить запись')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await api.deleteEditorialMember(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (reason) {
      setError(reason instanceof ApiError ? `Не удалось удалить запись (${reason.status})` : 'Не удалось удалить запись')
    } finally {
      setSaving(false)
    }
  }

  return <div className="page editorial-team">
    <section className="section-header editorial-team__header">
      <div><p className="eyebrow">Редакция</p><h1 className="page-title">Состав редакции</h1><p className="subtitle">Редакционная коллегия и редакционный совет без привязки к аккаунтам.</p></div>
      <button className="button button--primary" type="button" onClick={openCreate}>+ Добавить участника</button>
    </section>

    <section className="panel editorial-team__panel">
      <div className="editorial-queue__filter editorial-team__tabs" role="tablist" aria-label="Раздел состава редакции">
        <button type="button" className={`editorial-queue__filter-button ${group === 'collegium' ? 'editorial-queue__filter-button--active' : ''}`} onClick={() => setGroup('collegium')}>Редакционная коллегия: {members.filter((item) => item.group === 'collegium').length}</button>
        <button type="button" className={`editorial-queue__filter-button ${group === 'council' ? 'editorial-queue__filter-button--active' : ''}`} onClick={() => setGroup('council')}>Редакционный совет: {members.filter((item) => item.group === 'council').length}</button>
      </div>
      {error ? <div className="table__empty editorial-team__error">{error}</div> : null}
      {loading ? <div className="table__empty">Загрузка состава…</div> : null}
      {!loading && visibleMembers.length === 0 ? <div className="editorial-team__empty"><strong>В этом разделе пока никого нет</strong><span>Добавьте первого участника — аккаунт на сайте для этого не нужен.</span><button className="button button--ghost" type="button" onClick={openCreate}>Добавить участника</button></div> : null}
      {!loading && visibleMembers.length > 0 ? <div className="editorial-team__table-wrap"><table className="editorial-team__table"><thead><tr><th>ФИО</th><th>Статус</th><th>Место работы</th><th>Гражданство</th><th>Индекс Хирша</th><th>Идентификаторы</th><th /></tr></thead><tbody>{visibleMembers.map((member) => <tr key={member.id}><td><strong>{member.full_name}</strong></td><td>{member.status || '—'}</td><td>{member.workplace || '—'}</td><td>{member.citizenship || '—'}</td><td><span>WoS: {member.h_index_wos ?? '—'}</span><span>Scopus: {member.h_index_scopus ?? '—'}</span></td><td><span>ORCID: {member.orcid || '—'}</span><span>Scopus: {member.scopus_author_id || '—'}</span><span>Researcher ID: {member.researcher_id || '—'}</span></td><td><div className="editorial-team__actions"><button className="button button--ghost button--compact" type="button" onClick={() => openEdit(member)}>Изменить</button><button className="editorial-team__delete" type="button" onClick={() => setDeleteTarget(member)} aria-label={`Удалить ${member.full_name}`}>×</button></div></td></tr>)}</tbody></table></div> : null}
    </section>

    {draft ? <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null) }}><form className="modal modal--wide editorial-team-modal" onSubmit={save}><header className="modal__header"><div><p className="eyebrow">{editingId ? 'Редактирование' : 'Новая запись'}</p><h2 className="modal__title">{editingId ? draft.full_name || 'Участник редакции' : 'Добавить участника'}</h2></div><button className="modal__close" type="button" onClick={() => setDraft(null)} aria-label="Закрыть">×</button></header><div className="modal__body editorial-team-modal__body">
      <div className="editorial-team-modal__group"><button type="button" className={draft.group === 'collegium' ? 'is-active' : ''} onClick={() => update('group', 'collegium')}>Редакционная коллегия</button><button type="button" className={draft.group === 'council' ? 'is-active' : ''} onClick={() => update('group', 'council')}>Редакционный совет</button></div>
      <div className="form-grid"><label className="form-label editorial-team-modal__wide">ФИО *<input className="text-input" autoFocus required value={draft.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Фамилия Имя Отчество" /></label><label className="form-label">Статус<input className="text-input" value={draft.status || ''} onChange={(e) => update('status', e.target.value)} placeholder="Главный редактор, профессор…" /></label><label className="form-label">Гражданство<input className="text-input" value={draft.citizenship || ''} onChange={(e) => update('citizenship', e.target.value)} placeholder="Казахстан" /></label><label className="form-label editorial-team-modal__wide">Место работы<input className="text-input" value={draft.workplace || ''} onChange={(e) => update('workplace', e.target.value)} placeholder="Университет, организация" /></label><label className="form-label">Индекс Хирша (WoS)<input className="text-input" type="number" min="0" value={draft.h_index_wos ?? ''} onChange={(e) => update('h_index_wos', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="form-label">Индекс Хирша (Scopus)<input className="text-input" type="number" min="0" value={draft.h_index_scopus ?? ''} onChange={(e) => update('h_index_scopus', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="form-label">ORCID<input className="text-input" value={draft.orcid || ''} onChange={(e) => update('orcid', e.target.value)} placeholder="0000-0000-0000-0000" /></label><label className="form-label">Scopus Author ID<input className="text-input" value={draft.scopus_author_id || ''} onChange={(e) => update('scopus_author_id', e.target.value)} /></label><label className="form-label">Web of Science / Researcher ID<input className="text-input" value={draft.researcher_id || ''} onChange={(e) => update('researcher_id', e.target.value)} /></label><label className="form-label">Порядок отображения<input className="text-input" type="number" min="0" value={draft.sort_order} onChange={(e) => update('sort_order', Number(e.target.value))} /></label></div>
    </div><footer className="modal__footer"><button className="button button--ghost" type="button" disabled={saving} onClick={() => setDraft(null)}>Отмена</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button></footer></form></div> : null}
    <ConfirmModal open={Boolean(deleteTarget)} title="Удалить участника?" message={deleteTarget ? `${deleteTarget.full_name} будет удалён из состава редакции.` : ''} confirmText={saving ? 'Удаление…' : 'Удалить'} cancelText="Отмена" onCancel={() => !saving && setDeleteTarget(null)} onConfirm={() => { if (!saving) void remove() }} />
  </div>
}
