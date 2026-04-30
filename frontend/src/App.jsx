import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import GateScreen from './components/GateScreen'
import Layout from './components/Layout'
import DocumentUpload from './components/DocumentUpload'
import CaseInput from './components/CaseInput'
import ResultsPanel from './components/ResultsPanel'

function CasePage({ setSubmittedCase }) {
  const navigate = useNavigate()

  function handleSubmit(caseData) {
    setSubmittedCase(caseData)
    sessionStorage.setItem('submittedCase', JSON.stringify(caseData))
    navigate('/results')
  }

  return <CaseInput onSubmit={handleSubmit} />
}

function getSavedCase() {
  try {
    const saved = sessionStorage.getItem('submittedCase')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function App() {
  const [acknowledged, setAcknowledged] = useState(false)
  const [submittedCase, setSubmittedCase] = useState(getSavedCase)

  if (!acknowledged) {
    return <GateScreen onAcknowledge={() => setAcknowledged(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/case" replace />} />
          <Route path="upload" element={<DocumentUpload />} />
          <Route path="case" element={<CasePage setSubmittedCase={setSubmittedCase} />} />
          <Route path="results" element={<ResultsPanel caseData={submittedCase} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App