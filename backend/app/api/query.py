"""Query endpoint for clinical decision support"""
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.rag import RAGService
from app.services.red_flags import RedFlagService

router = APIRouter()

# Initialize services
rag_service = RAGService()
red_flag_service = RedFlagService()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============== Request Models ==============

class ChiefComplaintInput(BaseModel):
    """Chief complaint and context"""
    complaint: str
    environment: Optional[str] = None
    resources: Optional[str] = None
    evacuation_available: Optional[bool] = None
    communication_available: Optional[bool] = None


class HPIInput(BaseModel):
    """History of Present Illness - OPQRST"""
    onset: Optional[str] = None
    provocation: Optional[str] = None
    quality: Optional[str] = None
    radiation: Optional[str] = None
    severity: Optional[int] = None
    time_course: Optional[str] = None


class VitalsInput(BaseModel):
    """Vital signs"""
    hr: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    rr: Optional[int] = None
    spo2: Optional[int] = None
    temp: Optional[float] = None
    pain_score: Optional[int] = None
    weight: Optional[float] = None
    unable_to_obtain: bool = False


class ExamInput(BaseModel):
    """Physical exam findings"""
    cardiopulmonary: Optional[str] = None
    abdomen: Optional[str] = None
    neuro: Optional[str] = None
    skin: Optional[str] = None
    msk: Optional[str] = None


class MedsHistoryInput(BaseModel):
    """Medications, allergies, and history"""
    medications: Optional[str] = None
    allergies: Optional[str] = None
    past_medical_history: Optional[str] = None


class CaseInput(BaseModel):
    """Complete case input"""
    chief_complaint: ChiefComplaintInput
    hpi: Optional[HPIInput] = None
    vitals: Optional[VitalsInput] = None
    exam: Optional[ExamInput] = None
    meds_history: Optional[MedsHistoryInput] = None
    assessment_plan: Optional[str] = None
    training_mode: bool = False
    user_diagnosis: Optional[str] = None


class RedFlagResponse(BaseModel):
    """Red flag response"""
    universal: List[str]
    category_specific: List[str]
    confidence: float
    matched_category: Optional[str] = None
    message: Optional[str] = None


class SourceCitation(BaseModel):
    """Source citation"""
    document: str
    page: Optional[int] = None
    snippet: str


class QueryResponse(BaseModel):
    """Query response"""
    red_flags: RedFlagResponse
    differential_diagnosis: Dict[str, List[str]]
    what_to_ask: List[str]
    protocol_recommendations: List[Dict[str, Any]]
    clinical_reasoning: Optional[str] = None
    medication_guidance: Optional[str] = None
    assessment_plan_review: Optional[str] = None
    call_preceptor: List[str]
    evacuate: List[str]
    confidence: str
    data_completeness: str
    protocol_support: str
    limitations: List[str]
    safety_disclaimer: str
    training_feedback: Optional[Dict[str, Any]] = None
    sources: List[SourceCitation]


# ============== Endpoints ==============

@router.post("/query", response_model=QueryResponse)
async def process_query(case: CaseInput):
    """Process a clinical query"""
    try:
        # 1. Get red flags based on chief complaint
        red_flags = red_flag_service.get_red_flags(
            case.chief_complaint.complaint
        )
        
        # 2. Build context from case data
        case_context = build_case_context(case)
        
        # 3. Retrieve relevant protocols
        retrieval_result = rag_service.retrieve(
            case.chief_complaint.complaint,
            case_context,
            top_k=5
        )
        
        # 4. Generate response
        response = generate_clinical_response(
            case=case,
            red_flags=red_flags,
            retrieval=retrieval_result
        )
        
        # 5. Log metadata (no patient data)
        log_query_metadata(case, red_flags, response)
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/red-flags/{complaint}")
async def get_red_flags_for_complaint(complaint: str):
    """Get red flags for a specific chief complaint"""
    red_flags = red_flag_service.get_red_flags(complaint)
    return red_flags


# ============== Helper Functions ==============

