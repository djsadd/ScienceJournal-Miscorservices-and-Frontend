"""Catalog of every email event managed by the notification service.

Keep event metadata here so delivery, the admin API and the admin UI all use the
same source of truth.  Services sending an event should only provide variables
listed for its key.
"""

EMAIL_EVENTS = {
    "notification_system": {
        "name": "Системное уведомление",
        "description": "Общее системное уведомление.",
        "type": "system",
        "subject": "{title}",
        "text": "{message}",
        "html": "<p>{message}</p>",
        "variables": {"title": "Заголовок уведомления", "message": "Текст уведомления", "article_id": "ID статьи, если указан"},
    },
    "notification_article_status": {
        "name": "Изменение статуса статьи",
        "description": "Резервный шаблон для событий статьи без отдельного типа.",
        "type": "article_status",
        "subject": "{title}", "text": "{message}", "html": "<p>{message}</p>",
        "variables": {"title": "Заголовок уведомления", "message": "Текст уведомления", "article_id": "ID статьи"},
    },
    "notification_review_assignment": {
        "name": "Уведомление о рецензировании",
        "description": "Резервный шаблон событий рецензирования.",
        "type": "review_assignment",
        "subject": "{title}", "text": "{message}", "html": "<p>{message}</p>",
        "variables": {"title": "Заголовок уведомления", "message": "Текст уведомления", "article_id": "ID статьи"},
    },
    "notification_editorial": {
        "name": "Редакционное уведомление",
        "description": "Резервный шаблон редакционных событий.",
        "type": "editorial",
        "subject": "{title}", "text": "{message}", "html": "<p>{message}</p>",
        "variables": {"title": "Заголовок уведомления", "message": "Текст уведомления", "article_id": "ID статьи"},
    },
    "notification_custom": {
        "name": "Прочее уведомление",
        "description": "Пользовательское уведомление.",
        "type": "custom",
        "subject": "{title}", "text": "{message}", "html": "<p>{message}</p>",
        "variables": {"title": "Заголовок уведомления", "message": "Текст уведомления", "article_id": "ID статьи, если указан"},
    },
    "registration_welcome": {
        "name": "Регистрация автора", "description": "Приветствие после автоматической активации автора.", "type": None,
        "subject": "Регистрация завершена", "text": "Здравствуйте, {display_name}. Ваш аккаунт автора активирован.",
        "html": "<p>Здравствуйте, {display_name}. Ваш аккаунт автора активирован.</p>",
        "variables": {"display_name": "Имя пользователя"},
    },
    "email_verification": {
        "name": "Подтверждение электронной почты", "description": "Ссылка подтверждения для редактора или рецензента.", "type": None,
        "subject": "Подтверждение электронной почты", "text": "Здравствуйте, {display_name}. Подтвердите почту: {verification_link}",
        "html": "<p>Здравствуйте, {display_name}.</p><p><a href=\"{verification_link}\">Подтвердить электронную почту</a></p>",
        "variables": {"display_name": "Имя пользователя", "verification_link": "Ссылка подтверждения"},
    },
    "password_reset": {
        "name": "Восстановление пароля", "description": "Ссылка для создания нового пароля.", "type": None,
        "subject": "Восстановление пароля", "text": "Здравствуйте, {display_name}. Перейдите по ссылке: {reset_link}. Ссылка действует {expires_minutes} мин.",
        "html": "<p>Здравствуйте, {display_name}.</p><p><a href=\"{reset_link}\">Сменить пароль</a></p><p>Ссылка действует {expires_minutes} мин.</p>",
        "variables": {"display_name": "Имя пользователя", "reset_link": "Ссылка восстановления", "expires_minutes": "Срок действия ссылки в минутах"},
    },
    "account_status_changed": {
        "name": "Статус аккаунта", "description": "Активация или деактивация аккаунта администратором.", "type": "system",
        "subject": "{title}", "text": "{message}", "html": "<p>{message}</p>",
        "variables": {"title": "Аккаунт активирован/деактивирован", "message": "Полный текст события", "display_name": "Имя пользователя", "role": "Название роли", "status": "active или inactive", "cabinet_url": "Ссылка входа"},
    },
    "new_article_submitted": {
        "name": "Новая статья для редакторов", "description": "Рассылка всем редакторам при подаче новой статьи.", "type": "editorial",
        "subject": "Новая статья: {article_title}", "text": "Подана новая статья «{article_title}» (ID {article_id}).", "html": "<p>Подана новая статья <strong>{article_title}</strong> (ID {article_id}).</p>",
        "variables": {"article_title": "Название статьи", "article_id": "ID статьи", "title": "Заголовок уведомления", "message": "Текст уведомления"},
    },
    "editor_comments": {
        "name": "Комментарий редактора автору", "description": "Комментарий по рукописи после редакционного решения.", "type": "article_status",
        "subject": "Комментарий по рукописи #{article_id}", "text": "{comments}", "html": "<p>{comments}</p>",
        "variables": {"comments": "Комментарий редактора", "article_id": "ID статьи", "title": "Заголовок уведомления", "message": "Тот же комментарий"},
    },
    "article_withdrawn": {
        "name": "Статья отозвана", "description": "Подтверждение автору об отзыве статьи.", "type": "article_status",
        "subject": "Статья #{article_id} отозвана", "text": "Статья #{article_id} отозвана.", "html": "<p>Статья #{article_id} отозвана.</p>",
        "variables": {"article_id": "ID статьи", "title": "Заголовок уведомления", "message": "Текст уведомления"},
    },
    "review_assigned": {
        "name": "Назначение рецензии", "description": "Рецензенту назначена статья.", "type": "review_assignment",
        "subject": "Вам назначена рецензия", "text": "Вам назначена рецензия по статье {article_label}.", "html": "<p>Вам назначена рецензия по статье {article_label}.</p>",
        "variables": {"article_label": "Название статьи или её ID", "article_id": "ID статьи", "title": "Заголовок уведомления", "message": "Текст уведомления"},
    },
    "review_cancelled": {
        "name": "Отмена рецензирования", "description": "Редактор отменил назначение рецензента.", "type": "review_assignment",
        "subject": "Рецензирование отменено", "text": "Назначение на рецензирование статьи {article_label} отменено.", "html": "<p>Назначение на рецензирование статьи {article_label} отменено.</p>",
        "variables": {"article_label": "Название статьи или её ID", "article_id": "ID статьи", "title": "Заголовок уведомления", "message": "Текст уведомления"},
    },
    "reviewer_declined": {
        "name": "Отказ рецензента", "description": "Уведомление редактору об отказе рецензента.", "type": "editorial",
        "subject": "Рецензент отказался от рецензирования", "text": "Рецензент #{reviewer_id} отказался от статьи {article_label}. Причина: {reason}", "html": "<p>Рецензент #{reviewer_id} отказался от статьи {article_label}.</p><p>Причина: {reason}</p>",
        "variables": {"reviewer_id": "ID рецензента", "article_label": "Название статьи или её ID", "reason": "Причина отказа", "article_id": "ID статьи", "title": "Заголовок", "message": "Полный текст"},
    },
    "review_completed": {
        "name": "Рецензия завершена", "description": "Уведомление ответственному редактору.", "type": "editorial",
        "subject": "Рецензия по статье #{article_id} завершена", "text": "Рецензия #{review_id} по статье #{article_id} завершена.", "html": "<p>Рецензия #{review_id} по статье #{article_id} завершена.</p>",
        "variables": {"review_id": "ID рецензии", "article_id": "ID статьи", "title": "Заголовок", "message": "Текст уведомления"},
    },
}

# Every notification path supplies these two fallback values, including direct
# emails.  Exposing them consistently also keeps templates created by older
# versions editable in the admin panel.
for _event in EMAIL_EVENTS.values():
    _event["variables"].setdefault("title", "Исходный заголовок события")
    _event["variables"].setdefault("message", "Исходный текст события")

SAMPLE_VALUES = {
    "title": "Тестовое уведомление", "message": "Это пример текста уведомления.", "article_id": "123",
    "display_name": "Алексей Иванов", "verification_link": "https://journal.example/verify", "reset_link": "https://journal.example/reset",
    "expires_minutes": "30", "role": "рецензент", "status": "active", "cabinet_url": "https://journal.example/login",
    "article_title": "Искусственный интеллект в современной науке", "comments": "Просим учесть замечания редакции.",
    "article_label": "«Искусственный интеллект в современной науке»", "reviewer_id": "42", "review_id": "77", "reason": "Тема вне моей специализации.",
}
