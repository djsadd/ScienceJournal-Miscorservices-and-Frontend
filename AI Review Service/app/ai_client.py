import json

import httpx

from app import config


class AIProviderError(RuntimeError):
    pass


SYSTEM_PROMPT = """You are an exacting but constructive academic peer reviewer.
Evaluate only the submitted material; do not invent facts, citations, experiments, or results.
Return valid JSON only, matching this schema:
{
  "review_text": "detailed review",
  "recommendation": "accept|minor_revision|major_revision|reject",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "publication_recommendations": ["specific actionable change"],
  "scores": {"novelty": 1, "methodology": 1, "clarity": 1, "significance": 1, "reproducibility": 1}
}
Every score must be an integer from 1 to 5. Distinguish missing evidence from negative evidence.
State that the assessment is preliminary when only an abstract is supplied."""

STREAM_SYSTEM_PROMPT = """Ты — независимый научный рецензент журнала. Подготовь строгую,
доказательную и конструктивную рецензию на языке запроса. Анализируй только предоставленный
материал, не выдумывай факты, источники или результаты. Если доступна лишь аннотация, явно
укажи, что вывод предварительный.

Обязательно оцени отдельными разделами критерии редакции:
1. Важность, полезность и применимость идей, методов и технологий.
2. Новизна освещения и возможность применения в отрасли.
3. Оригинальность идей, методов, решений и результатов.
4. Наличие нового процесса, услуги или продукта.
5. Теоретическая и практическая значимость результатов и выводов.
6. Логичность, последовательность и связность изложения.
7. Научный стиль, языковые и стилистические нормы.
8. Соответствие требованиям редакции: терминология, аннотация, ключевые слова,
   научный аппарат и библиография.

Для каждого критерия дай краткий вывод и конкретную рекомендацию. Затем добавь разделы
«Сильные стороны», «Обязательные исправления» и «Итоговая рекомендация».
Заверши ровно одной технической строкой:
ИТОГОВЫЙ_СТАТУС: РЕКОМЕНДОВАТЬ
или ИТОГОВЫЙ_СТАТУС: РЕКОМЕНДОВАТЬ_ПОСЛЕ_ДОРАБОТКИ
или ИТОГОВЫЙ_СТАТУС: НЕ_РЕКОМЕНДОВАТЬ
Не используй другие итоговые статусы."""


def _validate_result(data: dict) -> dict:
    allowed = {"accept", "minor_revision", "major_revision", "reject"}
    if data.get("recommendation") not in allowed:
        raise AIProviderError("AI returned an invalid publication recommendation")
    for key in ("review_text", "strengths", "weaknesses", "publication_recommendations", "scores"):
        if key not in data:
            raise AIProviderError(f"AI response is missing '{key}'")
    if not isinstance(data["review_text"], str) or not data["review_text"].strip():
        raise AIProviderError("AI returned an empty review")
    if not all(isinstance(data[key], list) for key in ("strengths", "weaknesses", "publication_recommendations")):
        raise AIProviderError("AI returned invalid review lists")
    expected_scores = {"novelty", "methodology", "clarity", "significance", "reproducibility"}
    if set(data["scores"]) != expected_scores or not all(isinstance(v, int) and 1 <= v <= 5 for v in data["scores"].values()):
        raise AIProviderError("AI returned invalid scores")
    return data


async def generate_review(*, title: str, abstract: str, manuscript_text: str, language: str, instructions: str) -> dict:
    if not config.AI_API_KEY:
        raise AIProviderError("AI_API_KEY is not configured")

    language_name = {"ru": "Russian", "kk": "Kazakh", "en": "English"}[language]
    content = (
        f"Write the review in {language_name}.\n"
        f"Title: {title or '[not supplied]'}\n"
        f"Abstract: {abstract or '[not supplied]'}\n"
        f"Manuscript: {manuscript_text or '[not supplied; review is abstract-only]'}\n"
        f"Additional editorial instructions: {instructions or '[none]'}"
    )[: config.AI_MAX_INPUT_CHARS]
    payload = {
        "model": config.AI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        "response_format": {"type": "json_object"},
    }
    try:
        async with httpx.AsyncClient(timeout=config.AI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{config.AI_API_URL.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {config.AI_API_KEY}"},
                json=payload,
            )
            response.raise_for_status()
            raw = response.json()["choices"][0]["message"]["content"]
            return _validate_result(json.loads(raw))
    except AIProviderError:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise AIProviderError(f"AI provider request failed: {exc}") from exc


async def stream_review(*, title: str, abstract: str, manuscript_text: str, language: str):
    """Yield text deltas from the OpenAI Responses API."""
    if not config.AI_API_KEY:
        raise AIProviderError("AI_API_KEY/OPEN_AI_KEY is not configured")
    language_name = {"ru": "русском", "kk": "казахском", "en": "английском"}[language]
    user_input = (
        f"Подготовь рецензию на {language_name} языке.\n\n"
        f"Название: {title or '[не указано]'}\n\n"
        f"Аннотация: {abstract or '[не указана]'}\n\n"
        f"Текст рукописи: {manuscript_text or '[полный текст недоступен]'}"
    )[: config.AI_MAX_INPUT_CHARS]
    payload = {
        "model": config.AI_MODEL,
        "instructions": STREAM_SYSTEM_PROMPT,
        "input": user_input,
        "reasoning": {"effort": "medium"},
        "text": {"verbosity": "medium"},
        "stream": True,
        "store": False,
    }
    try:
        async with httpx.AsyncClient(timeout=config.AI_TIMEOUT_SECONDS) as client:
            async with client.stream(
                "POST", f"{config.AI_API_URL.rstrip('/')}/responses",
                headers={"Authorization": f"Bearer {config.AI_API_KEY}", "Accept": "text/event-stream"},
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: ") or line == "data: [DONE]":
                        continue
                    try:
                        event = json.loads(line[6:])
                    except json.JSONDecodeError:
                        continue
                    if event.get("type") == "response.output_text.delta" and event.get("delta"):
                        yield event["delta"]
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:500]
        raise AIProviderError(f"OpenAI error {exc.response.status_code}: {detail}") from exc
    except httpx.HTTPError as exc:
        raise AIProviderError(f"OpenAI streaming failed: {exc}") from exc
