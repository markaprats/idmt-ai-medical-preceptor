"""
IDMT AI Medical Preceptor - Main Application
FastAPI backend for clinical decision support
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("IDMT AI Medical Preceptor starting up...")
    
    # Ensure uploads directory exists
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    yield
    print("IDMT AI Medical Preceptor shutting down...")


app = FastAPI(
    title="IDMT AI Medical Preceptor",
    description="Clinical Decision Support Prototype for IDMTs",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS middleware - allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://idmt-ai-medical-preceptor.vercel.app",
        "https://idmt-ai-medical-preceptor-git-main-markaprats-projects.vercel.app",
        "https://idmt-ai-medical-preceptor-flld8umid-markaprats-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(documents.router, prefix="/api", tags=["Documents"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "IDMT AI Medical Preceptor",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}