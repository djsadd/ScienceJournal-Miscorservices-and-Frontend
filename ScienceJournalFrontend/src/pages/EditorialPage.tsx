import { useState } from 'react'

type Filter = 'board' | 'council'

export function EditorialPage() {
  const [filter, setFilter] = useState<Filter>('board')

  const board = [
    { name: 'Джапарова Г. А.', role: 'Главный редактор', note: 'к. э. н., профессор' },
    { name: 'Смоилов С. Ж.', role: 'Заместитель главного редактора', note: 'PhD', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=56530669600&origin=resultslist#', label: 'Scopus' } },
    { name: 'Алиев У. Ж.', role: 'Редакционная коллегия', note: 'д. э. н., профессор (Казахстан)', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=57949136300&origin=recordpage', label: 'Scopus' } },
    { name: 'Аубакиров Т. О.', role: 'Редакционная коллегия', note: 'д. т. н., профессор (Казахстан)' },
    { name: 'Тасбулатов А. Б.', role: 'Редакционная коллегия', note: 'д. и. н., профессор (Казахстан)' },
    { name: 'Даубаев К. Ж.', role: 'Редакционная коллегия', note: 'д. э. н., профессор (Казахстан)', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=57197799392&origin=resultslist', label: 'Scopus' } },
    { name: 'Попова М. С.', role: 'Редакционная коллегия', note: 'PhD, профессор (Болгария)', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=57542934300&origin=resultslist', label: 'Scopus' } },
    { name: 'Тунч М. Д.', role: 'Редакционная коллегия', note: 'PhD, профессор (Турция)', link: { href: 'https://scholar.google.com.tr/citations?user=znyiDk4AAAAJ&hl=tr', label: 'Google Scholar' } },
    { name: 'Антонио А. М.', role: 'Редакционная коллегия', note: 'PhD, профессор (Испания)', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=55583872800', label: 'Scopus' } },
    { name: 'Ильина И. Н.', role: 'Редакционная коллегия', note: 'д. э. н., профессор (Россия)' },
    { name: 'Чекмарев В. В.', role: 'Редакционная коллегия', note: 'д. э. н., профессор (Россия)' },
    { name: 'Лемешенко П. С.', role: 'Редакционная коллегия', note: 'д. э. н., профессор (Белоруссия)' },
    { name: 'Тарасевич В. Н.', role: 'Редакционная коллегия', note: 'д. э. н., профессор (Украина)' },
    { name: 'Абишева К. М.', role: 'Редакционная коллегия', note: 'д. ф. н., профессор (Казахстан)', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=55964132200', label: 'Scopus' } },
    { name: 'Нагымжанова К. М.', role: 'Редакционная коллегия', note: 'д. п. н., профессор (Казахстан)', link: { href: 'https://www.scopus.com/authid/detail.uri?authorId=55964960000', label: 'Scopus' } },
    { name: 'Сман А. С.', role: 'Редакционная коллегия', note: 'д. ю. н., профессор (Казахстан)' },
    { name: 'Мырзаханова Н. М.', role: 'Редакционная коллегия', note: 'д. б. н., профессор (Казахстан)' },
    { name: 'Никитинский Е. С.', role: 'Редакционная коллегия', note: 'д. п. н., профессор (Казахстан)' },
    { name: 'Капсалямов К. Ж.', role: 'Редакционная коллегия', note: 'к. ю. н., профессор (Казахстан)' },
    { name: 'Есымханова З. К.', role: 'Редакционная коллегия', note: 'к. э. н., профессор (Казахстан)' },
    { name: 'Каменова М. Ж.', role: 'Редакционная коллегия', note: 'э. ғ. к., профессор' },
  ]

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">редакция</p>
        <h1 className="hero__title">Редакционная коллегия и совет</h1>
        <p className="subtitle">
          Состав редколлегии и редсовета журнала «Известия университета Туран-Астана».
        </p>

        <div className="filter-bar">
          <button
            className={`filter-chip ${filter === 'board' ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter('board')}
          >
            Редакционная коллегия
          </button>
          <button
            className={`filter-chip ${filter === 'council' ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter('council')}
          >
            Редакционный совет
          </button>
        </div>

        {filter === 'board' && (
          <>
            <div className="grid grid-3">
              {board.map((m) => (
                <div className="panel person-card" key={m.name}>
                  <div className="panel-title">{m.name}</div>
                  <p className="subtitle">{m.role}</p>
                  <p className="meta-label">{m.note}</p>
                  {m.link && (
                    <a className="button button--ghost" href={m.link.href} target="_blank" rel="noreferrer">{m.link.label}</a>
                  )}
                </div>
              ))}
            </div>
            <div className="meta-label" style={{ marginTop: 16 }}>Ответственный секретарь: Нурманов А. М.</div>
          </>
        )}

        {filter === 'council' && (
          <>
            <div className="panel">
              <div className="panel-title">Редакционный совет</div>
              <p className="subtitle">Состав редсовета публикуется в ближайшем обновлении.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
