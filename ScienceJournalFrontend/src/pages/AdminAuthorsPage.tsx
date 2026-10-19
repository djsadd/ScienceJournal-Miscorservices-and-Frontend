import { useEffect, useMemo, useState } from 'react'

import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Author = {
  id: number
  email: string
  first_name: string
  patronymic?: string | null
  last_name: string
  first_name_en?: string | null
  patronymic_en?: string | null
  last_name_en?: string | null
  first_name_ru?: string | null
  patronymic_ru?: string | null
  last_name_ru?: string | null
  first_name_kz?: string | null
  patronymic_kz?: string | null
  last_name_kz?: string | null
}

type Language = 'ru' | 'en' | 'kz'

const copy = {
  ru: {
    eyebrow: 'Администрирование', title: 'Авторы',
    subtitle: 'ФИО авторов на латинице, русском и казахском языках.',
    search: 'Поиск по ФИО или email', total: 'Всего авторов',
    latin: 'Латиница', russian: 'Русский', kazakh: 'Қазақша', contacts: 'Контакты',
    loading: 'Загружаем авторов…', empty: 'Авторы не найдены', missing: 'Не заполнено',
    error: 'Не удалось загрузить список авторов', refresh: 'Обновить',
    autofill: 'Заполнить русский из қазақша', autofilling: 'Заполняем…',
    confirmAutofill: 'Заполнить пустые русские поля из казахских',
    nothingToFill: 'Нет авторов с пустым русским ФИО и заполненным казахским ФИО.',
    filled: 'Русские поля заполнены. Обновлено авторов:',
    fillError: 'Часть данных не удалось обновить. Успешно обновлено авторов:',
  },
  en: {
    eyebrow: 'Administration', title: 'Authors',
    subtitle: 'Author names in Latin, Russian and Kazakh.',
    search: 'Search by name or email', total: 'Total authors',
    latin: 'Latin', russian: 'Russian', kazakh: 'Kazakh', contacts: 'Contacts',
    loading: 'Loading authors…', empty: 'No authors found', missing: 'Not provided',
    error: 'Failed to load authors', refresh: 'Refresh',
    autofill: 'Fill Russian from Kazakh', autofilling: 'Filling…',
    confirmAutofill: 'Fill empty Russian fields from Kazakh for',
    nothingToFill: 'There are no authors with empty Russian and completed Kazakh names.',
    filled: 'Russian fields filled. Authors updated:',
    fillError: 'Some data could not be updated. Authors updated successfully:',
  },
  kz: {
    eyebrow: 'Әкімшілік', title: 'Авторлар',
    subtitle: 'Авторлардың аты-жөні латын, орыс және қазақ тілдерінде.',
    search: 'Аты-жөні немесе email бойынша іздеу', total: 'Барлық авторлар',
    latin: 'Латынша', russian: 'Орысша', kazakh: 'Қазақша', contacts: 'Байланыс',
    loading: 'Авторлар жүктелуде…', empty: 'Авторлар табылмады', missing: 'Толтырылмаған',
    error: 'Авторлар тізімін жүктеу мүмкін болмады', refresh: 'Жаңарту',
    autofill: 'Орысшаны қазақшадан толтыру', autofilling: 'Толтырылуда…',
    confirmAutofill: 'Бос орысша өрістерді қазақшадан толтыру',
    nothingToFill: 'Орысша аты-жөні бос және қазақша аты-жөні толтырылған авторлар жоқ.',
    filled: 'Орысша өрістер толтырылды. Жаңартылған авторлар:',
    fillError: 'Кейбір деректер жаңартылмады. Сәтті жаңартылған авторлар:',
  },
} satisfies Record<Language, Record<string, string>>

const joinName = (...parts: (string | null | undefined)[]) =>
  parts.map((part) => part?.trim()).filter(Boolean).join(' ')

const localizedName = (author: Author, language: Language) => {
  if (language === 'en') {
    return joinName(
      author.last_name_en || author.last_name,
      author.first_name_en || author.first_name,
      author.patronymic_en || author.patronymic,
    )
  }
  return joinName(
    author[`last_name_${language}`],
    author[`first_name_${language}`],
    author[`patronymic_${language}`],
  )
}

