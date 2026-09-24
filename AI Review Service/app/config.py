import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://reviews:pass@db/reviews")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ARTICLE_SERVICE_URL = os.getenv("ARTICLE_SERVICE_URL", "http://articles:8000")
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://fileprocessing:7000")
SHARED_SERVICE_SECRET = os.getenv("SHARED_SERVICE_SECRET", "service-shared-secret")

# Any OpenAI-compatible Chat Completions endpoint can be used.
AI_API_URL = os.getenv("AI_API_URL", "https://api.openai.com/v1")
AI_API_KEY = os.getenv("AI_API_KEY") or os.getenv("OPEN_AI_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "gpt-5.5")
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "120"))
AI_MAX_INPUT_CHARS = int(os.getenv("AI_MAX_INPUT_CHARS", "120000"))
