import { useEffect, useState, useRef } from 'react'
import { api } from '../api/client'
import type { Author, Keyword, Article } from '../shared/types'
import './QuickPublishPage.css'

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
  authorIds: number[]
  keywordIds: number[]
}

interface SelectedItem {
  id: number
  name: string
}

export default function QuickPublishPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<SelectedItem[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<SelectedItem[]>([])
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [keywordModalOpen, setKeywordModalOpen] = useState(false)
  const [newAuthor, setNewAuthor] = useState({ first_name: '', last_name: '' })
  const [newKeyword, setNewKeyword] = useState({ ru: '', en: '', kz: '' })
  const [fileLayoutName, setFileLayoutName] = useState<string | null>(null)
  const [fileManuscriptName, setFileManuscriptName] = useState<string | null>(null)
  const [fileAuthorInfoName, setFileAuthorInfoName] = useState<string | null>(null)
  const layoutFileRef = useRef<HTMLInputElement>(null)
  const manuscriptFileRef = useRef<HTMLInputElement>(null)
  const authorInfoFileRef = useRef<HTMLInputElement>(null)

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
    authorIds: [],
    keywordIds: [],
  })

  // Load authors and keywords
  useEffect(() => {
    const load = async () => {
      try {
        const [authorsData, keywordsData] = await Promise.all([
          api.getAuthors<Author[]>(),
          api.getKeywords<Keyword[]>(),
        ])
        setAuthors(authorsData)
        setKeywords(keywordsData)
      } catch (e: any) {
        setError(e?.message || 'Failed to load data')
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await api.quickPublishArticle<Article>({
        title_kz: form.title_kz,
        title_en: form.title_en,
        title_ru: form.title_ru,
        abstract_kz: form.abstract_kz || undefined,
        abstract_en: form.abstract_en || undefined,
        abstract_ru: form.abstract_ru || undefined,
        doi: form.doi || undefined,
        article_type: form.articleType,
        layout_file_id: form.layoutFileId || undefined,
        manuscript_file_id: form.manuscriptFileId || undefined,
        author_info_file_id: form.authorInfoFileId || undefined,
        generative_ai_info: form.generativeAiInfo || undefined,
        author_ids: selectedAuthors.map((a: SelectedItem) => a.id),
        keyword_ids: selectedKeywords.map((k: SelectedItem) => k.id),
      })
      setSuccess(true)
      // Reset form
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
        authorIds: [],
        keywordIds: [],
      })
      setSelectedAuthors([])
      setSelectedKeywords([])
      setFileLayoutName(null)
      setFileManuscriptName(null)
      setFileAuthorInfoName(null)
      setTimeout(() => {
        window.location.href = `/articles/${result.id}`
      }, 1000)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Failed to publish article')
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('upload', file)
    return api.request<{ id: string }>('/files', 'POST', { body: formData })
  }

  const handleLayoutFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) {
      try {
        setLoading(true)
        const result = await uploadFile(file)
        setForm({ ...form, layoutFileId: result.id })
        setFileLayoutName(file.name)
      } catch (err) {
        setError('Ошибка при загрузке файла')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleManuscriptFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) {
      try {
        setLoading(true)
        const result = await uploadFile(file)
        setForm({ ...form, manuscriptFileId: result.id })
        setFileManuscriptName(file.name)
      } catch (err) {
        setError('Ошибка при загрузке файла')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleAuthorInfoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) {
      try {
        setLoading(true)
        const result = await uploadFile(file)
        setForm({ ...form, authorInfoFileId: result.id })
        setFileAuthorInfoName(file.name)
      } catch (err) {
        setError('Ошибка при загрузке файла')
      } finally {
        setLoading(false)
      }
    }
  }

  const saveNewAuthor = async () => {
    if (!newAuthor.first_name.trim() || !newAuthor.last_name.trim()) return
    try {
      const created = await api.post<Author>('/articles/authors', {
        first_name: newAuthor.first_name.trim(),
        last_name: newAuthor.last_name.trim(),
      })
      setAuthors((prev: Author[]) => [...prev, created])
      setSelectedAuthors((prev: SelectedItem[]) => [...prev, { id: created.id!, name: `${created.last_name} ${created.first_name}` }])
      setNewAuthor({ first_name: '', last_name: '' })
      setAuthorModalOpen(false)
    } catch (err) {
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
      setKeywords((prev: Keyword[]) => [...prev, created])
      setSelectedKeywords((prev: SelectedItem[]) => [...prev, { id: created.id!, name: created.title_ru || created.title_en || created.title_kz || 'Unnamed' }])
      setNewKeyword({ ru: '', en: '', kz: '' })
      setKeywordModalOpen(false)
    } catch (err) {
      setError('Не удалось создать ключевое слово')
    }
  }

  const addAuthorFromList = (author: Author) => {
    if (!selectedAuthors.find((a: SelectedItem) => a.id === author.id)) {
      setSelectedAuthors((prev: SelectedItem[]) => [...prev, { id: author.id!, name: `${author.last_name} ${author.first_name}` }])
    }
  }

  const removeAuthor = (id: number) => {
    setSelectedAuthors((prev: SelectedItem[]) => prev.filter((a: SelectedItem) => a.id !== id))
  }

  const addKeywordFromList = (keyword: Keyword) => {
    if (!selectedKeywords.find((k: SelectedItem) => k.id === keyword.id)) {
      setSelectedKeywords((prev: SelectedItem[]) => [...prev, { id: keyword.id!, name: keyword.title_ru || keyword.title_en || keyword.title_kz || 'Unnamed' }])
    }
  }

  const removeKeyword = (id: number) => {
    setSelectedKeywords((prev: SelectedItem[]) => prev.filter((k: SelectedItem) => k.id !== id))
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор</p>
          <h1 className="page-title">Быстрая публикация статьи</h1>
          <p className="subtitle">Загрузите готовую статью и опубликуйте её напрямую</p>
        </div>
      </section>

      <section className="section section--narrow">
        {error && <div className="alert error">{error}</div>}
        {success && (
          <div className="alert success">Статья успешно опубликована! Перенаправление...</div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-grid form-grid--cols-3">
            <label>
              <span>Заголовок (RU)*</span>
              <input
                type="text"
                required
                value={form.title_ru}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title_ru: e.target.value })}
              />
            </label>
            <label>
              <span>Title (EN)*</span>
              <input
                type="text"
                required
                value={form.title_en}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title_en: e.target.value })}
              />
            </label>
            <label>
              <span>Тақырып (KZ)*</span>
              <input
                type="text"
                required
                value={form.title_kz}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title_kz: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid form-grid--cols-3">
            <label>
              <span>Аннотация (RU)</span>
              <textarea
                value={form.abstract_ru}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, abstract_ru: e.target.value })}
              />
            </label>
            <label>
              <span>Abstract (EN)</span>
              <textarea
                value={form.abstract_en}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, abstract_en: e.target.value })}
              />
            </label>
            <label>
              <span>Аннотация (KZ)</span>
              <textarea
                value={form.abstract_kz}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, abstract_kz: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid form-grid--cols-3">
            <label>
              <span>DOI</span>
              <input
                type="text"
                value={form.doi}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, doi: e.target.value })}
                placeholder="10.1234/example"
              />
            </label>
            <label>
              <span>Тип статьи</span>
              <select
                value={form.articleType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, articleType: e.target.value as any })}
              >
                <option value="original">Original</option>
                <option value="review">Review</option>
              </select>
            </label>
            <label>
              <span>Информация об ИИ</span>
              <input
                type="text"
                value={form.generativeAiInfo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, generativeAiInfo: e.target.value })}
              />
            </label>
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
              <button
                type="button"
                className="button button--secondary"
                onClick={() => layoutFileRef.current?.click()}
                disabled={loading}
              >
                {fileLayoutName ? `✓ ${fileLayoutName}` : '📎 Выбрать файл'}
              </button>
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
              <button
                type="button"
                className="button button--secondary"
                onClick={() => manuscriptFileRef.current?.click()}
                disabled={loading}
              >
                {fileManuscriptName ? `✓ ${fileManuscriptName}` : '📎 Выбрать файл'}
              </button>
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
              <button
                type="button"
                className="button button--secondary"
                onClick={() => authorInfoFileRef.current?.click()}
                disabled={loading}
              >
                {fileAuthorInfoName ? `✓ ${fileAuthorInfoName}` : '📎 Выбрать файл'}
              </button>
            </div>
          </div>

          <div className="panel panel--elevated">
            <div className="panel-title">
              <span>Авторы</span>
              <button
                type="button"
                className="button button--compact button--ghost"
                onClick={() => setAuthorModalOpen(true)}
              >
                + Добавить
              </button>
            </div>
            {selectedAuthors.length === 0 ? (
              <p className="meta-label">Авторы не добавлены</p>
            ) : (
              <div className="tags-list">
                {selectedAuthors.map((author) => (
                  <div key={author.id} className="tag">
                    <span>{author.name}</span>
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => removeAuthor(author.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel panel--elevated">
            <div className="panel-title">
              <span>Ключевые слова</span>
              <button
                type="button"
                className="button button--compact button--ghost"
                onClick={() => setKeywordModalOpen(true)}
              >
                + Добавить
              </button>
            </div>
            {selectedKeywords.length === 0 ? (
              <p className="meta-label">Ключевые слова не добавлены</p>
            ) : (
              <div className="tags-list">
                {selectedKeywords.map((keyword) => (
                  <div key={keyword.id} className="tag">
                    <span>{keyword.name}</span>
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => removeKeyword(keyword.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {authorModalOpen && (
            <div className="modal-overlay" onClick={() => setAuthorModalOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Добавить автора</h2>
                
                <div className="modal-section">
                  <h3 className="modal-subtitle">Создать нового автора</h3>
                  <div className="form-grid form-grid--cols-2">
                    <input
                      type="text"
                      placeholder="Имя"
                      value={newAuthor.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, first_name: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Фамилия"
                      value={newAuthor.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthor({ ...newAuthor, last_name: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="button"
                    onClick={saveNewAuthor}
                    disabled={!newAuthor.first_name.trim() || !newAuthor.last_name.trim()}
                  >
                    Создать автора
                  </button>
                </div>

                <hr className="modal-divider" />

                <div className="modal-section">
                  <h3 className="modal-subtitle">Или выбрать из списка</h3>
                  {authors.length === 0 ? (
                    <p className="meta-label">Нет доступных авторов</p>
                  ) : (
                    <div className="authors-list">
                      {authors.map((author) => (
                        <label key={author.id} className="list-item">
                          <input
                            type="checkbox"
                            checked={selectedAuthors.some(a => a.id === author.id)}
                            onChange={() => {
                              if (selectedAuthors.some(a => a.id === author.id)) {
                                removeAuthor(author.id!)
                              } else {
                                addAuthorFromList(author)
                              }
                            }}
                          />
                          <span>{author.last_name} {author.first_name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setAuthorModalOpen(false)}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}

          {keywordModalOpen && (
            <div className="modal-overlay" onClick={() => setKeywordModalOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Добавить ключевое слово</h2>
                
                <div className="modal-section">
                  <h3 className="modal-subtitle">Создать новое ключевое слово</h3>
                  <div className="form-grid form-grid--cols-3">
                    <input
                      type="text"
                      placeholder="Русский"
                      value={newKeyword.ru}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword({ ...newKeyword, ru: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="English"
                      value={newKeyword.en}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword({ ...newKeyword, en: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Қазақша"
                      value={newKeyword.kz}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword({ ...newKeyword, kz: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="button"
                    onClick={saveNewKeyword}
                    disabled={!newKeyword.ru.trim()}
                  >
                    Создать ключевое слово
                  </button>
                </div>

                <hr className="modal-divider" />

                <div className="modal-section">
                  <h3 className="modal-subtitle">Или выбрать из списка</h3>
                  {keywords.length === 0 ? (
                    <p className="meta-label">Нет доступных ключевых слов</p>
                  ) : (
                    <div className="keywords-list">
                      {keywords.map((kw) => (
                        <label key={kw.id} className="list-item">
                          <input
                            type="checkbox"
                            checked={selectedKeywords.some(k => k.id === kw.id)}
                            onChange={() => {
                              if (selectedKeywords.some(k => k.id === kw.id)) {
                                removeKeyword(kw.id!)
                              } else {
                                addKeywordFromList(kw)
                              }
                            }}
                          />
                          <span>{kw.title_ru || kw.title_en || kw.title_kz}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setKeywordModalOpen(false)}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="toolbar">
            <button
              type="submit"
              className="button"
              disabled={loading || !form.title_ru || !form.title_en || !form.title_kz}
            >
              {loading ? 'Публикация...' : 'Опубликовать статью'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
