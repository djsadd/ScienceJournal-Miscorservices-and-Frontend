import { useState } from 'react'

type Member = {
  name: string
  role: string
  field: string
  id: string
}

const editorialBoard: Member[] = [
  { name: 'Михаил Орлов', role: 'Главный редактор', field: 'Физика конденсированного состояния', id: 'orcid.org/0000-0001' },
  { name: 'Дарья Платонова', role: 'Зам. редактора', field: 'Вычислительная медицина', id: 'orcid.org/0000-0002' },
  { name: 'Илья Захаров', role: 'Редактор', field: 'Экономика и управление', id: 'scopus:572000000' },
  { name: 'София Самойлова', role: 'Редактор', field: 'Социальные науки', id: 'scopus:572000001' },
]

const editorialCouncil: Member[] = [
  { name: 'Рецензент А', role: 'Совет', field: 'Право и регуляторика', id: 'orcid.org/0000-0003' },
  { name: 'Рецензент Б', role: 'Совет', field: 'Маркетинг и финансы', id: 'orcid.org/0000-0004' },
  { name: 'Рецензент В', role: 'Совет', field: 'Гуманитарные науки', id: 'orcid.org/0000-0005' },
]

export function EditorialPage() {
  const [filter, setFilter] = useState<'board' | 'council'>('board')
  const data = filter === 'board' ? editorialBoard : editorialCouncil

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">редакция</p>
        <h1 className="hero__title">Редколлегия и рецензирование</h1>
        <p className="subtitle">
          Принципы формирования редколлегии: научная репутация, тематическая экспертиза и международное представительство.
          Ниже — состав редколлегии и редсовета с основными научными идентификаторами.
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

        <div className="grid grid-3">
          {data.map((person) => (
            <div className="panel person-card" key={person.name}>
              <div className="panel-title">{person.name}</div>
              <p className="subtitle">{person.role}</p>
              <p className="meta-label">{person.field}</p>
              <div className="id-chip">ID: {person.id}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3 className="panel-title">Политика рецензирования</h3>
          <ul className="list">
            <li>Двустороннее слепое рецензирование.</li>
            <li>Срок подготовки отзыва — 2–4 недели.</li>
            <li>Раунды доработок до окончательного решения редакции.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
