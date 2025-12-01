from io import BytesIO
from typing import Optional, List
import httpx
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from pypdf import PdfReader, PdfWriter

from app import config


async def fetch_file_metadata(file_id: str) -> dict:
    async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
        r = await client.get(f"{config.FILE_SERVICE_URL}/files/{file_id}")
        r.raise_for_status()
        return r.json()


async def download_file_content(file_id: str) -> bytes:
    async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
        r = await client.get(f"{config.FILE_SERVICE_URL}/files/{file_id}/download")
        r.raise_for_status()
        return r.content


async def upload_result_file(filename: str, content: bytes, content_type: str = "application/pdf") -> dict:
    async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
        files = {"upload": (filename, content, content_type)}
        r = await client.post(f"{config.FILE_SERVICE_URL}/files/", files=files)
        r.raise_for_status()
        return r.json()


def extract_file_id_from_url(file_url: Optional[str]) -> Optional[str]:
    # Expected format: /files/{file_id}/download
    if not file_url:
        return None
    try:
        return file_url.split("/files/")[1].split("/download")[0]
    except Exception:
        return None


def make_cover_page_pdf(title: Optional[str], subtitle_lines: Optional[List[str]] = None) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 4 * cm, title or "Document")

    c.setFont("Helvetica", 12)
    y = height - 5.2 * cm
    if subtitle_lines:
        for line in subtitle_lines:
            c.drawCentredString(width / 2, y, line)
            y -= 0.7 * cm

    c.showPage()
    c.save()
    return buffer.getvalue()


def merge_pdfs(pdf_blobs: List[bytes]) -> bytes:
    writer = PdfWriter()
    for blob in pdf_blobs:
        try:
            reader = PdfReader(BytesIO(blob))
            for page in reader.pages:
                writer.add_page(page)
        except Exception:
            # Skip non-PDF or corrupted content
            continue
    out = BytesIO()
    writer.write(out)
    return out.getvalue()


def build_api_download_url(file_id: str) -> str:
    prefix = getattr(config, "API_PREFIX", "/api")
    base = getattr(config, "API_GATEWAY_URL", "http://localhost:8000")
    return f"{base}{prefix}/files/{file_id}/download"
