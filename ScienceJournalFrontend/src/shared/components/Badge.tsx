interface BadgeProps {
  status: string
}

const statusMap: Record<
  string,
  { label: string; tone: 'success' | 'info' | 'warn' | 'danger' | 'muted' }
> = {
  draft: { label: 'Черновик', tone: 'muted' },
  submitted: { label: 'Отправлено', tone: 'info' },
  in_progress: { label: 'В работе', tone: 'warn' },
  completed: { label: 'Завершено', tone: 'success' },
  cancelled: { label: 'Отменена', tone: 'muted' },
  pending: { label: 'Ожидает', tone: 'info' },
  in_review: { label: 'На рецензии', tone: 'warn' },
  under_review: { label: 'На рецензировании', tone: 'warn' },
  editor_check: { label: 'Проверка редактора', tone: 'info' },
  reviewer_check: { label: 'Проверка рецензента', tone: 'info' },
  revisions: { label: 'Правки', tone: 'warn' },
  send_for_revision: { label: 'Отправлено на доработку', tone: 'warn' },
  sent_for_revision: { label: 'Отправлено на доработку', tone: 'warn' },
  accepted: { label: 'Принято', tone: 'success' },
  rejected: { label: 'Отклонено', tone: 'danger' },
  resubmission: { label: 'Повторная рецензия', tone: 'warn' },
}

export function Badge({ status }: BadgeProps) {
  const meta = statusMap[status] ?? { label: status, tone: 'muted' }
  return <span className={`badge badge--${meta.tone}`}>{meta.label}</span>
}
