import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Tab = 'traffic' | 'articles' | 'volumes'
type Dashboard = {
  period_days: number; date_from: string; date_to: string
  summary: { page_views: number; views: number; unique_visitors: number; reads: number; downloads: number; read_rate: number }
  trend: { date: string; views: number; page_views: number; reads: number; downloads: number }[]
  top_articles: { article_id: number; title: string; views: number; reads: number; downloads: number; unique_visitors: number; read_rate: number }[]
  top_volumes: { volume_id: number; views: number; reads: number; downloads: number; unique_visitors: number }[]
  top_pages: { path: string; views: number; unique_visitors: number }[]
}
const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days + 1); return d.toISOString().slice(0, 10) }
const empty: Dashboard = { period_days: 30, date_from: daysAgo(30), date_to: today(), summary: { page_views: 0, views: 0, unique_visitors: 0, reads: 0, downloads: 0, read_rate: 0 }, trend: [], top_articles: [], top_volumes: [], top_pages: [] }

export default function AdminAnalyticsPage() {
  const { lang } = useLanguage()
  const [tab, setTab] = useState<Tab>('traffic')
  const [range, setRange] = useState({ from: daysAgo(30), to: today() })
  const [appliedRange, setAppliedRange] = useState(range)
  const [data, setData] = useState<Dashboard>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const t = {
    ru: { title: 'Аналитика', subtitle: 'Полная картина аудитории и востребованности публикаций', traffic: 'Посещаемость ресурса', articles: 'Аналитика статей', volumes: 'Аналитика журналов', apply: 'Применить', views: 'Просмотры статей', pageViews: 'Посещения страниц', visitors: 'Уникальные посетители', reads: 'Дочитывания', downloads: 'Загрузки PDF', rate: 'Доля дочитываний', dynamics: 'Динамика просмотров', popularArticles: 'Самые читаемые статьи', popularVolumes: 'Популярные выпуски', popularPages: 'Популярные страницы', name: 'Название', issue: 'Выпуск', page: 'Страница', noData: 'За выбранный период данных пока нет', failed: 'Не удалось загрузить аналитику', from: 'С', to: 'По' },
    en: { title: 'Analytics', subtitle: 'A complete view of your audience and publication demand', traffic: 'Website traffic', articles: 'Article analytics', volumes: 'Journal analytics', apply: 'Apply', views: 'Article views', pageViews: 'Page views', visitors: 'Unique visitors', reads: 'Completed reads', downloads: 'PDF downloads', rate: 'Read-through rate', dynamics: 'View trend', popularArticles: 'Most-read articles', popularVolumes: 'Popular issues', popularPages: 'Popular pages', name: 'Title', issue: 'Issue', page: 'Page', noData: 'No data for the selected period', failed: 'Failed to load analytics', from: 'From', to: 'To' },
    kz: { title: 'Аналитика', subtitle: 'Аудитория мен жарияланымдарға сұраныстың толық көрінісі', traffic: 'Ресурсқа кіру', articles: 'Мақалалар аналитикасы', volumes: 'Журналдар аналитикасы', apply: 'Қолдану', views: 'Мақала қаралымдары', pageViews: 'Бет қаралымдары', visitors: 'Бірегей келушілер', reads: 'Толық оқылымдар', downloads: 'PDF жүктеулері', rate: 'Оқып шығу үлесі', dynamics: 'Қаралым динамикасы', popularArticles: 'Ең көп оқылған мақалалар', popularVolumes: 'Танымал шығарылымдар', popularPages: 'Танымал беттер', name: 'Атауы', issue: 'Шығарылым', page: 'Бет', noData: 'Таңдалған кезеңде дерек жоқ', failed: 'Аналитиканы жүктеу мүмкін болмады', from: 'Бастап', to: 'Дейін' },
  }[lang]

  useEffect(() => {
    let active = true; setLoading(true); setError('')
    api.getAnalyticsDashboard<Dashboard>({ date_from: appliedRange.from, date_to: appliedRange.to, limit: 20 })
      .then((value) => { if (active) setData(value) })
      .catch((e) => { if (active) setError(e?.bodyJson?.detail || t.failed) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [appliedRange, t.failed])

  const chartValue = (item: Dashboard['trend'][number]) => tab === 'traffic' ? item.page_views : item.views
  const max = useMemo(() => Math.max(1, ...data.trend.map(chartValue)), [data.trend, tab])
  const quickRange = (days: number) => { const next = { from: daysAgo(days), to: today() }; setRange(next); setAppliedRange(next) }
  const tabs: { key: Tab; label: string }[] = [{ key: 'traffic', label: t.traffic }, { key: 'articles', label: t.articles }, { key: 'volumes', label: t.volumes }]
  const cards = tab === 'traffic'
    ? [[t.pageViews, data.summary.page_views], [t.visitors, data.summary.unique_visitors], [t.views, data.summary.views]]
    : tab === 'articles'
      ? [[t.views, data.summary.views], [t.reads, data.summary.reads], [t.downloads, data.summary.downloads], [t.rate, `${data.summary.read_rate}%`]]
      : [[t.views, data.summary.views], [t.visitors, data.summary.unique_visitors], [t.downloads, data.summary.downloads]]

  return <div className="analytics-page">
    <header className="analytics-hero"><div><span className="analytics-hero__icon" aria-hidden="true">↗</span><p className="eyebrow">ADMIN / INSIGHTS</p><h1>{t.title}</h1><p>{t.subtitle}</p></div></header>
    <nav className="analytics-tabs" aria-label={t.title}>{tabs.map((item) => <button key={item.key} className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
    <section className="analytics-filter panel">
      <div className="analytics-quick-periods">{[7, 30, 90, 365].map((days) => <button key={days} onClick={() => quickRange(days)}>{days === 365 ? '1 год' : `${days} дней`}</button>)}</div>
      <label><span>{t.from}</span><input type="date" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
      <label><span>{t.to}</span><input type="date" value={range.to} min={range.from} max={today()} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
      <button className="button button--primary" disabled={!range.from || !range.to || range.from > range.to} onClick={() => setAppliedRange(range)}>{t.apply}</button>
    </section>
    {error && <div className="alert error">{error}</div>}
    {loading ? <div className="loading">Loading...</div> : <>
      <section className="analytics-cards">{cards.map(([label, value]) => <div className="analytics-card" key={label}><span>{label}</span><strong>{value}</strong><small>{data.date_from} — {data.date_to}</small></div>)}</section>
      <section className="panel analytics-panel"><div className="analytics-panel__heading"><h2>{t.dynamics}</h2><span>{data.period_days} d</span></div><div className="analytics-chart">{data.trend.map((point) => <div className="analytics-bar-wrap" key={point.date} title={`${point.date}: ${chartValue(point)}`}><div className="analytics-bar" style={{ height: `${Math.max(2, chartValue(point) / max * 100)}%` }} /><small>{point.date.slice(5)}</small></div>)}</div></section>
      {tab === 'traffic' && <MetricTable title={t.popularPages} empty={t.noData} headers={[t.page, t.pageViews, t.visitors]} rows={data.top_pages.map((x) => [x.path, x.views, x.unique_visitors])} />}
      {tab === 'articles' && <MetricTable title={t.popularArticles} empty={t.noData} headers={[t.name, t.views, t.visitors, t.reads, t.rate, t.downloads]} rows={data.top_articles.map((x) => [`${x.title} · #${x.article_id}`, x.views, x.unique_visitors, x.reads, `${x.read_rate}%`, x.downloads])} />}
      {tab === 'volumes' && <MetricTable title={t.popularVolumes} empty={t.noData} headers={[t.issue, t.views, t.visitors, t.reads, t.downloads]} rows={data.top_volumes.map((x) => [`№ ${x.volume_id}`, x.views, x.unique_visitors, x.reads, x.downloads])} />}
    </>}
  </div>
}

function MetricTable({ title, empty, headers, rows }: { title: string; empty: string; headers: string[]; rows: (string | number)[][] }) {
  return <section className="panel analytics-panel"><h2>{title}</h2>{rows.length === 0 ? <div className="table__empty">{empty}</div> : <div className="analytics-table-wrap"><table className="analytics-table"><thead><tr>{headers.map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row[0]) + index}>{row.map((cell, i) => <td key={i}>{i === 0 ? <strong>{cell}</strong> : cell}</td>)}</tr>)}</tbody></table></div>}</section>
}
