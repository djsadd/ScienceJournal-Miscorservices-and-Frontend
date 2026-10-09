import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import { toApiFilesUrl } from '../shared/url'
import { useLanguage } from '../shared/LanguageContext'
import './VolumeEditPage.css'

const copy = {
  ru: { editor:'Редактор', edit:'Редактирование выпуска', issue:'Выпуск', selected:'Выбрано', back:'Вернуться к выпускам', save:'Сохранить изменения', saving:'Сохранение…', loading:'Загрузка…', basic:'Основные сведения', year:'Год', number:'Номер выпуска', month:'Месяц', status:'Статус', active:'Активен', plannedDate:'Плановая дата выпуска', targetCount:'Нужное количество статей', titles:'Название', description:'Описание', files:'Файлы выпуска', filesHint:'Загрузите готовые материалы выпуска в PDF или изображение обложки', completeIssue:'Полный выпуск', contentsFile:'Содержание выпуска', currentFile:'Текущий файл', cover:'Обложка выпуска', openCover:'Открыть текущую обложку', noFile:'Файл ещё не загружен', articles:'Статьи в выпуске', currentArticles:'Текущие статьи', noArticles:'В выпуске пока нет статей', addArticle:'Добавить статью', actualArticles:'Актуальные статьи', actualHint:'Выберите опубликованные статьи для добавления в выпуск', article:'Статья', authors:'Авторы', action:'Действие', openArticle:'Открыть статью', remove:'Убрать', add:'Добавить', searchLabel:'Поиск по названию или аннотации', searchPlaceholder:'Например: нейросети', author:'Автор', authorPlaceholder:'Фамилия или имя', pageSize:'На странице', search:'Найти статьи', searching:'Поиск…', found:'Найдено', page:'Страница', previous:'Назад', next:'Далее', nothing:'Ничего не найдено', close:'Готово', untitled:'Без заголовка', type:'Тип' },
  en: { editor:'Editor', edit:'Edit issue', issue:'Issue', selected:'Selected', back:'Back to issues', save:'Save changes', saving:'Saving…', loading:'Loading…', basic:'Issue details', year:'Year', number:'Issue number', month:'Month', status:'Status', active:'Active', plannedDate:'Planned publication date', targetCount:'Required article count', titles:'Title', description:'Description', files:'Issue files', filesHint:'Upload the complete issue and contents as PDF, or add a cover image', completeIssue:'Complete issue', contentsFile:'Issue contents', currentFile:'Current file', cover:'Issue cover', openCover:'Open current cover', noFile:'No file uploaded yet', articles:'Articles in this issue', currentArticles:'Current articles', noArticles:'There are no articles in this issue yet', addArticle:'Add article', actualArticles:'Available articles', actualHint:'Select published articles to add to the issue', article:'Article', authors:'Authors', action:'Action', openArticle:'Open article', remove:'Remove', add:'Add', searchLabel:'Search title or abstract', searchPlaceholder:'For example: neural networks', author:'Author', authorPlaceholder:'First or last name', pageSize:'Per page', search:'Find articles', searching:'Searching…', found:'Found', page:'Page', previous:'Previous', next:'Next', nothing:'Nothing found', close:'Done', untitled:'Untitled', type:'Type' },
  kz: { editor:'Редактор', edit:'Шығарылымды өңдеу', issue:'Шығарылым', selected:'Таңдалды', back:'Шығарылымдарға оралу', save:'Өзгерістерді сақтау', saving:'Сақталуда…', loading:'Жүктелуде…', basic:'Негізгі мәліметтер', year:'Жыл', number:'Шығарылым нөмірі', month:'Ай', status:'Күйі', active:'Белсенді', plannedDate:'Жоспарланған шығу күні', targetCount:'Қажетті мақалалар саны', titles:'Атауы', description:'Сипаттама', files:'Шығарылым файлдары', filesHint:'Толық шығарылым мен мазмұнды PDF түрінде немесе мұқаба суретін жүктеңіз', completeIssue:'Толық шығарылым', contentsFile:'Шығарылым мазмұны', currentFile:'Ағымдағы файл', cover:'Шығарылым мұқабасы', openCover:'Ағымдағы мұқабаны ашу', noFile:'Файл әлі жүктелмеген', articles:'Шығарылымдағы мақалалар', currentArticles:'Ағымдағы мақалалар', noArticles:'Бұл шығарылымда әзірге мақала жоқ', addArticle:'Мақала қосу', actualArticles:'Өзекті мақалалар', actualHint:'Шығарылымға қосу үшін жарияланған мақалаларды таңдаңыз', article:'Мақала', authors:'Авторлар', action:'Әрекет', openArticle:'Мақаланы ашу', remove:'Алып тастау', add:'Қосу', searchLabel:'Атауы немесе аңдатпасы бойынша іздеу', searchPlaceholder:'Мысалы: нейрондық желілер', author:'Автор', authorPlaceholder:'Тегі немесе аты', pageSize:'Бетте', search:'Мақалаларды табу', searching:'Іздеу…', found:'Табылды', page:'Бет', previous:'Артқа', next:'Келесі', nothing:'Ештеңе табылмады', close:'Дайын', untitled:'Атаусыз', type:'Түрі' },
} as const

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
  planned_publication_date?: string | null
  target_article_count?: number | null
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  description?: string | null
  is_active?: boolean
  article_ids?: number[]
}

