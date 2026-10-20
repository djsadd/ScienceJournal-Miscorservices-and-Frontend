import { useLanguage } from '../shared/LanguageContext'

export function PolicyAIPage() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      eyebrow: 'регламенты',
      title: 'Заявление об отношении к использованию ИИ',
      text:
        'Приём материалов, созданных с использованием ИИ, допускается только с прозрачным указанием инструментов и степени участия автора. Ответственность за корректность, авторство и отсутствие заимствований несёт автор.',
      heading: 'Политика применения искусственного интеллекта',
      paragraphs: [
        'Журнал «Известия университета „Туран-Астана“» допускает использование генеративного искусственного интеллекта (ИИ) исключительно как вспомогательного инструмента при подготовке рукописей — например, для редактирования, перевода, структурирования или форматирования текста. Использование ИИ не может заменять научный вклад автора, а системы ИИ не могут указываться в качестве авторов или соавторов публикации.',
        'При подаче статей авторы обязаны раскрывать факт использования ИИ в файле «Title page» и в тексте «Manuscript» отдельным разделом перед списком литературы, указав инструмент и цель его применения. Общий уровень оригинальности рукописи должен составлять не менее 80%.',
        'Запрещается использовать ИИ для генерации эмпирических данных или научных выводов, написания всей рукописи либо её существенной части, создания фиктивных источников, автоматического подбора непроверенных ссылок и искусственного повышения оригинальности текста.',
        'В системы ИИ запрещено загружать неопубликованные рукописи, рецензии, персональные данные и иные конфиденциальные материалы редакционного процесса. Требование распространяется на авторов, редакторов и рецензентов. Рецензентам запрещено применять ИИ для научной экспертизы рукописей.',
        'Сообщение рецензента о признаках использования генеративного ИИ обязательно рассматривается редакцией и может стать основанием для запроса разъяснений или дополнительной проверки.',
        'Редакция вправе запрашивать разъяснения и проводить выборочные проверки. Недекларированное использование ИИ или нарушение этих правил считается нарушением публикационной этики и является основанием для отклонения рукописи.',
      ],
    },
    en: {
      eyebrow: 'policies',
      title: 'Statement on AI usage',
      text:
        'Submissions created with AI are accepted only with transparent disclosure of tools and the author’s level of involvement. The author is responsible for accuracy, authorship and absence of plagiarism.',
      heading: 'Artificial intelligence policy',
      paragraphs: [
        '“Turan-Astana University News” permits generative artificial intelligence (AI) solely as an assistive tool in manuscript preparation, for example for editing, translation, structuring, or formatting. AI cannot replace an author’s scholarly contribution, and AI systems cannot be named as authors or co-authors.',
        'When submitting an article, authors must disclose any use of AI in the “Title page” file and in a separate section of the “Manuscript” before the references, naming the tool and its purpose. The manuscript must have an overall originality score of at least 80%.',
        'AI must not be used to generate empirical data or scientific conclusions, write all or a substantial part of a manuscript, create fictitious sources, select references automatically without author verification, or artificially increase text originality.',
        'Unpublished manuscripts, reviews, personal data, and other confidential editorial materials must not be uploaded to AI systems. This applies to authors, editors, and reviewers. Reviewers may not use AI to conduct the scholarly assessment of manuscripts.',
        'Any indication from a reviewer that an author may have used generative AI must be considered by the editors and may lead to a request for clarification or an additional manuscript check.',
        'The editors may request explanations and conduct spot checks. Undisclosed AI use or a breach of these rules is treated as a violation of publication ethics and may result in rejection.',
      ],
    },
    kz: {
      eyebrow: 'ережелер',
      title: 'ЖИ қолдануға қатысты мәлімдеме',
      text:
        'ЖИ көмегімен жасалған материалдар тек қолданылған құралдарды және автордың қатысу деңгейін ашық көрсету арқылы қабылданады. Дұрыстығы, авторлығы және плагиаттың болмауы үшін автор жауап береді.',
      heading: 'Жасанды интеллектіні қолдану саясаты',
      paragraphs: [
        '«Тұран-Астана» университетінің хабарлары» журналы генеративті жасанды интеллектіні (ЖИ) қолжазбаны дайындау кезінде тек көмекші құрал ретінде, мысалы мәтінді редакциялау, аудару, құрылымдау немесе форматтау үшін пайдалануға рұқсат етеді. ЖИ автордың ғылыми үлесін алмастыра алмайды және ЖИ жүйелері автор немесе бірлескен автор ретінде көрсетілмейді.',
        'Мақала жіберген кезде авторлар ЖИ қолданылғанын «Title page» файлында және «Manuscript» мәтінінде әдебиеттер тізімінің алдындағы жеке бөлімде ашық көрсетіп, құралдың атауы мен қолдану мақсатын жазуға міндетті. Қолжазбаның жалпы түпнұсқалық деңгейі кемінде 80% болуы тиіс.',
        'ЖИ-ді эмпирикалық деректер мен ғылыми қорытындылар жасауға, қолжазбаны толық немесе елеулі бөлігін жазуға, жалған дереккөздер құруға, сілтемелерді автор тексермей автоматты таңдауға және мәтіннің түпнұсқалығын жасанды арттыруға пайдалануға тыйым салынады.',
        'ЖИ жүйелеріне жарияланбаған қолжазбаларды, рецензияларды, дербес деректерді және редакциялық үдеріске қатысты өзге құпия материалдарды жүктеуге болмайды. Бұл талап авторларға, редакторларға және рецензенттерге қолданылады. Рецензенттерге қолжазбаны ғылыми сараптау үшін ЖИ қолдануға тыйым салынады.',
        'Рецензент генеративті ЖИ қолдану белгілері туралы хабарлаған жағдайда, редакция бұл ақпаратты міндетті түрде қарап, автордан түсініктеме сұрата немесе қосымша тексеру жүргізе алады.',
        'Редакция авторлардан түсініктеме сұрауға және іріктеп тексеру жүргізуге құқылы. ЖИ қолдануды жарияламау немесе осы қағидаларды бұзу жариялау этикасын бұзу болып саналады және қолжазбаны қабылдамауға негіз болады.',
      ],
    },
  }[lang]

  return (
    <div className="public-container public-container--editorial-wide">
      <div className="section public-section policy-text-page">
          <h1 className="hero__title">{t.heading}</h1>
          <section className="policy-text-section">
            {t.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
      </div>
    </div>
  )
}
