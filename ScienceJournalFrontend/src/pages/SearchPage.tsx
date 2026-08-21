import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'
import { formatArticleType } from '../shared/labels'
import type { Article, Volume } from '../shared/types'

type SearchArticle = Article & {
  volumeId?: number | string | null
  volumeNumber?: string | null
  volumeYear?: number | null
  volumeMonth?: number | null
}

type SearchFilters = {
  q: string
  title: string
  author: string
  keywords: string
  doi: string
  abstract: string
  year: string
  volume: string
  type: string
}

const defaultFilters: SearchFilters = {
  q: '',
  title: '',
  author: '',
  keywords: '',
  doi: '',
  abstract: '',
  year: '',
  volume: '',
  type: '',
}

const compact = (value?: string | null) => (value || '').trim()
const normalize = (value?: string | number | null) => String(value ?? '').toLowerCase().trim()
const includes = (haystack: string, needle: string) => !needle || haystack.includes(needle)

const pickLocalized = (lang: 'ru' | 'en' | 'kz', ru?: string | null, en?: string | null, kz?: string | null) => {
  const preferred = lang === 'ru' ? ru : lang === 'en' ? en : kz
  return compact(preferred) || compact(ru) || compact(en) || compact(kz)
}

const formatAuthorName = (author: any) =>
  [author?.last_name, author?.first_name, author?.patronymic]
    .map(compact)
    .filter(Boolean)
    .join(' ')

const getAuthorSearchText = (article: SearchArticle) =>
  Array.isArray(article.authors)
    ? article.authors
        .flatMap((author: any) => [
          formatAuthorName(author),
          author?.email,
          author?.affiliation1,
          author?.affiliation2,
          author?.affiliation3,
          author?.orcid,
          author?.scopus_author_id,
          author?.researcher_id,
        ])
        .map(normalize)
        .join(' ')
    : ''

const getKeywordSearchText = (article: SearchArticle) =>
  Array.isArray(article.keywords)
    ? article.keywords
        .flatMap((keyword: any) => [keyword?.title_ru, keyword?.title_en, keyword?.title_kz])
        .map(normalize)
        .join(' ')
    : ''

const getArticleSearchText = (article: SearchArticle) =>
  [
    article.title_ru,
    article.title_en,
    article.title_kz,
    article.abstract_ru,
    article.abstract_en,
    article.abstract_kz,
    article.doi,
    article.article_type,
    article.volumeNumber,
    article.volumeYear,
    article.volumeMonth,
    getAuthorSearchText(article),
    getKeywordSearchText(article),
  ]
    .map(normalize)
    .join(' ')

const getFiltersFromSearch = (search: string): SearchFilters => {
  const params = new URLSearchParams(search)
  return {
    q: params.get('q') || '',
    title: params.get('title') || '',
    author: params.get('author') || '',
    keywords: params.get('keywords') || '',
    doi: params.get('doi') || '',
    abstract: params.get('abstract') || '',
    year: params.get('year') || '',
    volume: params.get('volume') || '',
    type: params.get('type') || '',
  }
}

