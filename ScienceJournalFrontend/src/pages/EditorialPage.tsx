import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../shared/LanguageContext'

type Group = 'collegium' | 'council'
type Member = { id:number; group:Group; full_name:string; status?:string|null; workplace?:string|null; citizenship?:string|null; h_index_wos?:number|null; h_index_scopus?:number|null; orcid?:string|null; scopus_author_id?:string|null; researcher_id?:string|null }

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

  const renderGroup=(group:Group)=>{
    const list=members.filter(member=>member.group===group)
    const title=group==='collegium'?t.collegium:t.council
    const label=group==='collegium'?t.collegiumMember:t.councilMember
    return <section className="public-editorial__group" aria-labelledby={`editorial-${group}`}>
      <header className="public-editorial__group-header"><div><span className={`public-editorial__badge public-editorial__badge--${group}`}>{label}</span><h2 id={`editorial-${group}`}>{title}</h2></div><strong>{list.length}</strong></header>
      {!list.length?<div className="public-editorial__empty">{t.empty}</div>:<div className="public-editorial__grid">{list.map(member=><article className="panel public-editorial-card" key={member.id}>
        <div className="public-editorial-card__top"><div className="public-editorial-card__avatar" aria-hidden="true">{member.full_name.split(/\s+/).slice(0,2).map(part=>part[0]).join('')}</div><div><span className={`public-editorial__badge public-editorial__badge--${member.group}`}>{label}</span><h3>{member.full_name}</h3>{member.status?<p>{member.status}</p>:null}</div></div>
        <dl className="public-editorial-card__details">{member.workplace?<div><dt>{t.workplace}</dt><dd>{member.workplace}</dd></div>:null}{member.citizenship?<div><dt>{t.citizenship}</dt><dd>{member.citizenship}</dd></div>:null}{member.h_index_wos!=null||member.h_index_scopus!=null?<div><dt>{t.hIndex}</dt><dd>{member.h_index_wos!=null?`WoS: ${member.h_index_wos}`:''}{member.h_index_wos!=null&&member.h_index_scopus!=null?' · ':''}{member.h_index_scopus!=null?`Scopus: ${member.h_index_scopus}`:''}</dd></div>:null}</dl>
        {member.orcid||member.scopus_author_id||member.researcher_id?<div className="public-editorial-card__ids"><span>{t.ids}</span><div>{member.orcid?<a href={`https://orcid.org/${member.orcid}`} target="_blank" rel="noreferrer">ORCID</a>:null}{member.scopus_author_id?<span>Scopus ID: {member.scopus_author_id}</span>:null}{member.researcher_id?<span>Researcher ID: {member.researcher_id}</span>:null}</div></div>:null}
      </article>)}</div>}
    </section>
  }

  return <div className="public-container"><section className="section public-section public-editorial"><p className="eyebrow">{t.eyebrow}</p><h1 className="hero__title">{t.title}</h1><p className="subtitle">{t.subtitle}</p>{loading?<div className="public-editorial__empty">{t.loading}</div>:<div className="public-editorial__groups">{renderGroup('collegium')}{renderGroup('council')}</div>}</section></div>
}
