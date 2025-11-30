export function ContactsPage() {
  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">контактная информация</p>
        <h1 className="hero__title">Редакция «Вестник Туран-Астана»</h1>
        <div className="panel contact-card">
          <div className="contact-grid">
            <div>
              <div className="meta-label">Email</div>
              <div>editorial@sciencejournal.edu</div>
            </div>
            <div>
              <div className="meta-label">Телефон</div>
              <div>+7 (495) 123-45-67</div>
            </div>
            <div>
              <div className="meta-label">Адрес</div>
              <div>Астана, Университетская 1</div>
            </div>
          </div>
          <p className="subtitle">
            Пишите по вопросам подачи рукописей, рецензирования, интеграций и партнёрств. Мы ответим в течение 2 рабочих
            дней.
          </p>
        </div>
      </div>
    </div>
  )
}
