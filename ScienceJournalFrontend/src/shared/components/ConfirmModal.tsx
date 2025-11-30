// no React import needed with modern JSX transform

interface ConfirmModalProps {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = 'Подтверждение',
  message = 'Вы уверены, что хотите продолжить?',
  confirmText = 'Да',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="panel"
        style={{ minWidth: 360, maxWidth: 520, padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ marginBottom: 16 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="button button--ghost" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="button button--primary" type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
