"""RAG Service - Retrieval Augmented Generation for medical protocols"""
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class RetrievalResult:
    """Result from document retrieval"""
    documents: List[Dict[str, Any]]
    has_matches: bool
    match_count: int
    clinical_reasoning: Optional[str] = None


class RAGService:
    """Service for retrieving relevant medical protocols"""
    
    def __init__(self):
        """Initialize RAG service"""
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        self.docs_dir = self.data_dir / "documents"
        self.index_dir = self.data_dir / "index"
        
        # Ensure directories exist
        self.docs_dir.mkdir(parents=True, exist_ok=True)
        self.index_dir.mkdir(parents=True, exist_ok=True)
    
    def retrieve(self, chief_complaint: str, case_context: str, top_k: int = 5) -> RetrievalResult:
        """Retrieve relevant documents for a clinical query"""
        pdf_files = list(self.docs_dir.glob("*.pdf"))
        
        if not pdf_files:
            return RetrievalResult(
                documents=[],
                has_matches=False,
                match_count=0,
                clinical_reasoning=self._generate_conservative_guidance(chief_complaint)
            )
        
        return self._simulate_retrieval(chief_complaint, case_context, top_k)
    
    def _simulate_retrieval(self, chief_complaint: str, case_context: str, top_k: int) -> RetrievalResult:
        """Simulate retrieval for prototype"""
        index_files = list(self.index_dir.glob("*"))
        
        if not index_files:
            return RetrievalResult(
                documents=[],
                has_matches=False,
                match_count=0,
                clinical_reasoning=self._generate_conservative_guidance(chief_complaint)
            )
        
        return RetrievalResult(
            documents=[{
                "document": "Sample Protocol",
                "page": 1,
                "content": "Protocol guidance would appear here after document indexing.",
                "source": "uploaded_document"
            }],
            has_matches=True,
            match_count=1
        )
    
    def _generate_conservative_guidance(self, complaint: str) -> str:
        """Generate conservative clinical guidance when no protocols match"""
        return f"""
No direct protocol match found in the provided documents for: "{complaint}"

Conservative guidance:
- Stabilize patient and reassess ABCs
- Obtain or repeat vital signs
- Identify and monitor red flags
- Contact preceptor for guidance
- Consider evacuation if deteriorating
- Document all findings and interventions

Note: This response is based on general clinical principles, not specific protocol guidance.
"""
    
    def index_document(self, file_path: Path) -> Dict[str, Any]:
        """Index a document for retrieval"""
        return {
            "status": "indexed",
            "document": file_path.name,
            "chunks": 0
        }
    
    def get_index_status(self) -> Dict[str, Any]:
        """Get current index status"""
        index_files = list(self.index_dir.glob("*"))
        
        return {
            "indexed": len(index_files) > 0,
            "document_count": len(index_files),
            "status": "ready" if index_files else "empty"
        }