import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Volume, Article } from '../shared/types'
import { toApiFilesUrl } from '../shared/url'
import './VolumeEditPage.css'

interface ArticleSearchResult {
  items: Article[]
  pagination: { total_count: number; page: number; page_size: number; total_pages: number; has_next: boolean; has_prev: boolean }
}

type FormState = { year?: number; number?: number; month?: number | null; title_kz?: string | null; title_en?: string | null; title_ru?: string | null; description?: string | null; is_active?: boolean; article_ids?: number[] }

export default function VolumeEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [form, setForm] = useState<FormState>({})

  // Article search
  const [search, setSearch] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [results, setResults] = useState<ArticleSearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  const currentArticleIds = useMemo(() => new Set(form.article_ids || []), [form.article_ids])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!id) throw new Error('Missing id')
        const data = await api.getVolumeById<Volume>(id)
        if (!cancelled) {
          setVolume(data)
          setForm({
            year: data.year,
            number: data.number,
            month: data.month ?? null,
            title_kz: data.title_kz ?? null,
            title_en: data.title_en ?? null,
            title_ru: data.title_ru ?? null,
            description: data.description ?? null,
            is_active: !!data.is_active,
            article_ids: Array.isArray(data.articles) ? data.articles.map(a => Number(a.id!)) : [],
          })
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || 'Не удалось загрузить том')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

  const doSearch = async (resetPage = false) => {
    setSearching(true)
    setError(null)
    try {
      const params = {
        status: 'published',
        search: search || undefined,
        author_name: authorName || undefined,
        page: resetPage ? 1 : page,
        page_size: pageSize,
      }
      const data = await api.getUnassignedArticles<ArticleSearchResult>(params)
      setResults(data)
      if (resetPage) setPage(1)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Ошибка поиска статей')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    // initial search
    doSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateField = (key: keyof FormState, value: any) => {
    setForm((prev: FormState) => ({ ...prev, [key]: value }))
  }

  const toggleArticle = (articleId: number) => {
    setForm((prev: FormState) => {
      const ids = new Set(prev.article_ids || [])
      if (ids.has(articleId)) ids.delete(articleId)
      else ids.add(articleId)
      return { ...prev, article_ids: Array.from(ids) }
    })
  }

  const save = async () => {
    if (!id) return
    setSaving(true)
    setError(null)
    try {
      const body: any = {}
      // Only send fields the user edited (simplified: send all current form values)
      body.year = form.year
      body.number = form.number
      body.month = form.month ?? null
      body.title_kz = form.title_kz ?? null
      body.title_en = form.title_en ?? null
      body.title_ru = form.title_ru ?? null
      body.description = form.description ?? null
      body.is_active = !!form.is_active
      body.article_ids = form.article_ids || []

      const updated = await api.updateVolume<Volume>(id, body)
      setVolume(updated)
      // Navigate back to detail
      navigate(`/cabinet/volumes/${id}`)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Редактирование тома</h1>
          {volume && <p className="subtitle">Том {volume.number} / {volume.year}</p>}
        </div>
        <div className="section-actions">
          <Link className="button button--ghost" to={`/cabinet/volumes/${id}`}>← Назад к деталям</Link>
          <button className="button" onClick={save} disabled={saving || loading}>{saving ? 'Сохранение…' : 'Сохранить изменения'}</button>
        </div>
      </section>

      <section className="section section--narrow">
        {error && <div className="alert error">{error}</div>}
        {loading && <div className="loading">Загрузка...</div>}

        <div className="panel panel--elevated">
          <div className="panel-title">Основные сведения</div>
          <div className="form-grid form-grid--cols-4">
            <label>
              <span>Год</span>
              <input type="number" value={form.year ?? ''} onChange={e => updateField('year', Number(e.target.value))} />
            </label>
            <label>
              <span>Номер</span>
              <input type="number" value={form.number ?? ''} onChange={e => updateField('number', Number(e.target.value))} />
            </label>
            <label>
              <span>Месяц</span>
              <input type="number" value={form.month ?? ''} onChange={e => updateField('month', e.target.value ? Number(e.target.value) : null)} />
            </label>
            <label>
              <span>Активен</span>
              <input type="checkbox" checked={!!form.is_active} onChange={e => updateField('is_active', e.target.checked)} />
            </label>
          </div>

          <div className="form-grid form-grid--cols-3">
            <label>
              <span>Заголовок (RU)</span>
              <input type="text" value={form.title_ru ?? ''} onChange={e => updateField('title_ru', e.target.value || null)} />
            </label>
            <label>
              <span>Заголовок (EN)</span>
              <input type="text" value={form.title_en ?? ''} onChange={e => updateField('title_en', e.target.value || null)} />
            </label>
            <label>
              <span>Заголовок (KZ)</span>
              <input type="text" value={form.title_kz ?? ''} onChange={e => updateField('title_kz', e.target.value || null)} />
            </label>
          </div>

          <label className="form-block">
            <span>Описание</span>
            <textarea rows={4} value={form.description ?? ''} onChange={e => updateField('description', e.target.value || null)} />
          </label>
        </div>

        <div className="panel panel--elevated">
          <div className="panel-title">Статьи в томе</div>
          <div className="article-footer">
            <span className="meta-label">Выбрано: {form.article_ids?.length || 0}</span>
          </div>

          {volume?.articles && volume.articles.length > 0 && (
            <div className="card-list">
              <div className="latest-table__title">Текущие статьи</div>
              <div className="latest-table__body">
                {volume.articles.map(a => (
                  <div className="latest-table__row card" key={String(a.id)}>
                    <div className="latest-table__cell latest-table__cell--title">
                      <div className="latest-table__name">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                      <div className="latest-table__meta">DOI: {a.doi || '—'}</div>
                    </div>
                    <div className="latest-table__cell">{Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}</div>
                    <div className="latest-table__cell">
                      {a.manuscript_file_url ? (
                        <a className="button button--ghost button--compact" href={toApiFilesUrl(a.manuscript_file_url)} target="_blank" rel="noreferrer">PDF</a>
                      ) : (
                        <span className="meta-label">Нет файла</span>
                      )}
                    </div>
                    <div className="latest-table__cell">
                      <button className="button button--secondary" onClick={() => toggleArticle(Number(a.id!))}>
                        {currentArticleIds.has(Number(a.id!)) ? 'Убрать из тома' : 'Добавить в том'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel panel--elevated">
          <div className="panel-title">Добавление статей</div>
          <div className="form-grid form-grid--cols-3">
            <label>
              <span>Поиск по названию/аннотации</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Например: нейросети" />
            </label>
            <label>
              <span>Автор</span>
              <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Фамилия или имя" />
            </label>
            <label>
              <span>Размер страницы</span>
              <input type="number" value={pageSize} onChange={e => setPageSize(Number(e.target.value) || 10)} />
            </label>
          </div>
          <div className="toolbar">
            <button className="button" onClick={() => doSearch(true)} disabled={searching}>{searching ? 'Поиск…' : 'Искать опубликованные'}</button>
            {results && (
              <>
                <button className="button button--ghost" onClick={() => { if (results.pagination.has_prev) { setPage(p => Math.max(1, p - 1)); doSearch(false) } }} disabled={!results.pagination.has_prev}>Назад</button>
                <button className="button button--ghost" onClick={() => { if (results.pagination.has_next) { setPage(p => p + 1); doSearch(false) } }} disabled={!results.pagination.has_next}>Далее</button>
              </>
            )}
          </div>

          {results && (
            <div className="latest-table__body card-list" style={{ marginTop: '1rem' }}>
              {results.items.length === 0 && <div className="meta-label">Ничего не найдено</div>}
              {results.items.map(a => (
                <div className="latest-table__row card" key={String(a.id)}>
                  <div className="latest-table__cell latest-table__cell--title">
                    <div className="latest-table__name">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                    <div className="latest-table__meta">Тип: {a.article_type || '—'} · DOI: {a.doi || '—'}</div>
                  </div>
                  <div className="latest-table__cell">{Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}</div>
                  <div className="latest-table__cell">
                    {a.manuscript_file_url ? (
                      <a className="button button--ghost button--compact" href={toApiFilesUrl(a.manuscript_file_url)} target="_blank" rel="noreferrer">PDF</a>
                    ) : (
                      <span className="meta-label">Нет файла</span>
                    )}
                  </div>
                  <div className="latest-table__cell">
                    <button className="button button--secondary" onClick={() => toggleArticle(Number(a.id!))}>
                      {currentArticleIds.has(Number(a.id!)) ? 'Убрать' : 'Добавить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
