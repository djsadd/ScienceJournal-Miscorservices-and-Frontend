export function SearchPage() {
  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">поиск</p>
        <h1 className="hero__title">Найдите статьи и авторов</h1>
        <div className="search-inline">
          <input className="search" placeholder="Темы, DOI, фамилия автора или ключевые слова" />
          <button className="button button--primary">Искать</button>
        </div>
        <div className="pill-list">
          <span className="pill">экономика</span>
          <span className="pill">управление</span>
          <span className="pill">право</span>
          <span className="pill">социальные науки</span>
          <span className="pill">маркетинг</span>
          <span className="pill">финансы</span>
        </div>
        <p className="subtitle" style={{ marginTop: '0.6rem' }}>
          Здесь будет интеграция с поиском по DOI, авторам и тематике выпусков.
        </p>
      </div>
    </div>
  )
}
