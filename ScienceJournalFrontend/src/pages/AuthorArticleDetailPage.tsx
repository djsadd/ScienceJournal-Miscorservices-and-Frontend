import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { getArticleLanguageLabel } from '../shared/articleLanguages'
import { getCountryLabel, type CountryValue } from '../shared/countries'
import { formatArticleStatus, formatArticleType } from '../shared/labels'
import { toApiFilesUrl } from '../shared/url'

type Language = 'ru' | 'en' | 'kz'
type Tab = 'overview' | 'authors' | 'files' | 'versions'

interface Keyword {
  id: number
  title_ru?: string | null
  title_en?: string | null
  title_kz?: string | null
}

interface Author {
  id: number
  email: string
  first_name: string
  patronymic?: string | null
  last_name: string
  affiliation1?: string | null
  affiliation2?: string | null
  country?: CountryValue
  phone?: string | null
  address?: string | null
  orcid?: string | null
  scopus_author_id?: string | null
  researcher_id?: string | null
  is_corresponding: boolean
}

interface Version {
  id: number
  created_at: string
  updated_at?: string | null
}

interface Article {
  id: number
  title_ru?: string | null
  title_en?: string | null
  title_kz?: string | null
  abstract_ru?: string | null
  abstract_en?: string | null
  abstract_kz?: string | null
  article_language?: string | null
  article_type: string
  status: string
  doi?: string | null
  created_at: string
  updated_at?: string | null
  manuscript_file_url?: string | null
  antiplagiarism_file_url?: string | null
  author_info_file_url?: string | null
  cover_letter_file_url?: string | null
  not_published_elsewhere?: boolean
  plagiarism_free?: boolean
  authors_agree?: boolean
  generative_ai_info?: string | null
  keywords: Keyword[]
  authors: Author[]
  versions: Version[]
}

const editableStatuses = ['withdrawn', 'revisions', 'send_for_revision', 'sent_for_revision']

const copy = {
  ru: { back: 'Вернуться к моим статьям', edit: 'Редактировать', withdraw: 'Отозвать статью', overview: 'Обзор', authors: 'Авторы', files: 'Файлы', versions: 'Версии', content: 'Содержание', overviewTitle: 'Обзор рукописи', abstract: 'Аннотация', keywords: 'Ключевые слова', declarations: 'Заявления автора', unpublished: 'Не публиковалась ранее', plagiarism: 'Не содержит плагиата', consent: 'Все авторы согласны', ai: 'Использование генеративного ИИ', yes: 'Да', no: 'Нет', notSet: 'Не указано', participants: 'Участники', filesTitle: 'Файлы рукописи', versionsTitle: 'История версий', noFiles: 'Файлы не загружены', noVersions: 'Предыдущих версий нет', download: 'Открыть файл', submitted: 'Поступила', updated: 'Обновлена', language: 'Язык', confirm: 'Отозвать эту статью?', confirmText: 'Редакция приостановит рассмотрение рукописи. После отзыва её можно будет отредактировать.', cancel: 'Отмена', loading: 'Загрузка статьи…', error: 'Не удалось загрузить статью' },
  en: { back: 'Back to my articles', edit: 'Edit', withdraw: 'Withdraw article', overview: 'Overview', authors: 'Authors', files: 'Files', versions: 'Versions', content: 'Content', overviewTitle: 'Manuscript overview', abstract: 'Abstract', keywords: 'Keywords', declarations: 'Author declarations', unpublished: 'Not published elsewhere', plagiarism: 'Plagiarism free', consent: 'All authors agree', ai: 'Generative AI usage', yes: 'Yes', no: 'No', notSet: 'Not specified', participants: 'Contributors', filesTitle: 'Manuscript files', versionsTitle: 'Version history', noFiles: 'No files uploaded', noVersions: 'No previous versions', download: 'Open file', submitted: 'Submitted', updated: 'Updated', language: 'Language', confirm: 'Withdraw this article?', confirmText: 'The editorial review will be paused. You will be able to edit the manuscript after withdrawal.', cancel: 'Cancel', loading: 'Loading article…', error: 'Could not load article' },
  kz: { back: 'Менің мақалаларыма оралу', edit: 'Өңдеу', withdraw: 'Мақаланы қайтарып алу', overview: 'Шолу', authors: 'Авторлар', files: 'Файлдар', versions: 'Нұсқалар', content: 'Мазмұны', overviewTitle: 'Қолжазбаға шолу', abstract: 'Аңдатпа', keywords: 'Түйін сөздер', declarations: 'Автор мәлімдемелері', unpublished: 'Бұрын жарияланбаған', plagiarism: 'Плагиат жоқ', consent: 'Барлық авторлар келіседі', ai: 'Генеративті ЖИ қолдану', yes: 'Иә', no: 'Жоқ', notSet: 'Көрсетілмеген', participants: 'Қатысушылар', filesTitle: 'Қолжазба файлдары', versionsTitle: 'Нұсқалар тарихы', noFiles: 'Файлдар жүктелмеген', noVersions: 'Алдыңғы нұсқалар жоқ', download: 'Файлды ашу', submitted: 'Жіберілді', updated: 'Жаңартылды', language: 'Тіл', confirm: 'Мақаланы қайтарып алу керек пе?', confirmText: 'Редакциялық қарау тоқтатылады. Қайтарып алғаннан кейін қолжазбаны өңдеуге болады.', cancel: 'Бас тарту', loading: 'Мақала жүктелуде…', error: 'Мақаланы жүктеу мүмкін болмады' },
} as const

