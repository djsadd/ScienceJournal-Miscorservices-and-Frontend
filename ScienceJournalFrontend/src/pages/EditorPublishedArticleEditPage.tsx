import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Author, Keyword } from '../shared/types'
import { formatArticleStatus, formatArticleType } from '../shared/labels'

type Lang = 'ru' | 'kz' | 'en'

interface ArticleOut {
  id: number
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  abstract_kz?: string | null
  abstract_en?: string | null
  abstract_ru?: string | null
  doi?: string | null
  status: string
  article_type: 'original' | 'review' | string
  not_published_elsewhere?: boolean
  plagiarism_free?: boolean
  authors_agree?: boolean
  generative_ai_info?: string | null
  authors: Array<{ id: number }>
  keywords: Array<{ id: number }>
  created_at: string
}

export default function EditorPublishedArticleEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [me, setMe] = useState<{ role?: string; roles?: string[] } | null>(null)
  const isEditor = (me?.role === 'editor') || (me?.roles?.includes('editor'))

  const [article, setArticle] = useState<ArticleOut | null>(null)
  const [authors, setAuthors] = useState<Author[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [activeLang, setActiveLang] = useState<Lang>('ru')
  const [form, setForm] = useState({
    title_ru: '',
    title_en: '',
    title_kz: '',
    abstract_ru: '',
    abstract_en: '',
    abstract_kz: '',
    doi: '',
    article_type: 'original' as 'original' | 'review',
    not_published_elsewhere: true,
    plagiarism_free: true,
    authors_agree: true,
    generative_ai_info: '',
    author_ids: [] as number[],
    keyword_ids: [] as number[],
  })

  const [authorSearch, setAuthorSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')

  useEffect(() => {
    api.get<{ role?: string; roles?: string[] }>('/auth/me').then(setMe).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      api.getEditorArticleDetail<ArticleOut>(id),
      api.getAuthors<Author[]>(),
      api.getKeywords<Keyword[]>(),
    ])
      .then(([articleRes, authorsRes, keywordsRes]) => {
        setArticle(articleRes)
        setAuthors(Array.isArray(authorsRes) ? authorsRes : [])
        setKeywords(Array.isArray(keywordsRes) ? keywordsRes : [])
        setForm({
          title_ru: articleRes.title_ru || '',
          title_en: articleRes.title_en || '',
          title_kz: articleRes.title_kz || '',
          abstract_ru: articleRes.abstract_ru || '',
          abstract_en: articleRes.abstract_en || '',
          abstract_kz: articleRes.abstract_kz || '',
          doi: articleRes.doi || '',
          article_type: (articleRes.article_type === 'review' ? 'review' : 'original'),
          not_published_elsewhere: Boolean(articleRes.not_published_elsewhere),
          plagiarism_free: Boolean(articleRes.plagiarism_free),
          authors_agree: Boolean(articleRes.authors_agree),
          generative_ai_info: articleRes.generative_ai_info || '',
          author_ids: (articleRes.authors || []).map((a) => a.id),
          keyword_ids: (articleRes.keywords || []).map((k) => k.id),
        })
      })
      .catch((e: any) => {
        const message = e?.bodyJson?.detail || e?.message || 'Не удалось загрузить данные'
        setError(String(message))
      })
      .finally(() => setLoading(false))
  }, [id])

  const title = useMemo(() => {
    if (!article) return ''
    return (activeLang === 'ru' ? article.title_ru : activeLang === 'en' ? article.title_en : article.title_kz)
      || article.title_ru
      || article.title_en
      || article.title_kz
      || 'Без заголовка'
  }, [article, activeLang])

  const filteredAuthors = useMemo(() => {
    const q = authorSearch.trim().toLowerCase()
    if (!q) return authors
    return authors.filter((a) => {
      const name = `${a.last_name} ${a.first_name} ${a.patronymic || ''}`.toLowerCase()
      return name.includes(q) || a.email.toLowerCase().includes(q)
    })
  }, [authors, authorSearch])

  const filteredKeywords = useMemo(() => {
    const q = keywordSearch.trim().toLowerCase()
    if (!q) return keywords
    return keywords.filter((k) => {
      const v = `${k.title_ru || ''} ${k.title_en || ''} ${k.title_kz || ''}`.toLowerCase()
      return v.includes(q)
    })
  }, [keywords, keywordSearch])

  const toggleId = (list: number[], value: number) => (
    list.includes(value) ? list.filter((id) => id !== value) : [...list, value]
  )

  const canEdit = isEditor && article?.status === 'published'

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор • Редактирование опубликованной статьи</p>
        </div>
        <div className="lang-switch">
          {(['ru','en','kz'] as const).map((l) => (
            <button
              key={l}
              className={`lang-chip ${activeLang === l ? 'lang-chip--active' : ''}`}
              onClick={() => setActiveLang(l)}
              type="button"
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <div className="actions" style={{ marginBottom: '0.75rem' }}>
        <Link className="button button--ghost" to={`/cabinet/editorial2/${id}`}>Вернуться к статье</Link>
      </div>

      {error && <div className="alert error">Ошибка: {error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {article && (
        <section className="section">
          <div className="panel">
            <h2 className="panel-title" style={{ marginBottom: '0.25rem' }}>{title}</h2>
            <div className="article-meta">
              <span className="meta-label">Тип:</span> {formatArticleType(article.article_type, activeLang)}
              <span className="dot">•</span>
              <span className="meta-label">Статус:</span> {formatArticleStatus(article.status, activeLang)}
              <span className="dot">•</span>
              <span className="meta-label">Создано:</span> {new Date(article.created_at).toLocaleString()}
            </div>
            {!isEditor && (
              <div className="alert error" style={{ marginTop: '0.75rem' }}>
                Доступно только для роли редактора.
              </div>
            )}
            {isEditor && article.status !== 'published' && (
              <div className="alert error" style={{ marginTop: '0.75rem' }}>
                Редактирование через этот экран доступно только для статей со статусом «Опубликовано».
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Метаданные</h3>

            <div className="form-row">
              <label className="form-label">Заголовок ({activeLang.toUpperCase()})</label>
              <input
                className="text-input"
                value={activeLang === 'ru' ? form.title_ru : activeLang === 'en' ? form.title_en : form.title_kz}
                onChange={(e) => {
                  const v = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    ...(activeLang === 'ru' ? { title_ru: v } : activeLang === 'en' ? { title_en: v } : { title_kz: v }),
                  }))
                }}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Аннотация ({activeLang.toUpperCase()})</label>
              <textarea
                className="text-input"
                rows={6}
                value={activeLang === 'ru' ? form.abstract_ru : activeLang === 'en' ? form.abstract_en : form.abstract_kz}
                onChange={(e) => {
                  const v = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    ...(activeLang === 'ru' ? { abstract_ru: v } : activeLang === 'en' ? { abstract_en: v } : { abstract_kz: v }),
                  }))
                }}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">DOI</label>
                <input className="text-input" value={form.doi} onChange={(e) => setForm((p) => ({ ...p, doi: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Тип статьи</label>
                <select
                  className="text-input"
                  value={form.article_type}
                  onChange={(e) => setForm((p) => ({ ...p, article_type: (e.target.value === 'review' ? 'review' : 'original') }))}
                >
                  <option value="original">Original</option>
                  <option value="review">Review</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Информация об использовании генеративного ИИ</label>
              <textarea
                className="text-input"
                rows={3}
                value={form.generative_ai_info}
                onChange={(e) => setForm((p) => ({ ...p, generative_ai_info: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.not_published_elsewhere}
                  onChange={(e) => setForm((p) => ({ ...p, not_published_elsewhere: e.target.checked }))}
                />
                <span>Не опубликовано в другом месте</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.plagiarism_free}
                  onChange={(e) => setForm((p) => ({ ...p, plagiarism_free: e.target.checked }))}
                />
                <span>Плагиата нет</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.authors_agree}
                  onChange={(e) => setForm((p) => ({ ...p, authors_agree: e.target.checked }))}
                />
                <span>Согласие авторов</span>
              </label>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Авторы</h3>
            <input
              className="text-input"
              placeholder="Поиск по имени или email..."
              value={authorSearch}
              onChange={(e) => setAuthorSearch(e.target.value)}
            />
            <div style={{ marginTop: '0.75rem', maxHeight: 360, overflow: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
              {filteredAuthors.map((a) => {
                const checked = form.author_ids.includes(a.id)
                const label = `${a.last_name} ${a.first_name}${a.patronymic ? ' ' + a.patronymic : ''}`
                return (
                  <label
                    key={a.id}
                    style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f3f3' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setForm((p) => ({ ...p, author_ids: toggleId(p.author_ids, a.id) }))}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{label}</span>
                      <span className="form-hint">{a.email}</span>
                    </div>
                  </label>
                )
              })}
              {filteredAuthors.length === 0 && (
                <div className="table__empty" style={{ padding: '0.75rem' }}>Ничего не найдено</div>
              )}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Ключевые слова</h3>
            <input
              className="text-input"
              placeholder="Поиск по ключевым словам..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
            />
            <div style={{ marginTop: '0.75rem', maxHeight: 360, overflow: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
              {filteredKeywords.map((k) => {
                const checked = form.keyword_ids.includes(k.id)
                const label = k.title_ru || k.title_en || k.title_kz || `#${k.id}`
                return (
                  <label
                    key={k.id}
                    style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f3f3' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setForm((p) => ({ ...p, keyword_ids: toggleId(p.keyword_ids, k.id) }))}
                    />
                    <span style={{ fontWeight: 600 }}>{label}</span>
                  </label>
                )
              })}
              {filteredKeywords.length === 0 && (
                <div className="table__empty" style={{ padding: '0.75rem' }}>Ничего не найдено</div>
              )}
            </div>
          </div>

          {saveError && <div className="alert error">Ошибка сохранения: {saveError}</div>}

          <div className="actions" style={{ marginTop: '1rem' }}>
            <button
              className="button button--primary"
              disabled={!canEdit || saving}
              onClick={async () => {
                if (!id) return
                setSaving(true)
                setSaveError(null)
                try {
                  const payload = {
                    title_ru: form.title_ru.trim() || null,
                    title_en: form.title_en.trim() || null,
                    title_kz: form.title_kz.trim() || null,
                    abstract_ru: form.abstract_ru.trim() || null,
                    abstract_en: form.abstract_en.trim() || null,
                    abstract_kz: form.abstract_kz.trim() || null,
                    doi: form.doi.trim() ? form.doi.trim() : null,
                    article_type: form.article_type,
                    not_published_elsewhere: form.not_published_elsewhere,
                    plagiarism_free: form.plagiarism_free,
                    authors_agree: form.authors_agree,
                    generative_ai_info: form.generative_ai_info.trim() || null,
                    author_ids: form.author_ids,
                    keyword_ids: form.keyword_ids,
                  }
                  await api.updateEditorPublishedArticle<ArticleOut>(id, payload)
                  navigate(`/cabinet/editorial2/${id}`)
                } catch (e: any) {
                  const message = e?.bodyJson?.detail || e?.message || 'Не удалось сохранить'
                  setSaveError(String(message))
                } finally {
                  setSaving(false)
                }
              }}
              type="button"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              className="button button--ghost"
              onClick={() => navigate(`/cabinet/editorial2/${id}`)}
              type="button"
            >
              Отмена
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

