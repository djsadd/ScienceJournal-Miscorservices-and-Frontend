import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Article, Volume } from '../shared/types'
import { toApiFilesUrl } from '../shared/url'
import { useLanguage } from '../shared/LanguageContext'
import { formatArticleType, type Lang } from '../shared/labels'
import './VolumeEditPage.css'

const copy = {
  ru: { edit:'Редактирование выпуска', issue:'Выпуск', selected:'Выбрано', back:'Вернуться к выпускам', save:'Сохранить изменения', saving:'Сохранение…', loading:'Загрузка…', basic:'Основные сведения', year:'Год', number:'Номер выпуска', numberPlaceholder:'Например: 1, 1-2, 2-3', month:'Месяц', noMonth:'Не выбран', status:'Статус', active:'Активен', inactive:'Неактивен', plannedDate:'Плановая дата выпуска', targetCount:'Нужное количество статей', titleAndDescription:'Название и описание', titles:'Название', description:'Описание', files:'Файлы выпуска', filesHint:'Загрузите готовые материалы выпуска в PDF или изображение обложки', completeIssue:'Полный выпуск', contentsFile:'Содержание выпуска', currentFile:'Текущий файл', cover:'Обложка выпуска', noFile:'Файл ещё не загружен', fileNew:'Новый файл', fileUploaded:'Загружен', fileMissing:'Нет файла', addFile:'Добавить файл', chooseFile:'Нажмите для выбора', willSave:'Сохранится вместе с выпуском', download:'Скачать файл', replace:'Заменить файл', deleteFile:'Удалить файл', cancelChoice:'Отменить выбор', articles:'Статьи в выпуске', noArticles:'В выпуске пока нет статей', addArticle:'Добавить статью', actualArticles:'Актуальные статьи', actualHint:'Выберите опубликованные статьи для добавления в выпуск', openArticle:'Открыть статью', remove:'Убрать', add:'Добавить', searchLabel:'Поиск по названию или аннотации', searchPlaceholder:'Например: нейросети', author:'Автор', authorPlaceholder:'Фамилия или имя', pageSize:'На странице', search:'Найти статьи', searching:'Поиск…', found:'Найдено', page:'Страница', previous:'Назад', next:'Далее', nothing:'Ничего не найдено', close:'Готово', untitled:'Без заголовка' },
  en: { edit:'Edit issue', issue:'Issue', selected:'Selected', back:'Back to issues', save:'Save changes', saving:'Saving…', loading:'Loading…', basic:'Issue details', year:'Year', number:'Issue number', numberPlaceholder:'For example: 1, 1-2, 2-3', month:'Month', noMonth:'Not selected', status:'Status', active:'Active', inactive:'Inactive', plannedDate:'Planned publication date', targetCount:'Required article count', titleAndDescription:'Title and description', titles:'Title', description:'Description', files:'Issue files', filesHint:'Upload the complete issue and contents as PDF, or add a cover image', completeIssue:'Complete issue', contentsFile:'Issue contents', currentFile:'Current file', cover:'Issue cover', noFile:'No file uploaded yet', fileNew:'New file', fileUploaded:'Uploaded', fileMissing:'No file', addFile:'Add file', chooseFile:'Click to choose', willSave:'Will be saved with the issue', download:'Download file', replace:'Replace file', deleteFile:'Delete file', cancelChoice:'Cancel selection', articles:'Articles in this issue', noArticles:'There are no articles in this issue yet', addArticle:'Add article', actualArticles:'Available articles', actualHint:'Select published articles to add to the issue', openArticle:'Open article', remove:'Remove', add:'Add', searchLabel:'Search title or abstract', searchPlaceholder:'For example: neural networks', author:'Author', authorPlaceholder:'First or last name', pageSize:'Per page', search:'Find articles', searching:'Searching…', found:'Found', page:'Page', previous:'Previous', next:'Next', nothing:'Nothing found', close:'Done', untitled:'Untitled' },
  kz: { edit:'Шығарылымды өңдеу', issue:'Шығарылым', selected:'Таңдалды', back:'Шығарылымдарға оралу', save:'Өзгерістерді сақтау', saving:'Сақталуда…', loading:'Жүктелуде…', basic:'Негізгі мәліметтер', year:'Жыл', number:'Шығарылым нөмірі', numberPlaceholder:'Мысалы: 1, 1-2, 2-3', month:'Ай', noMonth:'Таңдалмаған', status:'Күйі', active:'Белсенді', inactive:'Белсенді емес', plannedDate:'Жоспарланған шығу күні', targetCount:'Қажетті мақалалар саны', titleAndDescription:'Атауы мен сипаттамасы', titles:'Атауы', description:'Сипаттама', files:'Шығарылым файлдары', filesHint:'Толық шығарылым мен мазмұнды PDF түрінде немесе мұқаба суретін жүктеңіз', completeIssue:'Толық шығарылым', contentsFile:'Шығарылым мазмұны', currentFile:'Ағымдағы файл', cover:'Шығарылым мұқабасы', noFile:'Файл әлі жүктелмеген', fileNew:'Жаңа файл', fileUploaded:'Жүктелген', fileMissing:'Файл жоқ', addFile:'Файл қосу', chooseFile:'Таңдау үшін басыңыз', willSave:'Шығарылыммен бірге сақталады', download:'Файлды жүктеп алу', replace:'Файлды ауыстыру', deleteFile:'Файлды жою', cancelChoice:'Таңдауды болдырмау', articles:'Шығарылымдағы мақалалар', noArticles:'Бұл шығарылымда әзірге мақала жоқ', addArticle:'Мақала қосу', actualArticles:'Өзекті мақалалар', actualHint:'Шығарылымға қосу үшін жарияланған мақалаларды таңдаңыз', openArticle:'Мақаланы ашу', remove:'Алып тастау', add:'Қосу', searchLabel:'Атауы немесе аңдатпасы бойынша іздеу', searchPlaceholder:'Мысалы: нейрондық желілер', author:'Автор', authorPlaceholder:'Тегі немесе аты', pageSize:'Бетте', search:'Мақалаларды табу', searching:'Іздеу…', found:'Табылды', page:'Бет', previous:'Артқа', next:'Келесі', nothing:'Ештеңе табылмады', close:'Дайын', untitled:'Атаусыз' },
} as const

