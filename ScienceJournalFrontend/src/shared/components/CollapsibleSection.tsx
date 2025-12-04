import { useState } from 'react'
import type { PropsWithChildren } from 'react'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
}

export default function CollapsibleSection({ title, defaultOpen = true, children }: PropsWithChildren<CollapsibleSectionProps>) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="panel">
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>{title}</h3>
        <button
          className="button button--ghost button--compact"
          aria-expanded={open}
          title={open ? 'Свернуть' : 'Развернуть'}
          onClick={() => setOpen(!open)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ display: 'inline-block', transition: 'transform 0.15s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          {open ? 'Свернуть' : 'Развернуть'}
        </button>
      </div>
      <div style={{ display: open ? 'block' : 'none' }}>
        {children}
      </div>
    </div>
  )
}
