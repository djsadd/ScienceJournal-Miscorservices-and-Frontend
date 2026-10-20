import { useLanguage } from '../shared/LanguageContext'

type LocalizedSection = [string, string[]]

export function PoliciesPage() {
  const { lang } = useLanguage()

  const ruSections = [
    ['Политика свободного доступа', [
      'Архив номеров журнала, информация о журнале и документация, регламентирующая основные вопросы и процессы его подготовки и выпуска, размещаются на сайте на трёх языках — казахском, русском и английском — в открытом доступе. Плата за доступ к журналу и информации о нём с читателей не взимается.',
      'Статьи, опубликованные в журнале, регистрируются в базе Crossref, каждой из них присваивается DOI (Digital Object Identifier — цифровой идентификатор объекта) для облегчения доступа международного научного сообщества и обеспечения надлежащего цитирования.',
    ]],
    ['Авторское право и лицензирование', [
      'Авторы сохраняют авторские права на свои публикации и предоставляют журналу право на первичную публикацию статьи на условиях лицензии Creative Commons Attribution 4.0 International License.',
      'Лицензия разрешает третьим лицам читать, скачивать, копировать, распространять и воспроизводить опубликованные материалы в некоммерческих целях при условии обязательного указания авторства и ссылки на лицензию.',
    ]],
    ['Редакционная коллегия', [
      'В состав редакционной коллегии и редакционного совета входят авторитетные казахстанские и зарубежные учёные и эксперты, имеющие публикации в международных базах данных Web of Science или Scopus по тематическим направлениям журнала.',
      'Состав редакционной коллегии указывается на сайте и в печатной версии журнала.',
    ]],
    ['Периодичность и язык издания', [
      'Журнал выходит четыре раза в год — ежеквартально. К публикации принимаются статьи на казахском, русском или английском языках. Библиометрическая информация — сведения об авторах, аннотации, ключевые слова и списки использованных источников — публикуется на всех трёх языках для каждой статьи.',
    ]],
    ['Условия конфиденциальности', [
      'В разделе «Сведения об авторах» в каждом номере журнала на трёх языках публикуется информация, подлежащая открытому размещению в соответствии с казахстанскими и международными требованиями: Ф. И. О., место работы — организация и структурное подразделение, занимаемая должность или статус, учёная степень и учёное звание при их наличии.',
      'В соответствии с международной практикой для каждой статьи указываются email и ORCID автора для корреспонденции. Для авторского коллектива публикуются данные одного из соавторов. При отсутствии ORCID корреспондирующему автору необходимо получить идентификатор путём регистрации на сайте ORCID.',
      'Иные сведения — номер телефона, адрес и прочие данные, указанные при подаче статьи, — доступны только членам редакционной коллегии и сотрудникам университета, непосредственно работающим с рукописями и формированием номеров журнала. Они не подлежат публикации или разглашению третьим лицам.',
      'Для обеспечения объективности и качества отбора статей действует политика двустороннего слепого рецензирования: рецензентам не сообщаются сведения об авторах, а авторам — сведения о рецензентах.',
      'Публикуемые материалы не обязательно отражают точку зрения редакционной коллегии. Редакция оставляет за собой право отбирать качественные статьи и отклонять неподходящие материалы без разъяснения причин, а также не несёт ответственности за достоверность содержания статей и предоставляемой авторами информации.',
    ]],
  ] as const

  const translated: { title: string; sections: LocalizedSection[] } = lang === 'en' ? {
    title: 'Editorial policy',
    sections: [
      ['Open-access policy', ['The journal archive, information about the journal, and documents governing its preparation and publication are freely available on the website in Kazakh, Russian, and English. Readers are not charged for access.', 'Published articles are registered with Crossref and assigned a DOI (Digital Object Identifier) to improve international discoverability and ensure proper citation.']],
      ['Copyright and licensing', ['Authors retain copyright and grant the journal the right of first publication under the Creative Commons Attribution 4.0 International License.', 'The licence permits others to read, download, copy, distribute, and reproduce published materials provided that authorship is credited and the licence is cited.']],
      ['Authorship criteria and contributions', ['Authorship requires all of the following: a substantial contribution to the study concept or design, data collection, analysis, or interpretation; drafting or critically revising the manuscript for significant intellectual content; and final approval of the version submitted for publication.']],
      ['Article submission and review policy', ['The journal uses double-blind peer review. Authors submit a “Title page” containing author, funding, and contribution details, and an anonymised “Manuscript”. Reviewers must be independent, competent in the subject, timely, objective, and free of discriminatory or offensive language.', 'Manuscripts are accepted throughout the year, but review does not guarantee publication. Authors are notified of rejection or required revisions. Accepted articles undergo proofreading and layout before publication as PDF files in the issue archive.']],
      ['Editorial board', ['The editorial board and council include respected Kazakhstani and international scholars and experts with Web of Science or Scopus publications in the journal’s subject areas. Their membership is listed online and in the print journal.']],
      ['Frequency and languages', ['The journal is published quarterly. Articles are accepted in Kazakh, Russian, or English. Author details, abstracts, keywords, and reference lists are published in all three languages for every article.']],
      ['Privacy', ['Each issue publishes author information required under Kazakhstani and international standards: full name, affiliation and unit, position or status, academic degree, and title where applicable.', 'The corresponding author’s email and ORCID are provided. Other submission data, including telephone numbers and addresses, are available only to authorised editorial and university staff and are not disclosed to third parties.', 'Double-blind review protects the identities of authors and reviewers. Published views do not necessarily represent the editorial board; the editors select suitable articles and are not responsible for the accuracy of content supplied by authors.']],
    ],
  } : {
    title: 'Редакциялық саясат',
    sections: [
      ['Ашық қолжетімділік саясаты', ['Журнал мұрағаты, журнал туралы ақпарат және оны дайындау мен шығарудың негізгі үдерістерін реттейтін құжаттар сайтта қазақ, орыс және ағылшын тілдерінде ашық қолжетімді. Оқырмандардан қолжетімділік үшін ақы алынбайды.', 'Жарияланған мақалалар Crossref базасында тіркеліп, халықаралық ғылыми қоғамдастықтың қолжетімділігі мен дұрыс дәйексөз келтіруді қамтамасыз ету үшін әрқайсысына DOI беріледі.']],
      ['Авторлық құқық және лицензиялау', ['Авторлар өз жарияланымдарына авторлық құқықты сақтап, журналға Creative Commons Attribution 4.0 International License шарттарымен алғашқы жариялау құқығын береді.', 'Лицензия авторлықты және лицензияға сілтемені міндетті түрде көрсету шартымен материалдарды оқуға, жүктеуге, көшіруге, таратуға және қайта шығаруға мүмкіндік береді.']],
      ['Авторлық критерийлері және авторлардың үлесі', ['Авторлық үшін мына талаптардың барлығы орындалуы тиіс: зерттеу тұжырымдамасына немесе дизайнына, деректер жинауға, талдауға не түсіндіруге елеулі үлес қосу; қолжазбаны дайындау немесе маңызды зияткерлік мазмұн енгізе отырып сыни қайта қарау; жариялауға ұсынылатын соңғы нұсқаны мақұлдау.']],
      ['Мақалаларды қабылдау және рецензиялау саясаты', ['Журналда қос соқыр рецензиялау қолданылады. Авторлар авторлар, қаржыландыру және үлес туралы мәліметтері бар «Title page» файлын және авторды анықтайтын ақпаратсыз «Manuscript» файлын береді. Рецензенттер тәуелсіз, тақырып бойынша құзыретті, уақтылы және объективті болуы, кемсітетін не қорлайтын сөз қолданбауы тиіс.', 'Қолжазбалар жыл бойы қабылданады, бірақ рецензиялау жариялануға кепілдік бермейді. Авторға қабылдамау немесе түзету қажеттілігі хабарланады. Қабылданған мақала корректорлық өңдеу мен беттеуден өтіп, шығарылым мұрағатында PDF форматында жарияланады.']],
      ['Редакциялық алқа', ['Редакциялық алқа мен кеңес құрамына журнал тақырыптары бойынша Web of Science немесе Scopus базаларында жарияланымдары бар беделді қазақстандық және шетелдік ғалымдар мен сарапшылар кіреді. Құрамы сайтта және журналдың баспа нұсқасында көрсетіледі.']],
      ['Шығу мерзімділігі және тілдері', ['Журнал тоқсан сайын жылына төрт рет шығады. Мақалалар қазақ, орыс немесе ағылшын тілдерінде қабылданады. Авторлар туралы мәліметтер, аңдатпалар, түйін сөздер және әдебиеттер тізімі әр мақала үшін үш тілде жарияланады.']],
      ['Құпиялылық шарттары', ['Әр шығарылымда қазақстандық және халықаралық талаптарға сәйкес авторлардың аты-жөні, жұмыс орны мен бөлімшесі, лауазымы немесе мәртебесі, ғылыми дәрежесі мен атағы жарияланады.', 'Хат-хабарға жауапты автордың email және ORCID деректері көрсетіледі. Телефон нөмірі, мекенжай және өтінімдегі өзге ақпарат тек уәкілетті редакция және университет қызметкерлеріне қолжетімді және үшінші тұлғаларға берілмейді.', 'Қос соқыр рецензиялау авторлар мен рецензенттердің тұлғасын қорғайды. Жарияланған пікірлер редакциялық алқаның көзқарасын міндетті түрде білдірмейді; редакция лайықты мақалаларды іріктейді және авторлар ұсынған мазмұнның дұрыстығына жауап бермейді.']],
    ],
  }

  return (
    <div className="public-container">
      <div className="section public-section policy-text-page">
        {lang === 'ru' ? <>
          <h1 className="hero__title">Редакционная политика</h1>
          {ruSections.slice(0, 2).map(([heading, paragraphs]) => <section className="policy-text-section" key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{heading === 'Авторское право и лицензирование' && <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0 International License</a></p>}</section>)}
          <section className="policy-text-section">
            <h2>Критерии авторства и вклад авторов</h2>
            <p>Авторство должно основываться на одновременном выполнении всех следующих условий:</p>
            <ol>
              <li>существенный вклад в разработку концепции и дизайна исследования, сбор данных либо анализ и интерпретацию данных;</li>
              <li>подготовка рукописи или её критический пересмотр с целью внесения значимого интеллектуального содержания;</li>
              <li>окончательное утверждение версии статьи, подаваемой к публикации.</li>
            </ol>
          </section>
          <section className="policy-text-section">
            <h2>Политика приёма и рецензирования статей</h2>
            <p>В журнале действует политика двустороннего слепого рецензирования: рецензентам не сообщаются сведения об авторах, а авторам — сведения о рецензентах. При подаче статьи авторы предоставляют два файла: «Title page» со сведениями об авторах, источниках финансирования и вкладе авторов, а также «Manuscript» с рукописью без информации, которая может быть использована для идентификации авторов.</p>
            <p>Основные принципы рецензирования:</p>
            <ul>
              <li>рецензенты не должны иметь конфликта интересов с авторами — родственных, профессиональных или финансовых связей;</li>
              <li>рецензенты отбираются на основе научной компетенции и опыта по тематике рукописи;</li>
              <li>рецензирование проводится в разумные сроки, обеспечивающие качество и оперативность публикационного процесса;</li>
              <li>рецензии должны быть объективными, аргументированными и свободными от дискриминационных, оскорбительных или субъективных высказываний;</li>
              <li>оценка рукописей не зависит от национальности, пола, религиозных или политических взглядов авторов.</li>
            </ul>
            <p>Рецензенты привлекаются как из числа членов редакционной коллегии, так и из числа внешних независимых экспертов по тематике журнала.</p>
            <p>Журнал принимает рукописи на протяжении всего года, однако применение двустороннего слепого рецензирования не гарантирует публикацию каждой поступившей статьи. При отрицательных заключениях или наличии замечаний автор получает уведомление, а статья снимается с рассмотрения окончательно либо до её доработки с устранением замечаний.</p>
            <p>Если принято решение о публикации, редакция направляет автору соответствующее уведомление. Статья проходит допечатную подготовку — корректуру и вёрстку — в рамках формирования номера журнала, после чего размещается в формате PDF на сайте в разделе «Архив выпусков».</p>
          </section>
          {ruSections.slice(2).map(([heading, paragraphs]) => <section className="policy-text-section" key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
        </> : <><h1 className="hero__title">{translated.title}</h1>{translated.sections.map(([heading, paragraphs]) => <section className="policy-text-section" key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</>}
      </div>
    </div>
  )
}
