import { Link } from 'react-router-dom'

export function AuthorsInfoPage() {
  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">для авторов</p>
        <h1 className="hero__title">Как подать статью</h1>
        <div className="panel">
          <h3 className="panel-title">Основные требования</h3>
          <ul className="list">
            <li>Форматирование рукописи по стандарту журнала.</li>
            <li>Оригинальность и корректное цитирование источников.</li>
            <li>Указание данных и этических соглашений, если применимо.</li>
          </ul>
        </div>
        <div className="grid grid-2" style={{ marginTop: '0.8rem' }}>
          <div className="panel">
            <h3 className="panel-title">Процесс</h3>
            <ul className="list">
              <li>Отправьте рукопись через личный кабинет.</li>
              <li>Дождитесь назначения рецензентов (2–4 недели).</li>
              <li>Выполните правки по итогам раундов.</li>
            </ul>
          </div>
          <div className="panel">
            <h3 className="panel-title">Поддержка</h3>
            <p className="subtitle">
              Свяжитесь с редакцией, если требуется консультация по формату, проверке оригинальности или этике публикаций.
            </p>
            <Link className="button button--primary" to="/cabinet/submissions">
              Перейти к подаче
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
