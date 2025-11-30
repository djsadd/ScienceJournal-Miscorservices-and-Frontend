import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { toApiFilesUrl } from '../shared/url'
import { formatArticleStatus, formatArticleType } from '../shared/labels'

interface KeywordOut {
  id: number
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
}

interface AuthorOut {
  id: number
  email: string
  prefix?: string | null
  first_name: string
  patronymic?: string | null
  last_name: string
  phone?: string | null
  address?: string | null
  country?: string | null
  affiliation1?: string | null
  affiliation2?: string | null
  affiliation3?: string | null
  is_corresponding: boolean
  orcid?: string | null
  scopus_author_id?: string | null
  researcher_id?: string | null
}

interface ArticleVersionOut {
  id: number
  created_at: string
  updated_at?: string | null
  title_kz?: string | null
  title_en?: string | null
  title_ru?: string | null
  abstract_kz?: string | null
  abstract_en?: string | null
  abstract_ru?: string | null
  doi?: string | null
  status?: string
  article_type?: string
  manuscript_file_url?: string | null
  author_info_file_url?: string | null
  cover_letter_file_url?: string | null
  antiplagiarism_file_url?: string | null
  authors?: AuthorOut[]
  keywords?: KeywordOut[]
}

export default function EditorArticleVersionPage() {
  const { id, versionId } = useParams<{ id: string; versionId: string }>()
  const [data, setData] = useState<ArticleVersionOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'ru' | 'en' | 'kz'>(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('lang') as 'ru' | 'en' | 'kz' | null
    return fromQuery && ['ru', 'en', 'kz'].includes(fromQuery) ? fromQuery : 'ru'
  })

  const title = useMemo(() => {
    if (!data) return ''
    return (lang === 'ru' ? data.title_ru : lang === 'en' ? data.title_en : data.title_kz) || data.title_ru || data.title_en || data.title_kz || 'Без заголовка'
  }, [data, lang])

  useEffect(() => {
    if (!id || !versionId) return
    setLoading(true)
    setError(null)
    api
      .getEditorArticleVersion<ArticleVersionOut>(id, versionId)
      .then((res) => {
        try { console.log('[EditorVersion] Article version:', res) } catch {}
        setData(res)
      })
      .catch((e: any) => {
        const message = e?.bodyJson?.detail || e?.message || 'Failed to load version'
        setError(String(message))
      })
      .finally(() => setLoading(false))
  }, [id, versionId])

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Редактор • Версия статьи</p>
        </div>
        <div className="lang-switch">
          {(['ru','en','kz'] as const).map((l) => (
            <button key={l} className={`lang-chip ${lang === l ? 'lang-chip--active' : ''}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
      </section>

      <div className="actions" style={{ marginBottom: '0.75rem' }}>
        <Link className="button button--ghost" to={`/cabinet/editorial2/${id}`}>Вернуться в основную статью</Link>
      </div>

      {error && <div className="alert error">Ошибка: {error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {data && (
        <section className="section">
          <div className="panel">
            <h2 className="panel-title">{title}</h2>
            <div className="article-meta">
              {data.article_type && (<><span className="meta-label">Тип:</span> {formatArticleType(data.article_type, lang)}<span className="dot">•</span></>)}
              {data.status && (<><span className="meta-label">Статус:</span> {formatArticleStatus(data.status, lang)}<span className="dot">•</span></>)}
              <span className="meta-label">DOI:</span> {data.doi || '—'}
              <span className="dot">•</span>
              <span className="meta-label">Создано:</span> {new Date(data.created_at).toLocaleString()}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Авторы</h3>
            {(!data.authors || data.authors.length === 0) ? (
              <div className="table__empty">Авторы пока не добавлены.</div>
            ) : (
              <div className="table">
                <div className="table__head">
                  <span>Имя</span>
                  <span>Email</span>
                  <span>Аффилиация</span>
                  <span>Контактный?</span>
                </div>
                <div className="table__body">
                  {data.authors.map((a) => (
                    <div className="table__row" key={a.id}>
                      <div className="table__cell">
                        <div className="table__title">{`${a.last_name} ${a.first_name}${a.patronymic ? ' ' + a.patronymic : ''}`}</div>
                        <div className="table__meta">{a.prefix || ''}</div>
                      </div>
                      <div className="table__cell">{a.email}</div>
                      <div className="table__cell">{[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || '—'}</div>
                      <div className="table__cell">{a.is_corresponding ? 'Да' : 'Нет'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Ключевые слова</h3>
            {(!data.keywords || data.keywords.length === 0) ? (
              <div className="table__empty">Ключевые слова не указаны.</div>
            ) : (
              <div className="pill-list">
                {data.keywords.map((k) => (
                  <span key={k.id} className="pill pill--ghost">{k.title_ru || k.title_en || k.title_kz}</span>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Файлы</h3>
            <div className="actions">
              <a className="button button--ghost button--compact" href={toApiFilesUrl(data.manuscript_file_url) || '#'} target="_blank" rel="noreferrer">Рукопись</a>
              {data.antiplagiarism_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.antiplagiarism_file_url)} target="_blank" rel="noreferrer">Антиплагиат</a>
              )}
              {data.author_info_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.author_info_file_url)} target="_blank" rel="noreferrer">Автор инфо</a>
              )}
              {data.cover_letter_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.cover_letter_file_url)} target="_blank" rel="noreferrer">Письмо</a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
