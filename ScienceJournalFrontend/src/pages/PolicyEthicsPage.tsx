import { useLanguage } from '../shared/LanguageContext'

type LocalizedSection = [string, string[]]

export function PolicyEthicsPage() {
  const { lang } = useLanguage()
  const ruSections = [
    ['Авторство и вклад', [
      'Журнал «Известия университета „Туран-Астана“» следует руководящим принципам авторства, принятым в международной практике. Авторство должно быть отнесено только к тем, кто внёс существенный вклад в разработку концепции, сбор данных, дизайн исследования, анализ, интерпретацию или написание рукописи. Те, кто внёс существенный вклад в написание статьи, должны быть включены в качестве соавторов.',
      'Все авторы должны участвовать в разработке и доработке рукописи, а также в утверждении окончательной версии и, следовательно, нести ответственность за все аспекты работы. Если была оказана финансовая помощь, техническая поддержка или иной вклад со стороны лиц, не являющихся авторами, это должно быть указано в разделе благодарностей.',
    ]],
    ['Конфликт интересов', ['Все авторы рукописей, представленных в журнал «Известия университета „Туран-Астана“», должны заявить о любых конфликтах интересов, которые могут иметь отношение к их исследованию. Конфликты интересов могут включать финансовые, коммерческие, юридические или профессиональные отношения с другими организациями или лицами, которые могут повлиять на исследование или интерпретацию его результатов. После публикации статьи наличие или отсутствие конфликта интересов указывается в соответствующем разделе библиометрических данных в конце статьи.']],
    ['Финансирование', ['Журнал «Известия университета „Туран-Астана“» требует от авторов раскрытия любых источников финансирования, включая финансовую поддержку исследования. Авторы должны описать роль любых спонсоров, если таковые имеются, на протяжении всего процесса исследования — от этапа разработки до подачи рукописи на публикацию.']],
    ['Конфиденциальность', ['Конфиденциальность информации, полученной в ходе исследования, имеет решающее значение, и такие данные никогда не должны использоваться без явного разрешения. Исследователи должны принимать все необходимые меры для защиты конфиденциальности участников исследований и предотвращения любого потенциального вреда. Любая информация, которая может идентифицировать участников исследования, включая респондентов опросов, должна быть удалена из рукописей.']],
    ['Плагиат и недобросовестная практика', [
      'Авторам запрещаются плагиат, самоплагиат, дублирование или множественные публикации, фальсификация, нарушение авторских прав, мошенничество и другие неэтичные действия.',
      'Авторы должны гарантировать, что представленные рукописи являются оригинальными работами, соответствующими этическим стандартам и применимому законодательству. Все представленные материалы проверяются с помощью автоматизированных программ для предотвращения плагиата в любой форме. Плагиат недопустим и является неэтичным поведением в издательской деятельности.',
    ]],
    ['Многократная подача рукописей', ['Журнал «Известия университета „Туран-Астана“» придерживается принципа единовременной подачи: одна рукопись может быть подана только в один журнал одновременно. Подача в другие журналы не допускается до получения письменного отказа. Одновременная подача одной и той же рукописи в несколько журналов запрещена.']],
    ['Жалобы и апелляции', ['При отборе статей для публикации и проведении редакционных процедур редакторы обладают значительной свободой действий, в том числе в части отклонения или недопуска к публикации статей, не соответствующих тематике, политике и иным требованиям журнала «Известия университета „Туран-Астана“» и международной публикационной практике. При окончательном выборе учитываются актуальность, новизна и значимость исследования, качество изложения материала и разнообразие тематики. Авторы могут направлять жалобы или апелляции по адресу journal@tau-edu.kz, предоставив подробное описание проблемы и подтверждающие документы. Обращения рассматриваются в соответствии с политикой и процедурами COPE.']],
    ['Соблюдение этических норм', ['Все участники издательского процесса — редакторы, рецензенты, авторы и издатели — обязаны придерживаться строгих этических принципов. Этическое регулирование охватывает получение согласия на публикацию, проведение исследований с участием людей, животных и уязвимых групп населения, обеспечение конфиденциальности данных и применение этичных методов маркетинга.']],
    ['Интеллектуальная собственность', ['Авторам следует избегать использования в рукописях материалов, защищённых авторским правом. Если такие материалы необходимы, авторы обязаны получить прямое разрешение правообладателя в соответствии с действующим законодательством и нормативными актами. Разрешение должно быть получено на условиях лицензии Creative Commons Attribution License с указанием авторства.']],
    ['Исправления и отзыв статей после публикации', ['Несмотря на многократные проверки при подготовке к публикации, в опубликованных материалах могут встречаться ошибки. При их обнаружении, независимо от причин возникновения, исправления вносятся путём публикации уведомления с разъяснением изменений исходного текста. Серьёзные ошибки, ставящие под сомнение результаты и выводы исследования, могут привести к отзыву статьи. Журнал оставляет за собой право отозвать статью при выявлении серьёзных нарушений этических норм, включая плагиат. В таких ситуациях журнал руководствуется собственными этическими стандартами и рекомендациями COPE.']],
  ] as const

  const translated: { title: string; intro: string[]; sections: LocalizedSection[] } = lang === 'en' ? {
    title: 'Publication ethics',
    intro: ['“Turan-Astana University News” is a double-blind peer-reviewed scholarly journal that follows international publishing ethics standards. The publisher, editors, reviewers, and authors must observe these principles to ensure high-quality research.', 'The journal strictly follows the principles of the Committee on Publication Ethics (COPE).'],
    sections: [
      ['Authorship and contributions', ['Authorship is limited to persons who made a substantial contribution to the concept, data collection, study design, analysis, interpretation, or writing. All substantial contributors must be listed as co-authors.', 'All authors must participate in preparing and revising the manuscript, approve its final version, and accept responsibility for the work. Financial, technical, or other support from non-authors must be acknowledged.']],
      ['Conflicts of interest', ['Authors must disclose any financial, commercial, legal, or professional relationships that could affect the research or interpretation of its results. The presence or absence of a conflict is stated in the published article.']],
      ['Funding', ['Authors must disclose all funding and describe the role of sponsors, if any, from study design through manuscript submission.']],
      ['Confidentiality', ['Research information must remain confidential and must not be used without explicit permission. Researchers must protect participants and remove any information that could identify them.']],
      ['Plagiarism and misconduct', ['Plagiarism, self-plagiarism, duplicate or multiple publication, fabrication, copyright infringement, fraud, and other unethical conduct are prohibited.', 'Submitted manuscripts must be original and comply with ethical standards and applicable law. All submissions are checked with automated plagiarism-detection systems.']],
      ['Multiple submissions', ['A manuscript may be submitted to only one journal at a time. Submission elsewhere is not permitted until a written rejection has been received.']],
      ['Complaints and appeals', ['Editors may reject work that does not meet the journal’s scope, policies, or international publishing standards. Decisions consider relevance, novelty, significance, presentation, and thematic diversity. Complaints and appeals may be sent to journal@tau-edu.kz with details and supporting documents and are handled under COPE procedures.']],
      ['Ethical compliance', ['Editors, reviewers, authors, and publishers must follow strict ethical principles concerning publication consent, research involving humans, animals and vulnerable groups, data confidentiality, and ethical marketing.']],
      ['Intellectual property', ['Authors should avoid copyrighted content. Where its use is necessary, direct permission must be obtained from the rights holder in accordance with applicable law and the Creative Commons Attribution License.']],
      ['Corrections and retractions', ['Errors are corrected through a published notice explaining changes to the original text. Serious errors or ethical breaches, including plagiarism, may lead to retraction in accordance with the journal’s standards and COPE guidance.']],
    ],
  } : {
    title: 'Жариялау этикасы',
    intro: ['«Тұран-Астана» университетінің хабарлары» — қос соқыр рецензиялау қағидаты бойынша жұмыс істейтін және халықаралық баспа этикасы стандарттарын ұстанатын ғылыми журнал. Зерттеулердің жоғары сапасын қамтамасыз ету үшін баспагер, редакция, рецензенттер мен авторлар осы қағидаларды сақтауға міндетті.', 'Журнал Жариялау этикасы жөніндегі комитеттің (COPE) қағидаттарын қатаң ұстанады.'],
    sections: [
      ['Авторлық және үлес', ['Авторлық тұжырымдамаға, деректер жинауға, зерттеу дизайнына, талдауға, түсіндіруге немесе қолжазбаны жазуға елеулі үлес қосқан тұлғаларға ғана беріледі. Елеулі үлес қосқандар бірлескен автор ретінде көрсетілуі тиіс.', 'Барлық авторлар қолжазбаны дайындауға және жетілдіруге қатысып, соңғы нұсқасын мақұлдауға және жұмыс үшін жауапкершілік алуға міндетті. Автор болып табылмайтын тұлғалардың қаржылық, техникалық немесе өзге көмегі алғыс бөлімінде көрсетіледі.']],
      ['Мүдделер қақтығысы', ['Авторлар зерттеуге немесе нәтижелерді түсіндіруге әсер етуі мүмкін қаржылық, коммерциялық, құқықтық немесе кәсіби қатынастарды ашып көрсетуге міндетті. Мүдделер қақтығысының болуы не болмауы жарияланған мақалада көрсетіледі.']],
      ['Қаржыландыру', ['Авторлар барлық қаржыландыру көздерін ашып, демеушілердің зерттеуді әзірлеуден қолжазбаны жіберуге дейінгі рөлін сипаттауы тиіс.']],
      ['Құпиялылық', ['Зерттеу барысында алынған ақпарат құпия сақталып, нақты рұқсатсыз пайдаланылмауы керек. Зерттеушілер қатысушыларды қорғап, оларды анықтауға мүмкіндік беретін мәліметтерді алып тастауға міндетті.']],
      ['Плагиат және жосықсыз әрекет', ['Плагиатқа, автоплагиатқа, қайталама немесе бірнеше рет жариялауға, деректерді бұрмалауға, авторлық құқықты бұзуға, алаяқтыққа және өзге этикаға жат әрекеттерге тыйым салынады.', 'Қолжазбалар түпнұсқа болып, этикалық стандарттар мен заңнамаға сәйкес келуі тиіс. Барлық материал плагиатты анықтайтын автоматтандырылған жүйелермен тексеріледі.']],
      ['Қолжазбаны бірнеше басылымға жіберу', ['Бір қолжазба бір уақытта тек бір журналға ұсынылады. Жазбаша бас тарту алынғанға дейін оны өзге журналға жіберуге болмайды.']],
      ['Шағымдар мен апелляциялар', ['Редакторлар журналдың тақырыбына, саясатына немесе халықаралық жариялау стандарттарына сәйкес келмейтін жұмысты қабылдамауға құқылы. Шешімде өзектілік, жаңалық, маңыз, баяндау сапасы және тақырыптық әртүрлілік ескеріледі. Шағымдар мен апелляциялар толық сипаттамасы және дәлелдерімен journal@tau-edu.kz мекенжайына жіберіліп, COPE рәсімдеріне сәйкес қаралады.']],
      ['Этикалық нормаларды сақтау', ['Редакторлар, рецензенттер, авторлар мен баспагерлер жариялауға келісім, адамдар, жануарлар және осал топтар қатысатын зерттеулер, деректер құпиялылығы мен этикалық маркетингке қатысты қатаң қағидаларды сақтауы тиіс.']],
      ['Зияткерлік меншік', ['Авторлар авторлық құқықпен қорғалған материалдарды пайдаланудан аулақ болуы керек. Қажет жағдайда құқық иеленушіден заңнамаға және Creative Commons Attribution лицензиясына сәйкес тікелей рұқсат алынуы тиіс.']],
      ['Жарияланған мақалаларды түзету және кері қайтарып алу', ['Қателер анықталған кезде бастапқы мәтіндегі өзгерістер түсіндірілген хабарлама жарияланады. Нәтижелерге күмән келтіретін елеулі қателер немесе плагиатты қоса алғанда этикалық бұзушылықтар журнал стандарттары мен COPE ұсынымдарына сай мақаланы кері қайтарып алуға әкелуі мүмкін.']],
    ],
  }

  return (
    <div className="public-container">
      <div className="section public-section policy-text-page">
        {lang === 'ru' ? <>
          <h1 className="hero__title">Публикационная этика</h1>
          <div className="policy-text-section">
            <p>Журнал «Известия университета „Туран-Астана“» — научный журнал, работающий по принципу двойного слепого рецензирования и придерживающийся международных стандартов издательской этики. Журнал принимает все необходимые меры для предотвращения нарушений в издательской деятельности. Все стороны, участвующие в процессе публикации, включая издателя, редакционный персонал, рецензентов и авторов, обязаны соблюдать руководящие принципы и стандарты для обеспечения высокого качества исследований.</p>
            <p>Журнал строго придерживается принципов <a href="https://publicationethics.org/resources/guidelines" target="_blank" rel="noreferrer">Комитета по издательской этике — COPE</a>.</p>
          </div>
          {ruSections.map(([heading, paragraphs]) => <section className="policy-text-section" key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{heading === 'Жалобы и апелляции' && <p><a href="mailto:journal@tau-edu.kz">journal@tau-edu.kz</a> · <a href="https://publicationethics.org/" target="_blank" rel="noreferrer">COPE</a></p>}{heading === 'Интеллектуальная собственность' && <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Attribution License 4.0</a></p>}</section>)}
        </> : <>
          <h1 className="hero__title">{translated.title}</h1>
          <div className="policy-text-section">{translated.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          {translated.sections.map(([heading, paragraphs]) => <section className="policy-text-section" key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
        </>}
      </div>
    </div>
  )
}