const buildSearch = (filters: SearchFilters) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    const trimmed = value.trim()
    if (trimmed) params.set(key, trimmed)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function SearchPage() {
  const { lang } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const localizedHref = (path: string) => (path === '/' ? `/${lang}` : `/${lang}${path}`)

  const t = {
    ru: {
      eyebrow: 'поиск',
      title: 'Найдите статьи и авторов',
      subtitle: 'Поиск работает по опубликованным статьям из активных выпусков журнала.',
      fields: {
        q: 'Общий поиск',
        title: 'Название',
        author: 'Автор',
        keywords: 'Ключевые слова',
        doi: 'DOI',
        abstract: 'Аннотация',
        year: 'Год',
        volume: 'Том',
        type: 'Тип статьи',
      },
      placeholders: {
        q: 'Тема, DOI, фамилия автора или ключевые слова',
        title: 'Слова из названия',
        author: 'Фамилия, имя, ORCID, организация',
        keywords: 'Экономика, управление...',
        doi: '10.xxxx/...',
        abstract: 'Текст из аннотации',
        year: '2025',
        volume: '1-2',
      },
      allTypes: 'Все типы',
      search: 'Искать',
      reset: 'Сбросить',
      loading: 'Загрузка...',
      error: 'Ошибка',
      found: (count: number) => `Найдено: ${count}`,
      noResults: 'Статьи не найдены. Измените запрос или очистите часть фильтров.',
      volume: 'Том',
      doi: 'DOI',
      authors: 'Авторы',
      keywords: 'Ключевые слова',
      open: 'Открыть статью',
      untitled: 'Без заголовка',
      unavailable: '—',
      loadError: 'Не удалось загрузить статьи',
    },
    en: {
      eyebrow: 'search',
      title: 'Find articles and authors',
      subtitle: 'Search runs across published articles from active journal issues.',
      fields: {
        q: 'All fields',
        title: 'Title',
        author: 'Author',
        keywords: 'Keywords',
        doi: 'DOI',
        abstract: 'Abstract',
        year: 'Year',
        volume: 'Volume',
        type: 'Article type',
      },
      placeholders: {
        q: 'Topic, DOI, author surname, or keywords',
        title: 'Words from the title',
        author: 'Name, ORCID, affiliation',
        keywords: 'Economics, management...',
        doi: '10.xxxx/...',
        abstract: 'Text from abstract',
        year: '2025',
        volume: '1-2',
      },
      allTypes: 'All types',
      search: 'Search',
      reset: 'Reset',
      loading: 'Loading...',
      error: 'Error',
      found: (count: number) => `Found: ${count}`,
      noResults: 'No articles found. Change the query or clear some filters.',
      volume: 'Volume',
      doi: 'DOI',
      authors: 'Authors',
      keywords: 'Keywords',
      open: 'Open article',
      untitled: 'Untitled',
      unavailable: '-',
      loadError: 'Failed to load articles',
    },
    kz: {
      eyebrow: 'іздеу',
      title: 'Мақалалар мен авторларды табыңыз',
      subtitle: 'Іздеу журналдың белсенді шығарылымдарындағы жарияланған мақалалар бойынша орындалады.',
      fields: {
        q: 'Жалпы іздеу',
        title: 'Атауы',
        author: 'Автор',
        keywords: 'Кілт сөздер',
        doi: 'DOI',
        abstract: 'Аннотация',
        year: 'Жыл',
        volume: 'Том',
        type: 'Мақала түрі',
      },
      placeholders: {
        q: 'Тақырып, DOI, автор тегі немесе кілт сөздер',
        title: 'Атауындағы сөздер',
        author: 'Аты-жөні, ORCID, ұйым',
        keywords: 'Экономика, басқару...',
        doi: '10.xxxx/...',
        abstract: 'Аннотация мәтіні',
        year: '2025',
        volume: '1-2',
      },
      allTypes: 'Барлық түрлер',
      search: 'Іздеу',
      reset: 'Тазарту',
      loading: 'Жүктелуде...',
      error: 'Қате',
      found: (count: number) => `Табылды: ${count}`,
      noResults: 'Мақалалар табылмады. Сұранысты өзгертіңіз немесе кейбір сүзгілерді тазалаңыз.',
      volume: 'Том',
      doi: 'DOI',
      authors: 'Авторлар',
      keywords: 'Кілт сөздер',
      open: 'Мақаланы ашу',
      untitled: 'Атаусыз',
      unavailable: '—',
      loadError: 'Мақалаларды жүктеу сәтсіз аяқталды',
    },
  }[lang]

  const [filters, setFilters] = useState<SearchFilters>(() => getFiltersFromSearch(location.search))
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFilters(getFiltersFromSearch(location.search))
  }, [location.search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.getPublicVolumes<Volume[]>()
      .then((data) => {
        if (!cancelled) setVolumes(Array.isArray(data) ? data : [])
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.bodyJson?.detail || e?.message || t.loadError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const articles = useMemo<SearchArticle[]>(() => {
    const rows: SearchArticle[] = []
    volumes.forEach((volume) => {
      const items = Array.isArray(volume.articles) ? volume.articles : []
      items.forEach((article) => {
        if (!article || article.status !== 'published') return
        rows.push({
          ...article,
          volumeId: volume.id ?? null,
          volumeNumber: volume.number ?? null,
          volumeYear: volume.year ?? null,
          volumeMonth: volume.month ?? null,
        })
      })
    })
    return rows
  }, [volumes])

  const results = useMemo(() => {
    const q = normalize(filters.q)
    const title = normalize(filters.title)
    const author = normalize(filters.author)
    const keywords = normalize(filters.keywords)
    const doi = normalize(filters.doi)
    const abstract = normalize(filters.abstract)
    const year = normalize(filters.year)
    const volume = normalize(filters.volume)
    const type = normalize(filters.type)

    return articles.filter((article) => {
      const allText = getArticleSearchText(article)
      const titleText = normalize([article.title_ru, article.title_en, article.title_kz].filter(Boolean).join(' '))
      const authorText = getAuthorSearchText(article)
      const keywordText = getKeywordSearchText(article)
      const abstractText = normalize([article.abstract_ru, article.abstract_en, article.abstract_kz].filter(Boolean).join(' '))
      const volumeText = normalize([article.volumeNumber, article.volumeYear, article.volumeMonth].filter(Boolean).join(' '))

      return (
        includes(allText, q) &&
        includes(titleText, title) &&
        includes(authorText, author) &&
        includes(keywordText, keywords) &&
        includes(normalize(article.doi), doi) &&
        includes(abstractText, abstract) &&
        includes(normalize(article.volumeYear), year) &&
        includes(volumeText, volume) &&
        (!type || article.article_type === type)
      )
    })
  }, [articles, filters])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    navigate(`${location.pathname}${buildSearch(filters)}`, { replace: false })
  }

  const resetSearch = () => {
    setFilters(defaultFilters)
    navigate(location.pathname, { replace: false })
  }

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="public-container">
      <div className="section public-section search-page">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>

        <form className="search-page__form" onSubmit={submitSearch}>
          <div className="search-page__main-row">
            <label className="form-label">
              {t.fields.q}
              <input
                className="search"
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder={t.placeholders.q}
              />
            </label>
            <button className="button button--primary" type="submit">{t.search}</button>
          </div>

          <div className="search-page__filters">
            <label className="form-label">
              {t.fields.title}
              <input className="text-input" value={filters.title} onChange={(event) => updateFilter('title', event.target.value)} placeholder={t.placeholders.title} />
            </label>
            <label className="form-label">
              {t.fields.author}
              <input className="text-input" value={filters.author} onChange={(event) => updateFilter('author', event.target.value)} placeholder={t.placeholders.author} />
            </label>
            <label className="form-label">
              {t.fields.keywords}
              <input className="text-input" value={filters.keywords} onChange={(event) => updateFilter('keywords', event.target.value)} placeholder={t.placeholders.keywords} />
            </label>
            <label className="form-label">
              {t.fields.doi}
              <input className="text-input" value={filters.doi} onChange={(event) => updateFilter('doi', event.target.value)} placeholder={t.placeholders.doi} />
            </label>
            <label className="form-label">
              {t.fields.abstract}
              <input className="text-input" value={filters.abstract} onChange={(event) => updateFilter('abstract', event.target.value)} placeholder={t.placeholders.abstract} />
            </label>
            <label className="form-label">
              {t.fields.year}
              <input className="text-input" value={filters.year} onChange={(event) => updateFilter('year', event.target.value)} placeholder={t.placeholders.year} inputMode="numeric" />
            </label>
            <label className="form-label">
              {t.fields.volume}
              <input className="text-input" value={filters.volume} onChange={(event) => updateFilter('volume', event.target.value)} placeholder={t.placeholders.volume} />
            </label>
            <label className="form-label">
              {t.fields.type}
              <select className="text-input" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
                <option value="">{t.allTypes}</option>
                <option value="original">{formatArticleType('original', lang)}</option>
                <option value="review">{formatArticleType('review', lang)}</option>
              </select>
            </label>
          </div>

          <div className="search-page__actions">
            <span className="meta-label">{t.found(results.length)}</span>
            <button className="button button--ghost" type="button" onClick={resetSearch}>{t.reset}</button>
          </div>
        </form>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}

        {!loading && !error && (
          <div className="search-page__results">
            {results.length === 0 ? (
              <div className="table__empty">{t.noResults}</div>
            ) : (
              results.map((article) => {
                const title = pickLocalized(lang, article.title_ru, article.title_en, article.title_kz) || t.untitled
                const abstract = pickLocalized(lang, article.abstract_ru, article.abstract_en, article.abstract_kz)
                const authors = Array.isArray(article.authors) ? article.authors.map(formatAuthorName).filter(Boolean) : []
                const keywords = Array.isArray(article.keywords)
                  ? article.keywords
                      .map((keyword: any) => pickLocalized(lang, keyword?.title_ru, keyword?.title_en, keyword?.title_kz))
                      .filter(Boolean)
                  : []
                const detailHref = article.volumeId
                  ? localizedHref(`/archive/volumes/${article.volumeId}/articles/${String((article as any).id)}`)
                  : localizedHref('/archive')

                return (
                  <article className="panel search-result" key={`${String(article.volumeId)}-${String((article as any).id)}`}>
                    <div className="search-result__body">
                      <div>
                        <h2 className="search-result__title">
                          <Link to={detailHref}>{title}</Link>
                        </h2>
                        <div className="search-result__meta">
                          <span>{t.volume}: {article.volumeNumber || t.unavailable} / {article.volumeYear || t.unavailable}</span>
                          <span>{formatArticleType(String(article.article_type || ''), lang)}</span>
                          <span>{t.doi}: {article.doi || t.unavailable}</span>
                        </div>
                      </div>
                      <Link className="button button--ghost button--compact" to={detailHref}>{t.open}</Link>
                    </div>

                    {authors.length ? (
                      <div className="search-result__line">
                        <span className="meta-label">{t.authors}:</span>
                        <span>{authors.join(', ')}</span>
                      </div>
                    ) : null}

                    {keywords.length ? (
                      <div className="search-result__line">
                        <span className="meta-label">{t.keywords}:</span>
                        <span>{keywords.join(', ')}</span>
                      </div>
                    ) : null}

                    {abstract ? <p className="article-abstract search-result__abstract">{abstract}</p> : null}
                  </article>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
