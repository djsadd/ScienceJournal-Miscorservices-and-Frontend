# Layout Service

Service for generating layout PDFs for articles and volumes.

## Environment
- `FILE_SERVICE_URL` (default `http://fileprocessing:7000`)
- `ARTICLE_SERVICE_URL` (default `http://articles:8000`)
- `API_GATEWAY_URL` (default `http://localhost:8000`)
- `API_PREFIX` (default `/api`)
- `DATABASE_URL` (default `sqlite:////app/layout.db`)

## Endpoints

- `GET /health` — health check
- `POST /layout/articles/{article_id}` — start layout for an article
  - Requires editor `Authorization: Bearer <token>`; forwards to Article service
  - Creates a cover page, merges with manuscript PDF (if available)
  - Stores result in File Storage and returns job info
- `POST /layout/volumes/{volume_id}` — start layout for a volume
  - Requires editor `Authorization: Bearer <token>`; fetches volume and its articles
  - Generates TOC cover page and concatenates article PDFs
  - Stores result in File Storage and returns job info
- `GET /layout/jobs/{job_id}` — get job by id
- `GET /layout/articles/{article_id}/latest` — get latest job for article

Responses include `output_file_id` and a `message` with a full download URL via API Gateway.

## Quick test

```powershell
# Health
Invoke-WebRequest -UseBasicParsing http://localhost:8006/health | Select-Object -ExpandProperty Content

# Start article layout (requires token with editor role)
$token = "<JWT>"
Invoke-WebRequest -UseBasicParsing -Method POST -Headers @{Authorization="Bearer $token"} `
  http://localhost:8006/layout/articles/1 | Select-Object -ExpandProperty Content
```
