export type Lang = 'ru' | 'en' | 'kz'

const typeMap = {
  ru: {
    original: 'Оригинальная статья',
    review: 'Обзорная статья',
  },
  en: {
    original: 'Original article',
    review: 'Review article',
  },
  kz: {
    original: 'Оригинальная мақала',
    review: 'Шолу мақаласы',
  },
} as const

const statusMap = {
  ru: {
    draft: 'Черновик',
    submitted: 'Отправлено',
    under_review: 'На рецензировании',
    in_review: 'На рецензии',
    editor_check: 'Проверка редактора',
    reviewer_check: 'Проверка рецензента',
    revisions: 'Правки',
    send_for_revision: 'Отправлено на доработку',
    sent_for_revision: 'Отправлено на доработку',
    rejected: 'Отклонено',
    accepted: 'Принято',
    published: 'Опубликовано',
    withdrawn: 'Отозвано',
  },
  en: {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under review',
    in_review: 'In review',
    editor_check: 'Editor check',
    reviewer_check: 'Reviewer check',
    revisions: 'Revisions',
    send_for_revision: 'Sent for revision',
    sent_for_revision: 'Sent for revision',
    rejected: 'Rejected',
    accepted: 'Accepted',
    published: 'Published',
    withdrawn: 'Withdrawn',
  },
  kz: {
    draft: 'Жоба',
    submitted: 'Жіберілді',
    under_review: 'Рецензияда',
    in_review: 'Рецензияда',
    editor_check: 'Редактор тексерісі',
    reviewer_check: 'Рецензент тексерісі',
    revisions: 'Түзетулер',
    send_for_revision: 'Доралауға жіберілді',
    sent_for_revision: 'Доралауға жіберілді',
    rejected: 'Қабылданбады',
    accepted: 'Қабылданды',
    published: 'Жарияланды',
    withdrawn: 'Қайтарылды',
  },
} as const

export function formatArticleType(code: string, lang: Lang = 'ru'): string {
  const l = (['ru', 'en', 'kz'] as const).includes(lang) ? lang : 'ru'
  const map = typeMap[l] as Record<string, string>
  return map[code] ?? code
}

export function formatArticleStatus(code: string, lang: Lang = 'ru'): string {
  const l = (['ru', 'en', 'kz'] as const).includes(lang) ? lang : 'ru'
  const map = statusMap[l] as Record<string, string>
  return map[code] ?? code
}
