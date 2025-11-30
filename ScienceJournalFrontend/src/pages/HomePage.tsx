import { Link } from 'react-router-dom'
import { api } from '../api/client'

export function HomePage() {
  const tokens = api.getTokens()
  const isAuthed = Boolean(tokens?.accessToken)

  return (
    <div className="public-container home-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Известия университета «Туран-Астана»</p>
          <h1 className="hero__title">Вестник Туран-Астана</h1>
          <p className="subtitle hero__subtitle">
            Рецензируемое издание Университета «Туран-Астана», публикующее результаты оригинальных исследований в
            экономике, управлении, праве, социальных и гуманитарных науках.
          </p>
          <div className="hero__actions">
            {isAuthed ? (
              <>
                <Link to="/cabinet" className="button button--primary">
                  Cabinet
                </Link>
                <Link to="/cabinet/profile" className="button button--ghost">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="button button--primary">
                  Login
                </Link>
                <Link to="/register" className="button button--ghost">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero__panel panel">
          <h3 className="panel-title">Ключевые сведения</h3>
          <p className="subtitle">
            Журнал издается с 2019 года, имеет свидетельство о регистрации и международный номер ISSN 2663-631X. Учредитель
            — Университет «Туран-Астана».
          </p>
          <div className="stat-block">
            <div>
              <div className="stat-value">2019</div>
              <div className="stat-label">год основания</div>
            </div>
            <div>
              <div className="stat-value">2663-631X</div>
              <div className="stat-label">ISSN</div>
            </div>
            <div>
              <div className="stat-value">4</div>
              <div className="stat-label">выпуска в год</div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">о журнале</p>
            <h2 className="panel-title">Миссия и политика</h2>
          </div>
          <a className="button button--ghost" href="#contacts">
            Контакты редакции
          </a>
        </div>
        <div className="panel">
          <p className="subtitle">
            Научный журнал «Вестник Туран-Астана» является рецензируемым изданием, публикующим результаты оригинальных
            научных исследований в области экономики, управления, права, социальных и гуманитарных наук.
          </p>
          <p className="subtitle">
            Редакционная политика направлена на развитие академического диалога между исследователями, преподавателями и
            практиками, а также на продвижение лучших научных и прикладных исследований.
          </p>
        </div>
      </section>

      <section id="purpose" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">цель журнала</p>
            <h2 className="panel-title">Содействие науке</h2>
          </div>
          <a className="button button--ghost" href="#authors">
            Для авторов
          </a>
        </div>
        <div className="panel">
          <p className="subtitle">
            Цель журнала «Вестник Туран-Астана» — содействовать развитию научных исследований и распространению актуальных
            знаний в области социально-экономических и гуманитарных наук.
          </p>
        </div>
      </section>

      <section id="editorial" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">редакция</p>
            <h2 className="panel-title">Редколлегия и рецензенты</h2>
          </div>
          <a className="button button--ghost" href="#rules">
            Политика журнала
          </a>
        </div>
        <div className="grid grid-3">
          {[
            { name: 'Михаил Орлов', role: 'Главный редактор', field: 'Физика конденсированного состояния' },
            { name: 'Дарья Платонова', role: 'Зам. редактора', field: 'Вычислительная медицина' },
            { name: 'Рецензенты', role: '35+ экспертов', field: 'Слепое рецензирование по профилю' },
          ].map((person) => (
            <div className="panel person-card" key={person.name}>
              <div className="panel-title">{person.name}</div>
              <p className="subtitle">{person.role}</p>
              <p className="meta-label">{person.field}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rules" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">тематика</p>
            <h2 className="panel-title">Направления публикаций</h2>
          </div>
          <Link className="button button--primary" to="/cabinet/submissions">
            Подать статью
          </Link>
        </div>
        <div className="panel">
          <ul className="list">
            <li>экономика и управление;</li>
            <li>право и государственное управление;</li>
            <li>социальные и гуманитарные науки;</li>
            <li>маркетинг, финансы и предпринимательство.</li>
          </ul>
        </div>
      </section>

      <section id="registry" className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">свидетельства и периодичность</p>
            <h2 className="panel-title">Регистрационные данные</h2>
          </div>
          <a className="button button--ghost" href="#contacts">
            Связаться
          </a>
        </div>
        <div className="grid grid-3">
          <div className="panel issue-card">
            <div className="panel-title">Свидетельство о регистрации</div>
            <p className="subtitle">№ 17458-Ж, дата 14.01.2019.</p>
          </div>
          <div className="panel issue-card">
            <div className="panel-title">ISSN</div>
            <p className="subtitle">2663-631X — международный номер печатного издания.</p>
          </div>
          <div className="panel issue-card">
            <div className="panel-title">Периодичность</div>
            <p className="subtitle">4 раза в год. Публикации принимаются на русском, казахском и английском языках.</p>
          </div>
        </div>
      </section>

      <section id="contacts" className="section public-section">
        <div className="panel contact-card">
          <div>
            <p className="eyebrow">контакты</p>
            <h2 className="panel-title">Редакция</h2>
            <p className="subtitle">Пишите по вопросам подачи, рецензирования и партнёрств.</p>
          </div>
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
              <div>Москва, Университетская 1</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
