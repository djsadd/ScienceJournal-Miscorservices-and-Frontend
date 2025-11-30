import type { JournalData } from '../shared/types'

export const journalData: JournalData = {
  users: [
    { id: 'author-1', name: 'Анна Климова', role: 'author', affiliation: 'СПбГУ' },
    { id: 'author-2', name: 'Илья Захаров', role: 'author', affiliation: 'МФТИ' },
    { id: 'author-3', name: 'София Самойлова', role: 'author', affiliation: 'МГУ' },
    { id: 'editor-1', name: 'Михаил Орлов', role: 'editor', affiliation: 'НИУ ВШЭ' },
    { id: 'editor-2', name: 'Дарья Платонова', role: 'editor', affiliation: 'Сколтех' },
    {
      id: 'reviewer-1',
      name: 'Рецензент А',
      role: 'reviewer',
      expertise: ['квантовые вычисления', 'материалы'],
    },
    {
      id: 'reviewer-2',
      name: 'Рецензент Б',
      role: 'reviewer',
      expertise: ['нейробиология', 'вычислительная медицина'],
    },
    {
      id: 'reviewer-3',
      name: 'Рецензент В',
      role: 'reviewer',
      expertise: ['космология', 'машинное обучение'],
    },
  ],
  articles: [
    {
      id: 'art-101',
      title: 'Моделирование фононных состояний в квантовых материалах',
      abstract:
        'Выявлены устойчивые состояния в слоистых материалах, что позволяет снизить тепловые потери в квантовых схемах.',
      status: 'in_review',
      specialty: 'квантовая физика',
      authors: ['author-1', 'author-2'],
      editorId: 'editor-1',
      submittedAt: '2025-02-10',
      version: 2,
      reviews: [
        {
          id: 'rev-1',
          articleId: 'art-101',
          reviewerId: 'reviewer-1',
          recommendation: 'minor',
          submittedAt: '2025-03-01',
          comments: 'Добавить сравнение с недавними результатами по охлаждению.',
          round: 1,
          isAnonymous: true,
        },
      ],
    },
    {
      id: 'art-102',
      title: 'Онлайн-оценка когнитивной нагрузки в нейрохирургии',
      abstract:
        'Предложена модель, предсказывающая перегрузку хирургов по данным нейронной активности в реальном времени.',
      status: 'submitted',
      specialty: 'медицина',
      authors: ['author-3'],
      editorId: 'editor-2',
      submittedAt: '2025-02-22',
      version: 1,
      reviews: [],
    },
    {
      id: 'art-103',
      title: 'Автоматическое обнаружение космических лучей в радиосигналах',
      abstract:
        'Используется обучение с подкреплением для выделения редких событий на фоне радиопомех.',
      status: 'accepted',
      specialty: 'астрофизика',
      authors: ['author-2'],
      editorId: 'editor-1',
      submittedAt: '2024-12-04',
      version: 3,
      reviews: [
        {
          id: 'rev-2',
          articleId: 'art-103',
          reviewerId: 'reviewer-3',
          recommendation: 'accept',
          submittedAt: '2025-01-05',
          comments: 'Работа зрелая, рекомендую принять без правок.',
          round: 2,
          isAnonymous: true,
        },
      ],
    },
  ],
  assignments: [
    {
      id: 'assign-1',
      articleId: 'art-101',
      reviewerId: 'reviewer-2',
      dueAt: '2025-03-15',
      round: 1,
      isAnonymous: true,
    },
    {
      id: 'assign-2',
      articleId: 'art-102',
      reviewerId: 'reviewer-1',
      dueAt: '2025-03-12',
      round: 1,
      isAnonymous: true,
    },
  ],
}
