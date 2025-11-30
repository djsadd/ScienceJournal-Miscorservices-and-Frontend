import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Volume } from '../shared/types'

function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ year?: number; number?: number; month?: number; active_only?: boolean }>({
    active_only: true,
  })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createData, setCreateData] = useState<{
    year: string
    number: string
    month: string
    title_ru: string
    title_en: string
    title_kz: string
    description: string
    is_active: string
    article_ids: string
  }>({ year: '', number: '', month: '', title_ru: '', title_en: '', title_kz: '', description: '', is_active: 'true', article_ids: '' })
  const parsedArticleIds = useMemo(() =>
    createData.article_ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n)), [createData.article_ids])

  useEffect(() => {
    const fetchVolumes = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.getVolumes<Volume[]>(filters)
        setVolumes(data)
      } catch (e: any) {
        setError(e?.message || 'Не удалось загрузить тома')
      } finally {
        setLoading(false)
      }
    }
    fetchVolumes()
  }, [filters])

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : name === 'active_only' ? value === 'true' : Number(value),
    }))
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Мои тома</h1>
          <p className="subtitle">Управляйте выпусками журнала: фильтруйте, просматривайте и создавайте новые тома.</p>
        </div>
        <div className="section-actions">
          <button className="button button--primary" onClick={() => setIsCreateOpen(true)}>Создать том</button>
        </div>
      </section>

      <section className="section">
        <div className="panel panel--floating">
          <div className="filters">
            <div className="filter-group">
              <label className="filter-label">Год</label>
              <input className="search" type="number" name="year" value={filters.year ?? ''} onChange={onFilterChange} placeholder="2025" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Номер</label>
              <input className="search" type="number" name="number" value={filters.number ?? ''} onChange={onFilterChange} placeholder="1" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Месяц</label>
              <input className="search" type="number" name="month" value={filters.month ?? ''} onChange={onFilterChange} placeholder="1" min={1} max={12} />
            </div>
            <div className="filter-group">
              <label className="filter-label">Активные</label>
              <select className="chip-select" name="active_only" value={String(filters.active_only ?? true)} onChange={onFilterChange}>
                <option value="true">Да</option>
                <option value="false">Все</option>
              </select>
            </div>
          </div>
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">Создать том</h2>
              <button className="modal__close" onClick={() => setIsCreateOpen(false)}>×</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setLoading(true)
                setError(null)
                try {
                  const payload = {
                    year: Number(createData.year),
                    number: Number(createData.number),
                    month: createData.month ? Number(createData.month) : undefined,
                    title_kz: createData.title_kz || undefined,
                    title_en: createData.title_en || undefined,
                    title_ru: createData.title_ru || undefined,
                    description: createData.description || undefined,
                    is_active: createData.is_active === 'true',
                    article_ids: parsedArticleIds.length ? parsedArticleIds : undefined,
                  }
                  const created = await api.createVolume<Volume>(payload)
                  setIsCreateOpen(false)
                  setCreateData({ year: '', number: '', month: '', title_ru: '', title_en: '', title_kz: '', description: '', is_active: 'true', article_ids: '' })
                  // Refresh list: prepend created or refetch
                  setVolumes((prev) => (prev ? [created, ...prev] : [created]))
                } catch (e: any) {
                  setError(e?.message || 'Не удалось создать том')
                } finally {
                  setLoading(false)
                }
              }}
              className="form-grid"
            >
              <label className="form-label">
                Год*
                <input className="text-input" type="number" value={createData.year} onChange={(e) => setCreateData((p) => ({ ...p, year: e.target.value }))} required />
              </label>
              <label className="form-label">
                Номер*
                <input className="text-input" type="number" value={createData.number} onChange={(e) => setCreateData((p) => ({ ...p, number: e.target.value }))} required />
              </label>
              <label className="form-label">
                Месяц (1-12)
                <input className="text-input" type="number" min={1} max={12} value={createData.month} onChange={(e) => setCreateData((p) => ({ ...p, month: e.target.value }))} />
              </label>
              <label className="form-label form-field--span-2">
                Заголовок (ru)
                <input className="text-input" type="text" value={createData.title_ru} onChange={(e) => setCreateData((p) => ({ ...p, title_ru: e.target.value }))} />
              </label>
              <label className="form-label form-field--span-2">
                Title (en)
                <input className="text-input" type="text" value={createData.title_en} onChange={(e) => setCreateData((p) => ({ ...p, title_en: e.target.value }))} />
              </label>
              <label className="form-label form-field--span-2">
                Тақырып (kz)
                <input className="text-input" type="text" value={createData.title_kz} onChange={(e) => setCreateData((p) => ({ ...p, title_kz: e.target.value }))} />
              </label>
              <label className="form-label">
                Описание
                <textarea className="text-input" value={createData.description} onChange={(e) => setCreateData((p) => ({ ...p, description: e.target.value }))} />
              </label>
              <label className="form-label">
                Активен
                <select className="chip-select" value={createData.is_active} onChange={(e) => setCreateData((p) => ({ ...p, is_active: e.target.value }))}>
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </label>
              <label className="form-label">
                ID статей (через запятую)
                <input className="text-input" type="text" placeholder="101, 102, 103" value={createData.article_ids} onChange={(e) => setCreateData((p) => ({ ...p, article_ids: e.target.value }))} />
                <span className="form-hint">Будут привязаны только опубликованные статьи</span>
              </label>
              <div className="modal__footer">
                <button className="button button--ghost" type="button" onClick={() => setIsCreateOpen(false)}>Отмена</button>
                <button className="button button--primary" type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
          {loading && <div className="loading">Загрузка...</div>}
          {error && <div className="alert error">Ошибка: {error}</div>}
          {!loading && !error && volumes && volumes.length === 0 && (
            <div className="empty">
              Томов не найдено. Попробуйте изменить фильтры или создайте новый том.
            </div>
          )}
          {!loading && !error && volumes && volumes.length > 0 && (
            <div className="card-grid">
              {volumes.map((v) => (
                <div className="panel" key={String(v.id ?? `${v.year}-${v.number}-${v.month ?? 'm'}`)}>
                  <div className="submission-card__top">
                    <div>
                      <h2 className="panel-title">
                        <a href={`/cabinet/volumes/${String(v.id ?? '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          Том {v.number} / {v.year}{v.month ? ` (${v.month} мес.)` : ''}
                        </a>
                      </h2>
                      {(v.title_ru || v.title_en || v.title_kz) && (
                        <div className="meta-label">{v.title_ru}{v.title_en ? ` | ${v.title_en}` : ''}{v.title_kz ? ` | ${v.title_kz}` : ''}</div>
                      )}
                    </div>
                    <span className={`badge ${v.is_active ? 'badge--success' : 'badge--muted'}`}>{v.is_active ? 'Активен' : 'Неактивен'}</span>
                  </div>
                  {v.description && <p className="article-abstract">{v.description}</p>}
                  <div className="article-footer">
                    <span className="meta-label">Статей: {v.articles?.length ?? 0}</span>
                  </div>
                  {v.articles && v.articles.length > 0 && (
                    <ul className="list">
                      {v.articles.slice(0, 5).map((a) => (
                        <li key={a.id}>{a.title_ru || a.title_en || a.title || `Статья #${a.id}`}</li>
                      ))}
                      {v.articles.length > 5 && <li>...ещё {v.articles.length - 5}</li>}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default VolumesPage
