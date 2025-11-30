import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from './labels'

type LanguageContextState = {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextState | null>(null)
const STORAGE_KEY = 'sj_lang'

function getInitialLang(): Lang {
  if (typeof window === 'undefined') {
    return 'ru'
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'en' || saved === 'kz' ? saved : 'ru'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang)
    }
  }, [lang])

  const value = useMemo(() => ({ lang, setLang }), [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
