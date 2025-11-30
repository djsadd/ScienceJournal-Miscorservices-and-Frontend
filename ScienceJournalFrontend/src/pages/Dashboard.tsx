import type { Article, ReviewAssignment, User } from '../shared/types'
import { StatCard } from '../shared/components/StatCard'

interface DashboardProps {
  articles: Article[]
  assignments: ReviewAssignment[]
  users: User[]
}

const statusLabelMap: Record<Article['status'], string> = {
  draft: 'Черновик',
  submitted: 'Отправлено',
  under_review: 'В рецензировании',
  in_review: 'На рецензии',
  revisions: 'Требуют правок',
  accepted: 'Принято',
  published: 'Опубликовано',
  withdrawn: 'Отозвано',
  rejected: 'Отклонено',
}

const getLastAction = (article: Article) => {
  const date = new Date(article.submittedAt).toLocaleDateString('ru-RU')
  switch (article.status) {
    case 'in_review':
      return `Передано на рецензию · ${date}`
    case 'revisions':
      return `Ждет правок автора · ${date}`
    case 'accepted':
      return `Принято к публикации · ${date}`
    case 'submitted':
      return `Отправлено в редакцию · ${date}`
    case 'rejected':
      return `Отклонено · ${date}`
    default:
      return `Обновлено · ${date}`
  }
}

export function Dashboard({ articles }: DashboardProps) {
  const latest = [...articles]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 4)

  const authorStats = [
    { label: 'На рецензии', value: 2 },
    { label: 'Требуют правок', value: 1 },
    { label: 'Приняты', value: 0 },
  ]

  const editorStats = [
    { label: 'Входящие новые статьи', value: 4 },
    { label: 'На рецензии', value: 6 },
    { label: 'Требуют решения', value: 2 },
    { label: 'На верстке', value: 1 },
  ]

  const reviewerStats = [
    { label: 'Новые приглашения', value: 1 },
    { label: 'Текущие рецензии', value: 3 },
    { label: 'Просроченные', value: 0 },
  ]

  const designerStats = [
    { label: 'На верстке', value: 5 },
    { label: 'Ожидают выпуска', value: 2 },
  ]

  return (
    <div className="app-container">
      <section className="section-header">
        <div>
          <p className="eyebrow">Кабинет</p>
          <h1 className="page-title">Главная панель</h1>
          <p className="subtitle">Сводка по ролям и быстрый просмотр последних статей.</p>
        </div>
        <div className="pill pill--ghost">Демоданные</div>
      </section>

      <div className="dashboard-grid">
        <div className="panel role-panel role-panel--wide">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">Автор</p>
              <h2 className="panel-title">Статистика заявок</h2>
              <p className="subtitle">Текущее состояние рукописей в работе.</p>
            </div>
            <span className="pill">Мои материалы</span>
          </div>

          <div className="grid grid-3 role-panel__stats">
            {authorStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="latest-table">
            <div className="latest-table__title">Мои последние статьи</div>
            <div className="latest-table__head">
              <span>Название</span>
              <span>Статус</span>
              <span>Последнее действие</span>
            </div>
            <div className="latest-table__body">
              {latest.map((article) => (
                <div className="latest-table__row" key={article.id}>
                  <div className="latest-table__cell latest-table__cell--title">
                    <div className="latest-table__name">{article.title}</div>
                    <div className="latest-table__meta">#{article.id}</div>
                  </div>
                  <div className="latest-table__cell">
                    <span className={`status-chip status-chip--${article.status}`}>
                      {statusLabelMap[article.status] ?? article.status}
                    </span>
                  </div>
                  <div className="latest-table__cell latest-table__cell--action">{getLastAction(article)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">Редактор</p>
              <h2 className="panel-title">Поток задач</h2>
              <p className="subtitle">Что сейчас требует внимания.</p>
            </div>
          </div>
          <div className="role-stats role-stats--dense">
            {editorStats.map((stat) => (
              <div className="role-stat" key={stat.label}>
                <div className="role-stat__value">{stat.value}</div>
                <div className="role-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">Рецензент</p>
              <h2 className="panel-title">Мои проверки</h2>
              <p className="subtitle">Приглашения и активные рецензии.</p>
            </div>
          </div>
          <div className="role-stats">
            {reviewerStats.map((stat) => (
              <div className="role-stat" key={stat.label}>
                <div className="role-stat__value">{stat.value}</div>
                <div className="role-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel role-panel">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">Верстальщик</p>
              <h2 className="panel-title">Выпуск номера</h2>
              <p className="subtitle">Статьи на верстке и в очереди на выпуск.</p>
            </div>
          </div>
          <div className="role-stats">
            {designerStats.map((stat) => (
              <div className="role-stat" key={stat.label}>
                <div className="role-stat__value">{stat.value}</div>
                <div className="role-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
