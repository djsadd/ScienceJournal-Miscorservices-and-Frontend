import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ReviewDetail } from '../shared/types'
import Alert from '../shared/components/Alert'
import ConfirmModal from '../shared/components/ConfirmModal'
import Toast from '../shared/components/Toast'
import { toApiFilesUrl } from '../shared/url'
import { formatArticleStatus, formatArticleType } from '../shared/labels'

export default function ReviewDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [lang, setLang] = useState<'ru' | 'en' | 'kz'>(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('lang') as 'ru' | 'en' | 'kz' | null
    return fromQuery && ['ru', 'en', 'kz'].includes(fromQuery) ? fromQuery : 'ru'
  })

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    setError(null)
    setSuccess(null)
    api
      .getReviewDetail<ReviewDetail>(id)
      .then((res) => {
        if (!mounted) return
        // Debug: log backend response
        try {
          // eslint-disable-next-line no-console
          console.log(`GET /reviews/${id}/detail response:`, res)
        } catch {}
        setData(res)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        if (e instanceof ApiError) {
          let detail: string | null = null
          if (e.bodyJson && typeof e.bodyJson === 'object') {
            const j: any = e.bodyJson
            if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
            else if (j.message) detail = String(j.message)
          }
          setError(detail ? `Ошибка ${e.status}: ${detail}` : `Ошибка ${e.status}`)
        } else {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки')
        }
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [id])

  const title = useMemo(() => {
    if (data?.article) {
      return (
        (lang === 'ru' ? data.article.title_ru : lang === 'en' ? data.article.title_en : data.article.title_kz) ||
        data.article.title_ru || data.article.title_en || data.article.title_kz ||
        data?.article_title || `Рецензия #${id}`
      )
    }
    return data?.article_title ?? `Рецензия #${id}`
  }, [data, id, lang])

  const abstract = useMemo(() => {
    if (!data?.article) return null
    const a = data.article
    return (lang === 'ru' ? a.abstract_ru : lang === 'en' ? a.abstract_en : a.abstract_kz) || a.abstract_ru || a.abstract_en || a.abstract_kz || null
  }, [data, lang])

  const form = useMemo(() => ({
    comments: data?.comments ?? '',
    recommendation: data?.recommendation ?? '',
    status: data?.status ?? 'pending',
    deadline: data?.deadline ?? '',
    importance_applicability: data?.importance_applicability ?? '',
    novelty_application: data?.novelty_application ?? '',
    originality: data?.originality ?? '',
    innovation_product: data?.innovation_product ?? '',
    results_significance: data?.results_significance ?? '',
    coherence: data?.coherence ?? '',
    style_quality: data?.style_quality ?? '',
    editorial_compliance: data?.editorial_compliance ?? '',
  }), [data])

  const [draft, setDraft] = useState(form)

  useEffect(() => {
    setDraft(form)
  }, [form])

  const onChange = (key: keyof typeof form, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const isReadOnly = useMemo(() => {
    const st = (data?.status || '').toString()
    return st === 'submitted' || st === 'completed' || st === 'cancelled'
  }, [data])

  const makePayload = () => {
    const payload: Record<string, any> = {}
    if (!data) return payload
    const keys = [
      'comments',
      'recommendation',
      'status',
      'deadline',
      'importance_applicability',
      'novelty_application',
      'originality',
      'innovation_product',
      'results_significance',
      'coherence',
      'style_quality',
      'editorial_compliance',
    ] as const
    keys.forEach((k) => {
      const current = (draft as any)[k]
      const initial = (data as any)[k]
      if (current !== initial) {
        payload[k] = current || null
      }
    })
    return payload
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const body = { ...makePayload(), action: 'save' }
      const res = await api.updateReview<ReviewDetail>(id, body)
      // eslint-disable-next-line no-console
      console.log('PATCH /reviews/{id} response:', res)
      setSuccess('Сохранено')
      setToastOpen(true)
      setData(res)
    } catch (e: any) {
      setError(e instanceof ApiError ? `Ошибка ${e.status}` : e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const doSubmit = async () => {
    if (!id) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const body = { ...makePayload(), action: 'submit' }
      const res = await api.updateReview<ReviewDetail>(id, body)
      // eslint-disable-next-line no-console
      console.log('Submit review response:', res)
      setSuccess('Рецензия отправлена')
      setToastOpen(true)
      setData(res)
    } catch (e: any) {
      setError(e instanceof ApiError ? `Ошибка ${e.status}` : e?.message || 'Ошибка отправки')
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Рецензент</p>
          <h1 className="page-title">{title}</h1>
          <p className="subtitle">Детали рецензии и ответы по критериям.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="pill pill--ghost">ID: {id}</div>
          <div className="lang-switch">
            {(['ru','en','kz'] as const).map((l) => (
              <button key={l} className={`lang-chip ${lang === l ? 'lang-chip--active' : ''}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Article summary (no authors, no versions) */}
      {data?.article && (
        <section className="section">
          <div className="panel">
            <div className="article-meta">
              <span className="meta-label">Тип:</span> {formatArticleType(String(data.article.article_type || ''), lang)}
              <span className="dot">•</span>
              <span className="meta-label">Статус:</span> {formatArticleStatus(String(data.article.status || ''), lang)}
              <span className="dot">•</span>
              <span className="meta-label">DOI:</span> {data.article.doi || '—'}
              {data.article.created_at ? (
                <>
                  <span className="dot">•</span>
                  <span className="meta-label">Создано:</span> {new Date(data.article.created_at).toLocaleString()}
                </>
              ) : null}
            </div>
            {abstract && (
              <div style={{ marginTop: '1.5rem', lineHeight: '1.6', color: '#444' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#555' }}>
                  {lang === 'ru' ? 'Аннотация' : lang === 'en' ? 'Abstract' : 'Аңдатпа'}
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{abstract}</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title" style={{ marginTop: 0 }}>Ключевые слова</h3>
            {!data.article.keywords || data.article.keywords.length === 0 ? (
              <div className="table__empty">Ключевые слова не указаны.</div>
            ) : (
              <div className="pill-list">
                {data.article.keywords.map((k) => (
                  <span key={k.id} className="pill pill--ghost">{k.title_ru || k.title_en || k.title_kz}</span>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title" style={{ marginTop: 0 }}>Файлы</h3>
            <div className="actions">
              {data.article.manuscript_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.article.manuscript_file_url) || '#'} target="_blank" rel="noreferrer">Рукопись</a>
              )}
              {data.article.antiplagiarism_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.article.antiplagiarism_file_url)} target="_blank" rel="noreferrer">Антиплагиат</a>
              )}
              {data.article.cover_letter_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.article.cover_letter_file_url)} target="_blank" rel="noreferrer">Письмо</a>
              )}
              {data.article.layout_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.article.layout_file_url)} target="_blank" rel="noreferrer">Вёрстка</a>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="panel">
        {success ? <Alert variant="success" className="mb-2" title={success} /> : null}
        {loading ? (
          <div className="table__empty">Загрузка…</div>
        ) : error ? (
          <Alert variant="error" title="Не удалось загрузить">{error}</Alert>
        ) : !data ? (
          <div className="table__empty">Данные не найдены.</div>
        ) : (
          <>
          <form className="auth-form">
            <div className="grid grid-2">

              

              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Комментарии</label>
                <textarea
                  className="text-input"
                  rows={3}
                  placeholder="Введите комментарии к рецензии"
                  value={draft.comments}
                  onChange={(e) => onChange('comments', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>

              {(
                [
                  [
                    'importance_applicability',
                    'Важность, полезность и/или применимость идей, методов, технологий:',
                  ],
                  [
                    'novelty_application',
                    'Новое освещение, применение в той или иной отрасли:',
                  ],
                  [
                    'originality',
                    'Идеи, методы, способы, решения и результаты поставленных задач исследования ранее не были известны или апробированы:',
                  ],
                  [
                    'innovation_product',
                    'Новый процесс, услуга, продукт, основанные на новых, неизвестных технологиях, методах или методологиях, определение новых для потребителей услуг:',
                  ],
                  [
                    'results_significance',
                    'Изложение результатов, теоретическая и практическая значимость, выводы, научно-практическое значение:',
                  ],
                  [
                    'coherence',
                    'Логичность, последовательность, связность изложения:',
                  ],
                  [
                    'style_quality',
                    'Коммуникативная ценность, соответствие научному стилю, языковым и стилистическим нормам:',
                  ],
                  [
                    'editorial_compliance',
                    'Соответствие требованиям редакции, использование терминологической лексики. Наличие аннотаций, пристатейного аппарата, ключевых слов, соблюдение определенных параметров страницы, библиографического списка:',
                  ],
                ] as const
              ).map(([key, label]) => (
                <div className="form-field" key={key} style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{label}</label>
                  <textarea
                    className="text-input"
                    rows={3}
                    placeholder="Введите оценку и замечания по этому критерию"
                    value={(draft as any)[key]}
                    onChange={(e) => onChange(key as any, e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              ))}
            </div>

            <div className="auth-row">
              {!isReadOnly && (
              <button className="button button--ghost" type="button" onClick={handleSave} disabled={saving}>
                Сохранить
              </button>
              )}
              {!isReadOnly && (
              <button className="button button--primary" type="button" onClick={() => setConfirmOpen(true)} disabled={saving}>
                Отправить
              </button>
              )}
            </div>
          </form>
          <ConfirmModal
            open={confirmOpen}
            title="Отправить рецензию?"
            message="После отправки рецензия будет передана редактору. Продолжить?"
            confirmText="Отправить"
            cancelText="Отмена"
            onConfirm={doSubmit}
            onCancel={() => setConfirmOpen(false)}
          />
          </>
        )}
      </div>
      <Toast open={!!toastOpen} message={success || ''} onClose={() => setToastOpen(false)} />

      
    </div>
  )
}