export default function AdminAuthorsPage() {
  const { lang } = useLanguage()
  const language = (lang === 'en' || lang === 'kz' ? lang : 'ru') as Language
  const t = copy[language]
  const [authors, setAuthors] = useState<Author[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      setAuthors(await api.getAuthors<Author[]>())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filteredAuthors = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return authors
    return authors.filter((author) => [
      author.email,
      localizedName(author, 'en'),
      localizedName(author, 'ru'),
      localizedName(author, 'kz'),
    ].some((value) => value.toLocaleLowerCase().includes(query)))
  }, [authors, search])

  const autofillCandidates = useMemo(() => authors.filter((author) =>
    (Boolean(author.first_name_kz?.trim()) && !author.first_name_ru?.trim())
    || (Boolean(author.patronymic_kz?.trim()) && !author.patronymic_ru?.trim())
    || (Boolean(author.last_name_kz?.trim()) && !author.last_name_ru?.trim())
  ), [authors])

  const autofillRussian = async () => {
    setMessage(null)
    if (autofillCandidates.length === 0) {
      setMessage({ kind: 'success', text: t.nothingToFill })
      return
    }
    if (!window.confirm(`${t.confirmAutofill}: ${autofillCandidates.length}?`)) return

    setAutofilling(true)
    let updated = 0
    let failed = 0
    for (const author of autofillCandidates) {
      const payload: Partial<Pick<Author, 'first_name_ru' | 'patronymic_ru' | 'last_name_ru'>> = {}
      if (!author.first_name_ru?.trim() && author.first_name_kz?.trim()) payload.first_name_ru = author.first_name_kz.trim()
      if (!author.patronymic_ru?.trim() && author.patronymic_kz?.trim()) payload.patronymic_ru = author.patronymic_kz.trim()
      if (!author.last_name_ru?.trim() && author.last_name_kz?.trim()) payload.last_name_ru = author.last_name_kz.trim()
      try {
        await api.updateAuthor<Author>(author.id, payload)
        updated += 1
      } catch {
        failed += 1
      }
    }
    await load()
    setAutofilling(false)
    setMessage({
      kind: failed ? 'error' : 'success',
      text: `${failed ? t.fillError : t.filled} ${updated}`,
    })
  }

  const nameCell = (author: Author, nameLanguage: Language) => {
    const value = localizedName(author, nameLanguage)
    return value
      ? <strong className="admin-authors__name">{value}</strong>
      : <span className="admin-authors__missing">{t.missing}</span>
  }

  return (
    <div className="page admin-authors">
      <section className="section-header admin-authors__header">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="page-title">{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="admin-authors__actions">
          <button type="button" className="button button--primary" onClick={() => void autofillRussian()} disabled={loading || autofilling || autofillCandidates.length === 0}>
            {autofilling ? t.autofilling : `${t.autofill} (${autofillCandidates.length})`}
          </button>
          <button type="button" className="button button--ghost" onClick={() => void load()} disabled={loading || autofilling}>
            {t.refresh}
          </button>
        </div>
      </section>

      {message ? <div className={`admin-authors__message admin-authors__message--${message.kind}`}>{message.text}</div> : null}

      <section className="panel admin-authors__panel">
        <div className="admin-authors__toolbar">
          <label className="admin-authors__search">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
          </label>
          <span className="admin-authors__count">{t.total}: <strong>{authors.length}</strong></span>
        </div>

        {error ? <div className="admin-authors__state admin-authors__state--error">{t.error}</div> : null}
        {!error && loading ? <div className="admin-authors__state">{t.loading}</div> : null}
        {!error && !loading && filteredAuthors.length === 0 ? <div className="admin-authors__state">{t.empty}</div> : null}

        {!error && !loading && filteredAuthors.length > 0 ? (
          <div className="admin-authors__table-wrap">
            <table className="admin-authors__table">
              <thead><tr><th>#</th><th>{t.latin}</th><th>{t.russian}</th><th>{t.kazakh}</th><th>{t.contacts}</th></tr></thead>
              <tbody>{filteredAuthors.map((author) => (
                <tr key={author.id}>
                  <td><span className="admin-authors__id">{author.id}</span></td>
                  <td>{nameCell(author, 'en')}</td>
                  <td>{nameCell(author, 'ru')}</td>
                  <td>{nameCell(author, 'kz')}</td>
                  <td><a href={`mailto:${author.email}`}>{author.email}</a></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
