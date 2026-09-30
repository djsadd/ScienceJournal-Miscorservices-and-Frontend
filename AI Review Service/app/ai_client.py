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

STREAM_SYSTEM_PROMPT = """Ты — помощник научного рецензента. Подготовь черновик анализа,
который рецензент обязан проверить и отредактировать. Не выступай самостоятельным рецензентом
и не принимай решение о публикации. Анализируй только предоставленный
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

Для каждого критерия дай краткое наблюдение, укажи, что рецензенту следует проверить,
и предложи конкретную формулировку замечания. Затем добавь разделы «Сильные стороны»,
«Вопросы для проверки» и «Предлагаемые замечания». Не формулируй итоговое решение
о принятии или отклонении статьи."""

ASSISTANT_CRITERIA = (
    "importance_applicability", "novelty_application", "originality", "innovation_product",
    "results_significance", "coherence", "style_quality", "editorial_compliance",
)

ASSISTANT_SYSTEM_PROMPT = """Ты — помощник научного рецензента. Анализируй только переданный
материал, не выдумывай факты, источники, эксперименты или результаты. Верни только JSON.
Для каждого критерия напиши краткое, конкретное наблюдение в 1–3 предложениях. Если данных
недостаточно, прямо напиши, что именно рецензент должен проверить. Итоговая рекомендация —
лишь подсказка рецензенту и должна иметь одно из трёх значений: accept, major_revision, reject.
JSON должен содержать summary, recommendation и объект criteria ровно с восемью ключами:
importance_applicability, novelty_application, originality, innovation_product,
results_significance, coherence, style_quality, editorial_compliance."""


def _validate_assistant_result(data: dict) -> dict:
    criteria = data.get("criteria")
    if not isinstance(criteria, dict) or set(criteria) != set(ASSISTANT_CRITERIA):
        raise AIProviderError("AI returned an invalid criteria set")
    if not all(isinstance(criteria[key], str) and criteria[key].strip() for key in ASSISTANT_CRITERIA):
        raise AIProviderError("AI returned an empty criterion")
    if not isinstance(data.get("summary"), str) or not data["summary"].strip():
        raise AIProviderError("AI returned an empty summary")
    if data.get("recommendation") not in {"accept", "major_revision", "reject"}:
        raise AIProviderError("AI returned an invalid recommendation")
    return data


async def generate_assistant_review(*, title: str, abstract: str, manuscript_text: str, language: str) -> dict:
    if not config.AI_API_KEY:
        raise AIProviderError("AI_API_KEY/OPEN_AI_KEY is not configured")
    language_name = {"ru": "Russian", "kk": "Kazakh", "en": "English"}[language]
    content = (
        f"Write the analysis in {language_name}.\n"
        f"Title: {title or '[not supplied]'}\n"
        f"Abstract: {abstract or '[not supplied]'}\n"
        f"Manuscript: {manuscript_text or '[not supplied; analysis is preliminary]'}\n"
        "Return: {\"criteria\": {all 8 required keys: short text}, "
        "\"summary\": \"short overall summary\", "
        "\"recommendation\": \"accept|major_revision|reject\"}."
    )[: config.AI_MAX_INPUT_CHARS]
    payload = {
        "model": config.AI_MODEL,
        "messages": [
            {"role": "system", "content": ASSISTANT_SYSTEM_PROMPT},
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
            return _validate_assistant_result(json.loads(raw))
    except AIProviderError:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise AIProviderError(f"AI assistant request failed: {exc}") from exc


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
