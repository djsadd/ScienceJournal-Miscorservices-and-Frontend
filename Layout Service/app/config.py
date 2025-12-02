import os
from dotenv import load_dotenv

load_dotenv()

# External services
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://fileprocessing:7000")
ARTICLE_SERVICE_URL = os.getenv("ARTICLE_SERVICE_URL", "http://articles:8000")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
API_PREFIX = os.getenv("API_PREFIX", "/api")

# Storage/DB
# Default to Postgres in container if not provided
DATABASE_URL = os.getenv(
	"DATABASE_URL",
	"postgresql://layout:pass@db/layout"
)

# Internal
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "20.0"))
SHARED_SERVICE_SECRET = os.getenv("SHARED_SERVICE_SECRET", "service-shared-secret")
