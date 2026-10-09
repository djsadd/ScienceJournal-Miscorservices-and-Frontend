import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import ConfirmModal from '../shared/components/ConfirmModal'

type EditorialGroup = 'collegium' | 'council'
type EditorialLanguage = 'ru' | 'kz' | 'en'
type EditorialMember = {
  id: number
  group: EditorialGroup
  full_name: string
  full_name_ru?: string | null
  full_name_kz?: string | null
  full_name_en?: string | null
  status?: string | null
  status_ru?: string | null
  status_kz?: string | null
  status_en?: string | null
  workplace?: string | null
  workplace_ru?: string | null
  workplace_kz?: string | null
  workplace_en?: string | null
  citizenship?: string | null
  citizenship_ru?: string | null
  citizenship_kz?: string | null
  citizenship_en?: string | null
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
  full_name_ru: '', full_name_kz: '', full_name_en: '',
  status: '',
  status_ru: '', status_kz: '', status_en: '',
  workplace: '',
  workplace_ru: '', workplace_kz: '', workplace_en: '',
  citizenship: '',
  citizenship_ru: '', citizenship_kz: '', citizenship_en: '',
  h_index_wos: null,
  h_index_scopus: null,
  orcid: '',
  scopus_author_id: '',
  researcher_id: '',
  sort_order: 0,
})

