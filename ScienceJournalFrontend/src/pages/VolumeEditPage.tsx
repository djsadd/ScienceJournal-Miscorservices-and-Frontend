import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import { toApiFilesUrl } from '../shared/url'
import './VolumeEditPage.css'

interface ArticleSearchResult {
  items: Article[]
  pagination: {
    total_count: number
    page: number
    page_size: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

type FormState = {
  year?: number
  number?: string
  month?: number | null
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  description?: string | null
  is_active?: boolean
  article_ids?: number[]
}

export default function VolumeEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [volume, setVolume] = useState<Volume | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({})
  const [fileCompleteIssue, setFileCompleteIssue] = useState<File | null>(null)
  const [fileCover, setFileCover] = useState<File | null>(null)
  const [fileContents, setFileContents] = useState<File | null>(null)

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
            article_ids: Array.isArray(data.articles) ? data.articles.map((a) => Number(a.id!)) : [],
          })
          setFileCompleteIssue(null)
          setFileCover(null)
          setFileContents(null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || 'Не удалось загрузить том')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id])

  const doSearch = async (opts: { resetPage?: boolean; page?: number } = {}) => {
    setSearching(true)
    setError(null)
    try {
      const targetPage = opts.resetPage ? 1 : (opts.page ?? page)
      const params = {
        status: 'published' as const,
        search: search || undefined,
        author_name: authorName || undefined,
        page: targetPage,
        page_size: pageSize,
      }
      const data = await api.getUnassignedArticles<ArticleSearchResult>(params)
      setResults(data)
      setPage(data.pagination?.page ?? targetPage)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Ошибка поиска статей')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    void doSearch({ resetPage: true })
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
      body.year = form.year
      body.number = form.number
      body.month = form.month ?? null
      body.title_kz = form.title_kz ?? null
      body.title_en = form.title_en ?? null
      body.title_ru = form.title_ru ?? null
      body.description = form.description ?? null
      body.is_active = !!form.is_active
      body.article_ids = form.article_ids || []

      // Optional uploads for issue-level files
      if (fileCompleteIssue || fileCover || fileContents) {
        const upload = async (file: File) => api.uploadFile<{ id: string }>(file)
        if (fileCompleteIssue) body.complete_issue_file_id = (await upload(fileCompleteIssue)).id
        if (fileCover) body.cover_file_id = (await upload(fileCover)).id
        if (fileContents) body.contents_file_id = (await upload(fileContents)).id
      }

      const updated = await api.updateVolume<Volume>(id, body)
      setVolume(updated)
      navigate(`/cabinet/volumes/${id}`)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = form.article_ids?.length ?? 0

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Редактирование тома</h1>
          {volume && (
            <p className="subtitle">
              Том {volume.number} / {volume.year}
            </p>
          )}
        </div>
        <div className="section-actions volume-edit__actions">
          <span className="badge badge--info volume-edit__badge">Выбрано: {selectedCount}</span>
          <Link className="button button--ghost" to={`/cabinet/volumes/${id}`}>
            ← Назад к деталям
          </Link>
          <button className="button button--primary" onClick={save} disabled={saving || loading}>
            {saving ? 'Сохранение…' : 'Сохранить изменения'}
          </button>
        </div>
      </section>

      <section className="section section--narrow">
        {error && <div className="alert error">{error}</div>}
        {loading && <div className="loading">Загрузка...</div>}

        <div className="volume-edit__grid">
          <div className="volume-edit__col">
            <div className="panel volume-edit__panel">
              <div className="volume-edit__panelHeader">
                <div className="panel-title">Основные сведения</div>
                <div className="volume-edit__panelHint meta-label">ID: {id || '—'}</div>
              </div>

              <div className="volume-edit__fields volume-edit__fields--basic">
                <label className="form-field">
                  <span className="form-label">Год</span>
                  <input
                    className="text-input"
                    type="number"
                    min={1900}
                    max={2100}
                    value={form.year ?? ''}
                    onChange={(e) => updateField('year', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Номер журнала</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.number ?? ''}
                    onChange={(e) => updateField('number', e.target.value || undefined)}
                    placeholder="Например: 1, 1-2, 2-3"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Месяц</span>
                  <input
                    className="text-input"
                    type="number"
                    min={1}
                    max={12}
                    value={form.month ?? ''}
                    onChange={(e) => updateField('month', e.target.value ? Number(e.target.value) : null)}
                    placeholder="1-12"
                  />
                </label>
                <div className="form-field">
                  <span className="form-label">Статус</span>
                  <label className="checkbox volume-edit__checkbox">
                    <input type="checkbox" checked={!!form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} />
                    <span>Активен</span>
                  </label>
                </div>
              </div>

              <div className="volume-edit__fields volume-edit__fields--titles">
                <label className="form-field">
                  <span className="form-label">Заголовок (RU)</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.title_ru ?? ''}
                    onChange={(e) => updateField('title_ru', e.target.value || null)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Заголовок (EN)</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.title_en ?? ''}
                    onChange={(e) => updateField('title_en', e.target.value || null)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Заголовок (KZ)</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.title_kz ?? ''}
                    onChange={(e) => updateField('title_kz', e.target.value || null)}
                  />
                </label>
              </div>

              <label className="form-field volume-edit__description">
                <span className="form-label">Описание</span>
                <textarea
                  className="text-input volume-edit__textarea"
                  rows={4}
                  value={form.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value || null)}
                />
              </label>

              <div className="volume-edit__files">
                <div className="panel-title" style={{ fontSize: '1.05rem', marginTop: '0.85rem' }}>Файлы выпуска</div>
                <div className="volume-edit__fields volume-edit__fields--files">
                  <label className="form-field">
                    <span className="form-label">Complete Issue</span>
                    <input
                      type="file"
                      className="file-input"
                      accept=".pdf"
                      onChange={(e) => setFileCompleteIssue(e.target.files?.[0] || null)}
                    />
                    <div className="meta-label">
                      {volume?.complete_issue_file_url ? (
                        <a href={toApiFilesUrl(volume.complete_issue_file_url)} target="_blank" rel="noreferrer">Текущий файл</a>
                      ) : (
                        'Текущий файл: —'
                      )}
                    </div>
                  </label>
                  <label className="form-field">
                    <span className="form-label">Обложка (постер)</span>
                    <input
                      type="file"
                      className="file-input"
                      accept="image/*"
                      onChange={(e) => setFileCover(e.target.files?.[0] || null)}
                    />
                    <div className="meta-label">
                      {volume?.cover_file_url ? (
                        <a href={toApiFilesUrl(volume.cover_file_url)} target="_blank" rel="noreferrer">Открыть текущую обложку</a>
                      ) : (
                        'Текущий файл: —'
                      )}
                    </div>
                    {(() => {
                      const existing = volume?.cover_file_url ? toApiFilesUrl(volume.cover_file_url) : null
                      const selected = fileCover ? URL.createObjectURL(fileCover) : null
                      const src = selected || existing
                      if (!src) return null
                      return (
                        <div className="volume-edit__coverPreview">
                          <img src={src} alt="Обложка выпуска" />
                        </div>
                      )
                    })()}
                  </label>
                  <label className="form-field">
                    <span className="form-label">Contents File</span>
                    <input
                      type="file"
                      className="file-input"
                      accept=".pdf"
                      onChange={(e) => setFileContents(e.target.files?.[0] || null)}
                    />
                    <div className="meta-label">
                      {volume?.contents_file_url ? (
                        <a href={toApiFilesUrl(volume.contents_file_url)} target="_blank" rel="noreferrer">Текущий файл</a>
                      ) : (
                        'Текущий файл: —'
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="panel volume-edit__panel" style={{ marginTop: '1rem' }}>
          <div className="volume-edit__panelHeader volume-edit__panelHeader--tight">
            <div>
              <div className="panel-title">Статьи в томе</div>
              <div className="meta-label">Выбрано: {selectedCount}</div>
            </div>
          </div>

          {volume?.articles && volume.articles.length > 0 ? (
            <div className="latest-table volume-edit__table volume-edit__table--articles">
              <div className="latest-table__title">Текущие статьи</div>
              <div className="latest-table__head volume-edit__head">
                <div>Статья</div>
                <div>Авторы</div>
                <div>PDF</div>
                <div>Действие</div>
              </div>
              <div className="latest-table__body">
                {volume.articles.map((a) => (
                  <div
                    className={`latest-table__row volume-edit__row ${currentArticleIds.has(Number(a.id!)) ? 'volume-edit__row--selected' : ''}`}
                    key={String(a.id)}
                  >
                    <div className="latest-table__cell latest-table__cell--title">
                      <div className="latest-table__name">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                      <div className="latest-table__meta">DOI: {a.doi || '—'}</div>
                    </div>
                    <div className="latest-table__cell volume-edit__authors">
                      {Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}
                    </div>
                    <div className="latest-table__cell volume-edit__cell--file">
                      {a.layout_file_url || a.manuscript_file_url ? (
                        <a className="button button--ghost button--compact" href={toApiFilesUrl(a.layout_file_url || a.manuscript_file_url || '')} target="_blank" rel="noreferrer">
                          PDF
                        </a>
                      ) : (
                        <span className="meta-label">Нет файла</span>
                      )}
                    </div>
                    <div className="latest-table__cell volume-edit__cell--actions">
                      <button className="button button--secondary button--compact" type="button" onClick={() => toggleArticle(Number(a.id!))}>
                        {currentArticleIds.has(Number(a.id!)) ? 'Убрать из тома' : 'Добавить в том'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="meta-label">В этом томе пока нет статей</div>
          )}
        </div>

        <div className="panel volume-edit__panel">
          <div className="volume-edit__panelHeader">
            <div>
              <div className="panel-title">Добавление статей</div>
              {results ? (
                <div className="meta-label">
                  Найдено: {results.pagination.total_count} · Стр. {results.pagination.page} / {results.pagination.total_pages}
                </div>
              ) : (
                <div className="meta-label">Фильтры для поиска опубликованных статей</div>
              )}
            </div>
          </div>

          <div className="volume-edit__fields volume-edit__fields--search">
            <label className="form-field">
              <span className="form-label">Поиск по названию/аннотации</span>
              <input
                className="text-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void doSearch({ resetPage: true })
                }}
                placeholder="Например: нейросети"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Автор</span>
              <input
                className="text-input"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void doSearch({ resetPage: true })
                }}
                placeholder="Фамилия или имя"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Размер страницы</span>
              <input
                className="text-input"
                type="number"
                min={5}
                max={100}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void doSearch({ resetPage: true })
                }}
              />
            </label>
          </div>

          <div className="volume-edit__toolbar">
            <button className="button" onClick={() => doSearch({ resetPage: true })} disabled={searching}>
              {searching ? 'Поиск…' : 'Искать опубликованные'}
            </button>
            {results && (
              <div className="volume-edit__pager">
                <button
                  className="button button--ghost button--compact"
                  onClick={() => {
                    if (results.pagination.has_prev) void doSearch({ page: Math.max(1, results.pagination.page - 1) })
                  }}
                  disabled={!results.pagination.has_prev || searching}
                >
                  Назад
                </button>
                <button
                  className="button button--ghost button--compact"
                  onClick={() => {
                    if (results.pagination.has_next) void doSearch({ page: results.pagination.page + 1 })
                  }}
                  disabled={!results.pagination.has_next || searching}
                >
                  Далее
                </button>
              </div>
            )}
          </div>

          {results && (
            <div className="latest-table volume-edit__table volume-edit__table--search">
              <div className="latest-table__head volume-edit__head">
                <div>Статья</div>
                <div>Авторы</div>
                <div>PDF</div>
                <div>Действие</div>
              </div>
              <div className="latest-table__body">
                {results.items.length === 0 && <div className="meta-label">Ничего не найдено</div>}
                {results.items.map((a) => (
                  <div
                    className={`latest-table__row volume-edit__row ${
                      currentArticleIds.has(Number(a.id!)) ? 'volume-edit__row--selected' : ''
                    }`}
                    key={String(a.id)}
                  >
                    <div className="latest-table__cell latest-table__cell--title">
                      <div className="latest-table__name">{a.title_ru || a.title_en || a.title_kz || 'Без заголовка'}</div>
                      <div className="latest-table__meta">
                        Тип: {a.article_type || '—'} · DOI: {a.doi || '—'}
                      </div>
                    </div>
                    <div className="latest-table__cell volume-edit__authors">
                      {Array.isArray(a.authors) ? a.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : '—'}
                    </div>
                    <div className="latest-table__cell volume-edit__cell--file">
                      {a.layout_file_url || a.manuscript_file_url ? (
                        <a className="button button--ghost button--compact" href={toApiFilesUrl(a.layout_file_url || a.manuscript_file_url || '')} target="_blank" rel="noreferrer">
                          PDF
                        </a>
                      ) : (
                        <span className="meta-label">Нет файла</span>
                      )}
                    </div>
                    <div className="latest-table__cell volume-edit__cell--actions">
                      <button className="button button--secondary button--compact" type="button" onClick={() => toggleArticle(Number(a.id!))}>
                        {currentArticleIds.has(Number(a.id!)) ? 'Убрать' : 'Добавить'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
