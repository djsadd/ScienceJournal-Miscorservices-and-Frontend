import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Volume as ApiVolume } from '../shared/types'

type ArchiveYear = { year: number; volumes: ApiVolume[] }

export function ArchivePage() {
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
        <p className="eyebrow">архив номеров</p>
        <h1 className="hero__title">Раскрывающийся список томов по годам</h1>
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <div className="grid grid-3">
            <div>
              <div className="panel-title">Свидетельство о регистрации</div>
              <p className="subtitle">№ 17458-Ж, дата 14.01.2019.</p>
            </div>
            <div>
              <div className="panel-title">ISSN</div>
              <p className="subtitle">2663-631X — международный номер печатного издания.</p>
            </div>
            <div>
              <div className="panel-title">Периодичность</div>
              <p className="subtitle">4 раза в год. Языки: русский, казахский, английский.</p>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="alert error">Ошибка: {error}</div>}
        {!loading && !error && (
          <div className="accordion">
            {archives.map((group) => {
              const isOpen = Boolean(openYears[group.year])
              return (
                <div className={`accordion-item ${isOpen ? 'accordion-item--open' : ''}`} key={group.year}>
                  <button className="accordion-header" onClick={() => toggleYear(group.year)} aria-expanded={isOpen}>
                    <div className="accordion-title">
                      <span className="panel-title">Год {group.year}</span>
                      <span className="subtitle">{group.volumes.length} выпуск(а)</span>
                    </div>
                    <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen ? (
                    <div className="accordion-body">
                      <div className="volume-chip">Тома {group.year}</div>
                      <ul className="volume-list">
                        {group.volumes.map((v) => (
                          <li key={String(v.id ?? `${v.year}-${v.number}-${v.month ?? 'm'}`)} className="volume-item">
                            <a href={v.id != null ? `/archive/volumes/${v.id}` : '#'} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <div>
                                <div className="volume-title">Том {v.number}{v.month ? ` (${v.month} мес.)` : ''}</div>
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