def build_case_context(case: CaseInput) -> str:
    """Build context string from case data"""
    parts = []
    
    parts.append(f"Chief Complaint: {case.chief_complaint.complaint}")
    if case.chief_complaint.environment:
        parts.append(f"Environment: {case.chief_complaint.environment}")
    if case.chief_complaint.resources:
        parts.append(f"Resources: {case.chief_complaint.resources}")
    
    if case.hpi:
        hpi_parts = []
        if case.hpi.onset: hpi_parts.append(f"Onset: {case.hpi.onset}")
        if case.hpi.provocation: hpi_parts.append(f"Provocation: {case.hpi.provocation}")
        if case.hpi.quality: hpi_parts.append(f"Quality: {case.hpi.quality}")
        if case.hpi.radiation: hpi_parts.append(f"Radiation: {case.hpi.radiation}")
        if case.hpi.severity: hpi_parts.append(f"Severity: {case.hpi.severity}/10")
        if case.hpi.time_course: hpi_parts.append(f"Time Course: {case.hpi.time_course}")
        if hpi_parts:
            parts.append("HPI: " + ", ".join(hpi_parts))
    
    if case.vitals:
        vital_parts = []
        if case.vitals.hr: vital_parts.append(f"HR: {case.vitals.hr}")
        if case.vitals.bp_systolic and case.vitals.bp_diastolic:
            vital_parts.append(f"BP: {case.vitals.bp_systolic}/{case.vitals.bp_diastolic}")
        if case.vitals.rr: vital_parts.append(f"RR: {case.vitals.rr}")
        if case.vitals.spo2: vital_parts.append(f"SpO2: {case.vitals.spo2}%")
        if case.vitals.temp: vital_parts.append(f"Temp: {case.vitals.temp}°F")
        if case.vitals.pain_score is not None:
            vital_parts.append(f"Pain: {case.vitals.pain_score}/10")
        if case.vitals.unable_to_obtain:
            vital_parts.append("Vitals: Unable to obtain")
        if vital_parts:
            parts.append("Vitals: " + ", ".join(vital_parts))
    
    if case.exam:
        exam_parts = []
        if case.exam.cardiopulmonary: exam_parts.append(f"CV: {case.exam.cardiopulmonary}")
        if case.exam.abdomen: exam_parts.append(f"Abd: {case.exam.abdomen}")
        if case.exam.neuro: exam_parts.append(f"Neuro: {case.exam.neuro}")
        if case.exam.skin: exam_parts.append(f"Skin: {case.exam.skin}")
        if case.exam.msk: exam_parts.append(f"MSK: {case.exam.msk}")
        if exam_parts:
            parts.append("Exam: " + ", ".join(exam_parts))
    
    if case.meds_history:
        if case.meds_history.medications:
            parts.append(f"Meds: {case.meds_history.medications}")
        if case.meds_history.allergies:
            parts.append(f"Allergies: {case.meds_history.allergies}")
        if case.meds_history.past_medical_history:
            parts.append(f"PMH: {case.meds_history.past_medical_history}")
    
    return " | ".join(parts)


def generate_clinical_response(case: CaseInput, red_flags, retrieval) -> QueryResponse:
    """Generate clinical response"""
    
    if retrieval["has_matches"]:
        confidence = "High" if retrieval["match_count"] >= 3 else "Moderate"
    else:
        confidence = "Low"
    
    protocol_recommendations = []
    for doc in retrieval["documents"][:3]:
        protocol_recommendations.append({
            "document": doc["document"],
            "page": doc.get("page"),
            "recommendation": doc.get("content", "")[:500],
            "source": doc.get("source", "")
        })
    
    differential = {
        "cannot_miss": ["Life-threatening condition related to red flags"],
        "more_common": ["Condition consistent with presentation"],
        "other": ["Differential considerations"]
    }
    
    what_to_ask = [
        "Clarify onset and duration",
        "Review associated symptoms",
        "Obtain additional history if available"
    ]
    
    call_preceptor = []
    evacuate = []
    
    if red_flags.confidence >= 0.75 or any(ru in str(red_flags.universal).lower() for ru in ["airway", "hemodynamic", "respiratory"]):
        call_preceptor.append("Contact preceptor for unstable patient")
        evacuate.append("Consider rapid evacuation if deteriorating")
    
    return QueryResponse(
        red_flags=red_flags,
        differential_diagnosis=differential,
        what_to_ask=what_to_ask,
        protocol_recommendations=protocol_recommendations,
        clinical_reasoning=retrieval["clinical_reasoning"] if not retrieval["has_matches"] else None,
        medication_guidance=None,
        assessment_plan_review=case.assessment_plan,
        call_preceptor=call_preceptor,
        evacuate=evacuate,
        confidence=confidence,
        data_completeness="Moderate",
        protocol_support="Partial" if retrieval["has_matches"] else "None",
        limitations=[
            "This is a prototype - verify all information",
            "Protocol matches depend on uploaded documents",
            "AI may not capture all clinical nuances"
        ],
        safety_disclaimer="⚠️ PROTOTYPE ONLY - NOT FOR CLINICAL USE. Verify all information independently.",
        training_feedback=generate_training_feedback(case) if case.training_mode else None,
        sources=[
            SourceCitation(
                document=doc["document"],
                page=doc.get("page"),
                snippet=doc.get("content", "")[:200]
            )
            for doc in retrieval["documents"]
        ]
    )


def generate_training_feedback(case: CaseInput) -> Dict[str, Any]:
    """Generate training mode feedback"""
    if not case.user_diagnosis:
        return {}
    
    return {
        "user_diagnosis": case.user_diagnosis,
        "critique": "Consider reviewing differential diagnoses based on presenting symptoms and red flags.",
        "missed_red_flags": "Ensure all universal red flags are addressed in your assessment.",
        "teaching_points": [
            "Always assess ABCs first",
            "Consider worst-case scenario for red flag presentations",
            "Document your clinical reasoning"
        ]
    }


def log_query_metadata(case: CaseInput, red_flags, response):
    """Log query metadata (no patient data)"""
    logger.info(f"Query logged - Category: {red_flags.matched_category}, "
                f"Confidence: {response.confidence}, "
                f"Protocol Support: {response.protocol_support}")