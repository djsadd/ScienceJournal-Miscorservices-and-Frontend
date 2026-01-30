import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    doi: '',
    articleType: 'original',
    layoutFileId: '',
    manuscriptFileId: '',
    authorInfoFileId: '',
    generativeAiInfo: '',
  })

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
        } catch {}
      }

      setSuccess(true)
      setForm({
        title_ru: '',
        title_en: '',
        title_kz: '',
        abstract_ru: '',
        abstract_en: '',
        abstract_kz: '',
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

  return (
    <div className="app-container quick-publish">
      <section className="section public-section quick-publish__section">
        <div className="quick-publish__header">
          <div className="quick-publish__intro">
            <p className="eyebrow">Редактор</p>
            <h1 className="hero__title">Быстрая публикация статьи</h1>
            <p className="subtitle">Загрузите готовую статью и опубликуйте её напрямую</p>
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

        <div className="quick-publish__layout">
          <form id="quick-publish-form" onSubmit={handleSubmit} className="auth-form quick-publish__form">
            <div className="form-field">
            <label className="form-label">Язык формы</label>
            <div className="lang-switch">
              {(['ru', 'kz', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-chip ${activeLang === code ? 'lang-chip--active' : ''} ${langDone[code] ? 'lang-chip--done' : ''}`}
                  onClick={() => setActiveLang(code)}
                  aria-label={`Переключить язык: ${langLabels[code]}`}
                >
                  <span className="lang-chip__label">{langLabels[code]}</span>
                  {langDone[code] ? <span className="lang-chip__done" aria-hidden>✓</span> : null}
                </button>
              ))}
            </div>
            <p className="form-hint">Заполните название на русском, затем на казахском и английском.</p>
          </div>

          <div className="form-field">
            <label className="form-label">Название статьи ({langLabels[activeLang]})*</label>
            <input
              className="text-input"
              type="text"
              value={getTitleForLang(activeLang)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitleForLang(activeLang, e.target.value)}
              placeholder="Введите название статьи"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Аннотация ({langLabels[activeLang]})</label>
            <textarea
              className="text-input"
              rows={5}
              value={getAbstractForLang(activeLang)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAbstractForLang(activeLang, e.target.value)}
              placeholder="Короткое описание статьи (необязательно)"
            />
          </div>

          <div className="form-grid form-grid--cols-3">
            <div className="form-field">
              <label className="form-label">DOI</label>
              <input
                className="text-input"
                type="text"
                value={form.doi}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, doi: e.target.value })}
                placeholder="10.1234/example"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Тип статьи</label>
              <select
                className="chip-select"
                value={form.articleType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, articleType: e.target.value as FormData['articleType'] })
                }
              >
                <option value="original">Original</option>
                <option value="review">Review</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Информация об ИИ</label>
              <input
                className="text-input"
                type="text"
                value={form.generativeAiInfo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, generativeAiInfo: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid form-grid--cols-3">
            <div className="form-field">
              <div className="form-label">Файл верстки (Layout)</div>
              <input
                ref={layoutFileRef}
                type="file"
                className="file-input"
                onChange={handleLayoutFileSelect}
                style={{ display: 'none' }}
              />
              <div className="quick-publish__file-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => layoutFileRef.current?.click()}
                  disabled={loading}
                >
                  {fileLayoutName ? `✓ ${fileLayoutName}` : 'Выбрать файл'}
                </button>
                {form.layoutFileId ? (
                  <button type="button" className="button button--ghost button--compact" onClick={clearLayoutFile} disabled={loading}>
                    Сбросить
                  </button>
                ) : null}
              </div>
            </div>

            <div className="form-field">
              <div className="form-label">Манускрипт</div>
              <input
                ref={manuscriptFileRef}
                type="file"
                className="file-input"
                onChange={handleManuscriptFileSelect}
                style={{ display: 'none' }}
              />
              <div className="quick-publish__file-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => manuscriptFileRef.current?.click()}
                  disabled={loading}
                >
                  {fileManuscriptName ? `✓ ${fileManuscriptName}` : 'Выбрать файл'}
                </button>
                {form.manuscriptFileId ? (
                  <button type="button" className="button button--ghost button--compact" onClick={clearManuscriptFile} disabled={loading}>
                    Сбросить
                  </button>
                ) : null}
              </div>
            </div>

            <div className="form-field">
              <div className="form-label">Данные автора</div>
              <input
                ref={authorInfoFileRef}
                type="file"
                className="file-input"
                onChange={handleAuthorInfoFileSelect}
                style={{ display: 'none' }}
              />
              <div className="quick-publish__file-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => authorInfoFileRef.current?.click()}
                  disabled={loading}
                >
                  {fileAuthorInfoName ? `✓ ${fileAuthorInfoName}` : 'Выбрать файл'}
                </button>
                {form.authorInfoFileId ? (
                  <button type="button" className="button button--ghost button--compact" onClick={clearAuthorInfoFile} disabled={loading}>
                    Сбросить
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="panel panel--elevated quick-publish__panel">
            <div className="panel-title quick-publish__panel-title-row">
              <span>Авторы</span>
              <button type="button" className="button button--compact button--ghost" onClick={() => setAuthorModalOpen(true)}>
                + Добавить
              </button>
            </div>
            {selectedAuthors.length ? (
              <div className="quick-publish__tags">
                {selectedAuthors.map((a) => (
                  <span key={a.id} className="quick-publish__tag">
                    {a.name}
                    <button
                      type="button"
                      className="quick-publish__tag-remove"
                      onClick={() => removeAuthor(a.id)}
                      aria-label={`Удалить автора: ${a.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="meta-label">Добавлено: 0</p>
            )}
          </div>

          <div className="panel panel--elevated quick-publish__panel">
            <div className="panel-title quick-publish__panel-title-row">
              <span>Ключевые слова</span>
              <button type="button" className="button button--compact button--ghost" onClick={() => setKeywordModalOpen(true)}>
                + Добавить
              </button>
            </div>
            {selectedKeywords.length ? (
              <div className="quick-publish__tags">
                {selectedKeywords.map((k) => (
                  <span key={k.id} className="quick-publish__tag">
                    {k.name}
                    <button
                      type="button"
                      className="quick-publish__tag-remove"
                      onClick={() => removeKeyword(k.id)}
                      aria-label={`Удалить ключевое слово: ${k.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="meta-label">Добавлено: 0</p>
            )}
          </div>
          </form>

          <aside className="quick-publish__aside">
            <div className="panel panel--elevated quick-publish__aside-card">
              <div className="panel-title" style={{ margin: 0 }}>
                Памятка
              </div>
              <ul className="list quick-publish__list">
                <li>Название обязательно на 3 языках.</li>
                <li>Файлы можно загрузить сразу или позже.</li>
                <li>После публикации произойдёт переход на страницу статьи.</li>
              </ul>
            </div>

            <div className="panel panel--elevated quick-publish__aside-card">
              <div className="panel-title" style={{ margin: 0 }}>
                Публикация
              </div>
              <p className="meta-label">
                Заполнено: {progressDone}/{progressTotal} • {progressPct}%
              </p>
              <button
                type="submit"
                form="quick-publish-form"
                className="button button--primary quick-publish__submit"
                disabled={!canPublish}
              >
                {loading ? 'Публикация...' : 'Опубликовать статью'}
              </button>
              {!canPublish && (
                <p className="form-hint" style={{ margin: 0 }}>
                  Для публикации заполните название на русском, казахском и английском.
                </p>
              )}
            </div>
          </aside>
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