export default function VolumeEditPage() {
  const { lang } = useLanguage()
  const t = copy[lang] || copy.ru
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
  const [fileDeleting, setFileDeleting] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [results, setResults] = useState<ArticleSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [articlePickerOpen, setArticlePickerOpen] = useState(false)

  const currentArticleIds = useMemo(() => new Set(form.article_ids || []), [form.article_ids])
  const selectedArticles = useMemo(() => {
    const byId = new Map<number, Article>()
    for (const article of volume?.articles || []) byId.set(Number(article.id), article)
    for (const article of results?.items || []) byId.set(Number(article.id), article)
    return Array.from(byId.values()).filter((article) => currentArticleIds.has(Number(article.id)))
  }, [currentArticleIds, results?.items, volume?.articles])

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
            planned_publication_date: data.planned_publication_date ?? null,
            target_article_count: data.target_article_count ?? null,
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

  const updateField = (key: keyof FormState, value: any) => {
    setForm((prev: FormState) => ({ ...prev, [key]: value }))
  }

  const articleDetailHref = (articleId?: string | number | null) => {
    const normalized = Number(articleId)
    return Number.isFinite(normalized) ? `/cabinet/editorial2/${normalized}` : '#'
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
      body.planned_publication_date = form.planned_publication_date ?? null
      body.target_article_count = form.target_article_count ?? null
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

  const deleteVolumeFile = async (field: 'complete_issue_file_id' | 'cover_file_id' | 'contents_file_id', clearDraft: () => void) => {
    if (!id) return
    setFileDeleting(field)
    setError(null)
    try {
      const updated = await api.updateVolume<Volume>(id, { [field]: null })
      setVolume(updated)
      clearDraft()
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Не удалось удалить файл')
    } finally {
      setFileDeleting(null)
    }
  }

  const selectedCount = form.article_ids?.length ?? 0

  return (
    <div className="app-container volume-edit-page">
      <section className="section-header volume-edit__hero">
        <div>
          <p className="eyebrow">{t.editor}</p>
          <h1 className="page-title">{t.edit}</h1>
          {volume && (
            <p className="subtitle">
              {t.issue} № {volume.number} / {volume.year}
            </p>
          )}
        </div>
        <div className="section-actions volume-edit__actions">
          <Link className="button button--ghost" to="/cabinet/volumes">
            ← {t.back}
          </Link>
        </div>
      </section>

      <section className="section section--narrow">
        {error && <div className="alert error">{error}</div>}
        {loading && <div className="loading">{t.loading}</div>}

        <div className="volume-edit__grid">
          <div className="volume-edit__col">
            <div className="panel volume-edit__panel">
              <div className="volume-edit__panelHeader">
                <div className="panel-title">{t.basic}</div>
              </div>

              <div className="volume-edit__fields volume-edit__fields--basic">
                <label className="form-field">
                  <span className="form-label">{t.year}</span>
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
                  <span className="form-label">{t.number}</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.number ?? ''}
                    onChange={(e) => updateField('number', e.target.value || undefined)}
                    placeholder="Например: 1, 1-2, 2-3"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">{t.month}</span>
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
                  <span className="form-label">{t.status}</span>
                  <label className="checkbox volume-edit__checkbox">
                    <input type="checkbox" checked={!!form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} />
                    <span>{t.active}</span>
                  </label>
                </div>
                <label className="form-field">
                  <span className="form-label">{t.plannedDate}</span>
                  <input className="text-input" type="date" value={form.planned_publication_date ?? ''} onChange={(e) => updateField('planned_publication_date', e.target.value || null)} />
                </label>
                <label className="form-field">
                  <span className="form-label">{t.targetCount}</span>
                  <input className="text-input" type="number" min={1} value={form.target_article_count ?? ''} onChange={(e) => updateField('target_article_count', e.target.value ? Number(e.target.value) : null)} />
                </label>
              </div>

              <div className="volume-edit__fields volume-edit__fields--titles">
                <label className="form-field">
                  <span className="form-label">{t.titles} (RU)</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.title_ru ?? ''}
                    onChange={(e) => updateField('title_ru', e.target.value || null)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">{t.titles} (EN)</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.title_en ?? ''}
                    onChange={(e) => updateField('title_en', e.target.value || null)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">{t.titles} (KZ)</span>
                  <input
                    className="text-input"
                    type="text"
                    value={form.title_kz ?? ''}
                    onChange={(e) => updateField('title_kz', e.target.value || null)}
                  />
                </label>
              </div>

              <label className="form-field volume-edit__description">
                <span className="form-label">{t.description}</span>
                <textarea
                  className="text-input volume-edit__textarea"
                  rows={4}
                  value={form.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value || null)}
                />
              </label>

              <div className="volume-edit__files">
                <div className="volume-edit__sectionTitle"><div><div className="panel-title">{t.files}</div><p>{t.filesHint}</p></div></div>
                <div className="volume-edit__fields volume-edit__fields--files">
                  {([
                    ['complete', 'complete_issue_file_id', t.completeIssue, 'PDF', '.pdf', volume?.complete_issue_file_url, fileCompleteIssue, setFileCompleteIssue],
                    ['cover', 'cover_file_id', t.cover, 'IMG', 'image/*', volume?.cover_file_url, fileCover, setFileCover],
                    ['contents', 'contents_file_id', t.contentsFile, 'PDF', '.pdf', volume?.contents_file_url, fileContents, setFileContents],
                  ] as const).map(([key, field, label, kind, accept, currentUrl, selectedFile, setSelectedFile]) => {
                    const inputId = `volume-file-${key}`
                    const hasFile = Boolean(currentUrl || selectedFile)
                    return <div className={`volume-edit__fileCard manuscript-file-slot ${hasFile ? 'volume-edit__fileCard--uploaded' : ''}`} key={key}>
                      <div className="manuscript-file-slot__heading"><span>{label}</span><small>{selectedFile ? 'Новый файл' : currentUrl ? 'Загружен' : 'Нет файла'}</small></div>
                      {hasFile && <div className="manuscript-file-card">
                        <span className={`manuscript-file-card__type manuscript-file-card__type--${kind.toLowerCase()}`}>{kind}</span>
                        <span className="manuscript-file-card__info"><strong title={selectedFile?.name || label}>{selectedFile?.name || label}</strong><small>{selectedFile ? 'Сохранится вместе с выпуском' : t.currentFile}</small></span>
                        <span className="manuscript-file-card__tools">
                          {currentUrl && <a className="file-icon-action" href={toApiFilesUrl(currentUrl)} download target="_blank" rel="noreferrer" title="Скачать файл" aria-label="Скачать файл">↓</a>}
                          <label className="file-icon-action" htmlFor={inputId} title="Заменить файл" aria-label="Заменить файл">✎</label>
                          <button className="file-icon-action file-icon-action--danger" type="button" disabled={fileDeleting === field} title={selectedFile ? 'Отменить выбор' : 'Удалить файл'} aria-label={selectedFile ? 'Отменить выбор' : 'Удалить файл'} onClick={() => selectedFile ? setSelectedFile(null) : void deleteVolumeFile(field, () => setSelectedFile(null))}>🗑</button>
                        </span>
                      </div>}
                      <input id={inputId} className="manuscript-file-slot__input" type="file" accept={accept} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      {!hasFile && <label className="manuscript-file-dropzone" htmlFor={inputId}><span>+</span><strong>Добавить файл</strong><small>Нажмите для выбора</small></label>}
                      {key === 'cover' && (() => {
                        const src = selectedFile ? URL.createObjectURL(selectedFile) : currentUrl ? toApiFilesUrl(currentUrl) : null
                        return src ? <div className="volume-edit__coverPreview"><img src={src} alt="Обложка выпуска" /></div> : null
                      })()}
                    </div>
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="panel volume-edit__panel" style={{ marginTop: '1rem' }}>
          <div className="volume-edit__panelHeader volume-edit__panelHeader--tight">
            <div>
              <div className="panel-title">{t.articles}</div>
            </div>
            <button className="button button--primary" type="button" onClick={() => { setArticlePickerOpen(true); if (!results) void doSearch({ resetPage: true }) }}>+ {t.addArticle}</button>
          </div>

          {selectedArticles.length > 0 ? (
            <div className="latest-table volume-edit__table volume-edit__table--articles">
              <div className="latest-table__title">{t.currentArticles}</div>
              <div className="latest-table__head volume-edit__head">
                <div>{t.article}</div>
                <div>{t.authors}</div>
                <div>PDF</div>
                <div>{t.action}</div>
              </div>
              <div className="latest-table__body">
                {selectedArticles.map((a) => (
                  <div
                    className={`latest-table__row volume-edit__row ${currentArticleIds.has(Number(a.id!)) ? 'volume-edit__row--selected' : ''}`}
                    key={String(a.id)}
                  >
                    <div className="latest-table__cell latest-table__cell--title">
                      <div className="latest-table__name">{(lang === 'en' ? a.title_en : lang === 'kz' ? a.title_kz : a.title_ru) || a.title_ru || a.title_en || a.title_kz || t.untitled}</div>
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
                        <span className="meta-label">{t.noFile}</span>
                      )}
                    </div>
                    <div className="latest-table__cell volume-edit__cell--actions">
                      <a
                        className="button button--ghost button--compact volume-edit__articleLink"
                        href={articleDetailHref(a.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.openArticle}
                      </a>
                      <button className="button button--secondary button--compact" type="button" onClick={() => toggleArticle(Number(a.id!))}>
                        {currentArticleIds.has(Number(a.id!)) ? t.remove : t.add}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="volume-edit__empty"><strong>{t.noArticles}</strong><button className="button button--primary" type="button" onClick={() => { setArticlePickerOpen(true); if (!results) void doSearch({ resetPage: true }) }}>+ {t.addArticle}</button></div>
          )}
        </div>

        <div className="volume-edit__saveBar">
          <Link className="button button--ghost" to="/cabinet/volumes">← {t.back}</Link>
          <button className="button button--primary" type="button" onClick={save} disabled={saving || loading}>
            {saving ? t.saving : t.save}
          </button>
        </div>

        {articlePickerOpen && <div className="volume-edit__modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setArticlePickerOpen(false) }}><div className="panel volume-edit__panel volume-edit__picker">
          <div className="volume-edit__panelHeader">
            <div>
              <div className="panel-title">{t.actualArticles}</div>
              {results ? (
                <div className="meta-label">
                  {t.found}: {results.pagination.total_count} · {t.page} {results.pagination.page} / {results.pagination.total_pages}
                </div>
              ) : (
                <div className="meta-label">{t.actualHint}</div>
              )}
            </div>
            <button className="volume-edit__modalClose" type="button" onClick={() => setArticlePickerOpen(false)} aria-label={t.close}>×</button>
          </div>

          <div className="volume-edit__fields volume-edit__fields--search">
            <label className="form-field">
              <span className="form-label">{t.searchLabel}</span>
              <input
                className="text-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void doSearch({ resetPage: true })
                }}
                placeholder={t.searchPlaceholder}
              />
            </label>
            <label className="form-field">
              <span className="form-label">{t.author}</span>
              <input
                className="text-input"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void doSearch({ resetPage: true })
                }}
                placeholder={t.authorPlaceholder}
              />
            </label>
            <label className="form-field">
              <span className="form-label">{t.pageSize}</span>
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
              {searching ? t.searching : t.search}
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
                  {t.previous}
                </button>
                <button
                  className="button button--ghost button--compact"
                  onClick={() => {
                    if (results.pagination.has_next) void doSearch({ page: results.pagination.page + 1 })
                  }}
                  disabled={!results.pagination.has_next || searching}
                >
                  {t.next}
                </button>
              </div>
            )}
          </div>

          {results && (
            <div className="latest-table volume-edit__table volume-edit__table--search">
              <div className="latest-table__head volume-edit__head">
                <div>{t.article}</div>
                <div>{t.authors}</div>
                <div>PDF</div>
                <div>{t.action}</div>
              </div>
              <div className="latest-table__body">
                {results.items.length === 0 && <div className="meta-label">{t.nothing}</div>}
                {results.items.map((a) => (
                  <div
                    className={`latest-table__row volume-edit__row ${
                      currentArticleIds.has(Number(a.id!)) ? 'volume-edit__row--selected' : ''
                    }`}
                    key={String(a.id)}
                  >
                    <div className="latest-table__cell latest-table__cell--title">
                      <div className="latest-table__name">{(lang === 'en' ? a.title_en : lang === 'kz' ? a.title_kz : a.title_ru) || a.title_ru || a.title_en || a.title_kz || t.untitled}</div>
                      <div className="latest-table__meta">
                        {t.type}: {a.article_type || '—'} · DOI: {a.doi || '—'}
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
                        <span className="meta-label">{t.noFile}</span>
                      )}
                    </div>
                    <div className="latest-table__cell volume-edit__cell--actions">
                      <a
                        className="button button--ghost button--compact volume-edit__articleLink"
                        href={articleDetailHref(a.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.openArticle}
                      </a>
                      <button className="button button--secondary button--compact" type="button" onClick={() => toggleArticle(Number(a.id!))}>
                        {currentArticleIds.has(Number(a.id!)) ? t.remove : t.add}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="volume-edit__pickerFooter"><span>{t.selected}: {selectedCount}</span><button className="button button--primary" type="button" onClick={() => setArticlePickerOpen(false)}>{t.close}</button></div>
        </div></div>}
      </section>
    </div>
  )
}
