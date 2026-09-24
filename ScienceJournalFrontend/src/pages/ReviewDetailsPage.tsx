import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ReviewDetail } from '../shared/types'
import Alert from '../shared/components/Alert'
import Toast from '../shared/components/Toast'
import { toApiFilesUrl } from '../shared/url'
import { formatArticleStatus, formatArticleType } from '../shared/labels'

export default function ReviewDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [declineError, setDeclineError] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)
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
    recommendation: data?.recommendation === 'minor_revision' ? 'major_revision' : data?.recommendation ?? '',
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

  const validRecommendations = ['accept', 'major_revision', 'reject'] as const
  const hasValidRecommendation = validRecommendations.includes(draft.recommendation as typeof validRecommendations[number])

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
    if (!hasValidRecommendation) {
      setError('Перед отправкой выберите итоговую рекомендацию.')
      setConfirmOpen(false)
      return
    }
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

  const handleDecline = async () => {
    if (!id || declining) return
    const reason = declineReason.trim()
    if (reason.length < 10) {
      setDeclineError('Укажите мотивированную причину отказа — не менее 10 символов.')
      return
    }
    setDeclining(true)
    setDeclineError(null)
    try {
      await api.declineReview(id, reason)
      setDeclineOpen(false)
      setSuccess('Отказ отправлен редактору. Назначение снято.')
      setToastOpen(true)
      window.setTimeout(() => navigate('/cabinet/reviews', { replace: true }), 1200)
    } catch (e: any) {
      const message = e?.bodyJson?.detail || e?.message || 'Не удалось отказаться от рецензирования'
      setDeclineError(String(message))
    } finally {
      setDeclining(false)
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
            <h3 className="panel-title" style={{ marginTop: 0 }}>Манускрипт</h3>
            <div className="actions">
              {data.article.manuscript_file_url && (
                <a className="button button--ghost button--compact" href={toApiFilesUrl(data.article.manuscript_file_url) || '#'} target="_blank" rel="noreferrer">Рукопись</a>
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
              {isReadOnly && (
                <div className="review-result" style={{ gridColumn: '1 / -1' }}>
                  <span className="form-label">Итоговая рекомендация</span>
                  <strong>{draft.recommendation === 'accept' ? 'Рекомендуется к публикации' : draft.recommendation === 'major_revision' ? 'Возвратить с замечаниями на доработку' : draft.recommendation === 'reject' ? 'Отклонить' : '—'}</strong>
                </div>
              )}

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

            <div className="review-actions">
              {!isReadOnly && (
              <button
                className="button review-actions__button review-actions__button--decline"
                type="button"
                onClick={() => {
                  setDeclineError(null)
                  setDeclineOpen(true)
                }}
                disabled={saving || declining}
              >
                Отказаться от рецензирования
              </button>
              )}
              {!isReadOnly && (
              <button className="button review-actions__button review-actions__button--save" type="button" onClick={handleSave} disabled={saving}>
                Сохранить черновик
              </button>
              )}
              {!isReadOnly && (
              <button className="button review-actions__button review-actions__button--submit" type="button" onClick={() => {
                setError(null)
                setConfirmOpen(true)
              }} disabled={saving}>
                Отправить рецензию
              </button>
              )}
            </div>
          </form>
          {confirmOpen && (
            <div className="modal-backdrop" onClick={() => !saving && setConfirmOpen(false)}>
              <div className="modal review-submit-modal" role="dialog" aria-modal="true" aria-labelledby="review-submit-title" onClick={(event) => event.stopPropagation()}>
                <div className="modal__header">
                  <div>
                    <p className="eyebrow">Завершение рецензии</p>
                    <h3 className="panel-title" id="review-submit-title">Отправить ответ редактору</h3>
                  </div>
                </div>
                <div className="modal__body">
                  <p className="subtitle">Выберите итоговую рекомендацию. После отправки изменить рецензию будет нельзя.</p>
                  <label className="form-field">
                    <span className="form-label">Итоговая рекомендация *</span>
                    <select
                      className="text-input review-submit-modal__select"
                      value={hasValidRecommendation ? draft.recommendation : ''}
                      onChange={(event) => {
                        onChange('recommendation', event.target.value)
                        setError(null)
                      }}
                      disabled={saving}
                      required
                      autoFocus
                    >
                      <option value="" disabled>Выберите рекомендацию</option>
                      <option value="accept">Рекомендуется к публикации</option>
                      <option value="major_revision">Возвратить с замечаниями на доработку</option>
                      <option value="reject">Отклонить</option>
                    </select>
                    {!hasValidRecommendation && <span className="form-error-text">Выберите один из трёх вариантов.</span>}
                  </label>
                </div>
                <div className="modal__footer review-submit-modal__footer">
                  <button className="button button--ghost" type="button" disabled={saving} onClick={() => setConfirmOpen(false)}>Вернуться</button>
                  <button className="button button--primary" type="button" disabled={saving || !hasValidRecommendation} onClick={doSubmit}>
                    {saving ? 'Отправляем…' : 'Отправить ответ'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {declineOpen && (
            <div className="modal-backdrop" onClick={() => !declining && setDeclineOpen(false)}>
              <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <div className="modal__header">
                  <p className="eyebrow">Мотивированный отказ</p>
                  <h3 className="panel-title">Отказаться от рецензирования?</h3>
                </div>
                <div className="modal__body">
                  <p className="subtitle">
                    Опишите причину отказа. Она будет отправлена ответственному редактору вместе с уведомлением по электронной почте.
                  </p>
                  <label className="form-field">
                    <span className="form-label">Причина отказа</span>
                    <textarea
                      className="text-input"
                      rows={5}
                      maxLength={2000}
                      value={declineReason}
                      onChange={(event) => {
                        setDeclineReason(event.target.value)
                        setDeclineError(null)
                      }}
                      placeholder="Например: тема статьи выходит за рамки моей научной специализации..."
                      disabled={declining}
                      autoFocus
                    />
                    <span className="form-hint">Не менее 10 символов. {declineReason.length}/2000</span>
                  </label>
                  {declineError ? <Alert variant="error" title="Не удалось отправить отказ">{declineError}</Alert> : null}
                </div>
                <div className="modal__footer">
                  <button className="button button--ghost" type="button" disabled={declining} onClick={() => setDeclineOpen(false)}>
                    Назад
                  </button>
                  <button className="button button--danger" type="button" disabled={declining || declineReason.trim().length < 10} onClick={handleDecline}>
                    {declining ? 'Отправляем...' : 'Подтвердить отказ'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
      <Toast open={!!toastOpen} message={success || ''} onClose={() => setToastOpen(false)} />

      
    </div>
  )
}
