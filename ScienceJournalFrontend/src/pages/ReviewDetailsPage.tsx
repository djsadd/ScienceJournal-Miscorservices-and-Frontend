import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ReviewDetail } from '../shared/types'
import Alert from '../shared/components/Alert'
import ConfirmModal from '../shared/components/ConfirmModal'
import Toast from '../shared/components/Toast'

export default function ReviewDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

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

  const title = useMemo(() => data?.article_title ?? `Рецензия #${id}` , [data, id])

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
        <div className="pill pill--ghost">ID: {id}</div>
      </section>

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
