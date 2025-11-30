import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { Article, ReviewAssignment, User } from '../shared/types'
import { Badge } from '../shared/components/Badge'

interface ArticleDetailsPageProps {
  articles: Article[]
  users: User[]
  assignments: ReviewAssignment[]
}

const editorReviewChecklist = [
  'Важность, полезность и/или применимость идей, методов, технологий:',
  'Новое освещение, применение в той или иной отрасли:',
  'Идеи, методы, способы, решения и результаты поставленных задач исследования ранее не были известны или апробированы:',
  'Новый процесс, услуга, продукт, основанные на новых, неизвестных технологиях, методах или методологиях, определение новых для потребителей услуг:',
  'Изложение результатов, теоретическая и практическая значимость, выводы, научно-практическое значение:',
  'Логичность, последовательность, связность изложения:',
  'Коммуникативная ценность, соответствие научному стилю, языковым и стилистическим нормам:',
  'Соответствие требованиям редакции, использование терминологической лексики. Наличие аннотаций, пристатейного аппарата, ключевых слов, соблюдение определенных параметров страницы, библиографического списка:',
]

export function ArticleDetailsPage({ articles, users, assignments }: ArticleDetailsPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isReviewChecklistOpen, setIsReviewChecklistOpen] = useState(true)
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({})

  const article = useMemo(() => articles.find((a) => a.id === id), [articles, id])
  const articleAssignments = useMemo(
    () => (article ? assignments.filter((a) => a.articleId === article.id) : []),
    [assignments, article],
  )
  const reviews = useMemo(() => article?.reviews ?? [], [article])
  const editor = useMemo(() => (article?.editorId ? users.find((u) => u.id === article.editorId) : undefined), [article, users])
  const authorNames = useMemo(
    () =>
      article
        ? article.authors
            .map((aid) => users.find((u) => u.id === aid))
            .filter(Boolean)
            .map((u) => (u?.affiliation ? `${u.name} (${u.affiliation})` : u!.name))
            .join(', ')
        : '',
    [article, users],
  )

  if (!article) {
    return (
      <div className="app-container">
        <div className="panel">
          <p className="panel-title">Статья не найдена</p>
          <button className="button button--ghost" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    )
  }

  const latestReview = reviews[reviews.length - 1]

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Карточка статьи</p>
          <h1 className="page-title">{article.title}</h1>
          <p className="subtitle">Детали для авторов, редакторов и рецензентов.</p>
        </div>
        <div className="pill">#{article.id}</div>
      </section>

      <div className="panel">
        <div className="article-card__top" style={{ marginBottom: '0.6rem' }}>
          <Badge status={article.status} />
          <span className="pill pill--ghost">v{article.version}</span>
        </div>
        <div className="grid grid-2">
          <div className="form-field">
            <div className="form-label">Авторы</div>
            <div className="form-hint">{authorNames || 'Не указаны'}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Специализация</div>
            <div className="form-hint">{article.specialty}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Отправлено</div>
            <div className="form-hint">{new Date(article.submittedAt).toLocaleDateString('ru-RU')}</div>
          </div>
          <div className="form-field">
            <div className="form-label">Редактор</div>
            <div className="form-hint">{editor?.name ?? 'Не назначен'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <p className="eyebrow">Рецензирование</p>
          <h3 className="panel-title">Назначения</h3>
          {articleAssignments.length === 0 ? (
            <div className="table__empty">Назначений нет.</div>
          ) : (
            <div className="assignment-list">
              {articleAssignments.map((a) => {
                const reviewer = users.find((u) => u.id === a.reviewerId)
                const review = reviews.find((r) => r.reviewerId === a.reviewerId)
                return (
                  <div className="assignment-row" key={a.id}>
                    <div>
                      <div className="assignment-title">{reviewer?.name ?? 'Рецензент'}</div>
                      <div className="article-meta">
                        <span>Раунд {a.round}</span>
                        <span className="dot">·</span>
                        <span>{a.isAnonymous ? 'Анонимно' : 'Открыто'}</span>
                      </div>
                    </div>
                    <div className="pill">
                      {review ? 'Отзыв получен' : `Дедлайн ${new Date(a.dueAt).toLocaleDateString('ru-RU')}`}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="panel">
          <p className="eyebrow">Статус</p>
          <h3 className="panel-title">Текущий этап</h3>
          <p className="subtitle">Последние действия по рукописи.</p>
          <div className="pill-list" style={{ marginBottom: "0.75rem" }}>
            <button className="button button--ghost button--compact" type="button" onClick={() => setIsReviewChecklistOpen(true)}>
              Проверка рецензии
            </button>
          </div>
          {latestReview ? (
            <div className="assignment-card__body">
              <div>
                <div className="meta-label">Рекомендация</div>
                <div>{latestReview.recommendation}</div>
              </div>
              <div>
                <div className="meta-label">Получено</div>
                <div>{new Date(latestReview.submittedAt).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <div className="form-label">Комментарии</div>
                <div className="form-hint">{latestReview.comments}</div>
              </div>
            </div>
          ) : (
            <div className="table__empty">Отзывов пока нет.</div>
          )}
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Все рецензии</p>
        {reviews.length === 0 ? (
          <div className="table__empty">Рецензии отсутствуют.</div>
        ) : (
          <div className="assignment-list">
            {reviews.map((rev) => {
              const reviewer = users.find((u) => u.id === rev.reviewerId)
              return (
                <div className="assignment-row" key={rev.id}>
                  <div>
                    <div className="assignment-title">{reviewer?.name ?? 'Рецензент'}</div>
                    <div className="article-meta">
                      <span>Раунд {rev.round}</span>
                      <span className="dot">·</span>
                      <span>{rev.isAnonymous ? 'Анонимно' : 'Подписано'}</span>
                    </div>
                    <p className="article-abstract">{rev.comments}</p>
                  </div>
                  <div className="pill">{rev.recommendation}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Быстрые действия</p>
            <h3 className="panel-title">Доступно всем ролям</h3>
          </div>
          <div className="pill pill--ghost">Навигация</div>
        </div>
        <div className="pill-list">
          <Link className="button button--ghost button--compact" to="/cabinet/submissions">
            К списку статей
          </Link>
          <Link className="button button--ghost button--compact" to="/cabinet/editorial">
            Панель редактора
          </Link>
          <Link className="button button--ghost button--compact" to="/cabinet/reviews">
            Назначения рецензента
          </Link>
          <Link className="button button--ghost button--compact" to="/cabinet/layout">
            Очередь верстки
          </Link>
        </div>
      {isReviewChecklistOpen ? (
        <div className="modal-backdrop" onClick={() => setIsReviewChecklistOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Проверка рецензии</h3>
              <button
                className="modal__close"
                onClick={() => setIsReviewChecklistOpen(false)}
                aria-label="Закрыть проверку рецензии"
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              {editorReviewChecklist.map((label) => (
                <div className="form-field" key={label}>
                  <label className="form-label">{label}</label>
                  <textarea
                    className="text-input"
                    rows={3}
                    placeholder="Комментарий редактора по пункту"
                    value={checklistNotes[label] ?? ""}
                    onChange={(e) => setChecklistNotes((prev) => ({ ...prev, [label]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setChecklistNotes({})}>
              Очистить заметки
              </button>
              <button className="button button--primary" type="button" onClick={() => setIsReviewChecklistOpen(false)}>
                ??????
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  )
}
