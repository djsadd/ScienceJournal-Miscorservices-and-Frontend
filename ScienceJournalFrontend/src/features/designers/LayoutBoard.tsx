import type { Article } from '../../shared/types'

interface LayoutBoardProps {
  articles: Article[]
}

const statusLabel: Record<string, string> = {
  layout: 'На верстке',
  approved: 'Утверждение',
}

export function LayoutBoard({ articles }: LayoutBoardProps) {
  const rows = articles.map((article) => {
    const isApproved = article.status === 'accepted'
    return {
      id: article.id,
      title: article.title,
      status: isApproved ? 'approved' : 'layout',
      date: new Date(article.submittedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    }
  })

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Верстальщик</p>
          <h1 className="page-title">Очередь верстки</h1>
          <p className="subtitle">Текущие материалы на верстке и в утверждении.</p>
        </div>
        <div className="pill pill--ghost">Рабочий стол</div>
      </section>

      <div className="panel">
        <div className="table">
          <div className="table__head">
            <span>Статья</span>
            <span>Статус</span>
            <span>Дата</span>
            <span>Действия</span>
          </div>
          <div className="table__body">
            {rows.map((row) => (
              <div className="table__row table__row--align" key={row.id}>
                <div className="table__cell table__cell--title">
                  <div className="table__title">{row.title}</div>
                  <div className="table__meta">#{row.id}</div>
                </div>
                <div className="table__cell">
                  <span className={`status-chip status-chip--${row.status === 'approved' ? 'accepted' : 'in_review'}`}>
                    {statusLabel[row.status]}
                  </span>
                </div>
                <div className="table__cell">{row.date}</div>
                <div className="table__cell table__cell--actions">
                  {row.status === 'layout' ? (
                    <button className="button button--ghost button--compact">Загрузить PDF</button>
                  ) : (
                    <button className="button button--ghost button--compact">Просмотр</button>
                  )}
                </div>
              </div>
            ))}
            {rows.length === 0 ? <div className="table__empty">Нет статей в работе.</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
