const ISO_639_1_CODES = [
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
] as const

export type UiLocale = 'ru' | 'en' | 'kz'

export type ArticleLanguageOption = {
  code: string
  label: string
  searchText: string
}

const localeMap: Record<UiLocale, string> = {
  ru: 'ru',
  en: 'en',
  kz: 'kk',
}

const fallbackLabels: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  kk: 'Kazakh',
  kz: 'Kazakh',
  zh: 'Chinese',
  ar: 'Arabic',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  tr: 'Turkish',
  ja: 'Japanese',
  ko: 'Korean',
}

const getDisplayName = (code: string, locale: UiLocale) => {
  try {
    const displayNames = new Intl.DisplayNames([localeMap[locale]], { type: 'language' })
    return displayNames.of(code) || fallbackLabels[code] || code.toUpperCase()
  } catch {
    return fallbackLabels[code] || code.toUpperCase()
  }
}

export const getArticleLanguageOptions = (locale: UiLocale): ArticleLanguageOption[] =>
  ISO_639_1_CODES.map((code) => {
    const label = getDisplayName(code, locale)
    return {
      code,
      label,
      searchText: `${label} ${code}`.toLowerCase(),
    }
  }).sort((a, b) => a.label.localeCompare(b.label, localeMap[locale]))

export const getArticleLanguageLabel = (code: string | null | undefined, locale: UiLocale) => {
  if (!code) return null
  return getDisplayName(code.toLowerCase(), locale)
}
