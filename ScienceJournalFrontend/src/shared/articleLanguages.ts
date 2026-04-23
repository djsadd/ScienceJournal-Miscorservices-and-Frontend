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
  ru: 'Русский',
  kk: 'Қазақша',
  kz: 'Қазақша',
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

const selfLabels: Record<string, string> = {
  ru: 'Русский',
  kk: 'Қазақша',
  kz: 'Қазақша',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  tr: 'Türkçe',
  zh: '中文',
  ar: 'العربية',
  ja: '日本語',
  ko: '한국어',
  uk: 'Українська',
  pl: 'Polski',
}

const getAutonymLocale = (code: string) => {
  if (code === 'kz') return 'kk'
  return code
}

const toDisplayLabel = (value: string) => {
  if (!value) return value
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

const getLocalizedName = (code: string, locale: UiLocale) => {
  try {
    const displayNames = new Intl.DisplayNames([localeMap[locale]], { type: 'language' })
    return displayNames.of(code) || null
  } catch {
    return null
  }
}

const getDisplayName = (code: string, locale: UiLocale) => {
  const normalizedCode = code.toLowerCase()
  if (selfLabels[normalizedCode]) return selfLabels[normalizedCode]

  try {
    const displayNames = new Intl.DisplayNames([getAutonymLocale(normalizedCode)], { type: 'language' })
    const autonym = displayNames.of(normalizedCode)
    if (autonym && autonym.toLowerCase() !== normalizedCode) return toDisplayLabel(autonym)
  } catch {
    // Fallback handled below.
  }

  const localizedName = getLocalizedName(normalizedCode, locale)
  if (localizedName && localizedName.toLowerCase() !== normalizedCode) return toDisplayLabel(localizedName)

  return fallbackLabels[normalizedCode] || normalizedCode.toUpperCase()
}

const hasReadableLabel = (option: ArticleLanguageOption) => option.label.toLowerCase() !== option.code.toLowerCase()

const preferredOrder = ['ru', 'kk', 'kz', 'en'] as const

export const getArticleLanguageOptions = (locale: UiLocale): ArticleLanguageOption[] =>
  ISO_639_1_CODES.map((code) => {
    const label = getDisplayName(code, locale)
    const localizedName = getLocalizedName(code, locale)
    const searchTokens = [label, localizedName, code.toUpperCase(), code].filter(Boolean)
    return {
      code,
      label,
      searchText: searchTokens.join(' ').toLowerCase(),
    }
  }).sort((a, b) => {
    const aPreferredIndex = preferredOrder.indexOf(a.code as (typeof preferredOrder)[number])
    const bPreferredIndex = preferredOrder.indexOf(b.code as (typeof preferredOrder)[number])

    if (aPreferredIndex !== -1 || bPreferredIndex !== -1) {
      if (aPreferredIndex === -1) return 1
      if (bPreferredIndex === -1) return -1
      return aPreferredIndex - bPreferredIndex
    }

    const aReadable = hasReadableLabel(a)
    const bReadable = hasReadableLabel(b)

    if (aReadable !== bReadable) return aReadable ? -1 : 1

    return a.label.localeCompare(b.label, localeMap[locale])
  })

export const getArticleLanguageLabel = (code: string | null | undefined, locale: UiLocale) => {
  if (!code) return null
  return getDisplayName(code.toLowerCase(), locale)
}
