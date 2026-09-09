import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../shared/LanguageContext'
import { api } from '../api/client'
import type { Volume as ApiVolume } from '../shared/types'

type ArchiveYear = { year: number; volumes: ApiVolume[] }

export function ArchivePage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      title: 'Архив выпусков',
      summary: 'Архив научных статей журнала · ISSN 2958-8103',
      search: 'Поиск по названию или автору…',
      all: 'Все',
      expand: 'Развернуть всё',
      collapse: 'Свернуть',
      loading: 'Загрузка...',
      error: 'Ошибка',
      issueCount: (n: number) => `${n} выпуск${n === 1 ? '' : 'а'}`,
      articleCount: (n: number) => `${n} ст.`,
      pages: 'С.',
      pdf: 'PDF',
      loadError: 'Не удалось загрузить архив томов',
    },
    en: {
      title: 'Issue archive',
      summary: 'Scientific journal archive · ISSN 2958-8103',
      search: 'Search by title or author…',
      all: 'All',
      expand: 'Expand all',
      collapse: 'Collapse',
      loading: 'Loading...',
      error: 'Error',
      issueCount: (n: number) => `${n} issue${n === 1 ? '' : 's'}`,
      articleCount: (n: number) => `${n} art.`,
      pages: 'P.',
      pdf: 'PDF',
      loadError: 'Failed to load archive',
    },
    kz: {
      title: 'Шығарылымдар мұрағаты',
      summary: 'Ғылыми журнал мұрағаты · ISSN 2958-8103',
      search: 'Атауы немесе авторы бойынша іздеу…',
      all: 'Барлығы',
      expand: 'Барлығын ашу',
      collapse: 'Жабу',
      loading: 'Жүктелуде...',
      error: 'Қате',
      issueCount: (n: number) => `${n} шығарылым`,
      articleCount: (n: number) => `${n} мақ.`,
      pages: 'Б.',
      pdf: 'PDF',
      loadError: 'Том мұрағатын жүктеу сәтсіз аяқталды',
    },
  }[lang]

  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const [volumes, setVolumes] = useState<ApiVolume[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getPublicVolumes<ApiVolume[]>()
      .then((data) => {
        setVolumes(data)
        const years = Array.from(new Set((data || []).map((v) => v.year))).sort((a, b) => b - a)
        if (years[0]) setOpenYears({ [years[0]]: true })
        const firstVolume = (data || []).find((volume) => volume.year === years[0])
        if (firstVolume) setOpenMonths({ [`${firstVolume.year}-${firstVolume.month || 0}`]: true })
      })
      .catch((e: any) => setError(e?.message || t.loadError))
      .finally(() => setLoading(false))
  }, [])

  const archives: ArchiveYear[] = useMemo(() => {
    if (!volumes) return []
    const byYear: Record<number, ApiVolume[]> = {}
    const normalizedQuery = query.trim().toLocaleLowerCase()
    volumes.forEach((v: ApiVolume) => {
      const searchable = [v.title_ru, v.title_en, v.title_kz, v.description, ...(v.articles || []).flatMap((article) => [article.title, article.title_ru, article.title_en, article.title_kz, ...(article.authors || []).map((author: any) => typeof author === 'string' ? author : `${author.first_name || ''} ${author.last_name || ''}`)])]
        .filter(Boolean).join(' ').toLocaleLowerCase()
      if (normalizedQuery && !searchable.includes(normalizedQuery)) return
      if (selectedYear && v.year !== selectedYear) return
      if (!byYear[v.year]) byYear[v.year] = []
      byYear[v.year].push(v)
    })
    return Object.entries(byYear)
      .map(([year, vols]) => ({ year: Number(year), volumes: vols.sort((a, b) => b.number.localeCompare(a.number)) }))
      .sort((a, b) => b.year - a.year)
  }, [volumes, query, selectedYear])

  const years = useMemo(() => Array.from(new Set((volumes || []).map((volume) => volume.year))).sort((a, b) => b - a), [volumes])
  const monthNames = lang === 'en'
    ? ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : lang === 'kz'
      ? ['', 'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
      : ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

  const articleTitle = (article: NonNullable<ApiVolume['articles']>[number]) => article[`title_${lang}`] || article.title || 'Без названия'
  const articleAuthors = (article: NonNullable<ApiVolume['articles']>[number]) => (article.authors || []).map((author: any) => typeof author === 'string' ? author : [author.first_name, author.patronymic, author.last_name].filter(Boolean).join(' ')).filter(Boolean).join(', ')

  const toggleYear = (year: number) => {
    setOpenYears((prev: Record<number, boolean>) => ({ ...prev, [year]: !prev[year] }))
  }

  const toggleMonth = (year: number, month: number | null | undefined) => {
    const key = `${year}-${month || 0}`
    setOpenMonths((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleAllYears = () => {
    const shouldOpen = years.some((year) => !openYears[year])
    setOpenYears(Object.fromEntries(years.map((year) => [year, shouldOpen])))
    if (shouldOpen) {
      setOpenMonths(Object.fromEntries((volumes || []).map((volume) => [`${volume.year}-${volume.month || 0}`, true])))
    }
  }

  return (
    <div className="archive-page">
      <div className="archive-shell">
        <header className="archive-heading">
          <h1>{t.title}</h1>
          <p>{t.summary}</p>
        </header>
        <div className="archive-toolbar">
          <label className="archive-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></label>
          <div className="archive-years-filter">
            <button className={selectedYear === null ? 'is-active' : ''} onClick={() => setSelectedYear(null)} type="button">{t.all}</button>
            {years.map((year) => <button className={selectedYear === year ? 'is-active' : ''} key={year} onClick={() => setSelectedYear(year)} type="button">{year}</button>)}
          </div>
          <div className="archive-actions"><button type="button" onClick={toggleAllYears}>{years.some((year) => !openYears[year]) ? t.expand : t.collapse}</button></div>
        </div>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}
        {!loading && !error && (
          <div className="archive-groups">
            {archives.map((group) => {
              const isOpen = Boolean(openYears[group.year])
              return (
                <section className={`archive-year ${isOpen ? 'is-open' : ''}`} key={group.year}>
                  <button className="archive-year__header" onClick={() => toggleYear(group.year)} aria-expanded={isOpen} type="button">
                    <span className="archive-year__name">{group.year}</span>
                    <span className="archive-year__count">{t.issueCount(group.volumes.length)} · {t.articleCount(group.volumes.reduce((sum, volume) => sum + (volume.articles?.length || 0), 0))}</span>
                    <span className="archive-year__chevron" aria-hidden="true">⌃</span>
                  </button>
                  {isOpen ? (
                    <div className="archive-year__body">
                      {Array.from(new Set(group.volumes.map((volume) => volume.month || 0))).sort((a, b) => b - a).map((month) => {
                        const monthKey = `${group.year}-${month}`
                        const monthVolumes = group.volumes.filter((volume) => (volume.month || 0) === month)
                        const monthOpen = Boolean(openMonths[monthKey])
                        return (
                          <section className={`archive-month ${monthOpen ? 'is-open' : ''}`} key={monthKey}>
                            <button className="archive-month__header" onClick={() => toggleMonth(group.year, month)} aria-expanded={monthOpen} type="button">
                              <span className="archive-month__name">{month ? monthNames[month] : 'Без месяца'}</span>
                              <span className="archive-month__count">{t.issueCount(monthVolumes.length)} · {t.articleCount(monthVolumes.reduce((sum, volume) => sum + (volume.articles?.length || 0), 0))}</span>
                              <span className="archive-month__chevron" aria-hidden="true">⌃</span>
                            </button>
                            {monthOpen && <div className="archive-month__body">
                              {monthVolumes.map((v) => (
                                <article className="archive-issue" key={String(v.id ?? `${v.year}-${v.number}-${v.month ?? 'm'}`)}>
                                  <a className="archive-issue__header" href={v.id != null ? `/archive/volumes/${v.id}` : '#'}><span className="archive-issue__label">Т. {v.number} № {v.number}</span><span className="archive-issue__date">{v.month ? monthNames[v.month] : ''} {v.year}</span><span className="archive-issue__count">{t.articleCount(v.articles?.length || 0)}</span></a>
                                  {v.articles?.length ? <ol className="archive-articles">
                                    {v.articles.map((article, index) => <li className="archive-article" key={article.id}>
                                      <span className="archive-article__number">{index + 1}</span>
                                      <div className="archive-article__content"><a href={`/archive/volumes/${v.id}/articles/${article.id}`} className="archive-article__title">{articleTitle(article)}</a><p className="archive-article__authors">{articleAuthors(article) || '—'}</p><p className="archive-article__meta">{t.pages} {article.abstract ? '1–' : '—'} &nbsp;·&nbsp; DOI: {article.doi || '—'}</p></div>
                                      {article.layout_file_url && <a className="archive-pdf" href={article.layout_file_url} target="_blank" rel="noreferrer">▱ {t.pdf}</a>}
                                    </li>)}
                                  </ol> : null}
                                </article>
                              ))}
                            </div>}
                          </section>
                        )
                      })}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

