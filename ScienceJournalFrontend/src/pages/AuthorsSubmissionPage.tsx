import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Keyword = { id?: number; ru: string; kz: string; en: string }
type Lang = 'ru' | 'kz' | 'en'
type LocaleKey = 'ru' | 'en' | 'kz'
type ArticleType = 'original' | 'review'

type AuthorApi = {
  id: number
  email: string
  prefix?: string | null
  first_name: string
  patronymic?: string | null
  last_name: string
  phone?: string | null
  address?: string | null
  country: string
  affiliation1: string
  affiliation2?: string | null
  affiliation3?: string | null
  is_corresponding: boolean
  orcid?: string | null
  scopus_author_id?: string | null
  researcher_id?: string | null
}

type FileOut = {
  id: string
  original_name: string
  content_type: string
  size_bytes: number
  url: string
  created_at: string
}

type AuthorForm = {
  id?: number
  email: string
  prefix: string
  firstName: string
  middleName: string
  lastName: string
  phone: string
  address: string
  country: string
  affiliation1: string
  affiliation2: string
  affiliation3: string
  isCorresponding: boolean
  orcid: string
  scopusId: string
  researcherId: string
}

const pageCopy: Record<LocaleKey, any> = {
  ru: {
    pageTitle: 'Р—Р°РіСЂСѓР·РёС‚Рµ СЂСѓРєРѕРїРёСЃСЊ',
    pageSubtitle: 'Р—Р°РїРѕР»РЅРёС‚Рµ РґР°РЅРЅС‹Рµ Рѕ СЃС‚Р°С‚СЊРµ, РІС‹Р±РµСЂРёС‚Рµ РєР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° Рё РїСЂРёРєСЂРµРїРёС‚Рµ С„Р°Р№Р»С‹.',
    backToCabinet: 'Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°Р±РёРЅРµС‚',
    formLanguagesLabel: 'РЇР·С‹Рє С„РѕСЂРјС‹',
    formLanguagesHint: 'Р­С‚РѕС‚ РїРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РјРµРЅСЏРµС‚ С‚РѕР»СЊРєРѕ РїРѕР»СЏ СЃС‚Р°С‚СЊРё. РЇР·С‹Рє СЃС‚СЂР°РЅРёС†С‹ РјРµРЅСЏРµС‚СЃСЏ РІ СЃР°Р№РґР±Р°СЂРµ.',
    formLanguages: { ru: 'Р СѓСЃСЃРєРёР№', kz: 'РљР°Р·Р°С…СЃРєРёР№', en: 'РђРЅРіР»РёР№СЃРєРёР№' },
    titleLabel: 'РќР°Р·РІР°РЅРёРµ СЃС‚Р°С‚СЊРё',
    abstractLabel: 'РђРЅРЅРѕС‚Р°С†РёСЏ',
    titlePlaceholders: { ru: 'Р—Р°РіРѕР»РѕРІРѕРє РЅР° СЂСѓСЃСЃРєРѕРј', kz: 'Р—Р°РіРѕР»РѕРІРѕРє РЅР° РєР°Р·Р°С…СЃРєРѕРј', en: 'Title in English' },
    abstractPlaceholders: { ru: 'РђРЅРЅРѕС‚Р°С†РёСЏ РЅР° СЂСѓСЃСЃРєРѕРј', kz: 'РђРЅРЅРѕС‚Р°С†РёСЏ РЅР° РєР°Р·Р°С…СЃРєРѕРј', en: 'Abstract in English' },
    articleTypeLabel: 'Р’С‹Р±РµСЂРёС‚Рµ С‚РёРї СЃС‚Р°С‚СЊРё',
    articleTypePlaceholder: '---------',
    articleTypes: { original: 'РћСЂРёРіРёРЅР°Р»СЊРЅР°СЏ СЃС‚Р°С‚СЊСЏ', review: 'РћР±Р·РѕСЂРЅР°СЏ СЃС‚Р°С‚СЊСЏ' },
    keywords: {
      label: 'Р’С‹Р±РµСЂРёС‚Рµ РєР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°',
      empty: 'РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° РїРѕРєР° РЅРµ РґРѕР±Р°РІР»РµРЅС‹.',
      add: 'Р”РѕР±Р°РІРёС‚СЊ РєР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°',
      edit: 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РєР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°',
      removeAria: 'РЈРґР°Р»РёС‚СЊ РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ',
      hint: 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј 5 РєР»СЋС‡РµРІС‹С… СЃР»РѕРІ. РљР°Р¶РґРѕРµ СЃР»РѕРІРѕ РЅСѓР¶РЅРѕ Р·Р°РїРѕР»РЅРёС‚СЊ РЅР° СЂСѓСЃСЃРєРѕРј, РєР°Р·Р°С…СЃРєРѕРј Рё Р°РЅРіР»РёР№СЃРєРѕРј.',
      modalTitle: 'РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° СЃС‚Р°С‚СЊРё',
      modalEyebrow: 'РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°',
      modalHint: 'Р—Р°РїРѕР»РЅРёС‚Рµ РјРёРЅРёРјСѓРј 5 РєР»СЋС‡РµРІС‹С… СЃР»РѕРІ РЅР° С‚СЂРµС… СЏР·С‹РєР°С…. РљРЅРѕРїРєР° РїР»СЋСЃ РґРѕР±Р°РІР»СЏРµС‚ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ СЃР»РѕРІР°.',
      rowTitle: 'РљР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ',
      languageLabels: { ru: 'РќР° СЂСѓСЃСЃРєРѕРј', kz: 'РќР° РєР°Р·Р°С…СЃРєРѕРј', en: 'РќР° Р°РЅРіР»РёР№СЃРєРѕРј' },
      placeholders: { ru: 'РќР°РїСЂРёРјРµСЂ: РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹Р№ РёРЅС‚РµР»Р»РµРєС‚', kz: 'РњС‹СЃР°Р»С‹: Р¶Р°СЃР°РЅРґС‹ РёРЅС‚РµР»Р»РµРєС‚', en: 'Example: artificial intelligence' },
      addRow: '+ Р”РѕР±Р°РІРёС‚СЊ РµС‰Рµ РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ',
    },
    files: {
      manuscript: 'Р—Р°РіСЂСѓР·РёС‚СЊ СЂСѓРєРѕРїРёСЃСЊ (.docx)',
      antiplagiarism: 'Р—Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р» Р°РЅС‚РёРїР»Р°РіРёР°С‚Р°',
      authorInfo: 'Р¤Р°Р№Р» СЃРѕ СЃРІРµРґРµРЅРёСЏРјРё РѕР± Р°РІС‚РѕСЂР°С… (*.doc, *.docx)',
      coverLetter: 'РЎРѕРїСЂРѕРІРѕРґРёС‚РµР»СЊРЅРѕРµ РїРёСЃСЊРјРѕ (*.pdf)',
    },
    aiInfoLabel: 'РЎРІРµРґРµРЅРёСЏ Рѕ РїСЂРёРјРµРЅРµРЅРёРё РіРµРЅРµСЂР°С‚РёРІРЅРѕРіРѕ РР',
    aiInfoPlaceholder: 'РћРїРёС€РёС‚Рµ, РіРґРµ Рё РєР°Рє РёСЃРїРѕР»СЊР·РѕРІР°Р»СЃСЏ РіРµРЅРµСЂР°С‚РёРІРЅС‹Р№ РР, РµСЃР»Рё РѕРЅ РїСЂРёРјРµРЅСЏР»СЃСЏ.',
    confirmations: {
      copyright: 'РЎС‚Р°С‚СЊСЏ СЂР°РЅРµРµ РЅРµ РїСѓР±Р»РёРєРѕРІР°Р»Р°СЃСЊ Рё РЅРµ СЂР°СЃСЃРјР°С‚СЂРёРІР°РµС‚СЃСЏ РґСЂСѓРіРёРј Р¶СѓСЂРЅР°Р»РѕРј',
      originality: 'Р’ СЃС‚Р°С‚СЊРµ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РїР»Р°РіРёР°С‚',
      consent: 'Р’СЃРµ Р°РІС‚РѕСЂС‹ РїРѕРґС‚РІРµСЂР¶РґР°СЋС‚ СЃРѕРіР»Р°СЃРёРµ СЃ РїРѕРґР°РЅРЅРѕР№ РІРµСЂСЃРёРµР№',
      labels: {
        copyright: 'РћС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РїР°СЂР°Р»Р»РµР»СЊРЅР°СЏ РїРѕРґР°С‡Р°',
        originality: 'РћС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РїР»Р°РіРёР°С‚',
        consent: 'Р•СЃС‚СЊ СЃРѕРіР»Р°СЃРёРµ Р°РІС‚РѕСЂРѕРІ',
      },
    },
    submit: 'РћС‚РїСЂР°РІРёС‚СЊ СЃС‚Р°С‚СЊСЋ',
    authors: {
      eyebrow: 'РђРІС‚РѕСЂС‹ СЃС‚Р°С‚СЊРё',
      title: 'РЎРѕСЃС‚Р°РІ Р°РІС‚РѕСЂРѕРІ',
      add: 'Р”РѕР±Р°РІРёС‚СЊ Р°РІС‚РѕСЂР°',
      empty: 'РђРІС‚РѕСЂС‹ РїРѕРєР° РЅРµ РґРѕР±Р°РІР»РµРЅС‹.',
      columns: { name: 'РРјСЏ', affiliations: 'РђС„С„РёР»РёР°С†РёРё', corresponding: 'РљРѕСЂСЂ. Р°РІС‚РѕСЂ', actions: 'Р”РµР№СЃС‚РІРёСЏ' },
      yes: 'Р”Р°',
      no: 'РќРµС‚',
      remove: 'РЈРґР°Р»РёС‚СЊ',
      modalTitle: 'Р”РѕР±Р°РІРёС‚СЊ Р°РІС‚РѕСЂР°',
      modalEyebrow: 'РљР°СЂС‚РѕС‡РєР° Р°РІС‚РѕСЂР°',
      modalHint: 'Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ, Р·Р°С‚РµРј РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РґРѕР±Р°РІСЊС‚Рµ Р°С„С„РёР»РёР°С†РёРё Рё РЅР°СѓС‡РЅС‹Рµ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂС‹.',
      fields: {
        prefix: 'РџСЂРµС„РёРєСЃ',
        firstName: 'РРјСЏ *',
        middleName: 'РћС‚С‡РµСЃС‚РІРѕ',
        lastName: 'Р¤Р°РјРёР»РёСЏ *',
        phone: 'РўРµР»РµС„РѕРЅ',
        address: 'РђРґСЂРµСЃ',
        country: 'РЎС‚СЂР°РЅР° *',
        affiliation1: 'РђС„С„РёР»РёР°С†РёСЏ 1 *',
        affiliation2: 'РђС„С„РёР»РёР°С†РёСЏ 2',
        affiliation3: 'РђС„С„РёР»РёР°С†РёСЏ 3',
        corresponding: 'РЎРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РёР№ Р°РІС‚РѕСЂ',
      },
      save: 'РЎРѕС…СЂР°РЅРёС‚СЊ Р°РІС‚РѕСЂР°',
    },
    common: {
      close: 'Р—Р°РєСЂС‹С‚СЊ',
      cancel: 'РћС‚РјРµРЅР°',
      save: 'РЎРѕС…СЂР°РЅРёС‚СЊ',
      notSpecified: 'вЂ”',
      uploaded: 'Р—Р°РіСЂСѓР¶РµРЅ',
      yes: 'Р”Р°',
      no: 'РќРµС‚',
      notAvailable: '?',
    },
    confirm: {
      title: 'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РґР°РЅРЅС‹С… СЃС‚Р°С‚СЊРё',
      columns: { field: 'РџРѕР»Рµ', value: 'Р—РЅР°С‡РµРЅРёРµ' },
      previewLanguage: 'РЇР·С‹Рє РїСЂРѕСЃРјРѕС‚СЂР°',
      articleTitle: 'РќР°Р·РІР°РЅРёРµ СЃС‚Р°С‚СЊРё',
      abstract: 'РђРЅРЅРѕС‚Р°С†РёСЏ',
      articleType: 'РўРёРї СЃС‚Р°С‚СЊРё',
      keywords: 'РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°',
      responsibleAuthor: 'РћС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№ Р°РІС‚РѕСЂ',
      authors: 'РђРІС‚РѕСЂС‹',
      manuscript: 'Р¤Р°Р№Р» СЂСѓРєРѕРїРёСЃРё',
      antiplagiarism: 'РђРЅС‚РёРїР»Р°РіРёР°С‚',
      authorInfo: 'РЎРІРµРґРµРЅРёСЏ РѕР± Р°РІС‚РѕСЂР°С…',
      coverLetter: 'РЎРѕРїСЂРѕРІРѕРґРёС‚РµР»СЊРЅРѕРµ РїРёСЃСЊРјРѕ',
      aiInfo: 'Р“РµРЅРµСЂР°С‚РёРІРЅС‹Р№ РР',
      confirmations: 'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ',
      comments: 'РљРѕРјРјРµРЅС‚Р°СЂРёРё',
      hint: 'РџСЂРѕРІРµСЂСЊС‚Рµ РґР°РЅРЅС‹Рµ РїРµСЂРµРґ РѕС‚РїСЂР°РІРєРѕР№ СЃС‚Р°С‚СЊРё РІ СЂРµРґР°РєС†РёСЋ.',
      edit: 'РќР°Р·Р°Рґ',
      submit: 'РџРѕРґС‚РІРµСЂРґРёС‚СЊ Рё РѕС‚РїСЂР°РІРёС‚СЊ',
    },
    errors: {
      server: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°',
      submitFailed: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ СЃС‚Р°С‚СЊСЋ. Р”Р°РЅРЅС‹Рµ С„РѕСЂРјС‹ СЃРѕС…СЂР°РЅРµРЅС‹, РёСЃРїСЂР°РІСЊС‚Рµ РѕС€РёР±РєСѓ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.',
      articleType: 'Р’С‹Р±РµСЂРёС‚Рµ С‚РёРї СЃС‚Р°С‚СЊРё',
      title: 'Р—Р°РїРѕР»РЅРёС‚Рµ Р·Р°РіРѕР»РѕРІРѕРє',
      abstract: 'Р—Р°РїРѕР»РЅРёС‚Рµ Р°РЅРЅРѕС‚Р°С†РёСЋ',
      keywordsMin: 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј 5 РєР»СЋС‡РµРІС‹С… СЃР»РѕРІ',
      keywordsFull: 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј 5 РєР»СЋС‡РµРІС‹С… СЃР»РѕРІ Рё Р·Р°РїРѕР»РЅРёС‚Рµ РєР°Р¶РґРѕРµ СЃР»РѕРІРѕ РЅР° С‚СЂРµС… СЏР·С‹РєР°С…',
      authors: 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј РѕРґРЅРѕРіРѕ Р°РІС‚РѕСЂР°',
      manuscript: 'Р—Р°РіСЂСѓР·РёС‚Рµ С„Р°Р№Р» СЂСѓРєРѕРїРёСЃРё РІ С„РѕСЂРјР°С‚Рµ .docx',
      manuscriptExt: 'РџРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ С„РѕСЂРјР°С‚ .docx',
      antiplagiarism: 'Р—Р°РіСЂСѓР·РёС‚Рµ С„Р°Р№Р» Р°РЅС‚РёРїР»Р°РіРёР°С‚Р°',
      authorInfo: 'Р—Р°РіСЂСѓР·РёС‚Рµ СЃРІРµРґРµРЅРёСЏ РѕР± Р°РІС‚РѕСЂР°С…',
      coverLetter: 'Р—Р°РіСЂСѓР·РёС‚Рµ СЃРѕРїСЂРѕРІРѕРґРёС‚РµР»СЊРЅРѕРµ РїРёСЃСЊРјРѕ',
      copyright: 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ РѕС‚СЃСѓС‚СЃС‚РІРёРµ РїР°СЂР°Р»Р»РµР»СЊРЅРѕР№ РїРѕРґР°С‡Рё',
      originality: 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ РѕС‚СЃСѓС‚СЃС‚РІРёРµ РїР»Р°РіРёР°С‚Р°',
      consent: 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ СЃРѕРіР»Р°СЃРёРµ РІСЃРµС… Р°РІС‚РѕСЂРѕРІ',
    },
  },
  en: {
    pageTitle: 'Upload manuscript',
    pageSubtitle: 'Fill in the article details, select keywords, and attach the files.',
    backToCabinet: 'Back to cabinet',
    formLanguagesLabel: 'Form language',
    formLanguagesHint: 'This switch changes only the article fields. The page language is controlled from the sidebar.',
    formLanguages: { ru: 'Russian', kz: 'Kazakh', en: 'English' },
    titleLabel: 'Article title',
    abstractLabel: 'Abstract',
    titlePlaceholders: { ru: 'Title in Russian', kz: 'Title in Kazakh', en: 'Title in English' },
    abstractPlaceholders: { ru: 'Abstract in Russian', kz: 'Abstract in Kazakh', en: 'Abstract in English' },
    articleTypeLabel: 'Select article type',
    articleTypePlaceholder: '---------',
    articleTypes: { original: 'Original article', review: 'Review article' },
    keywords: {
      label: 'Select keywords',
      empty: 'No keywords added yet.',
      add: 'Add keywords',
      edit: 'Edit keywords',
      removeAria: 'Remove keyword',
      hint: 'Add at least 5 keywords. Each keyword must be filled in Russian, Kazakh, and English.',
      modalTitle: 'Article keywords',
      modalEyebrow: 'Keywords',
      modalHint: 'Fill in at least 5 keywords in three languages. The plus button adds more keywords.',
      rowTitle: 'Keyword',
      languageLabels: { ru: 'In Russian', kz: 'In Kazakh', en: 'In English' },
      placeholders: { ru: 'Example: artificial intelligence', kz: 'Example: Р¶Р°СЃР°РЅРґС‹ РёРЅС‚РµР»Р»РµРєС‚', en: 'Example: artificial intelligence' },
      addRow: '+ Add another keyword',
    },
    files: {
      manuscript: 'Upload manuscript (.docx)',
      antiplagiarism: 'Upload anti-plagiarism file',
      authorInfo: 'Author information file (*.doc, *.docx)',
      coverLetter: 'Cover letter (*.pdf)',
    },
    aiInfoLabel: 'Generative AI usage details',
    aiInfoPlaceholder: 'Describe where and how generative AI was used, if applicable.',
    confirmations: {
      copyright: 'The article has not been published before and is not under review by another journal',
      originality: 'The article contains no plagiarism',
      consent: 'All authors confirm consent to the submitted version',
      labels: { copyright: 'No parallel submission', originality: 'No plagiarism', consent: 'Authors consent confirmed' },
    },
    submit: 'Submit article',
    authors: {
      eyebrow: 'Article authors',
      title: 'Author list',
      add: 'Add author',
      empty: 'No authors added yet.',
      columns: { name: 'Name', affiliations: 'Affiliations', corresponding: 'Corresponding', actions: 'Actions' },
      yes: 'Yes',
      no: 'No',
      remove: 'Remove',
      modalTitle: 'Add author',
      modalEyebrow: 'Author card',
      modalHint: 'Fill in the required fields, then add affiliations and research identifiers if needed.',
      fields: {
        prefix: 'Prefix',
        firstName: 'First name *',
        middleName: 'Middle name',
        lastName: 'Last name *',
        phone: 'Phone',
        address: 'Address',
        country: 'Country *',
        affiliation1: 'Affiliation 1 *',
        affiliation2: 'Affiliation 2',
        affiliation3: 'Affiliation 3',
        corresponding: 'Corresponding author',
      },
      save: 'Save author',
    },
    common: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      notSpecified: 'вЂ”',
      uploaded: 'Uploaded',
      yes: 'Yes',
      no: 'No',
      notAvailable: '?',
    },
    confirm: {
      title: 'Confirm article data',
      columns: { field: 'Field', value: 'Value' },
      previewLanguage: 'Preview language',
      articleTitle: 'Article title',
      abstract: 'Abstract',
      articleType: 'Article type',
      keywords: 'Keywords',
      responsibleAuthor: 'Responsible author',
      authors: 'Authors',
      manuscript: 'Manuscript',
      antiplagiarism: 'Anti-plagiarism',
      authorInfo: 'Author information',
      coverLetter: 'Cover letter',
      aiInfo: 'Generative AI',
      confirmations: 'Confirmations',
      comments: 'Comments',
      hint: 'Review the data before sending the article to the editorial office.',
      edit: 'Back',
      submit: 'Confirm and submit',
    },
    errors: {
      server: 'Server error',
      submitFailed: 'Failed to submit the article. Form data was kept, fix the issue and try again.',
      articleType: 'Select article type',
      title: 'Fill in the title',
      abstract: 'Fill in the abstract',
      keywordsMin: 'Add at least 5 keywords',
      keywordsFull: 'Add at least 5 keywords and fill each keyword in all three languages',
      authors: 'Add at least one author',
      manuscript: 'Upload the manuscript file in .docx format',
      manuscriptExt: 'Only .docx format is supported',
      antiplagiarism: 'Upload the anti-plagiarism file',
      authorInfo: 'Upload the author information file',
      coverLetter: 'Upload the cover letter',
      copyright: 'Confirm that there is no parallel submission',
      originality: 'Confirm that there is no plagiarism',
      consent: 'Confirm consent of all authors',
    },
  },
  kz: {
    pageTitle: 'ТљРѕР»Р¶Р°Р·Р±Р°РЅС‹ Р¶ТЇРєС‚РµТЈС–Р·',
    pageSubtitle: 'РњР°Т›Р°Р»Р° РґРµСЂРµРєС‚РµСЂС–РЅ С‚РѕР»С‚С‹СЂС‹Рї, РєС–Р»С‚ СЃУ©Р·РґРµСЂРґС– С‚Р°ТЈРґР°Рї, С„Р°Р№Р»РґР°СЂРґС‹ С‚С–СЂРєРµТЈС–Р·.',
    backToCabinet: 'РљР°Р±РёРЅРµС‚РєРµ РѕСЂР°Р»Сѓ',
    formLanguagesLabel: 'Р¤РѕСЂРјР° С‚С–Р»С–',
    formLanguagesHint: 'Р‘Т±Р» Р°СѓС‹СЃС‚С‹СЂТ“С‹С€ С‚РµРє РјР°Т›Р°Р»Р° У©СЂС–СЃС‚РµСЂС–РЅ У©Р·РіРµСЂС‚РµРґС–. Р‘РµС‚ С‚С–Р»С– СЃР°Р№РґР±Р°СЂ Р°СЂТ›С‹Р»С‹ Р°СѓС‹СЃР°РґС‹.',
    formLanguages: { ru: 'РћСЂС‹СЃС€Р°', kz: 'ТљР°Р·Р°Т›С€Р°', en: 'РђТ“С‹Р»С€С‹РЅС€Р°' },
    titleLabel: 'РњР°Т›Р°Р»Р° Р°С‚Р°СѓС‹',
    abstractLabel: 'РђТЈРґР°С‚РїР°',
    titlePlaceholders: { ru: 'РћСЂС‹СЃ С‚С–Р»С–РЅРґРµРіС– Р°С‚Р°Сѓ', kz: 'ТљР°Р·Р°Т› С‚С–Р»С–РЅРґРµРіС– Р°С‚Р°Сѓ', en: 'Title in English' },
    abstractPlaceholders: { ru: 'РћСЂС‹СЃ С‚С–Р»С–РЅРґРµРіС– Р°ТЈРґР°С‚РїР°', kz: 'ТљР°Р·Р°Т› С‚С–Р»С–РЅРґРµРіС– Р°ТЈРґР°С‚РїР°', en: 'Abstract in English' },
    articleTypeLabel: 'РњР°Т›Р°Р»Р° С‚ТЇСЂС–РЅ С‚Р°ТЈРґР°ТЈС‹Р·',
    articleTypePlaceholder: '---------',
    articleTypes: { original: 'РўТЇРїРЅТ±СЃТ›Р° РјР°Т›Р°Р»Р°', review: 'РЁРѕР»Сѓ РјР°Т›Р°Р»Р°СЃС‹' },
    keywords: {
      label: 'РљС–Р»С‚ СЃУ©Р·РґРµСЂРґС– С‚Р°ТЈРґР°ТЈС‹Р·',
      empty: 'РљС–Р»С‚ СЃУ©Р·РґРµСЂ У™Р»С– Т›РѕСЃС‹Р»РјР°РґС‹.',
      add: 'РљС–Р»С‚ СЃУ©Р·РґРµСЂРґС– Т›РѕСЃСѓ',
      edit: 'РљС–Р»С‚ СЃУ©Р·РґРµСЂРґС– У©ТЈРґРµСѓ',
      removeAria: 'РљС–Р»С‚ СЃУ©Р·РґС– У©С€С–СЂСѓ',
      hint: 'РљРµРјС–РЅРґРµ 5 РєС–Р»С‚ СЃУ©Р· Т›РѕСЃС‹ТЈС‹Р·. УСЂ СЃУ©Р· РѕСЂС‹СЃ, Т›Р°Р·Р°Т› Р¶У™РЅРµ Р°Т“С‹Р»С€С‹РЅ С‚С–Р»РґРµСЂС–РЅРґРµ С‚РѕР»С‚С‹СЂС‹Р»СѓС‹ РєРµСЂРµРє.',
      modalTitle: 'РњР°Т›Р°Р»Р°РЅС‹ТЈ РєС–Р»С‚ СЃУ©Р·РґРµСЂС–',
      modalEyebrow: 'РљС–Р»С‚ СЃУ©Р·РґРµСЂ',
      modalHint: 'Т®С€ С‚С–Р»РґРµ РєРµРјС–РЅРґРµ 5 РєС–Р»С‚ СЃУ©Р·РґС– С‚РѕР»С‚С‹СЂС‹ТЈС‹Р·. РџР»СЋСЃ Р±Р°С‚С‹СЂРјР°СЃС‹ Т›РѕСЃС‹РјС€Р° СЃУ©Р·РґРµСЂРґС– РµРЅРіС–Р·РµРґС–.',
      rowTitle: 'РљС–Р»С‚ СЃУ©Р·',
      languageLabels: { ru: 'РћСЂС‹СЃ С‚С–Р»С–РЅРґРµ', kz: 'ТљР°Р·Р°Т› С‚С–Р»С–РЅРґРµ', en: 'РђТ“С‹Р»С€С‹РЅ С‚С–Р»С–РЅРґРµ' },
      placeholders: { ru: 'РњС‹СЃР°Р»С‹: Р¶Р°СЃР°РЅРґС‹ РёРЅС‚РµР»Р»РµРєС‚', kz: 'РњС‹СЃР°Р»С‹: Р¶Р°СЃР°РЅРґС‹ РёРЅС‚РµР»Р»РµРєС‚', en: 'Example: artificial intelligence' },
      addRow: '+ РўР°Т“С‹ Р±С–СЂ РєС–Р»С‚ СЃУ©Р· Т›РѕСЃСѓ',
    },
    files: {
      manuscript: 'ТљРѕР»Р¶Р°Р·Р±Р°РЅС‹ Р¶ТЇРєС‚РµСѓ (.docx)',
      antiplagiarism: 'РђРЅС‚РёРїР»Р°РіРёР°С‚ С„Р°Р№Р»С‹РЅ Р¶ТЇРєС‚РµСѓ',
      authorInfo: 'РђРІС‚РѕСЂР»Р°СЂ С‚СѓСЂР°Р»С‹ С„Р°Р№Р» (*.doc, *.docx)',
      coverLetter: 'Р†Р»РµСЃРїРµ С…Р°С‚ (*.pdf)',
    },
    aiInfoLabel: 'Р“РµРЅРµСЂР°С‚РёРІС‚С– Р–Р Т›РѕР»РґР°РЅСѓ С‚СѓСЂР°Р»С‹ РјУ™Р»С–РјРµС‚',
    aiInfoPlaceholder: 'Р•РіРµСЂ Т›РѕР»РґР°РЅС‹Р»СЃР°, РіРµРЅРµСЂР°С‚РёРІС‚С– Р–Р Т›Р°Р№ Р¶РµСЂРґРµ Р¶У™РЅРµ Т›Р°Р»Р°Р№ РїР°Р№РґР°Р»Р°РЅС‹Р»Т“Р°РЅС‹РЅ СЃРёРїР°С‚С‚Р°ТЈС‹Р·.',
    confirmations: {
      copyright: 'РњР°Т›Р°Р»Р° Р±Т±СЂС‹РЅ Р¶Р°СЂРёСЏР»Р°РЅР±Р°Т“Р°РЅ Р¶У™РЅРµ Р±Р°СЃТ›Р° Р¶СѓСЂРЅР°Р»РґР° Т›Р°СЂР°СЃС‚С‹СЂС‹Р»С‹Рї Р¶Р°С‚Т›Р°РЅ Р¶РѕТ›',
      originality: 'РњР°Т›Р°Р»Р°РґР° РїР»Р°РіРёР°С‚ Р¶РѕТ›',
      consent: 'Р‘Р°СЂР»С‹Т› Р°РІС‚РѕСЂР»Р°СЂ Р¶С–Р±РµСЂС–Р»РіРµРЅ РЅТ±СЃТ›Р°РјРµРЅ РєРµР»С–СЃРµРґС–',
      labels: { copyright: 'ТљР°С‚Р°СЂ Р¶С–Р±РµСЂС–Р»С–Рј Р¶РѕТ›', originality: 'РџР»Р°РіРёР°С‚ Р¶РѕТ›', consent: 'РђРІС‚РѕСЂР»Р°СЂРґС‹ТЈ РєРµР»С–СЃС–РјС– Р±Р°СЂ' },
    },
    submit: 'РњР°Т›Р°Р»Р°РЅС‹ Р¶С–Р±РµСЂСѓ',
    authors: {
      eyebrow: 'РњР°Т›Р°Р»Р° Р°РІС‚РѕСЂР»Р°СЂС‹',
      title: 'РђРІС‚РѕСЂР»Р°СЂ Т›Т±СЂР°РјС‹',
      add: 'РђРІС‚РѕСЂ Т›РѕСЃСѓ',
      empty: 'РђРІС‚РѕСЂР»Р°СЂ У™Р»С– Т›РѕСЃС‹Р»РјР°РґС‹.',
      columns: { name: 'РђС‚С‹', affiliations: 'РђС„С„РёР»РёР°С†РёСЏР»Р°СЂ', corresponding: 'Р‘Р°Р№Р»Р°РЅС‹СЃ Р°РІС‚РѕСЂС‹', actions: 'УСЂРµРєРµС‚С‚РµСЂ' },
      yes: 'РУ™',
      no: 'Р–РѕТ›',
      remove: 'УЁС€С–СЂСѓ',
      modalTitle: 'РђРІС‚РѕСЂ Т›РѕСЃСѓ',
      modalEyebrow: 'РђРІС‚РѕСЂ РєР°СЂС‚Р°СЃС‹',
      modalHint: 'РњС–РЅРґРµС‚С‚С– У©СЂС–СЃС‚РµСЂРґС– С‚РѕР»С‚С‹СЂС‹ТЈС‹Р·, Т›Р°Р¶РµС‚ Р±РѕР»СЃР° Р°С„С„РёР»РёР°С†РёСЏР»Р°СЂ РјРµРЅ Т“С‹Р»С‹РјРё РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂР»Р°СЂРґС‹ Т›РѕСЃС‹ТЈС‹Р·.',
      fields: {
        prefix: 'РџСЂРµС„РёРєСЃ',
        firstName: 'РђС‚С‹ *',
        middleName: 'УРєРµСЃС–РЅС–ТЈ Р°С‚С‹',
        lastName: 'РўРµРіС– *',
        phone: 'РўРµР»РµС„РѕРЅ',
        address: 'РњРµРєРµРЅР¶Р°Р№',
        country: 'Р•Р» *',
        affiliation1: 'РђС„С„РёР»РёР°С†РёСЏ 1 *',
        affiliation2: 'РђС„С„РёР»РёР°С†РёСЏ 2',
        affiliation3: 'РђС„С„РёР»РёР°С†РёСЏ 3',
        corresponding: 'Р‘Р°Р№Р»Р°РЅС‹СЃ Р°РІС‚РѕСЂС‹',
      },
      save: 'РђРІС‚РѕСЂРґС‹ СЃР°Т›С‚Р°Сѓ',
    },
    common: {
      close: 'Р–Р°Р±Сѓ',
      cancel: 'Р‘Р°СЃ С‚Р°СЂС‚Сѓ',
      save: 'РЎР°Т›С‚Р°Сѓ',
      notSpecified: 'вЂ”',
      uploaded: 'Р–ТЇРєС‚РµР»РґС–',
      yes: 'РУ™',
      no: 'Р–РѕТ›',
      notAvailable: '?',
    },
    confirm: {
      title: 'РњР°Т›Р°Р»Р° РґРµСЂРµРєС‚РµСЂС–РЅ СЂР°СЃС‚Р°Сѓ',
      columns: { field: 'УЁСЂС–СЃ', value: 'РњУ™РЅС–' },
      previewLanguage: 'ТљР°СЂР°Сѓ С‚С–Р»С–',
      articleTitle: 'РњР°Т›Р°Р»Р° Р°С‚Р°СѓС‹',
      abstract: 'РђТЈРґР°С‚РїР°',
      articleType: 'РњР°Т›Р°Р»Р° С‚ТЇСЂС–',
      keywords: 'РљС–Р»С‚ СЃУ©Р·РґРµСЂ',
      responsibleAuthor: 'Р–Р°СѓР°РїС‚С‹ Р°РІС‚РѕСЂ',
      authors: 'РђРІС‚РѕСЂР»Р°СЂ',
      manuscript: 'ТљРѕР»Р¶Р°Р·Р±Р°',
      antiplagiarism: 'РђРЅС‚РёРїР»Р°РіРёР°С‚',
      authorInfo: 'РђРІС‚РѕСЂР»Р°СЂ С‚СѓСЂР°Р»С‹ РјУ™Р»С–РјРµС‚',
      coverLetter: 'Р†Р»РµСЃРїРµ С…Р°С‚',
      aiInfo: 'Р“РµРЅРµСЂР°С‚РёРІС‚С– Р–Р',
      confirmations: 'Р Р°СЃС‚Р°СѓР»Р°СЂ',
      comments: 'РўТЇСЃС–РЅС–РєС‚РµРјРµР»РµСЂ',
      hint: 'РњР°Т›Р°Р»Р°РЅС‹ СЂРµРґР°РєС†РёСЏТ“Р° Р¶С–Р±РµСЂРјРµСЃ Р±Т±СЂС‹РЅ РґРµСЂРµРєС‚РµСЂРґС– С‚РµРєСЃРµСЂС–ТЈС–Р·.',
      edit: 'РђСЂС‚Т›Р°',
      submit: 'Р Р°СЃС‚Р°Сѓ Р¶У™РЅРµ Р¶С–Р±РµСЂСѓ',
    },
    errors: {
      server: 'РЎРµСЂРІРµСЂ Т›Р°С‚РµСЃС–',
      submitFailed: 'РњР°Т›Р°Р»Р°РЅС‹ Р¶С–Р±РµСЂСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹. Р¤РѕСЂРјР° РґРµСЂРµРєС‚РµСЂС– СЃР°Т›С‚Р°Р»РґС‹, Т›Р°С‚РµРЅС– С‚ТЇР·РµС‚С–Рї, Т›Р°Р№С‚Р° РєУ©СЂС–ТЈС–Р·.',
      articleType: 'РњР°Т›Р°Р»Р° С‚ТЇСЂС–РЅ С‚Р°ТЈРґР°ТЈС‹Р·',
      title: 'РђС‚Р°СѓРґС‹ С‚РѕР»С‚С‹СЂС‹ТЈС‹Р·',
      abstract: 'РђТЈРґР°С‚РїР°РЅС‹ С‚РѕР»С‚С‹СЂС‹ТЈС‹Р·',
      keywordsMin: 'РљРµРјС–РЅРґРµ 5 РєС–Р»С‚ СЃУ©Р· Т›РѕСЃС‹ТЈС‹Р·',
      keywordsFull: 'РљРµРјС–РЅРґРµ 5 РєС–Р»С‚ СЃУ©Р· Т›РѕСЃС‹Рї, У™СЂ СЃУ©Р·РґС– ТЇС€ С‚С–Р»РґРµ С‚РѕР»С‚С‹СЂС‹ТЈС‹Р·',
      authors: 'РљРµРјС–РЅРґРµ Р±С–СЂ Р°РІС‚РѕСЂ Т›РѕСЃС‹ТЈС‹Р·',
      manuscript: '.docx С„РѕСЂРјР°С‚С‹РЅРґР°Т“С‹ Т›РѕР»Р¶Р°Р·Р±Р° С„Р°Р№Р»С‹РЅ Р¶ТЇРєС‚РµТЈС–Р·',
      manuscriptExt: 'РўРµРє .docx С„РѕСЂРјР°С‚С‹ Т›РѕР»РґР°Сѓ С‚Р°Р±Р°РґС‹',
      antiplagiarism: 'РђРЅС‚РёРїР»Р°РіРёР°С‚ С„Р°Р№Р»С‹РЅ Р¶ТЇРєС‚РµТЈС–Р·',
      authorInfo: 'РђРІС‚РѕСЂР»Р°СЂ С‚СѓСЂР°Р»С‹ С„Р°Р№Р»РґС‹ Р¶ТЇРєС‚РµТЈС–Р·',
      coverLetter: 'Р†Р»РµСЃРїРµ С…Р°С‚С‚С‹ Р¶ТЇРєС‚РµТЈС–Р·',
      copyright: 'ТљР°С‚Р°СЂ Р¶С–Р±РµСЂС–Р»С–Рј Р¶РѕТ› РµРєРµРЅС–РЅ СЂР°СЃС‚Р°ТЈС‹Р·',
      originality: 'РџР»Р°РіРёР°С‚ Р¶РѕТ› РµРєРµРЅС–РЅ СЂР°СЃС‚Р°ТЈС‹Р·',
      consent: 'Р‘Р°СЂР»С‹Т› Р°РІС‚РѕСЂР»Р°СЂРґС‹ТЈ РєРµР»С–СЃС–РјС–РЅ СЂР°СЃС‚Р°ТЈС‹Р·',
    },
  },
}

