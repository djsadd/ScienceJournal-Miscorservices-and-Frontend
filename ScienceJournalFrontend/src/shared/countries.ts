export type CountryValue =
  | string
  | {
      id?: number
      name?: string | null
      alpha_2?: string | null
      alpha_3?: string | null
    }
  | null
  | undefined

export const getCountryLabel = (country: CountryValue): string => {
  if (!country) return ''
  if (typeof country === 'string') return country
  return country.name || country.alpha_2 || country.alpha_3 || ''
}