export default function AuthorArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [lang, setLang] = useState<Language>(() => {
    const value = new URLSearchParams(window.location.search).get('lang')
    return value === 'en' || value === 'kz' ? value : 'ru'
  })
  const t = copy[lang]

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<Article>(`/articles/my/${id}`)
      .then(setArticle)
      .catch(() => setError(t.error))
      .finally(() => setLoading(false))
  }, [id])

  const title = useMemo(() => article ? (lang === 'ru' ? article.title_ru : lang === 'en' ? article.title_en : article.title_kz) || article.title_ru || article.title_en || article.title_kz || `#${article.id}` : '', [article, lang])
  const abstract = article ? (lang === 'ru' ? article.abstract_ru : lang === 'en' ? article.abstract_en : article.abstract_kz) || article.abstract_ru || article.abstract_en || article.abstract_kz : ''
  const canEdit = Boolean(article && editableStatuses.includes(article.status))
  const canWithdraw = Boolean(article && !['published', 'withdrawn', 'draft'].includes(article.status))
  const date = (value?: string | null) => value ? new Date(value).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  const files = article ? [
    ['manuscript', lang === 'en' ? 'Manuscript' : lang === 'kz' ? 'Қолжазба' : 'Рукопись', article.manuscript_file_url],
    ['author', lang === 'en' ? 'Author information' : lang === 'kz' ? 'Авторлар туралы мәліметтер' : 'Сведения об авторах', article.author_info_file_url],
    ['cover', lang === 'en' ? 'Cover letter' : lang === 'kz' ? 'Ілеспе хат' : 'Сопроводительное письмо', article.cover_letter_file_url],
    ['antiplagiarism', lang === 'en' ? 'Similarity report' : lang === 'kz' ? 'Антиплагиат есебі' : 'Отчёт антиплагиата', article.antiplagiarism_file_url],
  ].filter((entry) => entry[2]) as string[][] : []

  const withdraw = async () => {
    if (!article) return
    setWithdrawing(true)
    try {
      const result = await api.post<{ status: string }>(`/articles/${article.id}/withdraw`)
      setArticle({ ...article, status: result.status })
      setShowWithdraw(false)
    } finally { setWithdrawing(false) }
  }

  if (loading || error || !article) return <div className="app-container app-container--wide manuscript-detail"><div className={`loading${error ? ' alert error' : ''}`}>{error || t.loading}</div></div>

  return <div className="app-container app-container--wide manuscript-detail author-article-detail">
    <section className="manuscript-detail__toolbar">
      <Link className="manuscript-detail__back" to="/cabinet"><span aria-hidden="true">←</span> {t.back}</Link>
      <div className="lang-switch editor-form-lang-switch" aria-label="Language">{(['ru', 'en', 'kz'] as const).map((item) => <button type="button" key={item} className={`lang-chip ${lang === item ? 'lang-chip--active' : ''}`} onClick={() => setLang(item)}>{item.toUpperCase()}</button>)}</div>
    </section>

    <section className="section manuscript-detail__sheet">
      <div className="panel manuscript-hero">
        <div className="manuscript-hero__badges"><span className="manuscript-hero__number">№ {String(article.id).padStart(6, '0')}</span><span className="manuscript-status">{formatArticleStatus(article.status, lang)}</span><span className="manuscript-type">{formatArticleType(article.article_type, lang)}</span></div>
        <div className="author-article-detail__hero-row"><div className="manuscript-hero__heading"><p className="eyebrow">{lang === 'en' ? 'My manuscript' : lang === 'kz' ? 'Менің қолжазбам' : 'Моя рукопись'}</p><h1>{title}</h1></div><div className="author-article-detail__actions">{canEdit && <Link className="button button--primary" to={`/cabinet/my-articles/${article.id}/edit`}>{t.edit}</Link>}{canWithdraw && <button className="button button--danger" type="button" onClick={() => setShowWithdraw(true)}>{t.withdraw}</button>}</div></div>
        <div className="manuscript-meta"><div><span>{t.language}</span><strong>{getArticleLanguageLabel(article.article_language, lang) || t.notSet}</strong></div><div><span>{t.submitted}</span><strong>{date(article.created_at)}</strong></div><div><span>{t.updated}</span><strong>{date(article.updated_at || article.created_at)}</strong></div><div><span>DOI</span><strong>{article.doi || t.notSet}</strong></div></div>
      </div>

      <nav className="manuscript-tabs" aria-label="Article sections"><button className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>{t.overview}</button><button className={activeTab === 'authors' ? 'is-active' : ''} onClick={() => setActiveTab('authors')}>{t.authors} · {article.authors.length}</button><button className={activeTab === 'files' ? 'is-active' : ''} onClick={() => setActiveTab('files')}>{t.files} · {files.length}</button><button className={activeTab === 'versions' ? 'is-active' : ''} onClick={() => setActiveTab('versions')}>{t.versions} · {article.versions.length}</button></nav>

      {activeTab === 'overview' && <div className="manuscript-overview"><div className="manuscript-module__header"><div><p className="eyebrow">{t.content}</p><h2>{t.overviewTitle}</h2></div></div><div className="manuscript-abstract"><h4>{t.abstract}</h4><p>{abstract || t.notSet}</p></div><div className="module-keywords"><h3>{t.keywords}</h3><div className="pill-list">{article.keywords.length ? article.keywords.map((keyword) => <span className="pill pill--ghost" key={keyword.id}>{(lang === 'ru' ? keyword.title_ru : lang === 'en' ? keyword.title_en : keyword.title_kz) || keyword.title_ru || keyword.title_en || keyword.title_kz}</span>) : t.notSet}</div></div><div className="author-article-detail__declarations"><h3>{t.declarations}</h3>{[[t.unpublished, article.not_published_elsewhere], [t.plagiarism, article.plagiarism_free], [t.consent, article.authors_agree]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value ? t.yes : t.no}</strong></div>)}<div><span>{t.ai}</span><strong>{article.generative_ai_info || t.notSet}</strong></div></div></div>}

      {activeTab === 'authors' && <div className="manuscript-module"><div className="manuscript-module__header"><div><p className="eyebrow">{t.participants}</p><h2>{t.authors}</h2></div></div><div className="author-cards">{article.authors.map((author) => <button className={`author-card author-article-detail__author${selectedAuthor?.id === author.id ? ' is-selected' : ''}`} type="button" key={author.id} onClick={() => setSelectedAuthor(selectedAuthor?.id === author.id ? null : author)}><span className="author-card__avatar">{author.first_name.charAt(0)}{author.last_name.charAt(0)}</span><span className="author-card__content"><strong>{author.last_name} {author.first_name} {author.patronymic || ''}</strong><small>{author.email}</small><small>{author.affiliation1 || t.notSet}</small></span>{author.is_corresponding && <span className="author-card__badge">{lang === 'en' ? 'Corresponding author' : lang === 'kz' ? 'Жауапты автор' : 'Контактный автор'}</span>}</button>)}</div>{selectedAuthor && <div className="author-inline-details"><div className="author-inline-details__header"><h3>{selectedAuthor.last_name} {selectedAuthor.first_name}</h3><button className="button button--ghost button--compact" onClick={() => setSelectedAuthor(null)}>×</button></div><dl className="author-inline-details__contacts"><div><dt>Email</dt><dd>{selectedAuthor.email}</dd></div><div><dt>{lang === 'en' ? 'Phone' : 'Телефон'}</dt><dd>{selectedAuthor.phone || '—'}</dd></div><div><dt>{lang === 'en' ? 'Country' : 'Страна'}</dt><dd>{getCountryLabel(selectedAuthor.country) || '—'}</dd></div><div><dt>ORCID</dt><dd>{selectedAuthor.orcid || '—'}</dd></div><div><dt>Scopus Author ID</dt><dd>{selectedAuthor.scopus_author_id || '—'}</dd></div><div><dt>ResearcherID</dt><dd>{selectedAuthor.researcher_id || '—'}</dd></div></dl></div>}</div>}

      {activeTab === 'files' && <div className="manuscript-module"><div className="manuscript-module__header"><div><p className="eyebrow">{t.files}</p><h2>{t.filesTitle}</h2></div></div>{files.length ? <div className="manuscript-file-grid">{files.map(([key, label, url]) => <div className="manuscript-file-slot" key={key}><div className="manuscript-file-slot__info"><span className="manuscript-file-slot__icon">PDF</span><div><strong>{label}</strong><small>{url.split('/').pop()}</small></div></div><a className="button button--ghost button--compact" href={toApiFilesUrl(url)} target="_blank" rel="noreferrer">{t.download}</a></div>)}</div> : <div className="module-empty">{t.noFiles}</div>}</div>}

      {activeTab === 'versions' && <div className="manuscript-module"><div className="manuscript-module__header"><div><p className="eyebrow">{t.versions}</p><h2>{t.versionsTitle}</h2></div></div>{article.versions.length ? <div className="version-list">{article.versions.map((version, index) => <div className="version-item" key={version.id}><span className="version-item__number">{String(article.versions.length - index).padStart(2, '0')}</span><div><strong>{lang === 'en' ? 'Article version' : lang === 'kz' ? 'Мақала нұсқасы' : 'Версия статьи'}</strong><small>{date(version.created_at)}</small></div></div>)}</div> : <div className="module-empty">{t.noVersions}</div>}</div>}
    </section>

    {showWithdraw && <div className="modal-backdrop" onClick={() => setShowWithdraw(false)}><div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="modal__header"><h3>{t.confirm}</h3><button className="modal__close" onClick={() => setShowWithdraw(false)}>×</button></div><div className="modal__body"><p>{t.confirmText}</p></div><div className="modal__footer"><button className="button button--ghost" onClick={() => setShowWithdraw(false)}>{t.cancel}</button><button className="button button--danger" disabled={withdrawing} onClick={withdraw}>{t.withdraw}</button></div></div></div>}
  </div>
}