export default function EditorialTeamPage() {
  const [group, setGroup] = useState<EditorialGroup>('collegium')
  const [draftLanguage, setDraftLanguage] = useState<EditorialLanguage>('ru')
  const [members, setMembers] = useState<EditorialMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MemberDraft | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EditorialMember | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)

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
  const openCreate = () => { setEditingId(null); setDraftLanguage('ru'); setDraft({ ...emptyDraft(group), sort_order: visibleMembers.length }) }
  const openEdit = (member: EditorialMember) => {
    setEditingId(member.id)
    setDraftLanguage('ru')
    setDraft({
      ...member,
      full_name_ru: member.full_name_ru || member.full_name,
      full_name_kz: member.full_name_kz || member.full_name,
      full_name_en: member.full_name_en || member.full_name,
      status_ru: member.status_ru || member.status || '', status_kz: member.status_kz || member.status || '', status_en: member.status_en || member.status || '',
      workplace_ru: member.workplace_ru || member.workplace || '', workplace_kz: member.workplace_kz || member.workplace || '', workplace_en: member.workplace_en || member.workplace || '',
      citizenship_ru: member.citizenship_ru || member.citizenship || '', citizenship_kz: member.citizenship_kz || member.citizenship || '', citizenship_en: member.citizenship_en || member.citizenship || '',
    })
  }
  const update = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setDraft((current) => current ? { ...current, [key]: value } : current)

  const dropMember = async (targetId: number) => {
    if (draggedId == null || draggedId === targetId || reordering) return
    const from = visibleMembers.findIndex((member) => member.id === draggedId)
    const to = visibleMembers.findIndex((member) => member.id === targetId)
    if (from < 0 || to < 0) return
    const reordered = [...visibleMembers]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    const normalized = reordered.map((member, index) => ({ ...member, sort_order: index }))
    const positions = new Map(normalized.map((member) => [member.id, member]))
    setMembers((current) => current
      .map((member) => positions.get(member.id) ?? member)
      .sort((left, right) => left.group === right.group
        ? left.sort_order - right.sort_order
        : left.group.localeCompare(right.group)))
    setDraggedId(null)
    setDragOverId(null)
    setReordering(true)
    setError(null)
    try {
      await Promise.all(normalized.map((member) => api.updateEditorialMember(member.id, { sort_order: member.sort_order })))
    } catch (reason) {
      setError(reason instanceof ApiError ? `Не удалось сохранить порядок (${reason.status})` : 'Не удалось сохранить порядок участников')
      await load()
    } finally {
      setReordering(false)
    }
  }

  const startDrag = (event: DragEvent<HTMLButtonElement>, memberId: number) => {
    event.dataTransfer.effectAllowed = 'move'
    setDraggedId(memberId)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    const missingLanguage = (['ru', 'kz', 'en'] as EditorialLanguage[]).find(language => !draft[`full_name_${language}`]?.trim())
    if (missingLanguage) { setDraftLanguage(missingLanguage); return }
    const fullNameRu = draft.full_name_ru!.trim()
    const fullNameKz = draft.full_name_kz!.trim()
    const fullNameEn = draft.full_name_en!.trim()
    setSaving(true)
    setError(null)
    const payload = {
      ...draft,
      full_name: fullNameRu,
      full_name_ru: fullNameRu,
      full_name_kz: fullNameKz,
      full_name_en: fullNameEn,
      status: draft.status_ru?.trim() || null,
      workplace: draft.workplace_ru?.trim() || null,
      citizenship: draft.citizenship_ru?.trim() || null,
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
      <div className="editorial-team__summary">
        <div className="editorial-queue__filter editorial-team__tabs" role="group" aria-label="Фильтр состава редакции">
          <button type="button" className={`editorial-queue__filter-button ${group === 'collegium' ? 'editorial-queue__filter-button--active' : ''}`} aria-pressed={group === 'collegium'} onClick={() => setGroup('collegium')}>Редакционная коллегия: {members.filter((item) => item.group === 'collegium').length}</button>
          <button type="button" className={`editorial-queue__filter-button ${group === 'council' ? 'editorial-queue__filter-button--active' : ''}`} aria-pressed={group === 'council'} onClick={() => setGroup('council')}>Редакционный совет: {members.filter((item) => item.group === 'council').length}</button>
        </div>
        <small>{reordering ? 'Сохраняем порядок…' : 'Перетащите строки, чтобы изменить порядок'}</small>
      </div>
      {error ? <div className="table__empty editorial-team__error">{error}</div> : null}
      {loading ? <div className="table__empty">Загрузка состава…</div> : null}
      {!loading && visibleMembers.length === 0 ? <div className="editorial-team__empty"><strong>В этом разделе пока никого нет</strong><span>Добавьте первого участника — аккаунт на сайте для этого не нужен.</span><button className="button button--ghost" type="button" onClick={openCreate}>Добавить участника</button></div> : null}
      {!loading && visibleMembers.length > 0 ? <div className="editorial-team__table-wrap"><table className="editorial-team__table"><thead><tr><th className="editorial-team__drag-column" /><th>ФИО</th><th>Состав</th><th>Статус</th><th>Место работы</th><th>Гражданство</th><th>Индекс Хирша</th><th>Идентификаторы</th><th /></tr></thead><tbody>{visibleMembers.map((member) => <tr key={member.id} className={`${draggedId === member.id ? 'is-dragging' : ''} ${dragOverId === member.id ? 'is-drag-over' : ''}`} onDragOver={(event) => { event.preventDefault(); if (draggedId !== member.id) setDragOverId(member.id) }} onDragLeave={() => setDragOverId((current) => current === member.id ? null : current)} onDrop={(event) => { event.preventDefault(); void dropMember(member.id) }}><td><button className="editorial-team__drag" type="button" draggable={!reordering} onDragStart={(event) => startDrag(event, member.id)} onDragEnd={() => { setDraggedId(null); setDragOverId(null) }} aria-label={`Изменить порядок: ${member.full_name}`} title="Перетащить">⠿</button></td><td><strong>{member.full_name}</strong></td><td><span className={`editorial-team__membership editorial-team__membership--${member.group}`}>{member.group === 'collegium' ? 'Член редколлегии' : 'Член редсовета'}</span></td><td>{member.status || '—'}</td><td>{member.workplace || '—'}</td><td>{member.citizenship || '—'}</td><td><span>WoS: {member.h_index_wos ?? '—'}</span><span>Scopus: {member.h_index_scopus ?? '—'}</span></td><td><span>ORCID: {member.orcid || '—'}</span><span>Scopus: {member.scopus_author_id || '—'}</span><span>Researcher ID: {member.researcher_id || '—'}</span></td><td><div className="editorial-team__actions"><button className="editorial-team__icon-button" type="button" onClick={() => openEdit(member)} aria-label={`Редактировать ${member.full_name}`} title="Редактировать"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg></button><button className="editorial-team__icon-button editorial-team__icon-button--danger" type="button" onClick={() => setDeleteTarget(member)} aria-label={`Удалить ${member.full_name}`} title="Удалить"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></button></div></td></tr>)}</tbody></table></div> : null}
    </section>

    {draft ? <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDraft(null) }}><form className="modal modal--wide editorial-team-modal" onSubmit={save}><header className="modal__header"><div><p className="eyebrow">{editingId ? 'Редактирование' : 'Новая запись'}</p><h2 className="modal__title">{editingId ? draft.full_name_ru || 'Участник редакции' : 'Добавить участника'}</h2></div><button className="modal__close" type="button" onClick={() => setDraft(null)} aria-label="Закрыть">×</button></header><div className="modal__body editorial-team-modal__body">
      <div><span className="form-label">Состав редакции</span><div className="editorial-team-modal__group"><button type="button" className={draft.group === 'collegium' ? 'is-active' : ''} onClick={() => update('group', 'collegium')}>Член редколлегии</button><button type="button" className={draft.group === 'council' ? 'is-active' : ''} onClick={() => update('group', 'council')}>Член редсовета</button></div></div>
      <div className="editorial-team-modal__languageBlock"><span className="form-label">Язык данных</span><div className="editorial-team-modal__group editorial-team-modal__group--languages">{(['ru', 'kz', 'en'] as EditorialLanguage[]).map(language => <button type="button" key={language} className={draftLanguage === language ? 'is-active' : ''} onClick={() => setDraftLanguage(language)}>{language === 'ru' ? 'Русский' : language === 'kz' ? 'Қазақша' : 'English'}{draft[`full_name_${language}`]?.trim() ? <span aria-label="Заполнено">✓</span> : null}</button>)}</div></div>
      <section className="settings-language editorial-team-modal__translation"><h3>{draftLanguage === 'ru' ? 'Данные на русском' : draftLanguage === 'kz' ? 'Қазақ тіліндегі деректер' : 'Data in English'}</h3><label className="form-label">ФИО *<input className="text-input" autoFocus required value={draft[`full_name_${draftLanguage}`] || ''} onChange={(e) => update(`full_name_${draftLanguage}`, e.target.value)} placeholder="Фамилия Имя Отчество" /></label><label className="form-label">Статус / должность<input className="text-input" value={draft[`status_${draftLanguage}`] || ''} onChange={(e) => update(`status_${draftLanguage}`, e.target.value)} placeholder="Главный редактор, профессор…" /></label><label className="form-label">Гражданство<input className="text-input" value={draft[`citizenship_${draftLanguage}`] || ''} onChange={(e) => update(`citizenship_${draftLanguage}`, e.target.value)} placeholder="Казахстан" /></label><label className="form-label">Место работы<input className="text-input" value={draft[`workplace_${draftLanguage}`] || ''} onChange={(e) => update(`workplace_${draftLanguage}`, e.target.value)} placeholder="Университет, организация" /></label></section>
      <div className="form-grid editorial-team-modal__metrics"><label className="form-label">Индекс Хирша (WoS)<input className="text-input" type="number" min="0" value={draft.h_index_wos ?? ''} onChange={(e) => update('h_index_wos', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="form-label">Индекс Хирша (Scopus)<input className="text-input" type="number" min="0" value={draft.h_index_scopus ?? ''} onChange={(e) => update('h_index_scopus', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="form-label">ORCID<input className="text-input" value={draft.orcid || ''} onChange={(e) => update('orcid', e.target.value)} placeholder="0000-0000-0000-0000" /></label><label className="form-label">Scopus Author ID<input className="text-input" value={draft.scopus_author_id || ''} onChange={(e) => update('scopus_author_id', e.target.value)} /></label><label className="form-label editorial-team-modal__wide">Web of Science / Researcher ID<input className="text-input" value={draft.researcher_id || ''} onChange={(e) => update('researcher_id', e.target.value)} /></label></div>
    </div><footer className="modal__footer"><button className="button button--ghost" type="button" disabled={saving} onClick={() => setDraft(null)}>Отмена</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button></footer></form></div> : null}
    <ConfirmModal open={Boolean(deleteTarget)} title="Удалить участника?" message={deleteTarget ? `${deleteTarget.full_name} будет удалён из состава редакции.` : ''} confirmText={saving ? 'Удаление…' : 'Удалить'} cancelText="Отмена" onCancel={() => !saving && setDeleteTarget(null)} onConfirm={() => { if (!saving) void remove() }} />
  </div>
}
