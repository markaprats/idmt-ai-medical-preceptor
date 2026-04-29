# IDMT AI Medical Preceptor

A clinical decision support prototype for Independent Duty Medical Technicians (IDMTs). This application simulates an offline/protocol-grounded AI preceptor using uploaded medical documents for retrieval-augmented generation.

## ⚠️ Important Disclaimer

This is a **prototype for demonstration and training purposes only**. It is NOT intended for clinical use.

- AI responses are simulated and may be inaccurate
- All outputs require clinical verification against approved protocols
- User is responsible for verifying all recommendations
- Follow your scope of practice and local protocols

## Features

- **Gate Screen**: Security acknowledgment with prototype warning
- **Document Upload**: Upload IDMT Protocol Book and JTS CPGs (PDF)
- **Case Input Form**: Structured clinical data entry
- **Red Flag System**: Static catalog with dynamic keyword matching
- **AI Guidance Output**: Simulated clinical recommendations
- **Training Mode**: Educational case scenarios

## Project Structure

```
IDMT-AI-Medical-Preceptor/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── documents.py
│   │   │   └── query.py
│   │   └── services/
│   │       ├── red_flags.py
│   │       └── rag.py
│   ├── data/
│   │   └── red_flags_catalog.json
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GateScreen.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── CaseInput.jsx
│   │   │   ├── ResultsPanel.jsx
│   │   │   └── TrainingMode.jsx
│   │   ├── utils/
│   │   │   └── redFlagMatcher.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docs/
├── README.md
└── .gitignore
```

## Quick Start

### Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys (optional for prototype)

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/documents` | POST | Upload PDF document |
| `/api/documents` | GET | List uploaded documents |
| `/api/documents/{id}` | DELETE | Delete document |
| `/api/query` | POST | Submit clinical query |

## Red Flag System

The system uses a static catalog with dynamic keyword matching:

- **Confidence ≥ 0.75**: Single category match
- **Confidence 0.50-0.74**: Top 2 categories combined
- **Confidence < 0.50**: Universal red flags only

### Categories

- Chest Pain
- Difficulty Breathing
- Abdominal Pain
- Headache
- Altered Mental Status
- Trauma
- Environmental
- Allergic Reaction
- Medication Issue
- Psychiatric

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | FastAPI, Python 3.11+ |
| PDF Extraction | PyMuPDF (fitz) |
| Vector DB | ChromaDB (placeholder) |
| AI/LLM | LangChain (configurable) |
| Embeddings | sentence-transformers |

## License

MIT License - See LICENSE file for details

---

**Note**: This prototype is for educational and demonstration purposes. Always follow approved protocols and clinical guidelines in real-world applications.