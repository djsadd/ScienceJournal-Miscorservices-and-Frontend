import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import type { Lang } from './labels'

type LanguageContextState = {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextState | null>(null)
const STORAGE_KEY = 'sj_lang'
const supportedLangs = ['ru', 'kz', 'en'] as const

function isLang(value: string | undefined): value is Lang {
  return supportedLangs.includes(value as Lang)
}

function getInitialLang(): Lang {
  if (typeof window === 'undefined') {
    return 'ru'
  }

  const urlLang = window.location.pathname.split('/').filter(Boolean)[0]
  if (isLang(urlLang)) {
    return urlLang
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  return isLang(saved || undefined) ? (saved as Lang) : 'ru'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [lang, setLang] = useState<Lang>(getInitialLang)

  useEffect(() => {
    const urlLang = location.pathname.split('/').filter(Boolean)[0]
    if (isLang(urlLang) && urlLang !== lang) {
      setLang(urlLang)
    }
  }, [lang, location.pathname])

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
