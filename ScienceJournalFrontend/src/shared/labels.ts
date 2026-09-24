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
    original: 'Түпнұсқа мақала',
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

const reviewRecommendationMap = {
  ru: {
    accept: 'Рекомендуется к публикации',
    minor_revision: 'Возвратить с замечаниями на доработку',
    major_revision: 'Возвратить с замечаниями на доработку',
    reject: 'Отклонить',
  },
  en: {
    accept: 'Recommend for publication',
    minor_revision: 'Return for revision with comments',
    major_revision: 'Return for revision with comments',
    reject: 'Reject',
  },
  kz: {
    accept: 'Жариялауға ұсыну',
    minor_revision: 'Ескертулермен пысықтауға қайтару',
    major_revision: 'Ескертулермен пысықтауға қайтару',
    reject: 'Қабылдамау',
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

export function formatReviewRecommendation(code: string | null | undefined, lang: Lang = 'ru'): string {
  if (!code) return '—'
  const l = (['ru', 'en', 'kz'] as const).includes(lang) ? lang : 'ru'
  const map = reviewRecommendationMap[l] as Record<string, string>
  return map[code] ?? code
}