export function AuthorsSubmissionPage() {
  const { lang } = useLanguage()
  const locale: LocaleKey = lang === 'en' || lang === 'kz' ? lang : 'ru'
  const t = pageCopy[locale]
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKeywords, setModalKeywords] = useState<Keyword[]>([])
  const [activeLang, setActiveLang] = useState<Lang>('ru')
  const [titles, setTitles] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [abstracts, setAbstracts] = useState<Record<Lang, string>>({ ru: '', kz: '', en: '' })
  const [articleType, setArticleType] = useState<ArticleType | ''>('')
  const [comments, setComments] = useState('')
  void setComments
  const [generativeAiInfo, setGenerativeAiInfo] = useState('')
  const [confirmCopyright, setConfirmCopyright] = useState(false)
  const [confirmOriginality, setConfirmOriginality] = useState(false)
  const [confirmConsent, setConfirmConsent] = useState(false)
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [authorForm, setAuthorForm] = useState<AuthorForm>({
    email: '',
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    address: '',
    country: '',
    affiliation1: '',
    affiliation2: '',
    affiliation3: '',
    isCorresponding: true,
    orcid: '',
    scopusId: '',
    researcherId: '',
  })
  const [authorList, setAuthorList] = useState<AuthorForm[]>([])
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any | null>(null)
  const [confirmLang, setConfirmLang] = useState<Lang>('ru')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const articleTypeOptions: ArticleType[] = ['original', 'review']
  const langLabels: Record<Lang, string> = t.formLanguages

  const getApiErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      const body = error.bodyJson as any
      if (typeof body?.detail === 'string' && body.detail.trim()) return body.detail
      if (typeof body?.message === 'string' && body.message.trim()) return body.message
      if (typeof error.bodyText === 'string' && error.bodyText.trim()) return error.bodyText
      return `${t.errors.server} (${error.status})`
    }
    if (error instanceof Error && error.message.trim()) return error.message
    return t.errors.submitFailed
  }

  const handleRemoveKeyword = (keyword: Keyword) => {
    setSelectedKeywords((prev) =>
      prev.filter(
        (k) => (k.id ?? k.ru) !== (keyword.id ?? keyword.ru),
      ),
    )
  }

  const createEmptyKeyword = (): Keyword => ({ ru: '', kz: '', en: '' })

  const ensureMinimumKeywords = (items: Keyword[]) => {
    const next = [...items]
    while (next.length < 5) next.push(createEmptyKeyword())
    return next
  }

  const openKeywordModal = () => {
    setModalKeywords(ensureMinimumKeywords(selectedKeywords.map((keyword) => ({ ...keyword }))))
    setModalOpen(true)
  }

  const handleKeywordDraftChange = (index: number, field: Lang, value: string) => {
    setModalKeywords((prev) =>
      prev.map((keyword, keywordIndex) =>
        keywordIndex === index ? { ...keyword, [field]: value } : keyword,
      ),
    )
  }

  const handleAddKeywordRow = () => {
    setModalKeywords((prev) => [...prev, createEmptyKeyword()])
  }

  const handleRemoveKeywordRow = (index: number) => {
    setModalKeywords((prev) => {
      if (prev.length <= 5) return prev
      return prev.filter((_, keywordIndex) => keywordIndex !== index)
    })
  }

  const handleSaveKeywords = () => {
    const normalizedKeywords = modalKeywords.map((keyword) => ({
      ru: keyword.ru.trim(),
      kz: keyword.kz.trim(),
      en: keyword.en.trim(),
    }))

    const hasIncompleteKeyword = normalizedKeywords.some(
      (keyword) => !keyword.ru || !keyword.kz || !keyword.en,
    )

    if (normalizedKeywords.length < 5 || hasIncompleteKeyword) {
      setErrors((prev) => ({
        ...prev,
        keywords: 'Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј 5 РєР»СЋС‡РµРІС‹С… СЃР»РѕРІ Рё Р·Р°РїРѕР»РЅРёС‚Рµ РєР°Р¶РґРѕРµ СЃР»РѕРІРѕ РЅР° С‚СЂРµС… СЏР·С‹РєР°С…',
      }))
      return
    }

    setSelectedKeywords(normalizedKeywords)
    setErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.keywords
      return nextErrors
    })
    setModalOpen(false)
  }

  const resetAuthorForm = () =>
    setAuthorForm({
      email: '',
      prefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      phone: '',
      address: '',
      country: '',
      affiliation1: '',
      affiliation2: '',
      affiliation3: '',
      isCorresponding: true,
      orcid: '',
      scopusId: '',
      researcherId: '',
    })

  const mapApiAuthorToForm = (a: AuthorApi): AuthorForm => ({
    id: a.id,
    email: a.email,
    prefix: a.prefix ?? '',
    firstName: a.first_name,
    middleName: a.patronymic ?? '',
    lastName: a.last_name,
    phone: a.phone ?? '',
    address: a.address ?? '',
    country: a.country,
    affiliation1: a.affiliation1,
    affiliation2: a.affiliation2 ?? '',
    affiliation3: a.affiliation3 ?? '',
    isCorresponding: a.is_corresponding,
    orcid: a.orcid ?? '',
    scopusId: a.scopus_author_id ?? '',
    researcherId: a.researcher_id ?? '',
  })

  const saveAuthor = async () => {
    if (!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()) return
    try {
      const payload = {
        email: authorForm.email.trim(),
        prefix: authorForm.prefix.trim() || null,
        first_name: authorForm.firstName.trim(),
        patronymic: authorForm.middleName.trim() || null,
        last_name: authorForm.lastName.trim(),
        phone: authorForm.phone.trim() || null,
        address: authorForm.address.trim() || null,
        country: authorForm.country.trim(),
        affiliation1: authorForm.affiliation1.trim(),
        affiliation2: authorForm.affiliation2.trim() || null,
        affiliation3: authorForm.affiliation3.trim() || null,
        is_corresponding: authorForm.isCorresponding,
        orcid: authorForm.orcid.trim() || null,
        scopus_author_id: authorForm.scopusId.trim() || null,
        researcher_id: authorForm.researcherId.trim() || null,
      }
      const created = await api.post<AuthorApi>('/articles/authors', payload)
      const mapped = mapApiAuthorToForm(created)
      setAuthorList((prev) => {
        if (prev.some((a) => a.email === mapped.email)) return prev
        return [...prev, mapped]
      })
      resetAuthorForm()
      setAuthorModalOpen(false)
    } catch (error) {
      console.error('Failed to create author', error)
    }
  }

  const removeAuthor = (email: string) => {
    setAuthorList((prev) => prev.filter((author) => author.email !== email))
  }

  const selectedKeywordsValue = useMemo(
    () => selectedKeywords.map((kw) => kw.ru).join(', '),
    [selectedKeywords],
  )

  const authorsText = useMemo<Record<Lang, string>>(
    () => {
      const fullNames = authorList
        .map((author) => [author.prefix, author.firstName, author.middleName, author.lastName].filter(Boolean).join(' '))
        .filter(Boolean)
        .join('; ')
      return { ru: fullNames, kz: fullNames, en: fullNames }
    },
    [authorList],
  )

  const uploadFile = async (file: File): Promise<FileOut> => {
    const formData = new FormData()
    formData.append('upload', file)
    return api.request<FileOut>('/files', 'POST', { body: formData })
  }

  const getFileNameFromInputIndex = (idx: number): string | null => {
    try {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"].file-input[data-upload-slot="article-file"]'))
      const file = inputs[idx]?.files?.[0]
      return file ? file.name : null
    } catch {
      return null
    }
  }

  const validateSubmissionFields = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!articleType) nextErrors.articleType = t.errors.articleType
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((contentLang) => {
      if (!titles[contentLang]?.trim()) nextErrors[`title_${contentLang}`] = t.errors.title
      if (!abstracts[contentLang]?.trim()) nextErrors[`abstract_${contentLang}`] = t.errors.abstract
    })
    if (selectedKeywords.length < 5) nextErrors.keywords = t.errors.keywordsMin
    if (authorList.length === 0) nextErrors.authorList = t.errors.authors
    if (!confirmCopyright) nextErrors.confirmCopyright = t.errors.copyright
    if (!confirmOriginality) nextErrors.confirmOriginality = t.errors.originality
    if (!confirmConsent) nextErrors.confirmConsent = t.errors.consent

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstErrorKey = Object.keys(nextErrors)[0]
      const el = document.querySelector<HTMLElement>(`[data-error-key="${firstErrorKey}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!articleType) nextErrors.articleType = t.errors.articleType
    ;(['ru', 'kz', 'en'] as Lang[]).forEach((contentLang) => {
      if (!titles[contentLang]?.trim()) nextErrors[`title_${contentLang}`] = t.errors.title
      if (!abstracts[contentLang]?.trim()) nextErrors[`abstract_${contentLang}`] = t.errors.abstract
    })
    if (selectedKeywords.length < 5) nextErrors.keywords = t.errors.keywordsMin
    if (authorList.length === 0) nextErrors.authorList = t.errors.authors
    const manuscript = getFileNameFromInputIndex(0)
    const antiplag = getFileNameFromInputIndex(3)
    const authorInfo = getFileNameFromInputIndex(1)
    const coverLetter = getFileNameFromInputIndex(2)
    if (!manuscript) nextErrors.manuscript = t.errors.manuscript
    else if (!manuscript.toLowerCase().endsWith('.docx')) nextErrors.manuscript = t.errors.manuscriptExt
    if (!antiplag) nextErrors.antiplagiarism = t.errors.antiplagiarism
    if (!authorInfo) nextErrors.authorInfo = t.errors.authorInfo
    if (!coverLetter) nextErrors.coverLetter = t.errors.coverLetter
    if (!confirmCopyright) nextErrors.confirmCopyright = t.errors.copyright
    if (!confirmOriginality) nextErrors.confirmOriginality = t.errors.originality
    if (!confirmConsent) nextErrors.confirmConsent = t.errors.consent

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstErrorKey = Object.keys(nextErrors)[0]
      const el = document.querySelector<HTMLElement>(`[data-error-key="${firstErrorKey}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }
  void validateForm

  return (
    <div className="public-container">
      {false && (
      <div className="section public-section">
        <p className="eyebrow">РџРѕРґР°С‡Р° СЃС‚Р°С‚СЊРё</p>
        <h1 className="hero__title">Р—Р°РіСЂСѓР·РёС‚Рµ СЂСѓРєРѕРїРёСЃСЊ</h1>
        <p className="subtitle">Р—Р°РїРѕР»РЅРёС‚Рµ РґР°РЅРЅС‹Рµ Рѕ СЃС‚Р°С‚СЊРµ, РІС‹Р±РµСЂРёС‚Рµ РєР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° Рё РїСЂРёРєСЂРµРїРёС‚Рµ С„Р°Р№Р»С‹.</p>
        <Link to="/cabinet/submissions" className="button button--ghost">
          Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°Р±РёРЅРµС‚
        </Link>
      </div>
      )}

      <div className="section public-section" style={{ display: 'none' }}>
        <h1 className="hero__title">Р—Р°РіСЂСѓР·РёС‚Рµ СЂСѓРєРѕРїРёСЃСЊ</h1>
        <p className="subtitle">
          Р—Р°РїРѕР»РЅРёС‚Рµ РґР°РЅРЅС‹Рµ Рѕ СЃС‚Р°С‚СЊРµ, РІС‹Р±РµСЂРёС‚Рµ РєР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР° Рё РїСЂРёРєСЂРµРїРёС‚Рµ С„Р°Р№Р»С‹.
        </p>
        <Link to="/cabinet/submissions" className="button button--ghost">
          Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°Р±РёРЅРµС‚
        </Link>
      </div>

        <div className="section public-section">
          <h1 className="hero__title">{t.pageTitle}</h1>
          <p className="subtitle">{t.pageSubtitle}</p>
          <Link to="/cabinet/submissions" className="button button--ghost">
            {t.backToCabinet}
          </Link>
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                setSubmitError(null)
                if (!validateSubmissionFields()) return
                const form = e.currentTarget as HTMLFormElement
                const fileInputs = Array.from(
                  form.querySelectorAll<HTMLInputElement>('input[type="file"].file-input[data-upload-slot="article-file"]'),
                )
                const manuscriptFile = fileInputs[0]?.files?.[0] ?? null
                const authorInfoFile = fileInputs[1]?.files?.[0] ?? null
                const coverLetterFile = fileInputs[2]?.files?.[0] ?? null
                const antiplagiarismFile = fileInputs[3]?.files?.[0] ?? null

                const manuscriptFileId = manuscriptFile ? (await uploadFile(manuscriptFile)).id : null
                const authorInfoFileId = authorInfoFile ? (await uploadFile(authorInfoFile)).id : null
                const coverLetterFileId = coverLetterFile ? (await uploadFile(coverLetterFile)).id : null
                const antiplagiarismFileId = antiplagiarismFile ? (await uploadFile(antiplagiarismFile)).id : null

                const payload = {
                  // СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ РєРѕРЅС‚СЂР°РєС‚Сѓ backend
                  title_kz: titles.kz || null,
                  title_en: titles.en || null,
                  title_ru: titles.ru || null,

                  abstract_kz: abstracts.kz || null,
                  abstract_en: abstracts.en || null,
                  abstract_ru: abstracts.ru || null,

                  doi: null,
                  status: 'draft',
                  article_type: articleType || 'original',

                  // РїРѕРєР° Р±РµСЂС‘Рј id РїРµСЂРІРѕРіРѕ Р°РІС‚РѕСЂР° РєР°Рє РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕРіРѕ
                  responsible_user_id: authorList[0]?.id ?? null,

                  antiplagiarism_file_id: antiplagiarismFileId,
                  manuscript_file_id: manuscriptFileId,
                  author_info_file_id: authorInfoFileId,
                  cover_letter_file_id: coverLetterFileId,

                  not_published_elsewhere: true,
                  plagiarism_free: true,
                  authors_agree: true,
                  generative_ai_info: generativeAiInfo.trim() || null,

                  authors_text: authorsText,
                  keyword_ids: [],
                  keywords: selectedKeywords.map((k) => ({
                    title_ru: k.ru,
                    title_kz: k.kz,
                    title_en: k.en,
                  })),
                  author_ids: authorList
                    .map((a) => a.id)
                    .filter((id): id is number => typeof id === 'number'),
                  comments: comments.trim() || null,
                  confirmations: {
                    copyright: confirmCopyright,
                    originality: confirmOriginality,
                    consent: confirmConsent,
                  },
                }
                // РћС‚РєСЂС‹РІР°РµРј РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ СЃ РѕС‚С‡С‘С‚РѕРј
                setPendingPayload(payload)
                setConfirmModalOpen(true)
              } catch (error) {
                setSubmitError(getApiErrorMessage(error))
                console.error('Failed to submit article', error)
              }
            }}
          >
          {submitError ? (
            <div className="alert error" style={{ marginBottom: '1rem' }}>
              {submitError}
            </div>
          ) : null}
          {false && (
          <div className="form-field">
            <label className="form-label">РЇР·С‹Рє С„РѕСЂРјС‹</label>
            <div className="lang-switch">
              {(['ru', 'kz', 'en'] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-chip ${activeLang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => setActiveLang(code)}
                >
                  {langLabels[code]}
                </button>
              ))}
            </div>
            <p className="form-hint">
              Р’С‹Р±РµСЂРёС‚Рµ СЏР·С‹Рє РґР»СЏ Р·Р°РїРѕР»РЅРµРЅРёСЏ РЅР°Р·РІР°РЅРёСЏ, Р°РЅРЅРѕС‚Р°С†РёРё Рё Р°РІС‚РѕСЂРѕРІ.
            </p>
          </div>
          )}
          <div className="form-field">
            <label className="form-label">{t.articleTypeLabel}</label>
              <select
                className="chip-select"
                value={articleType}
                onChange={(e) => setArticleType((e.target.value || '') as ArticleType | '')}
                data-error-key="articleType"
                style={errors.articleType ? { borderColor: 'red' } : undefined}
              >
              <option value="">{t.articleTypePlaceholder}</option>
              {articleTypeOptions.map((type) => (
                <option key={type} value={type}>{t.articleTypes[type]}</option>
              ))}
            </select>
            {errors.articleType ? (<p className="form-hint" style={{ color: 'red' }}>{errors.articleType}</p>) : null}
          </div>

          <div className="form-field form-field--article-file">
            <label className="form-label">{t.keywords.label}</label>
            <div className="form-field">
              {selectedKeywords.length > 0 ? (
                <div className="pill-list">
                  {selectedKeywords.map((kw, index) => (
                    <span
                      key={`${kw.ru}-${kw.kz}-${kw.en}-${index}`}
                      className="status-chip status-chip--submitted"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {kw.ru} / {kw.kz} / {kw.en}
                      <button
                        type="button"
                        aria-label={t.keywords.removeAria}
                        onClick={() => handleRemoveKeyword(kw)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'inherit',
                          fontSize: 14,
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        {'\u00d7'}
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="table__empty">{t.keywords.empty}</div>
              )}
              <button
                type="button"
                className="button button--ghost"
                onClick={openKeywordModal}
                data-error-key="keywords"
                style={errors.keywords ? { borderColor: 'red', color: 'red' } : undefined}
              >
                {selectedKeywords.length > 0
                  ? t.keywords.edit
                  : t.keywords.add}
              </button>
              <input type="hidden" name="keywords" value={selectedKeywordsValue} />
            </div>
            <p className="form-hint">{t.keywords.hint}</p>
            {errors.keywords ? (<p className="form-hint" style={{ color: 'red' }}>{errors.keywords}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.formLanguagesLabel}</label>
            <div className="lang-switch">
              {(['ru', 'kz', 'en'] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-chip ${activeLang === code ? 'lang-chip--active' : ''}`}
                  onClick={() => setActiveLang(code)}
                >
                  {langLabels[code]}
                </button>
              ))}
            </div>
            <p className="form-hint">{t.formLanguagesHint}</p>
          </div>

          <div className="form-field">
            <label className="form-label">{t.titleLabel} ({langLabels[activeLang]})</label>
            <input
              className="text-input"
              placeholder={t.titlePlaceholders[activeLang]}
              value={titles[activeLang]}
              onChange={(e) => setTitles((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`title_${activeLang}`}
              style={errors[`title_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`title_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`title_${activeLang}`]}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.abstractLabel} ({langLabels[activeLang]})</label>
            <textarea
              className="text-input"
              rows={4}
              placeholder={t.abstractPlaceholders[activeLang]}
              value={abstracts[activeLang]}
              onChange={(e) => setAbstracts((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              data-error-key={`abstract_${activeLang}`}
              style={errors[`abstract_${activeLang}`] ? { borderColor: 'red' } : undefined}
            />
            {errors[`abstract_${activeLang}`] ? (<p className="form-hint" style={{ color: 'red' }}>{errors[`abstract_${activeLang}`]}</p>) : null}
          </div>


          <div className="form-field">
            <label className="form-label">{t.files.manuscript}</label>
            <input
              type="file"
              className="file-input"
              data-upload-slot="article-file"
              data-error-key="manuscript"
              accept=".docx"
              style={errors.manuscript ? { outline: '2px solid red' } : undefined}
            />
            {errors.manuscript ? (<p className="form-hint" style={{ color: 'red' }}>{errors.manuscript}</p>) : null}
          </div>
          <div className="form-field">
            <label className="form-label">{t.files.antiplagiarism}</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="antiplagiarism" style={errors.antiplagiarism ? { outline: '2px solid red' } : undefined} />
            {errors.antiplagiarism ? (<p className="form-hint" style={{ color: 'red' }}>{errors.antiplagiarism}</p>) : null}
          </div>

          {false && (
          <div className="form-field">
            <label className="form-label">Р СѓРєРѕРїРёСЃСЊ (*.doc, *.docx)</label>
            <input type="file" className="file-input" data-upload-slot="article-file" />
          </div>
          )}
          <div className="form-field">
            <label className="form-label">{t.files.authorInfo}</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="authorInfo" style={errors.authorInfo ? { outline: '2px solid red' } : undefined} />
            {errors.authorInfo ? (<p className="form-hint" style={{ color: 'red' }}>{errors.authorInfo}</p>) : null}
          </div>
          <div className="form-field">
            <label className="form-label">{t.files.coverLetter}</label>
            <input type="file" className="file-input" data-upload-slot="article-file" data-error-key="coverLetter" accept=".pdf" style={errors.coverLetter ? { outline: '2px solid red' } : undefined} />
            {errors.coverLetter ? (<p className="form-hint" style={{ color: 'red' }}>{errors.coverLetter}</p>) : null}
          </div>

          <div className="form-field">
            <label className="form-label">{t.aiInfoLabel}</label>
            <textarea
              className="text-input"
              rows={3}
              value={generativeAiInfo}
              onChange={(e) => setGenerativeAiInfo(e.target.value)}
              placeholder={t.aiInfoPlaceholder}
            />
          </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmCopyright}
                onChange={(e) => setConfirmCopyright(e.target.checked)}
                data-error-key="confirmCopyright"
              />{' '}
              {t.confirmations.copyright}
            </label>
            {errors.confirmCopyright ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmCopyright}</p>) : null}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmOriginality}
                onChange={(e) => setConfirmOriginality(e.target.checked)}
                data-error-key="confirmOriginality"
              />{' '}
              {t.confirmations.originality}
            </label>
            {errors.confirmOriginality ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmOriginality}</p>) : null}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmConsent}
                onChange={(e) => setConfirmConsent(e.target.checked)}
                data-error-key="confirmConsent"
              />{' '}
              {t.confirmations.consent}
            </label>
            {errors.confirmConsent ? (<p className="form-hint" style={{ color: 'red' }}>{errors.confirmConsent}</p>) : null}

          <button className="button button--primary" type="submit">
            {t.submit}
          </button>
        </form>
      </div>

      <div className="section public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.authors.eyebrow}</p>
            <h2 className="panel-title">{t.authors.title}</h2>
          </div>
          <button className="button button--primary button--compact" type="button" onClick={() => setAuthorModalOpen(true)}>
            {t.authors.add}
          </button>
        </div>
        {authorList.length === 0 ? (
          <div className="table__empty">{t.authors.empty}</div>
        ) : (
          <div className="table">
            <div className="table__head">
              <span>{t.authors.columns.name}</span>
              <span>Email</span>
              <span>{t.authors.columns.affiliations}</span>
              <span>{t.authors.columns.corresponding}</span>
              <span>{t.authors.columns.actions}</span>
            </div>
            <div className="table__body">
              {authorList.map((a, idx) => (
                <div className="table__row" key={`${a.email}-${idx}`}>
                  <div className="table__cell">
                    <div className="table__title">
                      {a.prefix ? `${a.prefix} ` : ''}
                      {a.firstName} {a.middleName} {a.lastName}
                    </div>
                    <div className="table__meta">{a.phone}</div>
                  </div>
                  <div className="table__cell">{a.email}</div>
                  <div className="table__cell">
                    {[a.affiliation1, a.affiliation2, a.affiliation3].filter(Boolean).join('; ') || t.common.notSpecified}
                  </div>
                  <div className="table__cell">{a.isCorresponding ? t.authors.yes : t.authors.no}</div>
                  <div className="table__cell">
                    <button type="button" className="button button--ghost button--compact" onClick={() => removeAuthor(a.email)}>
                      {t.authors.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {errors.authorList ? (<p className="form-hint" style={{ color: 'red' }}>{errors.authorList}</p>) : null}

      {modalOpen ? (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal modal--wide keyword-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t.keywords.modalTitle}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)} aria-label={t.common.close}>
                {'\u00d7'}
              </button>
            </div>
            <div className="modal__body keyword-modal__body">
              <div className="keyword-modal__intro">
                <p className="keyword-modal__eyebrow">{t.keywords.modalEyebrow}</p>
                <p className="form-hint" style={{ margin: 0 }}>
                {t.keywords.modalHint}
                </p>
              </div>
              <div className="keyword-modal__list">
                {modalKeywords.map((keyword, index) => (
                  <div key={`keyword-row-${index}`} className="keyword-row">
                    <div className="keyword-row__header">
                      <div className="keyword-row__title">
                        <span className="keyword-row__index">{index + 1}</span>
                        <strong>{t.keywords.rowTitle}</strong>
                      </div>
                      {index >= 5 ? (
                        <button
                          type="button"
                          className="button button--ghost button--compact"
                          onClick={() => handleRemoveKeywordRow(index)}
                        >
                          {t.authors.remove}
                        </button>
                      ) : null}
                    </div>
                    <div className="keyword-row__grid">
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{t.keywords.languageLabels.ru}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.ru}
                          onChange={(e) => handleKeywordDraftChange(index, 'ru', e.target.value)}
                          placeholder={t.keywords.placeholders.ru}
                        />
                      </div>
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{t.keywords.languageLabels.kz}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.kz}
                          onChange={(e) => handleKeywordDraftChange(index, 'kz', e.target.value)}
                          placeholder={t.keywords.placeholders.kz}
                        />
                      </div>
                      <div className="form-field keyword-row__field" style={{ margin: 0 }}>
                        <label className="form-label">{t.keywords.languageLabels.en}</label>
                        <input
                          className="text-input keyword-row__input"
                          value={keyword.en}
                          onChange={(e) => handleKeywordDraftChange(index, 'en', e.target.value)}
                          placeholder={t.keywords.placeholders.en}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={handleAddKeywordRow}
                style={{ justifySelf: 'start' }}
              >
                {t.keywords.addRow}
              </button>
              {errors.keywords ? (<p className="form-hint" style={{ color: 'red', margin: 0 }}>{errors.keywords}</p>) : null}
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setModalOpen(false)}>
                {t.common.cancel}
              </button>
              <button className="button button--primary" type="button" onClick={handleSaveKeywords}>
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authorModalOpen ? (
        <div className="modal-backdrop" onClick={() => setAuthorModalOpen(false)}>
          <div className="modal modal--wide author-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t.authors.modalTitle}</h3>
              <button className="modal__close" onClick={() => setAuthorModalOpen(false)} aria-label={t.common.close}>
                {'\u00d7'}
              </button>
            </div>
            <div className="modal__body author-modal__body">
              <div className="author-modal__intro">
                <p className="author-modal__eyebrow">{t.authors.modalEyebrow}</p>
                <p className="author-modal__hint">{t.authors.modalHint}</p>
              </div>
              <div className="author-grid">
                <div className="form-field">
                  <label className="form-label">Email *</label>
                  <input className="text-input" value={authorForm.email} onChange={(e) => setAuthorForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.prefix}</label>
                  <input className="text-input" value={authorForm.prefix} onChange={(e) => setAuthorForm((p) => ({ ...p, prefix: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.firstName}</label>
                  <input className="text-input" value={authorForm.firstName} onChange={(e) => setAuthorForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.middleName}</label>
                  <input className="text-input" value={authorForm.middleName} onChange={(e) => setAuthorForm((p) => ({ ...p, middleName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.lastName}</label>
                  <input className="text-input" value={authorForm.lastName} onChange={(e) => setAuthorForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.phone}</label>
                  <input className="text-input" value={authorForm.phone} onChange={(e) => setAuthorForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-field form-field--span-2">
                  <label className="form-label">{t.authors.fields.address}</label>
                  <input className="text-input" value={authorForm.address} onChange={(e) => setAuthorForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.country}</label>
                  <input className="text-input" value={authorForm.country} onChange={(e) => setAuthorForm((p) => ({ ...p, country: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.affiliation1}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation1} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation1: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.affiliation2}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation2} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation2: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.affiliation3}</label>
                  <textarea className="text-input" rows={3} value={authorForm.affiliation3} onChange={(e) => setAuthorForm((p) => ({ ...p, affiliation3: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.authors.fields.corresponding}</label>
                  <div className="pill-list">
                    <button type="button" className={`button button--ghost button--compact ${authorForm.isCorresponding ? 'button--active' : ''}`} onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: true }))}>{t.common.yes}</button>
                    <button type="button" className={`button button--ghost button--compact ${!authorForm.isCorresponding ? 'button--active' : ''}`} onClick={() => setAuthorForm((p) => ({ ...p, isCorresponding: false }))}>{t.common.no}</button>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">ORCID</label>
                  <input className="text-input" value={authorForm.orcid} onChange={(e) => setAuthorForm((p) => ({ ...p, orcid: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Scopus Author ID</label>
                  <input className="text-input" value={authorForm.scopusId} onChange={(e) => setAuthorForm((p) => ({ ...p, scopusId: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Researcher ID</label>
                  <input className="text-input" value={authorForm.researcherId} onChange={(e) => setAuthorForm((p) => ({ ...p, researcherId: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal__footer author-modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setAuthorModalOpen(false)}>{t.common.cancel}</button>
              <button className="button button--primary" type="button" onClick={saveAuthor} disabled={!authorForm.email.trim() || !authorForm.firstName.trim() || !authorForm.lastName.trim()}>{t.authors.save}</button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmModalOpen && pendingPayload ? (
        <div className="modal-backdrop" onClick={() => setConfirmModalOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t.confirm.title}</h3>
              <button className="modal__close" onClick={() => setConfirmModalOpen(false)} aria-label={t.common.close}>?</button>
            </div>
            <div className="modal__body">
              <div className="table">
                <div className="table__head">
                  <span>{t.confirm.columns.field}</span>
                  <span>{t.confirm.columns.value}</span>
                </div>
                <div className="table__body">
                  <div className="table__row"><div className="table__cell">{t.confirm.previewLanguage}</div><div className="table__cell"><div className="lang-switch">{(['ru', 'kz', 'en'] as Lang[]).map((code) => (<button key={code} type="button" className={`lang-chip ${confirmLang === code ? 'lang-chip--active' : ''}`} onClick={() => setConfirmLang(code)}>{langLabels[code]}</button>))}</div></div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.articleTitle}</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.title_ru) || (confirmLang === 'kz' && pendingPayload.title_kz) || (confirmLang === 'en' && pendingPayload.title_en) || t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.abstract}</div><div className="table__cell">{(confirmLang === 'ru' && pendingPayload.abstract_ru) || (confirmLang === 'kz' && pendingPayload.abstract_kz) || (confirmLang === 'en' && pendingPayload.abstract_en) || t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.articleType}</div><div className="table__cell">{articleType ? t.articleTypes[articleType] : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.keywords}</div><div className="table__cell">{selectedKeywords.length ? selectedKeywords.map((kw) => confirmLang === 'ru' ? kw.ru : confirmLang === 'kz' ? kw.kz : kw.en).filter(Boolean).join(', ') : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.responsibleAuthor}</div><div className="table__cell">{(() => { const responsible = authorList.find((a) => a.id === pendingPayload.responsible_user_id); if (!responsible) return pendingPayload.responsible_user_id ?? t.common.notAvailable; const name = [responsible.prefix, responsible.firstName, responsible.middleName, responsible.lastName].filter(Boolean).join(' '); return `${name} (${responsible.email})`; })()}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.authors}</div><div className="table__cell">{authorList.length ? authorList.map((a) => [a.prefix, a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')).join('; ') : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.manuscript}</div><div className="table__cell">{getFileNameFromInputIndex(0) || (pendingPayload.manuscript_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.antiplagiarism}</div><div className="table__cell">{getFileNameFromInputIndex(3) || (pendingPayload.antiplagiarism_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.authorInfo}</div><div className="table__cell">{getFileNameFromInputIndex(1) || (pendingPayload.author_info_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.coverLetter}</div><div className="table__cell">{getFileNameFromInputIndex(2) || (pendingPayload.cover_letter_file_id ? t.common.uploaded : t.common.notAvailable)}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.aiInfo}</div><div className="table__cell">{pendingPayload.generative_ai_info || t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.confirmations}</div><div className="table__cell">{pendingPayload.confirmations ? (['copyright', 'originality', 'consent'] as const).filter((k) => pendingPayload.confirmations[k]).map((k) => t.confirmations.labels[k]).join(', ') || t.common.notAvailable : t.common.notAvailable}</div></div>
                  <div className="table__row"><div className="table__cell">{t.confirm.comments}</div><div className="table__cell">{pendingPayload.comments || t.common.notAvailable}</div></div>
                </div>
              </div>
              <p className="form-hint" style={{ marginTop: 12 }}>{t.confirm.hint}</p>
            </div>
            <div className="modal__footer">
              <button className="button button--ghost" type="button" onClick={() => setConfirmModalOpen(false)}>{t.confirm.edit}</button>
              <button className="button button--primary" type="button" onClick={async () => { try { setSubmitError(null); await api.post('/articles', pendingPayload); setConfirmModalOpen(false); setPendingPayload(null); navigate('/cabinet/submissions'); } catch (error) { setSubmitError(getApiErrorMessage(error)); console.error('Failed to submit article', error); } }}>{t.confirm.submit}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}




