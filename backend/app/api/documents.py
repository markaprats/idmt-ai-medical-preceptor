"""Document upload, extraction, and simple search endpoints"""
import json
import re
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import fitz  # PyMuPDF

router = APIRouter()

import os

# Use persistent disk if available (Render), otherwise fallback locally
BASE_DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent.parent.parent / "data"))

DATA_DIR = BASE_DATA_DIR
DOCS_DIR = DATA_DIR / "documents"
UPLOADS_DIR = DATA_DIR / "uploads"
INDEX_DIR = DATA_DIR / "index"
CHUNKS_FILE = DATA_DIR / "chunks.json"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
DOCS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)


class DocumentInfo(BaseModel):
    filename: str
    size: int
    uploaded_at: str
    page_count: Optional[int] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total: int


class PDFUploadResponse(BaseModel):
    filename: str
    pages_extracted: int
    chunks_created: int
    sample_pages: List[dict]


class SearchRequest(BaseModel):
    query: str


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200):
    if not text:
        return []

    cleaned = re.sub(r"\s+", " ", text).strip()
    chunks = []
    start = 0

    while start < len(cleaned):
        end = start + chunk_size
        chunks.append(cleaned[start:end])
        start = end - overlap

        if start < 0:
            start = 0

        if start >= len(cleaned):
            break

    return chunks


def load_chunks():
    if not CHUNKS_FILE.exists():
        return []

    with open(CHUNKS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_chunks(chunks):
    with open(CHUNKS_FILE, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)


def score_chunk(query: str, text: str):
    query_terms = [term for term in re.findall(r"\w+", query.lower()) if len(term) > 2]
    text_lower = text.lower()

    if not query_terms:
        return 0

    score = 0
    for term in query_terms:
        if term in text_lower:
            score += 1

    if query.lower() in text_lower:
        score += 3

    return score


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    documents = []

    for file_path in UPLOADS_DIR.glob("*.pdf"):
        stat = file_path.stat()
        documents.append(
            DocumentInfo(
                filename=file_path.name,
                size=stat.st_size,
                uploaded_at=str(stat.st_mtime),
                page_count=None,
            )
        )

    return DocumentListResponse(documents=documents, total=len(documents))


@router.post("/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_path = UPLOADS_DIR / file.filename
    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    all_chunks = load_chunks()
    all_chunks = [c for c in all_chunks if c.get("document_name") != file.filename]

    sample_pages = []
    pages_extracted = 0
    chunks_created = 0

    try:
        doc = fitz.open(str(file_path))
        pages_extracted = len(doc)

        for page_index in range(pages_extracted):
            page_number = page_index + 1
            page = doc[page_index]
            text = page.get_text() or ""

            if page_number <= 5:
                sample_pages.append(
                    {
                        "page_number": page_number,
                        "content": text[:500],
                    }
                )

            page_chunks = chunk_text(text)

            for chunk_index, chunk in enumerate(page_chunks):
                all_chunks.append(
                    {
                        "document_name": file.filename,
                        "page_number": page_number,
                        "chunk_id": f"{file.filename}-p{page_number}-c{chunk_index + 1}",
                        "text": chunk,
                    }
                )
                chunks_created += 1

        doc.close()
        save_chunks(all_chunks)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting PDF text: {str(e)}")

    return PDFUploadResponse(
        filename=file.filename,
        pages_extracted=pages_extracted,
        chunks_created=chunks_created,
        sample_pages=sample_pages,
    )


@router.post("/search")
async def search_documents(request: SearchRequest):
    chunks = load_chunks()

    if not chunks:
        return {
            "query": request.query,
            "results": [],
            "message": "No indexed documents found. Upload a PDF first.",
        }

    scored = []

    for chunk in chunks:
        score = score_chunk(request.query, chunk.get("text", ""))
        if score > 0:
            scored.append(
                {
                    "document_name": chunk.get("document_name"),
                    "page_number": chunk.get("page_number"),
                    "chunk_id": chunk.get("chunk_id"),
                    "snippet": chunk.get("text", "")[:700],
                    "score": score,
                }
            )

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "query": request.query,
        "results": scored[:5],
    }


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    return await upload_pdf(file)


@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    file_path = UPLOADS_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")

    file_path.unlink()

    chunks = load_chunks()
    chunks = [c for c in chunks if c.get("document_name") != filename]
    save_chunks(chunks)

    return {"status": "deleted", "filename": filename}


@router.get("/documents/index/status")
async def get_index_status():
    chunks = load_chunks()
    documents = sorted(set(c.get("document_name") for c in chunks if c.get("document_name")))

    return {
        "indexed": len(chunks) > 0,
        "chunks": len(chunks),
        "documents": documents,
        "status": "ready" if chunks else "empty",
    }
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


class GenerateGuidanceRequest(BaseModel):
    case_data: dict
    protocol_results: List[dict]


@router.post("/generate-guidance")
async def generate_guidance(request: GenerateGuidanceRequest):
    case_data = request.case_data
    protocol_results = request.protocol_results

    source_text = "\n\n".join([
        f"Source {i + 1}: {item.get('document_name')} page {item.get('page_number')}\n{item.get('snippet')}"
        for i, item in enumerate(protocol_results[:5])
    ])

    system_prompt = """
You are an IDMT AI Medical Preceptor prototype.

Rules:
- This is not a diagnosis.
- Do not replace clinical judgment.
- Do not invent protocol authority.
- Use only provided protocol source text for protocol-supported recommendations.
- If sources do not support a recommendation, say so.
- Medication dosing may only be included if present in provided source text.
- If no direct protocol support exists, recommend stabilization, reassessment, preceptor consultation, and evacuation/escalation as clinically appropriate.
- Be conservative for red flags, unstable vitals, or missing critical data.
- Keep output concise and operational.
- Return valid JSON only.
"""

    user_prompt = f"""
CASE DATA:
{case_data}

RETRIEVED PROTOCOL SOURCES:
{source_text}

Return JSON only with these keys:
immediate_red_flags
differential_cannot_miss
differential_more_common
differential_other
ask_check_next
protocol_supported_recommendations
general_clinical_reasoning
medication_guidance
assessment_plan_review
call_preceptor_evacuate
confidence_data_integrity
safety_disclaimer
"""

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content

        return {
            "guidance": content,
            "model": OPENAI_MODEL,
            "sources_used": len(protocol_results[:5]),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")    