import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

type TemplateVariable = { name: string; description: string; sample: string }
type Template = { key: string; name: string; description: string; variables: TemplateVariable[] }

const commonNames = new Set(['user_name', 'user_email', 'first_name', 'last_name', 'title', 'message'])

export default function EmailTemplateDocsPage() {
  const [items, setItems] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getEmailTemplates<Template[]>()
      .then(setItems)
      .catch(() => setError('Не удалось загрузить справочник переменных.'))
      .finally(() => setLoading(false))
  }, [])

  const commonVariables = useMemo(() => {
    const variables = new Map<string, TemplateVariable>()
    items.flatMap(item => item.variables).filter(item => commonNames.has(item.name)).forEach(item => variables.set(item.name, item))
    return [...variables.values()]
  }, [items])

  return <div className="page">
    <section className="section-header">
      <div><p className="eyebrow">Администратор · Справочник</p><h1 className="page-title">Документация шаблонов писем</h1><p className="subtitle">Переменные подставляются при отправке. Используйте синтаксис <code>{'{имя_переменной}'}</code> в теме, обычном тексте и HTML.</p></div>
      <Link className="button button--primary" to="/cabinet/admin/email-templates">Открыть редактор</Link>
    </section>

    {loading ? <div className="loading">Загрузка...</div> : error ? <div className="alert alert--error">{error}</div> : <>
      <section className="panel">
        <h2 className="panel-title">Общие переменные</h2>
        <p className="form-hint">Доступны во всех письмах. Данные получателя автоматически загружаются из его учётной записи.</p>
        <div className="table">
          <div className="table__head" style={{ gridTemplateColumns: 'minmax(150px, .7fr) minmax(240px, 1.5fr) minmax(180px, 1fr)' }}><span>Тег</span><span>Описание</span><span>Пример</span></div>
          {commonVariables.map(variable => <div className="table__row" style={{ gridTemplateColumns: 'minmax(150px, .7fr) minmax(240px, 1.5fr) minmax(180px, 1fr)' }} key={variable.name}>
            <div className="table__cell"><code>{`{${variable.name}}`}</code></div><div className="table__cell">{variable.description}</div><div className="table__cell">{variable.sample || '—'}</div>
          </div>)}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2 className="panel-title">Переменные событий</h2>
        <p className="form-hint">Эти теги зависят от типа письма. Не используйте тег одного события в шаблоне другого события.</p>
        <div className="auth-form">
          {items.map(item => {
            const eventVariables = item.variables.filter(variable => !commonNames.has(variable.name))
            return <details key={item.key} className="panel panel--compact">
              <summary><strong>{item.name}</strong> <span className="form-hint">({item.key})</span></summary>
              <p className="form-hint">{item.description}</p>
              {eventVariables.length ? eventVariables.map(variable => <div key={variable.name} style={{ marginTop: 10 }}>
                <code>{`{${variable.name}}`}</code> — {variable.description} <span className="form-hint">Пример: {variable.sample || '—'}</span>
              </div>) : <p className="form-hint">Дополнительных переменных нет.</p>}
            </details>
          })}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2 className="panel-title">Правила использования</h2>
        <ol>
          <li>Тег пишется в фигурных скобках без пробелов: <code>{'{user_name}'}</code>.</li>
          <li>Теги можно вставлять в тему, текстовую и HTML-версию письма.</li>
          <li>Если имя или фамилия не заполнены, соответствующий тег будет пустым; <code>{'{user_name}'}</code> использует логин как запасное значение.</li>
          <li>Перед сохранением система проверяет неизвестные и синтаксически неверные теги.</li>
          <li>Кнопка тестовой отправки показывает результат на демонстрационных данных.</li>
        </ol>
      </section>
    </>}
  </div>
}
