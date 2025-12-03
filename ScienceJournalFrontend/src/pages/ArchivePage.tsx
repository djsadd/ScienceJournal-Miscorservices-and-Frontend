import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../shared/LanguageContext'
import { api } from '../api/client'
import type { Volume as ApiVolume } from '../shared/types'

type ArchiveYear = { year: number; volumes: ApiVolume[] }

export function ArchivePage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'архив номеров',
      title: 'Раскрывающийся список томов по годам',
      registry: {
        certTitle: 'Свидетельство о регистрации',
        certText: '№ 17458-Ж, дата 14.01.2019.',
        issnTitle: 'ISSN',
        issnText: '2663-631X — международный номер печатного издания.',
        freqTitle: 'Периодичность',
        freqText: '4 раза в год. Языки: русский, казахский, английский.',
      },
      loading: 'Загрузка...',
      error: 'Ошибка',
      year: 'Год',
      issuesCount: (n: number) => `${n} выпуск(а)`,
      volumesOfYear: (y: number) => `Тома ${y}`,
      volumeTitle: (n: number, m?: number | null) => `Том ${n}${m ? ` (${m} мес.)` : ''}`,
    },
    en: {
      eyebrow: 'archive of issues',
      title: 'Expandable list of volumes by year',
      registry: {
        certTitle: 'Registration certificate',
        certText: 'No. 17458-Ж, dated 14.01.2019.',
        issnTitle: 'ISSN',
        issnText: '2663-631X — international print ISSN.',
        freqTitle: 'Frequency',
        freqText: '4 issues per year. Languages: Kazakh, Russian, English.',
      },
      loading: 'Loading...',
      error: 'Error',
      year: 'Year',
      issuesCount: (n: number) => `${n} issue(s)`,
      volumesOfYear: (y: number) => `Volumes of ${y}`,
      volumeTitle: (n: number, m?: number | null) => `Volume ${n}${m ? ` (${m} mo.)` : ''}`,
    },
    kz: {
      eyebrow: 'шығарылымдар мұрағаты',
      title: 'Жылдар бойынша томдар тізімі',
      registry: {
        certTitle: 'Тіркеу куәлігі',
        certText: '№ 17458-Ж, 14.01.2019.',
        issnTitle: 'ISSN',
        issnText: '2663-631X — баспа нұсқасының халықаралық нөмірі.',
        freqTitle: 'Мерзімділік',
        freqText: 'Жылына 4 шығарылым. Тілдер: қазақ, орыс, ағылшын.',
      },
      loading: 'Жүктелуде...',
      error: 'Қате',
      year: 'Жыл',
      issuesCount: (n: number) => `${n} шығарылым`,
      volumesOfYear: (y: number) => `${y} жылғы томдар`,
      volumeTitle: (n: number, m?: number | null) => `Том ${n}${m ? ` (${m} ай)` : ''}`,
    },
  }[lang]
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})
  const [volumes, setVolumes] = useState<ApiVolume[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getPublicVolumes<ApiVolume[]>()
      .then((data) => {
        setVolumes(data)
        const years = Array.from(new Set((data || []).map((v) => v.year))).sort((a, b) => b - a)
        if (years[0]) setOpenYears({ [years[0]]: true })
      })
      .catch((e: any) => setError(e?.message || 'Не удалось загрузить архив томов'))
      .finally(() => setLoading(false))
  }, [])

  const archives: ArchiveYear[] = useMemo(() => {
    if (!volumes) return []
    const byYear: Record<number, ApiVolume[]> = {}
    volumes.forEach((v: ApiVolume) => {
      if (!byYear[v.year]) byYear[v.year] = []
      byYear[v.year].push(v)
    })
    return Object.entries(byYear)
      .map(([year, vols]) => ({ year: Number(year), volumes: vols.sort((a, b) => (b.number - a.number)) }))
      .sort((a, b) => b.year - a.year)
  }, [volumes])

  const toggleYear = (year: number) => {
    setOpenYears((prev: Record<number, boolean>) => ({ ...prev, [year]: !prev[year] }))
  }

  return (
    <div className="public-container">
      <div className="section public-section">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero__title">{t.title}</h1>
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <div className="grid grid-3">
            <div>
              <div className="panel-title">{t.registry.certTitle}</div>
              <p className="subtitle">{t.registry.certText}</p>
            </div>
            <div>
              <div className="panel-title">{t.registry.issnTitle}</div>
              <p className="subtitle">{t.registry.issnText}</p>
            </div>
            <div>
              <div className="panel-title">{t.registry.freqTitle}</div>
              <p className="subtitle">{t.registry.freqText}</p>
            </div>
          </div>
        </div>

        {loading && <div className="loading">{t.loading}</div>}
        {error && <div className="alert error">{t.error}: {error}</div>}
        {!loading && !error && (
          <div className="accordion">
            {archives.map((group) => {
              const isOpen = Boolean(openYears[group.year])
              return (
                <div className={`accordion-item ${isOpen ? 'accordion-item--open' : ''}`} key={group.year}>
                  <button className="accordion-header" onClick={() => toggleYear(group.year)} aria-expanded={isOpen}>
                    <div className="accordion-title">
                      <span className="panel-title">{t.year} {group.year}</span>
                      <span className="subtitle">{t.issuesCount(group.volumes.length)}</span>
                    </div>
                    <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen ? (
                    <div className="accordion-body">
                      <div className="volume-chip">{t.volumesOfYear(group.year)}</div>
                      <ul className="volume-list">
                        {group.volumes.map((v) => (
                          <li key={String(v.id ?? `${v.year}-${v.number}-${v.month ?? 'm'}`)} className="volume-item">
                            <a href={v.id != null ? `/archive/volumes/${v.id}` : '#'} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <div>
                                <div className="volume-title">{t.volumeTitle(v.number, v.month)}</div>
                                <div className="subtitle">{v.description || v.title_ru || v.title_en || v.title_kz || '—'}</div>
                              </div>
                              <div className="meta-label">{v.year}</div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
