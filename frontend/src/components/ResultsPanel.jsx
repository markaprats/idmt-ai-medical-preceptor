import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Brain, FileText, ChevronLeft, RefreshCw, Copy, CheckCircle } from 'lucide-react'

export default function ResultsPanel() {
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [redFlags, setRedFlags] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load case data from sessionStorage
    const storedCase = sessionStorage.getItem('caseData')
    const storedFlags = sessionStorage.getItem('redFlags')
    
    if (storedCase) {
      setCaseData(JSON.parse(storedCase))
    }
    if (storedFlags) {
      setRedFlags(JSON.parse(storedFlags))
    }
    
    // Simulate AI processing
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const handleCopy = () => {
    const text = generateReport()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateReport = () => {
    if (!caseData) return ''
    
    return `
IDMT AI Medical Preceptor - Clinical Analysis Report
=====================================================
Chief Complaint: ${caseData.chiefComplaint}
Onset: ${caseData.onset || 'Not specified'}
Severity: ${caseData.severity}/10

Vital Signs:
- Heart Rate: ${caseData.vitalSigns.heartRate || 'Not recorded'} bpm
- Blood Pressure: ${caseData.vitalSigns.bloodPressure || 'Not recorded'} mmHg
- Respiratory Rate: ${caseData.vitalSigns.respiratoryRate || 'Not recorded'} /min
- Temperature: ${caseData.vitalSigns.temperature || 'Not recorded'} °F
- SpO2: ${caseData.vitalSigns.oxygenSaturation || 'Not recorded'}%

${redFlags ? `
RED FLAGS IDENTIFIED:
${redFlags.matchedCategory ? `Category: ${redFlags.matchedCategory}` : 'General monitoring required'}

Universal Red Flags to Monitor:
${redFlags.universal.map(f => `- ${f}`).join('\n')}

${redFlags.categorySpecific.length > 0 ? `Category-Specific Red Flags:
${redFlags.categorySpecific.map(f => `- ${f}`).join('\n')}` : ''}
` : ''}

CLINICAL RECOMMENDATIONS:
=========================
This is a prototype analysis. All recommendations must be verified against 
approved protocols and clinical judgment.

1. Assess and monitor ABCs
2. Reassess vital signs frequently
3. Identify and monitor for red flags
4. Consider evacuation criteria
5. Contact preceptor for guidance

---
Generated: ${new Date().toLocaleString()}
Prototype v1.0 - For Training Only
    `.trim()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-red-600 animate-spin mb-4" />
          <p className="text-slate-600">Analyzing case...</p>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600 mb-4">No case data found</p>
        <button
          onClick={() => navigate('/case')}
          className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
        >
          Enter a Case
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Analysis Results</h1>
          <p className="text-slate-600 mt-1">Clinical decision support output</p>
        </div>
        <button
          onClick={() => navigate('/case')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* Case Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Case Summary</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Chief Complaint</p>
            <p className="font-medium text-slate-800">{caseData.chiefComplaint}</p>
          </div>
          <div>
            <p className="text-slate-500">Onset</p>
            <p className="font-medium text-slate-800">{caseData.onset || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-500">Severity</p>
            <p className="font-medium text-slate-800">{caseData.severity}/10</p>
          </div>
          <div>
            <p className="text-slate-500">Location</p>
            <p className="font-medium text-slate-800">{caseData.location || 'Not specified'}</p>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-2">Vital Signs</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'HR', value: caseData.vitalSigns.heartRate },
              { label: 'BP', value: caseData.vitalSigns.bloodPressure },
              { label: 'RR', value: caseData.vitalSigns.respiratoryRate },
              { label: 'Temp', value: caseData.vitalSigns.temperature },
              { label: 'SpO2', value: caseData.vitalSigns.oxygenSaturation },
            ].map((vital) => (
              <div key={vital.label} className="bg-slate-50 rounded p-2 text-center">
                <p className="text-xs text-slate-500">{vital.label}</p>
                <p className="font-medium text-slate-800">{vital.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {redFlags && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Red Flags Identified</h2>
            {redFlags.matchedCategory && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                {redFlags.matchedCategory.replace(/_/g, ' ').toUpperCase()}
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-red-700 mb-2">Universal Red Flags</p>
              <ul className="space-y-1">
                {redFlags.universal.map((flag, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-800">
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>

            {redFlags.categorySpecific.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">Category-Specific</p>
                <ul className="space-y-1">
                  {redFlags.categorySpecific.map((flag, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-red-800">
                      <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Guidance */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-slate-800">AI Guidance</h2>
        </div>

        <div className="prose prose-sm max-w-none text-slate-600">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800 font-medium">⚠️ Prototype Notice</p>
            <p className="text-sm text-yellow-700">This is simulated output for demonstration. All recommendations require clinical verification against approved protocols.</p>
          </div>

          <h3 className="text-base font-medium text-slate-800 mb-2">Assessment & Recommendations</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Primary survey: reassess ABCs</li>
            <li>Continuous monitoring of vital signs</li>
            <li>Watch for deterioration per identified red flags</li>
            <li>Consider evacuation criteria based on clinical presentation</li>
            <li>Document all findings and interventions</li>
            <li>Contact preceptor for guidance as needed</li>
          </ul>

          <h3 className="text-base font-medium text-slate-800 mt-4 mb-2">Protocol Reference</h3>
          <p>No direct protocol match found in uploaded documents. General clinical principles applied.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Report'}
        </button>

        <button
          onClick={() => navigate('/training')}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
        >
          <FileText className="w-4 h-4" />
          Enter Training Mode
        </button>
      </div>
    </div>
  )
}