const monthLocales = { ru: 'ru-RU', en: 'en-GB', kz: 'kk-KZ' } as const

const icons = {
  back: 'M19 12H5M11 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
  open: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  close: 'M6 6l12 12M18 6 6 18',
}

const Icon = ({ path }: { path: string }) => (
  <svg
    className="volume-edit-icon"
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

type Copy = (typeof copy)[keyof typeof copy]

const articleDetailHref = (articleId?: string | number | null) => {
  const normalized = Number(articleId)
  return Number.isFinite(normalized) ? `/cabinet/editorial2/${normalized}` : '#'
}

function ArticleRow({ article, index, selected, lang, t, onToggle }: { article: Article; index?: number; selected: boolean; lang: Lang; t: Copy; onToggle: () => void }) {
  const title = (lang === 'en' ? article.title_en : lang === 'kz' ? article.title_kz : article.title_ru) || article.title_ru || article.title_en || article.title_kz || t.untitled
  const authors = Array.isArray(article.authors) ? article.authors.map((x: any) => `${x.last_name} ${x.first_name}`).join(', ') : ''
  const fileUrl = article.layout_file_url || article.manuscript_file_url
  const meta = [article.article_type && formatArticleType(article.article_type, lang), `DOI: ${article.doi || '—'}`, !fileUrl && t.noFile].filter(Boolean).join(' · ')
  return (
    <div className={`volume-edit-article ${index === undefined && selected ? 'volume-edit-article--selected' : ''}`}>
      {index !== undefined && <span className="volume-edit-article__no">{String(index + 1).padStart(2, '0')}</span>}
      <div className="volume-edit-article__info">
        <strong>{title}</strong>
        {authors && <span>{authors}</span>}
        <small>{meta}</small>
      </div>
      <div className="volume-edit-article__actions">
        {fileUrl && <a className="button button--ghost" href={toApiFilesUrl(fileUrl)} target="_blank" rel="noreferrer">PDF</a>}
        <a className="button button--ghost volume-edit-button--icon" href={articleDetailHref(article.id)} target="_blank" rel="noreferrer" title={t.openArticle} aria-label={t.openArticle}><Icon path={icons.open} /></a>
        <button className={`button button--ghost volume-edit-article__toggle ${selected ? 'volume-edit-button--danger' : ''}`} type="button" aria-pressed={selected} onClick={onToggle}>
          {selected ? t.remove : t.add}
        </button>
      </div>
    </div>
  )
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
  // Search results are replaced on every page, so articles picked earlier are kept here
  const [knownArticles, setKnownArticles] = useState<Map<number, Article>>(new Map())
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  const currentArticleIds = useMemo(() => new Set(form.article_ids || []), [form.article_ids])
  const selectedArticles = useMemo(
    () => (form.article_ids || []).flatMap((articleId) => knownArticles.get(articleId) ?? []),
    [form.article_ids, knownArticles],
  )
  const monthNames = useMemo(() => {
    const format = new Intl.DateTimeFormat(monthLocales[lang] || monthLocales.ru, { month: 'long' })
    return Array.from({ length: 12 }, (_, month) => format.format(new Date(2000, month, 1)))
  }, [lang])

  useEffect(() => {
    if (!fileCover) {
      setCoverPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(fileCover)
    setCoverPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [fileCover])

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
          setKnownArticles(new Map((data.articles || []).map((article) => [Number(article.id), article])))
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
      setKnownArticles((prev) => {
        const next = new Map(prev)
        for (const article of data.items) next.set(Number(article.id), article)
        return next
      })
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

  const openPicker = () => {
    setArticlePickerOpen(true)
    if (!results) void doSearch({ resetPage: true })
  }

  const selectedCount = form.article_ids?.length ?? 0
  const targetCount = form.target_article_count ?? 0
  const localizedTitle = volume && ((lang === 'en' ? volume.title_en : lang === 'kz' ? volume.title_kz : volume.title_ru) || volume.title_ru || volume.title_en || volume.title_kz)

  return (
    <div className="volume-edit">
      <header className="volume-edit__header">
        <Link className="volume-edit__back" to="/cabinet/volumes">
          <Icon path={icons.back} />
          {t.back}
        </Link>
        {volume && <span className="volume-edit__kicker">{t.issue} № {volume.number}, {volume.year}</span>}
        <h1 className="volume-edit__title">{t.edit}</h1>
        {localizedTitle && <p className="volume-edit__subtitle">{localizedTitle}</p>}
      </header>

      {loading && <div className="volume-edit__message">{t.loading}</div>}

      <div className="volume-edit__layout">
        <div className="volume-edit__main">
          <section className="volume-edit-section">
            <h2 className="volume-edit-section__title">{t.basic}</h2>
            <div className="volume-edit__fields">
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.year}</span>
                <input
                  className="text-input"
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.year ?? ''}
                  onChange={(e) => updateField('year', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.number}</span>
                <input
                  className="text-input"
                  type="text"
                  value={form.number ?? ''}
                  onChange={(e) => updateField('number', e.target.value || undefined)}
                  placeholder={t.numberPlaceholder}
                />
              </label>
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.month}</span>
                <select className="text-input" value={form.month ?? ''} onChange={(e) => updateField('month', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">{t.noMonth}</option>
                  {monthNames.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}
                </select>
              </label>
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.plannedDate}</span>
                <input className="text-input" type="date" value={form.planned_publication_date ?? ''} onChange={(e) => updateField('planned_publication_date', e.target.value || null)} />
              </label>
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.targetCount}</span>
                <input className="text-input" type="number" min={1} value={form.target_article_count ?? ''} onChange={(e) => updateField('target_article_count', e.target.value ? Number(e.target.value) : null)} />
              </label>
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.status}</span>
                <select className="text-input" value={form.is_active ? 'active' : 'inactive'} onChange={(e) => updateField('is_active', e.target.value === 'active')}>
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                </select>
              </label>
            </div>
          </section>

          <section className="volume-edit-section">
            <h2 className="volume-edit-section__title">{t.titleAndDescription}</h2>
            <div className="volume-edit__stack">
              {(['ru', 'en', 'kz'] as const).map((code) => {
                const key = `title_${code}` as const
                return (
                  <label className="volume-edit-field" key={code}>
                    <span className="volume-edit-field__label">{t.titles} ({code.toUpperCase()})</span>
                    <input className="text-input" type="text" value={form[key] ?? ''} onChange={(e) => updateField(key, e.target.value || null)} />
                  </label>
                )
              })}
              <label className="volume-edit-field">
                <span className="volume-edit-field__label">{t.description}</span>
                <textarea
                  className="text-input volume-edit__textarea"
                  rows={4}
                  value={form.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value || null)}
                />
              </label>
            </div>
          </section>

          <section className="volume-edit-section volume-edit-section--flush">
            <div className="volume-edit-section__head">
              <div>
                <h2 className="volume-edit-section__title">{t.articles}</h2>
                <span className="volume-edit__count">{selectedCount}{targetCount > 0 && ` / ${targetCount}`}</span>
              </div>
              <button className="button button--primary" type="button" onClick={openPicker}><Icon path={icons.plus} />{t.addArticle}</button>
            </div>
            {targetCount > 0 && <i className="volume-edit__progress"><span style={{ width: `${Math.min((selectedCount / targetCount) * 100, 100)}%` }} /></i>}

            {selectedArticles.length > 0 ? (
              selectedArticles.map((a, index) => (
                <ArticleRow key={String(a.id)} article={a} index={index} selected lang={lang} t={t} onToggle={() => toggleArticle(Number(a.id!))} />
              ))
            ) : (
              <div className="volume-edit__empty">{t.noArticles}</div>
            )}
          </section>
        </div>

        <aside className="volume-edit-section volume-edit__aside">
          <h2 className="volume-edit-section__title">{t.files}</h2>
          <p className="volume-edit-section__hint">{t.filesHint}</p>
          <div className="volume-edit__files">
            {([
              ['complete', 'complete_issue_file_id', t.completeIssue, 'PDF', '.pdf', volume?.complete_issue_file_url, fileCompleteIssue, setFileCompleteIssue],
              ['cover', 'cover_file_id', t.cover, 'IMG', 'image/*', volume?.cover_file_url, fileCover, setFileCover],
              ['contents', 'contents_file_id', t.contentsFile, 'PDF', '.pdf', volume?.contents_file_url, fileContents, setFileContents],
            ] as const).map(([key, field, label, kind, accept, currentUrl, selectedFile, setSelectedFile]) => {
              const inputId = `volume-file-${key}`
              const hasFile = Boolean(currentUrl || selectedFile)
              return <div className="manuscript-file-slot volume-edit-file" key={key}>
                <div className="manuscript-file-slot__heading"><span>{label}</span><small>{selectedFile ? t.fileNew : currentUrl ? t.fileUploaded : t.fileMissing}</small></div>
                {hasFile && <div className="manuscript-file-card">
                  <span className={`manuscript-file-card__type manuscript-file-card__type--${kind.toLowerCase()}`}>{kind}</span>
                  <span className="manuscript-file-card__info"><strong title={selectedFile?.name || t.currentFile}>{selectedFile?.name || t.currentFile}</strong>{selectedFile && <small>{t.willSave}</small>}</span>
                  <span className="manuscript-file-card__tools">
                    {currentUrl && <a className="file-icon-action" href={toApiFilesUrl(currentUrl)} download target="_blank" rel="noreferrer" title={t.download} aria-label={t.download}><Icon path={icons.download} /></a>}
                    <label className="file-icon-action" htmlFor={inputId} title={t.replace} aria-label={t.replace}><Icon path={icons.edit} /></label>
                    <button className="file-icon-action file-icon-action--danger" type="button" disabled={fileDeleting === field} title={selectedFile ? t.cancelChoice : t.deleteFile} aria-label={selectedFile ? t.cancelChoice : t.deleteFile} onClick={() => selectedFile ? setSelectedFile(null) : void deleteVolumeFile(field, () => setSelectedFile(null))}><Icon path={icons.trash} /></button>
                  </span>
                </div>}
                <input id={inputId} className="manuscript-file-slot__input" type="file" accept={accept} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                {!hasFile && <label className="manuscript-file-dropzone" htmlFor={inputId}><span>+</span><strong>{t.addFile}</strong><small>{t.chooseFile}</small></label>}
                {key === 'cover' && (() => {
                  const src = selectedFile ? coverPreviewUrl : currentUrl ? toApiFilesUrl(currentUrl) : null
                  return src ? <div className="volume-edit__coverPreview"><img src={src} alt={t.cover} /></div> : null
                })()}
              </div>
            })}
          </div>
        </aside>
      </div>

      <div className="volume-edit__saveBar">
        {error && !articlePickerOpen && <span className="volume-edit__error" role="alert">{error}</span>}
        <Link className="button button--ghost" to="/cabinet/volumes">{t.back}</Link>
        <button className="button button--primary" type="button" onClick={save} disabled={saving || loading}>
          {saving ? t.saving : t.save}
        </button>
      </div>

      {articlePickerOpen && <div className="volume-edit__modal" role="dialog" aria-modal="true" aria-label={t.actualArticles} onMouseDown={(e) => { if (e.target === e.currentTarget) setArticlePickerOpen(false) }}><div className="volume-edit__picker">
        <div className="volume-edit__pickerHead">
          <div>
            <h2 className="volume-edit-section__title">{t.actualArticles}</h2>
            <p className="volume-edit-section__hint">
              {results ? `${t.found}: ${results.pagination.total_count} · ${t.page} ${results.pagination.page} / ${results.pagination.total_pages}` : t.actualHint}
            </p>
          </div>
          <button className="button button--ghost volume-edit-button--icon" type="button" onClick={() => setArticlePickerOpen(false)} title={t.close} aria-label={t.close}><Icon path={icons.close} /></button>
        </div>

        <div className="volume-edit__search">
          <label className="volume-edit-field">
            <span className="volume-edit-field__label">{t.searchLabel}</span>
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
          <label className="volume-edit-field">
            <span className="volume-edit-field__label">{t.author}</span>
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
          <label className="volume-edit-field">
            <span className="volume-edit-field__label">{t.pageSize}</span>
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
          <button className="button button--primary" type="button" onClick={() => doSearch({ resetPage: true })} disabled={searching}>
            <Icon path={icons.search} />
            {searching ? t.searching : t.search}
          </button>
        </div>

        {error && <div className="volume-edit__error volume-edit__error--block" role="alert">{error}</div>}

        <div className="volume-edit__results">
          {results && results.items.length === 0 && <div className="volume-edit__empty">{t.nothing}</div>}
          {results?.items.map((a) => (
            <ArticleRow key={String(a.id)} article={a} selected={currentArticleIds.has(Number(a.id!))} lang={lang} t={t} onToggle={() => toggleArticle(Number(a.id!))} />
          ))}
        </div>

        <div className="volume-edit__pickerFooter">
          <span>{t.selected}: {selectedCount}</span>
          {results && (
            <div className="volume-edit__pager">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => {
                  if (results.pagination.has_prev) void doSearch({ page: Math.max(1, results.pagination.page - 1) })
                }}
                disabled={!results.pagination.has_prev || searching}
              >
                {t.previous}
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => {
                  if (results.pagination.has_next) void doSearch({ page: results.pagination.page + 1 })
                }}
                disabled={!results.pagination.has_next || searching}
              >
                {t.next}
              </button>
            </div>
          )}
          <button className="button button--primary" type="button" onClick={() => setArticlePickerOpen(false)}>{t.close}</button>
        </div>
      </div></div>}
    </div>
  )
}
