import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Group = 'collegium' | 'council'
type Member = { id:number; group:Group; full_name:string; full_name_ru?:string|null; full_name_kz?:string|null; full_name_en?:string|null; status?:string|null; status_ru?:string|null; status_kz?:string|null; status_en?:string|null; workplace?:string|null; workplace_ru?:string|null; workplace_kz?:string|null; workplace_en?:string|null; citizenship?:string|null; citizenship_ru?:string|null; citizenship_kz?:string|null; citizenship_en?:string|null; h_index_wos?:number|null; h_index_scopus?:number|null; orcid?:string|null; scopus_author_id?:string|null; researcher_id?:string|null }

const copy = {
  ru:{eyebrow:'Редакция',title:'Состав редакции',subtitle:'Редакционная коллегия и редакционный совет журнала.',collegium:'Редакционная коллегия',council:'Редакционный совет',collegiumMember:'Член редколлегии',councilMember:'Член редсовета',empty:'Состав пока не опубликован',loading:'Загрузка состава…',workplace:'Место работы',citizenship:'Гражданство',hIndex:'Индекс Хирша',ids:'Научные идентификаторы'},
  en:{eyebrow:'Editorial',title:'Editorial team',subtitle:'The journal’s editorial board and editorial council.',collegium:'Editorial board',council:'Editorial council',collegiumMember:'Editorial board member',councilMember:'Editorial council member',empty:'The team has not been published yet',loading:'Loading editorial team…',workplace:'Affiliation',citizenship:'Citizenship',hIndex:'H-index',ids:'Research identifiers'},
  kz:{eyebrow:'Редакция',title:'Редакция құрамы',subtitle:'Журналдың редакциялық алқасы мен редакциялық кеңесі.',collegium:'Редакциялық алқа',council:'Редакциялық кеңес',collegiumMember:'Редакциялық алқа мүшесі',councilMember:'Редакциялық кеңес мүшесі',empty:'Құрам әлі жарияланбаған',loading:'Құрам жүктелуде…',workplace:'Жұмыс орны',citizenship:'Азаматтығы',hIndex:'Хирш индексі',ids:'Ғылыми идентификаторлар'},
} as const

export function EditorialPage() {
  const { lang } = useLanguage()
  const locale = lang === 'en' || lang === 'kz' ? lang : 'ru'
  const t = copy[locale]
  const [members,setMembers] = useState<Member[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{let active=true;api.getPublicEditorialMembers<Member[]>().then(data=>{if(active)setMembers(data)}).catch(()=>{if(active)setMembers([])}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])

  const renderMembers=()=>{
    if(!members.length)return <div className="public-editorial__empty">{t.empty}</div>
    return <div className="public-editorial__grid">{members.map(member=>{const fullName=member[`full_name_${locale}`]||member.full_name;const status=member[`status_${locale}`]||member.status;const workplace=member[`workplace_${locale}`]||member.workplace;const citizenship=member[`citizenship_${locale}`]||member.citizenship;return <article className="panel public-editorial-card" key={member.id}>
        <div className="public-editorial-card__top"><h3>{fullName}</h3>{status?<p>{status}</p>:null}</div>
        <dl className="public-editorial-card__details">{workplace?<div><dt>{t.workplace}</dt><dd>{workplace}</dd></div>:null}{citizenship?<div><dt>{t.citizenship}</dt><dd>{citizenship}</dd></div>:null}{member.h_index_wos!=null||member.h_index_scopus!=null?<div><dt>{t.hIndex}</dt><dd>{member.h_index_wos!=null?`WoS: ${member.h_index_wos}`:''}{member.h_index_wos!=null&&member.h_index_scopus!=null?' · ':''}{member.h_index_scopus!=null?`Scopus: ${member.h_index_scopus}`:''}</dd></div>:null}</dl>
        {member.orcid||member.scopus_author_id||member.researcher_id?<div className="public-editorial-card__ids"><span>{t.ids}</span><div>{member.orcid?<a href={`https://orcid.org/${encodeURIComponent(member.orcid)}`} target="_blank" rel="noreferrer">ORCID: {member.orcid}</a>:null}{member.scopus_author_id?<a href={`https://www.scopus.com/authid/detail.uri?authorId=${encodeURIComponent(member.scopus_author_id)}`} target="_blank" rel="noreferrer">Scopus Author ID: {member.scopus_author_id}</a>:null}{member.researcher_id?<a href={`https://www.webofscience.com/wos/author/record/${encodeURIComponent(member.researcher_id)}`} target="_blank" rel="noreferrer">Researcher ID: {member.researcher_id}</a>:null}</div></div>:null}
      </article>})}</div>
  }

  return <div className="public-container"><section className="section public-section public-editorial"><p className="eyebrow">{t.eyebrow}</p><h1 className="hero__title">{t.title}</h1><p className="subtitle">{t.subtitle}</p><div className="public-editorial__list">{loading?<div className="public-editorial__empty">{t.loading}</div>:renderMembers()}</div></section></div>
}
