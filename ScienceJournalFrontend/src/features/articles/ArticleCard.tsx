import type { ReactNode } from 'react'
import type { Article, User } from '../../shared/types'
import { Badge } from '../../shared/components/Badge'

interface ArticleCardProps {
  article: Article
  users: User[]
  footer?: ReactNode
}

export function ArticleCard({ article, users, footer }: ArticleCardProps) {
  const authorNames = article.authors
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  const editorName = users.find((u) => u.id === article.editorId)?.name

  return (
    <div className="panel article-card">
      <div className="article-card__top">
        <Badge status={article.status} />
        <span className="pill pill--ghost">v{article.version}</span>
      </div>
      <h3 className="article-title">{article.title}</h3>
      <div className="article-meta">
        <span>{authorNames}</span>
        <span className="dot">·</span>
        <span>{article.specialty}</span>
      </div>
      <p className="article-abstract">{article.abstract}</p>
      <div className="article-footer">
        <div className="article-footer__meta">
          <span className="meta-label">Отправлено</span>
          <span>{new Date(article.submittedAt).toLocaleDateString('ru-RU')}</span>
          {editorName ? (
            <>
              <span className="dot">·</span>
              <span className="meta-label">Редактор</span>
              <span>{editorName}</span>
            </>
          ) : null}
        </div>
        {footer}
      </div>
    </div>
  )
}
