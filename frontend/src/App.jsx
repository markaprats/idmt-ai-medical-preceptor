import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import GateScreen from './components/GateScreen'
import Layout from './components/Layout'
import DocumentUpload from './components/DocumentUpload'
import CaseInput from './components/CaseInput'
import ResultsPanel from './components/ResultsPanel'
import TrainingMode from './components/TrainingMode'

function App() {
  const [acknowledged, setAcknowledged] = useState(false)

  if (!acknowledged) {
    return <GateScreen onAcknowledge={() => setAcknowledged(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/upload" replace />} />
          <Route path="upload" element={<DocumentUpload />} />
          <Route path="case" element={<CaseInput />} />
          <Route path="results" element={<ResultsPanel />} />
          <Route path="training" element={<TrainingMode />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App