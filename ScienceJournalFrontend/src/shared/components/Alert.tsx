import React from 'react'

type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: React.ReactNode
  className?: string
}

const palette: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg: '#fff5f5',
    border: '#f56565',
    text: '#742a2a',
    icon: '⚠️',
  },
  warning: {
    bg: '#fffaf0',
    border: '#f6ad55',
    text: '#7b341e',
    icon: '⚠️',
  },
  info: {
    bg: '#ebf8ff',
    border: '#63b3ed',
    text: '#2a4365',
    icon: 'ℹ️',
  },
  success: {
    bg: '#f0fff4',
    border: '#68d391',
    text: '#22543d',
    icon: '✅',
  },
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const colors = palette[variant]
  return (
    <div
      role="alert"
      className={className}
      style={{
        background: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        padding: '12px 14px',
        borderRadius: 6,
        lineHeight: 1.4,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: '18px' }} aria-hidden>
        {colors.icon}
      </span>
      <div>
        {title && (
          <div style={{ fontWeight: 600, marginBottom: children ? 4 : 0 }}>
            {title}
          </div>
        )}
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}

export default Alert
