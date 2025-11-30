import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Article, ReviewAssignment, User } from '../shared/types'

interface ReviewFormPageProps {
  assignments: ReviewAssignment[]
  articles: Article[]
  users: User[]
}

export const reviewFields = [
  'Важность, полезность и/или применимость идей, методов, технологий',
  'Новое освещение, применение в той или иной отрасли',
  'Идеи, методы, способы, решения и результаты поставленных задач исследования ранее не были известны или апробированы',
  'Новый процесс, услуга, продукт, основанные на новых, неизвестных технологиях, методах или методологиях, определение новых для потребителей услуг',
  'Изложение результатов, теоретическая и практическая значимость, выводы, научно-практическое значение',
  'Логичность, последовательность, связность изложения',
  'Коммуникативная ценность, соответствие научному стилю, языковым и стилистическим нормам',
  'Соответствие требованиям редакции, использование терминологической лексики. Наличие аннотаций, пристатейного аппарата, ключевых слов, соблюдение определенных параметров страницы, библиографического списка',
]

export function ReviewFormPage({ assignments, articles, users }: ReviewFormPageProps) {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)

  const assignment = useMemo(() => assignments.find((a) => a.id === assignmentId), [assignments, assignmentId])
  const article = useMemo(() => (assignment ? articles.find((a) => a.id === assignment.articleId) : undefined), [articles, assignment])
  const reviewer = useMemo(() => (assignment ? users.find((u) => u.id === assignment.reviewerId) : undefined), [users, assignment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // В реальном приложении — отправка на бэк.
    navigate(-1)
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Рецензия</p>
          <h1 className="page-title">{article?.title ?? 'Статья'}</h1>
          <p className="subtitle">Форма для заполнения рецензентом по ключевым критериям.</p>
        </div>
        <div className="pill">Assignment: {assignment?.id ?? '-'}</div>
      </section>

      <div className="panel">
        <div className="grid grid-2">
          <div className="form-field">
            <div className="form-label">Рецензент</div>
            <div className="form-hint">{reviewer?.name ?? '—'}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Дедлайн</div>
            <div className="form-hint">
              {assignment ? new Date(assignment.dueAt).toLocaleDateString('ru-RU') : 'Не указан'}
            </div>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {reviewFields.map((label) => (
            <div className="form-field" key={label}>
              <label className="form-label">{label}</label>
              <textarea
                className="text-input"
                rows={3}
                value={answers[label] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [label]: e.target.value }))}
              />
            </div>
          ))}

          <div className="form-field">
            <label className="form-label">Файл рукописи (обновлённый)</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? <div className="form-hint">Прикреплено: {file.name}</div> : null}
          </div>

          <div className="auth-row">
            <button className="button button--ghost" type="button" onClick={() => navigate(-1)}>
              Назад
            </button>
            <button className="button button--primary" type="submit">
              Отправить рецензию
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
