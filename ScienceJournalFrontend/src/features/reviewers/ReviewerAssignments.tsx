import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Article, ReviewAssignment, User } from '../../shared/types'
import { Badge } from '../../shared/components/Badge'

interface ReviewerAssignmentsProps {
  assignments: ReviewAssignment[]
  articles: Article[]
  users: User[]
}

export function ReviewerAssignments({ assignments, articles, users }: ReviewerAssignmentsProps) {
  const withMetadata = useMemo(
    () =>
      assignments
        .map((assignment) => {
          const article = articles.find((a) => a.id === assignment.articleId)
          const reviewer = users.find((u) => u.id === assignment.reviewerId)
          return { assignment, article, reviewer }
        })
        .filter((item) => item.article && item.reviewer) as {
        assignment: ReviewAssignment
        article: Article
        reviewer: User
      }[],
    [assignments, articles, users],
  )

  const deriveStatus = (article: Article) => {
    if (article.status === 'submitted') return 'Ждет принятия'
    if (article.status === 'in_review' || article.status === 'revisions') return 'В работе'
    if (article.status === 'accepted') return 'Завершено'
    return 'В работе'
  }

  const actionButtons = (article: Article) => {
    if (article.status === 'submitted') return ['Принять', 'Отклонить', 'Рецензия']
    if (article.status === 'in_review' || article.status === 'revisions') return ['Открыть', 'Рецензия']
    return ['Открыть']
  }

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Рецензент</p>
          <h1 className="page-title">Назначенные статьи</h1>
          <p className="subtitle">Список рецензий с дедлайнами и быстрыми действиями.</p>
        </div>
        <div className="pill pill--ghost">Роль: Reviewer</div>
      </section>

      <div className="panel">
        <div className="table">
          <div className="table__head">
            <span>Название</span>
            <span>Дедлайн</span>
            <span>Статус</span>
            <span>Действия</span>
          </div>
          <div className="table__body">
            {withMetadata.map(({ assignment, article }) => (
              <div className="table__row table__row--align" key={assignment.id}>
                <div className="table__cell table__cell--title">
                  <div className="table__title">{article.title}</div>
                  <div className="table__meta">{article.specialty}</div>
                </div>
                <div className="table__cell">
                  {new Date(assignment.dueAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                </div>
                <div className="table__cell">
                  <Badge status={article.status} />
                  <div className="table__meta">{deriveStatus(article)}</div>
                </div>
                <div className="table__cell table__cell--actions">
                  {actionButtons(article).map((action) => {
                    if (action === 'Открыть') {
                      return (
                        <Link key={action} className="button button--ghost button--compact" to={`/cabinet/articles/${article.id}`}>
                          {action}
                        </Link>
                      )
                    }
                    if (action === 'Рецензия') {
                      return (
                        <Link
                          key={action}
                          className="button button--ghost button--compact"
                          to={`/cabinet/review/${assignment.id}`}
                        >
                          {action}
                        </Link>
                      )
                    }
                    return (
                      <button key={action} className="button button--ghost button--compact">
                        {action}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {withMetadata.length === 0 ? <div className="table__empty">Нет назначенных статей.</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
