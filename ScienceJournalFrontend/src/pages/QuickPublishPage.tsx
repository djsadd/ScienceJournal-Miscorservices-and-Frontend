import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import { getArticleLanguageOptions } from '../shared/articleLanguages'
import type { Article, Author, Keyword } from '../shared/types'
import { Alert } from '../shared/components/Alert'
import './QuickPublishPage.css'

type Lang = 'ru' | 'kz' | 'en'

interface FormData {
  title_ru: string
  title_en: string
  title_kz: string
  abstract_ru: string
  abstract_en: string
  abstract_kz: string
  articleLanguage: string
  doi: string
  articleType: 'original' | 'review'
  layoutFileId: string
  manuscriptFileId: string
  authorInfoFileId: string
  generativeAiInfo: string
}

interface SelectedItem {
  id: number
  name: string
}

export default function QuickPublishPage() {
  type ErrorLike = { bodyJson?: unknown; message?: unknown }
  type FileOut = {
    id: string
    original_name?: string
    content_type?: string | null
    size_bytes?: number
    url?: string
    created_at?: string
  }

  const { lang: locale } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const [activeLang, setActiveLang] = useState<Lang>('ru')
  const langLabels: Record<Lang, string> = { ru: 'Русский', kz: 'Казахский', en: 'Английский' }

  const [selectedAuthors, setSelectedAuthors] = useState<SelectedItem[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<SelectedItem[]>([])
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [keywordModalOpen, setKeywordModalOpen] = useState(false)

  const [newAuthor, setNewAuthor] = useState({
    email: '',
    prefix: '',
    first_name: '',
    patronymic: '',
    last_name: '',
    phone: '',
    address: '',
    country: 'Kazakhstan',
    affiliation1: '',
    affiliation2: '',
    affiliation3: '',
    is_corresponding: false,
    orcid: '',
    scopus_author_id: '',
    researcher_id: '',
  })

  const [newKeyword, setNewKeyword] = useState({ ru: '', en: '', kz: '' })

  const [fileLayoutName, setFileLayoutName] = useState<string | null>(null)
  const [fileManuscriptName, setFileManuscriptName] = useState<string | null>(null)
  const [fileAuthorInfoName, setFileAuthorInfoName] = useState<string | null>(null)
  const [layoutFileOut, setLayoutFileOut] = useState<FileOut | null>(null)

  const layoutFileRef = useRef<HTMLInputElement>(null)
  const manuscriptFileRef = useRef<HTMLInputElement>(null)
  const authorInfoFileRef = useRef<HTMLInputElement>(null)
  const authorEmailInputRef = useRef<HTMLInputElement>(null)
  const keywordRuInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    title_ru: '',
    title_en: '',
    title_kz: '',
    abstract_ru: '',
    abstract_en: '',
    abstract_kz: '',
    articleLanguage: locale === 'kz' ? 'kk' : locale,
    doi: '',
    articleType: 'original',
    layoutFileId: '',
    manuscriptFileId: '',
    authorInfoFileId: '',
    generativeAiInfo: '',
  })

  const articleLanguageOptions = getArticleLanguageOptions(locale)

  const getTitleForLang = (lang: Lang) =>
    lang === 'ru' ? form.title_ru : lang === 'kz' ? form.title_kz : form.title_en

  const setTitleForLang = (lang: Lang, value: string) =>
    setForm({
      ...form,
      ...(lang === 'ru' ? { title_ru: value } : lang === 'kz' ? { title_kz: value } : { title_en: value }),
    })

  const getAbstractForLang = (lang: Lang) =>
    lang === 'ru' ? form.abstract_ru : lang === 'kz' ? form.abstract_kz : form.abstract_en

  const setAbstractForLang = (lang: Lang, value: string) =>
    setForm({
      ...form,
      ...(lang === 'ru' ? { abstract_ru: value } : lang === 'kz' ? { abstract_kz: value } : { abstract_en: value }),
    })

  const uploadFile = async (file: File) => {
    return api.uploadFile<FileOut>(file)
  }

  const handleLayoutFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      const result = await uploadFile(file)
      setLayoutFileOut(result)
      setForm((prev) => ({ ...prev, layoutFileId: result.id }))
      setFileLayoutName(result.original_name || file.name)
    } catch {
      setError('Ошибка при загрузке файла')
    } finally {
      setLoading(false)
    }
  }

  const handleManuscriptFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      const result = await uploadFile(file)
      setForm((prev) => ({ ...prev, manuscriptFileId: result.id }))
      setFileManuscriptName(file.name)
    } catch {
      setError('Ошибка при загрузке файла')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthorInfoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      const result = await uploadFile(file)
      setForm((prev) => ({ ...prev, authorInfoFileId: result.id }))
      setFileAuthorInfoName(file.name)
    } catch {
      setError('Ошибка при загрузке файла')
    } finally {
      setLoading(false)
    }
  }

  const saveNewAuthor = async () => {
    const optional = (value: string) => (value.trim() ? value.trim() : undefined)

    if (
      !newAuthor.email.trim() ||
      !newAuthor.first_name.trim() ||
      !newAuthor.last_name.trim() ||
      !newAuthor.country.trim() ||
      !newAuthor.affiliation1.trim()
    ) {
      return
    }

    try {
      const created = await api.post<Author>('/articles/authors', {
        email: newAuthor.email.trim(),
        prefix: optional(newAuthor.prefix),
        first_name: newAuthor.first_name.trim(),
        patronymic: optional(newAuthor.patronymic),
        last_name: newAuthor.last_name.trim(),
        phone: optional(newAuthor.phone),
        address: optional(newAuthor.address),
        country: newAuthor.country.trim(),
        affiliation1: newAuthor.affiliation1.trim(),
        affiliation2: optional(newAuthor.affiliation2),
        affiliation3: optional(newAuthor.affiliation3),
        is_corresponding: newAuthor.is_corresponding,
        orcid: optional(newAuthor.orcid),
        scopus_author_id: optional(newAuthor.scopus_author_id),
        researcher_id: optional(newAuthor.researcher_id),
      })

      setSelectedAuthors((prev) => [...prev, { id: created.id!, name: `${created.last_name} ${created.first_name}` }])
      setNewAuthor({
        email: '',
        prefix: '',
        first_name: '',
        patronymic: '',
        last_name: '',
        phone: '',
        address: '',
        country: 'Kazakhstan',
        affiliation1: '',
        affiliation2: '',
        affiliation3: '',
        is_corresponding: false,
        orcid: '',
        scopus_author_id: '',
        researcher_id: '',
      })
      setAuthorModalOpen(false)
    } catch {
      setError('Не удалось создать автора')
    }
  }

  const saveNewKeyword = async () => {
    if (!newKeyword.ru.trim()) return
    try {
      const created = await api.post<Keyword>('/articles/keywords', {
        title_ru: newKeyword.ru.trim(),
        title_kz: newKeyword.kz.trim(),
        title_en: newKeyword.en.trim(),
      })
      setSelectedKeywords((prev) => [
        ...prev,
        { id: created.id!, name: created.title_ru || created.title_en || created.title_kz || 'Unnamed' },
      ])
      setNewKeyword({ ru: '', en: '', kz: '' })
      setKeywordModalOpen(false)
    } catch {
      setError('Не удалось создать ключевое слово')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const layoutFileId = layoutFileOut?.id || form.layoutFileId || undefined
      const result = await api.quickPublishArticle<Article>({
        title_kz: form.title_kz,
        title_en: form.title_en,
        title_ru: form.title_ru,
        abstract_kz: form.abstract_kz || undefined,
        abstract_en: form.abstract_en || undefined,
        abstract_ru: form.abstract_ru || undefined,
        article_language: form.articleLanguage || undefined,
        doi: form.doi || undefined,
        article_type: form.articleType,
        layout_file_id: layoutFileId,
        manuscript_file_id: form.manuscriptFileId || undefined,
        author_info_file_id: form.authorInfoFileId || undefined,
        generative_ai_info: form.generativeAiInfo || undefined,
        author_ids: selectedAuthors.map((a) => a.id),
        keyword_ids: selectedKeywords.map((k) => k.id),
      })

      const articleIdNum = Number(result.id)
      if (layoutFileId && Number.isFinite(articleIdNum)) {
        try {
          const fileUrl = layoutFileOut?.url || `/files/${layoutFileId}/download`
          await api.createLayoutRecord({
            article_id: articleIdNum,
            file_id: layoutFileId,
            file_url: fileUrl,
          })
        } catch {
          // Публикация уже создана; отсутствие layout-записи не должно блокировать переход.
        }
      }

      setSuccess(true)
      setForm({
        title_ru: '',
        title_en: '',
        title_kz: '',
        abstract_ru: '',
        abstract_en: '',
        abstract_kz: '',
        articleLanguage: locale === 'kz' ? 'kk' : locale,
        doi: '',
        articleType: 'original',
        layoutFileId: '',
        manuscriptFileId: '',
        authorInfoFileId: '',
        generativeAiInfo: '',
      })
      setSelectedAuthors([])
      setSelectedKeywords([])
      setFileLayoutName(null)
      setFileManuscriptName(null)
      setFileAuthorInfoName(null)
      setLayoutFileOut(null)
      setTimeout(() => {
        window.location.href = `/articles/${result.id}`
      }, 1000)
    } catch (err: unknown) {
      let message: string | undefined
      if (err && typeof err === 'object') {
        const maybe = err as ErrorLike
        if (maybe.bodyJson && typeof maybe.bodyJson === 'object') {
          const detail = (maybe.bodyJson as Record<string, unknown>).detail
          if (typeof detail === 'string' && detail.trim()) message = detail
        }
        if (!message && typeof maybe.message === 'string' && maybe.message.trim()) message = maybe.message
      }
      setError(message || 'Не удалось опубликовать статью')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authorModalOpen && !keywordModalOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAuthorModalOpen(false)
      setKeywordModalOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [authorModalOpen, keywordModalOpen])

  useEffect(() => {
    if (!authorModalOpen) return
    const id = window.setTimeout(() => authorEmailInputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [authorModalOpen])

  useEffect(() => {
    if (!keywordModalOpen) return
    const id = window.setTimeout(() => keywordRuInputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [keywordModalOpen])

  const langDone: Record<Lang, boolean> = {
    ru: Boolean(form.title_ru.trim()),
    kz: Boolean(form.title_kz.trim()),
    en: Boolean(form.title_en.trim()),
  }
  const langDoneCount = (['ru', 'kz', 'en'] as const).reduce((acc, l) => acc + (langDone[l] ? 1 : 0), 0)
  const filesDoneCount =
    (form.layoutFileId ? 1 : 0) + (form.manuscriptFileId ? 1 : 0) + (form.authorInfoFileId ? 1 : 0)

  const progressTotal = 6
  const progressDone = langDoneCount + filesDoneCount
  const progressPct = Math.min(100, Math.round((progressDone / progressTotal) * 100))

  const canPublish = !loading && Boolean(form.title_ru.trim() && form.title_en.trim() && form.title_kz.trim())

  const clearLayoutFile = () => {
    setForm((prev) => ({ ...prev, layoutFileId: '' }))
    setFileLayoutName(null)
    setLayoutFileOut(null)
    if (layoutFileRef.current) layoutFileRef.current.value = ''
  }
  const clearManuscriptFile = () => {
    setForm((prev) => ({ ...prev, manuscriptFileId: '' }))
    setFileManuscriptName(null)
    if (manuscriptFileRef.current) manuscriptFileRef.current.value = ''
  }
  const clearAuthorInfoFile = () => {
    setForm((prev) => ({ ...prev, authorInfoFileId: '' }))
    setFileAuthorInfoName(null)
    if (authorInfoFileRef.current) authorInfoFileRef.current.value = ''
  }

  const removeAuthor = (id: number) => setSelectedAuthors((prev) => prev.filter((a) => a.id !== id))
  const removeKeyword = (id: number) => setSelectedKeywords((prev) => prev.filter((k) => k.id !== id))

  const steps = [
    { label: 'Основное', hint: 'Название и аннотация' },
    { label: 'Метаданные', hint: 'Тип, язык и DOI' },
    { label: 'Материалы', hint: 'Файлы публикации' },
    { label: 'Участники', hint: 'Авторы и ключевые слова' },
    { label: 'Просмотр', hint: 'Проверка и публикация' },
  ]

  const goToStep = (index: number) => {
    setActiveStep(Math.max(0, Math.min(steps.length - 1, index)))
    window.requestAnimationFrame(() => document.querySelector('.quick-publish__workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const previewTitle = form.title_ru || form.title_kz || form.title_en || 'Название статьи'
  const previewAbstract = form.abstract_ru || form.abstract_kz || form.abstract_en || 'Аннотация появится здесь после заполнения.'

  return (
    <div className="app-container quick-publish">
      <section className="section public-section quick-publish__section">
        <div className="quick-publish__header">
          <div className="quick-publish__intro">
            <p className="eyebrow">Редактор</p>
            <h1 className="hero__title">Быстрая публикация статьи</h1>
            <p className="subtitle">Соберите карточку публикации по разделам, проверьте рукопись и опубликуйте её напрямую.</p>
          </div>

          <div className="panel panel--elevated quick-publish__hero-panel">
            <div className="panel-title" style={{ margin: 0 }}>
              Готовность
            </div>
            <div className="quick-publish__progress" aria-label="Прогресс заполнения">
              <div className="quick-publish__progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="quick-publish__progress-meta">
              <span>Языки: {langDoneCount}/3</span>
              <span>Файлы: {filesDoneCount}/3</span>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className="quick-publish__alerts">
            {error && (
              <Alert variant="error" title="Ошибка">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" title="Готово">
                Статья успешно опубликована! Перенаправление...
              </Alert>
            )}
          </div>
        )}

        <div className="quick-publish__workspace">
          <nav className="quick-publish__steps" aria-label="Разделы публикации">
            {steps.map((step, index) => (
              <button type="button" key={step.label} onClick={() => goToStep(index)} className={activeStep === index ? 'is-active' : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.label}</strong>
                <small>{step.hint}</small>
              </button>
            ))}
          </nav>

          <form id="quick-publish-form" onSubmit={handleSubmit} className="quick-publish__editor">
            <header className="quick-publish__editor-head">
              <div><span>Раздел {activeStep + 1} из {steps.length}</span><h2>{steps[activeStep].label}</h2></div>
              <button type="button" className="quick-publish__preview-link" onClick={() => goToStep(4)}>Предпросмотр рукописи →</button>
            </header>

            <div className="quick-publish__stage" key={activeStep}>
              {activeStep === 0 && <>
                <div className="quick-publish__language-row">
                  <div><strong>Язык данных</strong><small>Заполните карточку на трёх языках</small></div>
                  <div className="lang-switch">{(['ru', 'kz', 'en'] as const).map((code) => <button key={code} type="button" className={`lang-chip ${activeLang === code ? 'lang-chip--active' : ''} ${langDone[code] ? 'lang-chip--done' : ''}`} onClick={() => setActiveLang(code)}>{langLabels[code]} {langDone[code] && '✓'}</button>)}</div>
                </div>
                <label className="quick-publish__paper-field"><span>Название статьи <b>*</b></span><input value={getTitleForLang(activeLang)} onChange={(e) => setTitleForLang(activeLang, e.target.value)} placeholder="Введите название статьи" /><small>{getTitleForLang(activeLang).length} символов</small></label>
                <label className="quick-publish__paper-field"><span>Аннотация</span><textarea rows={9} value={getAbstractForLang(activeLang)} onChange={(e) => setAbstractForLang(activeLang, e.target.value)} placeholder="Кратко опишите цель, методы и результаты исследования" /><small>{getAbstractForLang(activeLang).length} символов</small></label>
              </>}

              {activeStep === 1 && <div className="quick-publish__field-grid">
                <label><span>Основной язык рукописи</span><select value={form.articleLanguage} onChange={(e) => setForm({ ...form, articleLanguage: e.target.value })}>{articleLanguageOptions.map((o) => <option key={o.code} value={o.code}>{o.label} ({o.code.toUpperCase()})</option>)}</select></label>
                <label><span>Тип статьи</span><select value={form.articleType} onChange={(e) => setForm({ ...form, articleType: e.target.value as FormData['articleType'] })}><option value="original">Оригинальная статья</option><option value="review">Обзорная статья</option></select></label>
                <label><span>DOI</span><input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} placeholder="10.1234/example" /></label>
                <label className="is-wide"><span>Информация об использовании генеративного ИИ</span><textarea rows={5} value={form.generativeAiInfo} onChange={(e) => setForm({ ...form, generativeAiInfo: e.target.value })} placeholder="Укажите инструменты и способ использования, если применимо" /></label>
              </div>}

              {activeStep === 2 && <div className="quick-publish__uploads">
                {[
                  { title: 'Готовая вёрстка', note: 'PDF или файл финальной версии', name: fileLayoutName, id: form.layoutFileId, ref: layoutFileRef, change: handleLayoutFileSelect, clear: clearLayoutFile },
                  { title: 'Файл рукописи', note: 'DOCX, DOC или PDF', name: fileManuscriptName, id: form.manuscriptFileId, ref: manuscriptFileRef, change: handleManuscriptFileSelect, clear: clearManuscriptFile },
                  { title: 'Сведения об авторах', note: 'Дополнительный файл с данными', name: fileAuthorInfoName, id: form.authorInfoFileId, ref: authorInfoFileRef, change: handleAuthorInfoFileSelect, clear: clearAuthorInfoFile },
                ].map((file) => <div className={`quick-publish__upload ${file.id ? 'is-ready' : ''}`} key={file.title}><input ref={file.ref} type="file" hidden onChange={file.change} /><span className="quick-publish__upload-icon">{file.id ? '✓' : '↑'}</span><div><strong>{file.title}</strong><small>{file.name || file.note}</small></div><button type="button" onClick={() => file.ref.current?.click()} disabled={loading}>{file.id ? 'Заменить' : 'Выбрать файл'}</button>{file.id && <button type="button" className="is-remove" onClick={file.clear}>×</button>}</div>)}
              </div>}

              {activeStep === 3 && <div className="quick-publish__collections">
                <section><header><div><span>01</span><h3>Авторы</h3><p>Укажите авторов в порядке публикации.</p></div><button type="button" onClick={() => setAuthorModalOpen(true)}>+ Добавить автора</button></header>{selectedAuthors.length ? <div className="quick-publish__tags">{selectedAuthors.map((a, i) => <span key={a.id} className="quick-publish__tag"><i>{i + 1}</i>{a.name}<button type="button" onClick={() => removeAuthor(a.id)}>×</button></span>)}</div> : <p className="quick-publish__empty">Авторы пока не добавлены</p>}</section>
                <section><header><div><span>02</span><h3>Ключевые слова</h3><p>Добавьте термины для индексации статьи.</p></div><button type="button" onClick={() => setKeywordModalOpen(true)}>+ Добавить слово</button></header>{selectedKeywords.length ? <div className="quick-publish__tags">{selectedKeywords.map((k) => <span key={k.id} className="quick-publish__tag">{k.name}<button type="button" onClick={() => removeKeyword(k.id)}>×</button></span>)}</div> : <p className="quick-publish__empty">Ключевые слова пока не добавлены</p>}</section>
              </div>}

              {activeStep === 4 && <article className="quick-publish__manuscript">
                <div className="quick-publish__manuscript-meta"><span>{form.articleType === 'original' ? 'Оригинальная статья' : 'Обзорная статья'}</span><span>{form.articleLanguage.toUpperCase()}</span>{form.doi && <span>DOI {form.doi}</span>}</div>
                <h1>{previewTitle}</h1>
                <p className="quick-publish__byline">{selectedAuthors.length ? selectedAuthors.map((a) => a.name).join(' · ') : 'Авторы не указаны'}</p>
                <div className="quick-publish__abstract"><small>Аннотация</small><p>{previewAbstract}</p></div>
                {selectedKeywords.length > 0 && <p className="quick-publish__keywords"><strong>Ключевые слова:</strong> {selectedKeywords.map((k) => k.name).join(', ')}</p>}
                <footer><span>Материалы</span><strong>{filesDoneCount} из 3 файлов загружено</strong></footer>
              </article>}
            </div>

            <footer className="quick-publish__editor-footer">
              <button type="button" className="button button--ghost" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 0}>← Назад</button>
              <span>Все изменения сохраняются в форме</span>
              {activeStep < steps.length - 1 ? <button type="button" className="button button--primary" onClick={() => goToStep(activeStep + 1)}>Продолжить →</button> : <button type="submit" className="button button--primary" disabled={!canPublish}>{loading ? 'Публикация…' : 'Опубликовать статью'}</button>}
            </footer>
          </form>
        </div>

        {authorModalOpen && (
          <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label="Добавить автора"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="modal__header">
                <h3>Добавить автора</h3>
                <button type="button" className="modal__close" onClick={() => setAuthorModalOpen(false)} aria-label="Закрыть">
                  ×
                </button>
              </div>
              <div className="modal__body">
                <div className="modal-form-grid">
                  <div className="form-field">
                    <label className="form-label">Email*</label>
                    <input
                      ref={authorEmailInputRef}
                      type="email"
                      className="text-input"
                      placeholder="example@domain.com"
                      value={newAuthor.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, email: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Prefix</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Dr., Prof."
                      value={newAuthor.prefix}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, prefix: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Имя*</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Например: Иван"
                      value={newAuthor.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, first_name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Фамилия*</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Например: Петров"
                      value={newAuthor.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, last_name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Отчество</label>
                    <input
                      type="text"
                      className="text-input"
                      value={newAuthor.patronymic}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, patronymic: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Country*</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Kazakhstan"
                      value={newAuthor.country}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, country: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Affiliation 1*</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="University / Organization"
                      value={newAuthor.affiliation1}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, affiliation1: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Affiliation 2</label>
                    <input
                      type="text"
                      className="text-input"
                      value={newAuthor.affiliation2}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, affiliation2: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Affiliation 3</label>
                    <input
                      type="text"
                      className="text-input"
                      value={newAuthor.affiliation3}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, affiliation3: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="text-input"
                      value={newAuthor.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="text-input"
                      value={newAuthor.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, address: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">ORCID</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="0000-0000-0000-0000"
                      value={newAuthor.orcid}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, orcid: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Scopus Author ID</label>
                    <input
                      type="text"
                      className="text-input"
                      value={newAuthor.scopus_author_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, scopus_author_id: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Researcher ID</label>
                    <input
                      type="text"
                      className="text-input"
                      value={newAuthor.researcher_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, researcher_id: e.target.value })}
                    />
                  </div>
                  <label className="quick-publish__checkbox">
                    <input
                      type="checkbox"
                      checked={newAuthor.is_corresponding}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewAuthor({ ...newAuthor, is_corresponding: e.target.checked })
                      }
                    />
                    <span>Corresponding author</span>
                  </label>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="button button--ghost" onClick={() => setAuthorModalOpen(false)}>
                  Закрыть
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={saveNewAuthor}
                  disabled={
                    !newAuthor.email.trim() ||
                    !newAuthor.first_name.trim() ||
                    !newAuthor.last_name.trim() ||
                    !newAuthor.country.trim() ||
                    !newAuthor.affiliation1.trim()
                  }
                >
                  Создать и добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {keywordModalOpen && (
          <div className="modal-backdrop" onClick={() => setKeywordModalOpen(false)}>
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label="Добавить ключевое слово"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="modal__header">
                <h3>Добавить ключевое слово</h3>
                <button type="button" className="modal__close" onClick={() => setKeywordModalOpen(false)} aria-label="Закрыть">
                  ×
                </button>
              </div>
              <div className="modal__body">
                <div className="form-field">
                  <label className="form-label">На русском*</label>
                  <input
                    ref={keywordRuInputRef}
                    type="text"
                    className="text-input"
                    placeholder="Например: Искусственный интеллект"
                    value={newKeyword.ru}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword({ ...newKeyword, ru: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">На казахском</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Например: Жасанды интеллект"
                    value={newKeyword.kz}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword({ ...newKeyword, kz: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">На английском</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Например: Artificial Intelligence"
                    value={newKeyword.en}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword({ ...newKeyword, en: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="button button--ghost" onClick={() => setKeywordModalOpen(false)}>
                  Закрыть
                </button>
                <button type="button" className="button button--primary" onClick={saveNewKeyword} disabled={!newKeyword.ru.trim()}>
                  Создать и добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
