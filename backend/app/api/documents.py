"""Document upload and management endpoints"""
import os
import fitz  # PyMuPDF
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Data directories
DATA_DIR = Path(__file__).parent.parent.parent / "data"
DOCS_DIR = DATA_DIR / "documents"
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
INDEX_DIR = DATA_DIR / "index"

# Ensure directories exist
DOCS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)


class DocumentInfo(BaseModel):
    """Document information model"""
    filename: str
    size: int
    uploaded_at: str
    page_count: Optional[int] = None


class DocumentListResponse(BaseModel):
    """Response for document listing"""
    documents: List[DocumentInfo]
    total: int


class PDFUploadResponse(BaseModel):
    """Response for PDF upload"""
    filename: str
    pages_extracted: int
    sample_pages: List[dict]


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """List all uploaded documents"""
    documents = []
    
    if DOCS_DIR.exists():
        for file_path in DOCS_DIR.glob("*.pdf"):
            stat = file_path.stat()
            documents.append(DocumentInfo(
                filename=file_path.name,
                size=stat.st_size,
                uploaded_at=str(stat.st_mtime),
                page_count=None
            ))
    
    return DocumentListResponse(
        documents=documents,
        total=len(documents)
    )


@router.post("/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file and extract text page-by-page using PyMuPDF"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save to uploads directory
    file_path = UPLOADS_DIR / file.filename
    
    # Read and save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Extract text using PyMuPDF
    sample_pages = []
    pages_extracted = 0
    
    try:
        doc = fitz.open(str(file_path))
        pages_extracted = len(doc)
        
        # Extract first 500 chars from each page (up to 5 pages for sample)
        max_sample_pages = min(5, pages_extracted)
        for page_num in range(max_sample_pages):
            page = doc[page_num]
            text = page.get_text()
            # Get first 500 characters
            sample_text = text[:500] if text else ""
            sample_pages.append({
                "page_number": page_num + 1,
                "content": sample_text
            })
        
        doc.close()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting PDF text: {str(e)}")
    
    return PDFUploadResponse(
        filename=file.filename,
        pages_extracted=pages_extracted,
        sample_pages=sample_pages
    )


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF document (legacy endpoint)"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file_path = DOCS_DIR / file.filename
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    return {
        "status": "uploaded",
        "filename": file.filename,
        "size": len(content)
    }


@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document"""
    file_path = DOCS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path.unlink()
    
    return {
        "status": "deleted",
        "filename": filename
    }


@router.get("/documents/index/status")
async def get_index_status():
    """Get vector index status"""
    index_files = list(INDEX_DIR.glob("*")) if INDEX_DIR.exists() else []
    
    return {
        "indexed": len(index_files) > 0,
        "files": len(index_files),
        "status": "ready" if index_files else "empty"
    }