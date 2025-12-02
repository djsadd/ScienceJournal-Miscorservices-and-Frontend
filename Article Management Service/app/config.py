import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://articles:pass@db/articles")
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://fileprocessing:7000")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
API_PREFIX = os.getenv("API_PREFIX", "/api")
REVIEW_SERVICE_URL = os.getenv("REVIEW_SERVICE_URL", "http://reviews:8000")
EDITORIAL_SERVICE_URL = os.getenv("EDITORIAL_SERVICE_URL", "http://editorial:9000")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notifications:8000")
LAYOUT_SERVICE_URL = os.getenv("LAYOUT_SERVICE_URL", "http://layout:8000")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
SHARED_SERVICE_SECRET = os.getenv("SHARED_SERVICE_SECRET", "service-shared-secret")
