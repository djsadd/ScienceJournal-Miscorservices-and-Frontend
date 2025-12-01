export function ContactsPage() {
  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">контактная информация</p>
        <h1 className="hero__title">Редакция «Вестник Туран-Астана»</h1>
        <div className="panel contact-card">
          <div className="contact-grid">
            <div>
              <div className="meta-label">Электронная почта</div>
              <div>zharshy@tau-edu.kz</div>
            </div>
            <div>
              <div className="meta-label">Телефон</div>
              <div>+7 (7172) 64-43-10</div>
            </div>
            <div>
              <div className="meta-label">Адрес</div>
              <div>г. Астана, пр. Ықылас дүкенұлы, 29, Университет Туран-Астана</div>
            </div>
          </div>
          <div className="divider" />
          <div className="contact-grid">
            <div>
              <div className="meta-label">Ответственный редактор</div>
              <div>Доценко А.Н</div>
            </div>
            <div>
              <div className="meta-label">Email редактора</div>
              <div>zharshy@tau-edu.kz</div>
            </div>
          </div>
          <p className="subtitle">
            По вопросам подачи рукописей, рецензирования, макетирования и публикации обращайтесь по указанным контактам.
            Мы стараемся отвечать в течение 2 рабочих дней.
          </p>
        </div>
      </div>
    </div>
  )
}
