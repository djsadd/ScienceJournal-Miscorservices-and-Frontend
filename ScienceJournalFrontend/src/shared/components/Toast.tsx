interface ToastProps {
  open: boolean
  message: string
  onClose?: () => void
  durationMs?: number
}

export default function Toast({ open, message, onClose, durationMs = 3000 }: ToastProps) {
  if (!open) return null
  if (durationMs && onClose) {
    setTimeout(onClose, durationMs)
  }
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        background: '#22543d',
        color: 'white',
        padding: '10px 12px',
        borderRadius: 8,
        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        zIndex: 1000,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  )
}
