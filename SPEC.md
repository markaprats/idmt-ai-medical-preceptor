# IDMT AI Medical Preceptor - Specification

## Project Overview

**Name:** IDMT AI Medical Preceptor  
**Type:** Clinical Decision Support Web Application (Prototype)  
**Purpose:** Simulate an offline/protocol-grounded AI preceptor for Independent Duty Medical Technicians  
**Status:** Prototype - Not for clinical use

---

## Core Clinical Behavior

### Primary Scope
- Support all conditions in uploaded IDMT Protocol Book and JTS CPGs
- No internet browsing - local document retrieval only

### Response Behavior

**If condition IS covered:**
- Provide protocol-supported recommendations with citations

**If condition is NOT covered:**
- State: "No direct protocol match found in the provided documents."
- Do NOT invent protocol authority
- Provide conservative guidance:
  - stabilize patient
  - assess ABCs
  - obtain/repeat vitals
  - identify red flags
  - monitor
  - contact preceptor
  - consider evacuation
- Clearly separate:
  - Protocol-supported recommendations
  - General clinical reasoning

---

## Red Flag System

### Static Approved Catalog
Located in `backend/data/red_flags_catalog.json`

### Universal Red Flags (Always Display)
- Airway compromise
- Severe respiratory distress
- Hemodynamic instability
- Altered mental status
- Uncontrolled bleeding
- Severe pain out of proportion
- Rapid clinical deterioration
- Inability to obtain vital signs

### Chief Complaint Matching
- Keyword matching + semantic similarity
- Confidence thresholds:
  - ≥ 0.75: Display universal + matched category red flags
  - 0.50-0.74: Display universal + top 2 categories, prompt user selection
  - < 0.50: Display universal only with guidance message

### Constraints
- AI must NOT generate new red flag items
- Only select from approved catalog
- Include "Add Other Red Flag" free-text option

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **PDF Extraction:** PyMuPDF (fitz)
- **Vector Database:** ChromaDB
- **Embeddings:** Configurable (default: sentence-transformers)
- **LLM:** Configurable (default: OpenAI GPT)

### Frontend
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **Responsive:** Mobile-first

### Storage
- Local filesystem for PDFs + vector index
- Session-only case data (no persistent storage)

---

## Security / Access

### Gate Screen Required
```
Restricted Prototype – No Medical Use

This application is a prototype for evaluation and training demonstration. 
It is not approved for clinical use and must not be used to make real patient care decisions.

AI outputs may be incorrect or incomplete. Users must independently verify all findings, 
medications, doses, contraindications, and protocol guidance.

This application does not replace clinical judgment, required protocol review, 
or required preceptor consultation.

Do not enter PII or PHI.

By continuing, you confirm you are an authorized evaluator and will not use this tool for clinical care.
```

### Persistent Banner
```
Prototype only. Not for clinical use. Verify all information. Do not enter PII/PHI.
```

### Footer
```
© 2026 Mark Prats. Prototype for evaluation purposes. Not an official U.S. Air Force or Department of Defense system.
```

---

## UI Screens

1. **Gate Screen** - Security acknowledgment
2. **Document Upload / Knowledge Base** - PDF management
3. **Case Input** - Clinical data entry
4. **Preceptor Output** - AI response display
5. **Training Mode** - Educational workflow

---

## Case Input Fields

### A. Chief Complaint + Context
- Chief complaint (required)
- Environment (field, aircraft, ship, etc.)
- Resources available
- Evacuation available (yes/no)
- Communication available (yes/no)

### B. HPI (OPQRST)
- Onset
- Provocation/Palliation
- Quality
- Radiation
- Severity (1-10 scale)
- Time course

### C. Red Flags
- Dynamically generated per chief complaint
- Universal red flags always shown
- "Add Other Red Flag" option

### D. Vitals
- Heart Rate (bpm)
- Blood Pressure (systolic/diastolic)
- Respiratory Rate (breaths/min)
- SpO2 (%)
- Temperature (°F)
- Pain Score (0-10)
- Weight (kg) - optional
- Checkbox: "Unable to obtain vitals"

### E. Physical Exam
- Cardiopulmonary
- Abdomen
- Neurological
- Skin
- Musculoskeletal

### F. Meds / Allergies / History
- Current medications
- Allergies
- Past medical history

### G. IDMT Assessment and Plan
- Free-text field (optional)

### H. Voice Input
- Scaffold only - display placeholder

---

## Output Structure

1. **Immediate Red Flags** - Critical findings
2. **Differential Diagnosis**
   - Cannot miss
   - More common
   - Other considerations
3. **What to Ask / Check Next** - Follow-up questions
4. **Protocol-Supported Recommendations**
   - Document name
   - Page number
   - Source snippet
   - Expandable "View Source"
5. **General Clinical Reasoning** - Non-protocol guidance
6. **Medication Guidance**
   - ONLY if dosing is cited
   - Include verification warning
7. **IDMT Assessment & Plan Review**
8. **Call Preceptor / Evacuate** - Recommendations
9. **Confidence & Data Integrity**
   - Confidence: High / Moderate / Low
   - Data completeness
   - Protocol support level
   - Limitations
10. **Safety Disclaimer**

---

## Training Mode

- Require user to enter A/P before showing AI answer
- Then provide:
  - Critique reasoning
  - Identify missed red flags
  - Teaching points

---

## Logging

### Metadata Only (No Patient Content)
- Complaint category
- Confidence level
- Completeness score
- Protocol support level
- Retrieval count

---

## Retrieval Rules

- Use only uploaded documents
- Always include page-level citation
- Flag conflicts if present

### Hierarchy
1. IDMT Protocol Book
2. JTS CPGs
3. Other uploaded docs
4. General reasoning (last resort)

---

## Clinical Safety Rules

- Never invent protocol authority
- Always escalate unstable patients
- Require citation for dosing
- Separate protocol vs reasoning
- Clearly state uncertainty

---

## Build Priority

1. Functional prototype
2. Accurate citation system
3. Safe output behavior
4. Mobile usability
5. UI polish later