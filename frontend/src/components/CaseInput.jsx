import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Save } from 'lucide-react'
import redFlagCatalog from '../red_flag_catalog.json'

export default function CaseInput() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    onset: '',
    severity: 5,
    location: '',
    radiation: '',
    associatedSymptoms: '',
    interventions: '',
    vitalSigns: {
      heartRate: '',
      bloodPressure: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: '',
    },
    mechanismOfInjury: '',
    pastMedicalHistory: '',
    medications: '',
    allergies: '',
  })

  const [matchedRedFlags, setMatchedRedFlags] = useState(null)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Trigger red flag matching when chief complaint changes
    if (field === 'chiefComplaint' && value) {
      const matches = matchRedFlags(value)
      setMatchedRedFlags(matches)
    }
  }

  const handleVitalChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [field]: value }
    }))
  }

  const matchRedFlags = (complaint) => {
    const complaintLower = complaint.toLowerCase()
    const categories = redFlagCatalog.chief_complaint_categories
    const universal = redFlagCatalog.universal_red_flags
    
    let bestMatch = null
    let bestScore = 0

    for (const [categoryName, categoryData] of Object.entries(categories)) {
      let score = 0
      for (const keyword of categoryData.keywords) {
        if (complaintLower.includes(keyword.toLowerCase())) {
          score += 1
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = { name: categoryName, ...categoryData, score }
      }
    }

    if (bestScore > 0) {
      return {
        universal,
        categorySpecific: bestMatch.red_flags,
        matchedCategory: bestMatch.name,
        confidence: Math.min(bestScore / 3, 1)
      }
    }
    return { universal, categorySpecific: [], matchedCategory: null, confidence: 0 }
  }

  const handleSubmit = () => {
    // Store form data in sessionStorage for Results panel
    sessionStorage.setItem('caseData', JSON.stringify(formData))
    sessionStorage.setItem('redFlags', JSON.stringify(matchedRedFlags))
    navigate('/results')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clinical Case Input</h1>
        <p className="text-slate-600 mt-1">Enter patient presentation for AI analysis</p>
      </div>

      {/* Red Flags Warning */}
      {matchedRedFlags && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Red Flags for: {matchedRedFlags.matchedCategory || 'General'}</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-red-700 mb-2">Universal Red Flags (Always Monitor)</p>
              <ul className="text-sm text-red-800 space-y-1">
                {matchedRedFlags.universal.slice(0, 4).map((flag, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
            
            {matchedRedFlags.categorySpecific.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">Category-Specific Red Flags</p>
                <ul className="text-sm text-red-800 space-y-1">
                  {matchedRedFlags.categorySpecific.slice(0, 4).map((flag, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        {/* Chief Complaint */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Chief Complaint <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.chiefComplaint}
            onChange={(e) => handleChange('chiefComplaint', e.target.value)}
            placeholder="e.g., Chest pain, shortness of breath, leg injury"
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Onset & Severity */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Onset</label>
            <input
              type="text"
              value={formData.onset}
              onChange={(e) => handleChange('onset', e.target.value)}
              placeholder="e.g., 2 hours ago, sudden"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Severity (1-10)
              <span className="ml-2 font-normal text-slate-500">Current: {formData.severity}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.severity}
              onChange={(e) => handleChange('severity', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Location & Radiation */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Left chest, lower abdomen"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Radiation</label>
            <input
              type="text"
              value={formData.radiation}
              onChange={(e) => handleChange('radiation', e.target.value)}
              placeholder="e.g., To left arm, to back"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {/* Associated Symptoms */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Associated Symptoms</label>
          <textarea
            value={formData.associatedSymptoms}
            onChange={(e) => handleChange('associatedSymptoms', e.target.value)}
            placeholder="e.g., Nausea, sweating, shortness of breath"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Vital Signs */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 mb-4">Vital Signs</h3>
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">HR (bpm)</label>
              <input
                type="text"
                value={formData.vitalSigns.heartRate}
                onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                placeholder="e.g., 90"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">BP (mmHg)</label>
              <input
                type="text"
                value={formData.vitalSigns.bloodPressure}
                onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                placeholder="e.g., 120/80"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">RR (/min)</label>
              <input
                type="text"
                value={formData.vitalSigns.respiratoryRate}
                onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                placeholder="e.g., 18"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temp (°F)</label>
              <input
                type="text"
                value={formData.vitalSigns.temperature}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                placeholder="e.g., 98.6"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SpO2 (%)</label>
              <input
                type="text"
                value={formData.vitalSigns.oxygenSaturation}
                onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
                placeholder="e.g., 98"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Mechanism of Injury (for trauma) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mechanism of Injury (if trauma)</label>
          <textarea
            value={formData.mechanismOfInjury}
            onChange={(e) => handleChange('mechanismOfInjury', e.target.value)}
            placeholder="e.g., MVA, fall from height, GSW"
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Past Medical History */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Past Medical History</label>
          <textarea
            value={formData.pastMedicalHistory}
            onChange={(e) => handleChange('pastMedicalHistory', e.target.value)}
            placeholder="e.g., Diabetes, hypertension, asthma"
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Medications & Allergies */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Medications</label>
            <textarea
              value={formData.medications}
              onChange={(e) => handleChange('medications', e.target.value)}
              placeholder="e.g., Lisinopril 10mg, Metformin 500mg"
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Allergies</label>
            <textarea
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="e.g., NKDA, Penicillin (rash)"
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {/* Interventions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Pre-hospital Interventions</label>
          <textarea
            value={formData.interventions}
            onChange={(e) => handleChange('interventions', e.target.value)}
            placeholder="e.g., IV established, tourniquet applied, medications given"
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!formData.chiefComplaint}
          className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
            formData.chiefComplaint
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          Analyze Case
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}