import { useEffect, useState } from 'react'
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

export default function QuickPublishPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<Set<number>>(new Set())
  const [selectedKeywords, setSelectedKeywords] = useState<Set<number>>(new Set())

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        author_ids: Array.from(selectedAuthors),
        keyword_ids: Array.from(selectedKeywords),
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
      setSelectedAuthors(new Set())
      setSelectedKeywords(new Set())
      setTimeout(() => {
        window.location.href = `/articles/${result.id}`
      }, 1000)
    } catch (e: any) {
      setError(e?.bodyJson?.detail || e?.message || 'Failed to publish article')
    } finally {
      setLoading(false)
    }
  }

  const toggleAuthor = (authorId: number) => {
    const newSet = new Set(selectedAuthors)
    if (newSet.has(authorId)) {
      newSet.delete(authorId)
    } else {
      newSet.add(authorId)
    }
    setSelectedAuthors(newSet)
  }

  const toggleKeyword = (keywordId: number) => {
    const newSet = new Set(selectedKeywords)
    if (newSet.has(keywordId)) {
      newSet.delete(keywordId)
    } else {
      newSet.add(keywordId)
    }
    setSelectedKeywords(newSet)
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
                onChange={(e) => setForm({ ...form, title_ru: e.target.value })}
              />
            </label>
            <label>
              <span>Title (EN)*</span>
              <input
                type="text"
                required
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              />
            </label>
            <label>
              <span>Тақырып (KZ)*</span>
              <input
                type="text"
                required
                value={form.title_kz}
                onChange={(e) => setForm({ ...form, title_kz: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid form-grid--cols-3">
            <label>
              <span>Аннотация (RU)</span>
              <textarea
                value={form.abstract_ru}
                onChange={(e) => setForm({ ...form, abstract_ru: e.target.value })}
              />
            </label>
            <label>
              <span>Abstract (EN)</span>
              <textarea
                value={form.abstract_en}
                onChange={(e) => setForm({ ...form, abstract_en: e.target.value })}
              />
            </label>
            <label>
              <span>Аннотация (KZ)</span>
              <textarea
                value={form.abstract_kz}
                onChange={(e) => setForm({ ...form, abstract_kz: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid form-grid--cols-3">
            <label>
              <span>DOI</span>
              <input
                type="text"
                value={form.doi}
                onChange={(e) => setForm({ ...form, doi: e.target.value })}
                placeholder="10.1234/example"
              />
            </label>
            <label>
              <span>Тип статьи</span>
              <select
                value={form.articleType}
                onChange={(e) => setForm({ ...form, articleType: e.target.value as any })}
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
                onChange={(e) => setForm({ ...form, generativeAiInfo: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid form-grid--cols-3">
            <label>
              <span>Layout File ID</span>
              <input
                type="text"
                value={form.layoutFileId}
                onChange={(e) => setForm({ ...form, layoutFileId: e.target.value })}
                placeholder="file-uuid"
              />
            </label>
            <label>
              <span>Manuscript File ID</span>
              <input
                type="text"
                value={form.manuscriptFileId}
                onChange={(e) => setForm({ ...form, manuscriptFileId: e.target.value })}
                placeholder="file-uuid"
              />
            </label>
            <label>
              <span>Author Info File ID</span>
              <input
                type="text"
                value={form.authorInfoFileId}
                onChange={(e) => setForm({ ...form, authorInfoFileId: e.target.value })}
                placeholder="file-uuid"
              />
            </label>
          </div>

          <div className="panel panel--elevated">
            <div className="panel-title">Авторы</div>
            <div className="checkbox-list">
              {authors.length === 0 ? (
                <p className="meta-label">Нет доступных авторов</p>
              ) : (
                authors.map((author) => (
                  <label key={author.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedAuthors.has(author.id!)}
                      onChange={() => toggleAuthor(author.id!)}
                    />
                    <span>
                      {author.last_name} {author.first_name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="panel panel--elevated">
            <div className="panel-title">Ключевые слова</div>
            <div className="checkbox-list">
              {keywords.length === 0 ? (
                <p className="meta-label">Нет доступных ключевых слов</p>
              ) : (
                keywords.map((kw) => (
                  <label key={kw.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedKeywords.has(kw.id!)}
                      onChange={() => toggleKeyword(kw.id!)}
                    />
                    <span>
                      {kw.title_ru || kw.title_en || kw.title_kz}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

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
