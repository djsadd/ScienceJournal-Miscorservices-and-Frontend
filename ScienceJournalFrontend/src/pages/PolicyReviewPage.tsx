import { useLanguage } from '../shared/LanguageContext'

export function PolicyReviewPage() {
  const { lang } = useLanguage()
  const translated = lang === 'en' ? {
    title: 'Peer review',
    sections: [
      { heading: 'Review process', paragraphs: [
        'All manuscripts submitted to “Turan-Astana University News” are first assessed by the executive secretary and/or managing editor to determine whether they should proceed to peer review or be rejected at the preliminary stage (desk rejection). The assessment considers the journal’s scope, scholarly quality, and compliance with its requirements. If necessary, the manuscript is returned for revision with comments sent through the author’s account.',
        'Suitable manuscripts are sent to two or more experts, who identify the general and specific strengths and weaknesses of the work.',
        'The journal uses double-blind peer review, keeping authors and reviewers anonymous throughout the process. A first decision is normally made within three months, although timing may vary according to reviewer availability and unforeseen circumstances. Reviewers are encouraged to provide constructive comments even when publication is not recommended.',
        'Reviews are submitted through the reviewer’s account. The reviewer recommends acceptance, revision, or rejection. Comments are sent to the author through their account; the author uploads a revised version, which may be reviewed again. The executive secretary and/or managing editor then prepares recommendations for the editorial board, which makes the final decision.',
        'The journal follows an exclusive-submission policy. Manuscripts under consideration elsewhere or previously published are not accepted.',
      ], list: ['recommend the manuscript for publication;', 'return the manuscript to the author for revision;', 'reject the manuscript.'] },
      { heading: 'Review policy', paragraphs: [
        'Reviewers and authors must not be close colleagues, relatives, participants in the same research project, or otherwise closely connected.',
        'Reviewers should accept only manuscripts within their field of expertise and should respond promptly and submit their reports within a reasonable time.',
        'Reviews must not be influenced by an author’s nationality, religion, political views, gender, other personal characteristics, or commercial interests. Reports must be constructive and free of hostile language, personal attacks, defamation, or derogatory comments.',
        'Reviewers may be selected from the journal’s editorial board, Turan-Astana University staff, and external experts. They should assess the manuscript’s fit with the journal, scholarly contribution, relevance, methods, argument, conclusions, references, and structure.',
      ], list: ['Does the article fit the journal’s scope?', 'Is its scholarly contribution clearly stated, relevant, and meaningful?', 'Are the argument, materials, methods, analysis, and conclusions sound?', 'Are the references accurate, current, and consistent?', 'Does the heading structure match the content?'] },
    ],
  } : {
    title: 'Рецензиялау',
    sections: [
      { heading: 'Рецензиялау үдерісі', paragraphs: [
        '«Тұран-Астана» университетінің хабарлары» журналына түскен барлық қолжазбаны редакциялық алқаның жауапты хатшысы және/немесе шығарушы редактор алдымен рецензиялауға жіберу не алдын ала кезеңде қабылдамау (desk reject) тұрғысынан бағалайды. Бағалау мақаланың журнал тақырыбына сәйкестігіне, ғылыми сапасына және талаптарды орындауына негізделеді. Қажет болса, ескертулер автордың жеке кабинетіне жіберіліп, мақала пысықтауға қайтарылады.',
        'Талаптарға сай қолжазбалар жұмыстың жалпы және нақты артықшылықтары мен кемшіліктерін анықтау үшін екі немесе одан да көп сарапшыға жіберіледі.',
        'Журнал қос соқыр рецензиялауды қолданады: бүкіл үдеріс барысында авторлар мен рецензенттер бір-біріне белгісіз болады. Алғашқы шешім әдетте үш ай ішінде қабылданады, бірақ мерзім рецензенттердің қолжетімділігіне және күтпеген жағдайларға байланысты өзгеруі мүмкін. Жариялау ұсынылмаған жағдайда да рецензенттер сындарлы пікір беруге тиіс.',
        'Рецензия рецензенттің жеке кабинетіндегі нысан арқылы беріледі. Рецензент жариялауды, пысықтауды немесе қабылдамауды ұсынады. Ескертулер автордың кабинетіне жіберіледі; автор түзетілген нұсқаны жүктейді, қажет болса ол қайта рецензияланады. Жауапты хатшы және/немесе шығарушы редактор редакциялық алқаға ұсыным дайындайды, ал түпкілікті шешімді редакциялық алқа қабылдайды.',
        'Журнал қолжазбаны тек бір басылымға ұсыну саясатын ұстанады. Басқа журналда қаралып жатқан немесе бұрын жарияланған мақалалар қабылданбайды.',
      ], list: ['қолжазбаны жариялауға ұсыну;', 'қолжазбаны пысықтау үшін авторға қайтару;', 'қолжазбаны қабылдамау.'] },
      { heading: 'Рецензиялау саясаты', paragraphs: [
        'Рецензенттер мен авторлар жақын әріптестер, туыстар, бір зерттеу жобасының қатысушылары немесе өзге түрде тығыз байланысты болмауға тиіс.',
        'Рецензенттер тек өз құзыретіне сай қолжазбаларды қабылдап, шақыруларға уақтылы жауап беруге және пікірді орынды мерзімде ұсынуға міндетті.',
        'Пікір автордың ұлтына, дініне, саяси көзқарасына, жынысына, өзге жеке сипаттарына немесе коммерциялық мүдделерге тәуелді болмауы керек. Рецензиялар сындарлы болып, өшпенді сөздерден, жеке басына тиісуден, жала жабудан және кемсітетін пікірлерден ада болуы тиіс.',
        'Рецензенттер журналдың редакциялық алқасы, «Тұран-Астана» университетінің қызметкерлері және сыртқы сарапшылар арасынан таңдалуы мүмкін. Олар қолжазбаның журнал тақырыбына сәйкестігін, ғылыми үлесін, өзектілігін, әдістерін, дәлелдерін, қорытындыларын, сілтемелері мен құрылымын бағалайды.',
      ], list: ['Мақала журналдың тақырыбына сәйкес келе ме?', 'Ғылыми үлесі нақты тұжырымдалған ба және ол өзекті әрі мәнді ме?', 'Дәлелдер, материалдар, әдістер, талдау және қорытындылар негізді ме?', 'Сілтемелер дәл, өзекті және бірізді ме?', 'Тақырыптар құрылымы мазмұнға сәйкес пе?'] },
    ],
  }

  return (
    <div className="public-container">
      <div className="section public-section policy-text-page">
        {lang === 'ru' ? <>
          <h1 className="hero__title">Рецензирование</h1>
          <section className="policy-text-section">
            <h2>Процесс рецензирования</h2>
            <p>Все рукописи, поступающие на рассмотрение в журнал «Известия университета „Туран-Астана“», первоначально оцениваются ответственным секретарём редакционной коллегии и/или выпускающим редактором на предмет того, подходит ли рукопись для направления на рецензирование или должна быть отклонена на предварительном этапе («desk reject»). Оценка основывается на соответствии статьи тематике и интересам журнала, а также на общем уровне научного качества и соответствии требованиям журнала. При необходимости статья возвращается автору на доработку с замечаниями, которые направляются автору в виде сообщения в личном кабинете на сайте журнала.</p>
            <p>Рукописи, признанные подходящими для дальнейшего рассмотрения, направляются ответственным секретарём редакционной коллегии и/или выпускающим редактором на рецензирование двум или более экспертам, задачей которых является выявление общих и конкретных достоинств и недостатков работы.</p>
            <p>Журнал использует процедуру двойного слепого рецензирования, при которой авторы и рецензенты остаются анонимными на протяжении всего процесса. Первое решение, как правило, принимается в течение трёх месяцев с момента получения рукописи, однако сроки могут варьироваться в зависимости от доступности рецензентов и других непредвиденных обстоятельств. Рецензентам рекомендуется предоставлять конструктивные замечания, даже если статья не рекомендована к публикации.</p>
            <p>Рецензия подаётся путём заполнения формы в личном кабинете рецензента. Перед отправкой рецензии эксперт выбирает один из трёх вариантов заключения:</p>
            <ul>
              <li>рекомендовать рукопись к публикации;</li>
              <li>возвратить автору для доработки;</li>
              <li>отклонить рукопись.</li>
            </ul>
            <p>Ответственный секретарь или выпускающий редактор после ознакомления с рецензией и в случае наличия у рецензента замечаний направляет их автору в виде сообщения в личном кабинете на сайте журнала.</p>
            <p>Автор вносит исправления в рукопись и загружает в личном кабинете новую версию статьи, после чего ответственный секретарь или выпускающий редактор направляет статью на повторное рецензирование.</p>
            <p>На основе рецензий и собственной оценки ответственный секретарь и/или выпускающий редактор подготавливает рекомендации для редакционной коллегии.</p>
            <p>Окончательное решение о публикации либо отклонении статьи принимается редакционной коллегией.</p>
            <p>Журнал придерживается политики эксклюзивной подачи рукописей. Это означает, что статьи, находящиеся на рассмотрении в других журналах или уже опубликованные ранее, не принимаются к рассмотрению.</p>
          </section>
          <section className="policy-text-section">
            <h2>Политика рецензирования</h2>
            <p>Рецензенты и авторы не должны быть близкими коллегами, родственниками, участниками одного исследовательского проекта или иным образом тесно сотрудничать.</p>
            <p>Рецензенты должны принимать к рассмотрению только те рукописи, которые соответствуют их области экспертизы.</p>
            <p>Рецензенты обязаны своевременно отвечать на приглашения и предоставлять отзывы в разумные сроки, поскольку рецензирование является неотъемлемой частью академического процесса.</p>
            <p>Комментарии рецензентов не должны зависеть от национальности, религиозных или политических взглядов, пола или иных характеристик автора, а также от коммерческих интересов.</p>
            <p>Отзывы должны быть свободны от враждебных или провокационных формулировок.</p>
            <p>Рецензионные заключения не должны содержать личных нападок, клеветы или уничижительных комментариев.</p>
            <p>Рецензенты могут подбираться из числа членов редакционной коллегии журнала, сотрудников университета «Туран-Астана» и внешних экспертов.</p>
            <p>Рецензентам рекомендуется давать конструктивную оценку рукописи, руководствуясь следующими вопросами:</p>
            <ul>
              <li>Подходит ли поданная статья к тематике журнала?</li>
              <li>Сформулирован ли научный вклад статьи? Насколько данный вклад актуален, полезен и содержателен?</li>
              <li>Представлен ли в статье связный и логичный аргумент? Являются ли выбранные материалы, методы и анализ адекватными и корректно применёнными? Следуют ли выводы из представленного анализа?</li>
              <li>Являются ли ссылки точными, актуальными и последовательными?</li>
              <li>Соответствует ли структура заголовков содержанию?</li>
            </ul>
          </section>
        </> : <>
          <h1 className="hero__title">{translated.title}</h1>
          {translated.sections.map((section) => <section className="policy-text-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>)}
        </>}
      </div>
    </div>
  )
}
