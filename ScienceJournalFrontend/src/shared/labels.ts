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
    review_completed: 'Рецензирование завершено',
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
    review_completed: 'Review completed',
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
    review_completed: 'Рецензия аяқталды',
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
    accept: 'Статья рекомендуется к публикации.',
    minor_revision: 'Рекомендуется направить статью на доработку.',
    major_revision: 'Рекомендуется направить статью на доработку.',
    reject: 'Рекомендуется отклонить статью.',
  },
  en: {
    accept: 'The article is recommended for publication.',
    minor_revision: 'It is recommended to send the article for revision.',
    major_revision: 'It is recommended to send the article for revision.',
    reject: 'It is recommended to reject the article.',
  },
  kz: {
    accept: 'Мақаланы жариялау ұсынылады.',
    minor_revision: 'Мақаланы түзетуге жіберу ұсынылады.',
    major_revision: 'Мақаланы түзетуге жіберу ұсынылады.',
    reject: 'Мақаланы қабылдамау ұсынылады.',
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
