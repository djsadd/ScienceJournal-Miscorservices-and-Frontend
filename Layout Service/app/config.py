import os
from dotenv import load_dotenv

load_dotenv()

# External services
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://fileprocessing:7000")
ARTICLE_SERVICE_URL = os.getenv("ARTICLE_SERVICE_URL", "http://articles:8000")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
API_PREFIX = os.getenv("API_PREFIX", "/api")

# DB components (override individually or via DATABASE_URL)
DB_USER = os.getenv("DB_USER", "layout")
DB_PASSWORD = os.getenv("DB_PASSWORD", "pass")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "layout")

# Full DSN can still be injected directly; otherwise constructed from parts
DATABASE_URL = os.getenv(
	"DATABASE_URL", f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Internal
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "20.0"))
SHARED_SERVICE_SECRET = os.getenv("SHARED_SERVICE_SECRET", "service-shared-secret")
