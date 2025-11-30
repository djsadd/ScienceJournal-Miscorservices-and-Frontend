export function PoliciesPage() {
  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">регламенты, процедуры, документация</p>
        <h1 className="hero__title">Правила и процессы</h1>
        <div className="panel">
          <h3 className="panel-title">Тематика журнала</h3>
          <ul className="list">
            <li>экономика и управление;</li>
            <li>право и государственное управление;</li>
            <li>социальные и гуманитарные науки;</li>
            <li>маркетинг, финансы и предпринимательство.</li>
          </ul>
        </div>
        <div className="grid grid-2">
          <div className="panel">
            <h3 className="panel-title">Правила для авторов</h3>
            <ul className="list">
              <li>Требования к форматированию рукописи.</li>
              <li>Проверка оригинальности и наличие данных.</li>
              <li>Этика публикаций и раскрытие конфликтов интересов.</li>
            </ul>
          </div>
          <div className="panel">
            <h3 className="panel-title">Процесс рецензирования</h3>
            <ul className="list">
              <li>Двустороннее слепое рецензирование.</li>
              <li>Сроки: 2–4 недели на отзыв.</li>
              <li>Раунды доработок и финальное решение редакции.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
