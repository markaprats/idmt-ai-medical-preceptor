import { useState } from 'react'
import { Shield, AlertTriangle, X } from 'lucide-react'

export default function GateScreen({ onAcknowledge }) {
  const [checked, setChecked] = useState(false)

  const handleAgree = () => {
    if (checked) {
      onAcknowledge()
    }
  }

  const handleExit = () => {
    window.close()
    window.location.href = 'about:blank'
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-800 px-6 py-4 flex items-center gap-3">
          <Shield className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Restricted Prototype – No Medical Use</h1>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-b border-yellow-300 px-6 py-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Evaluation and Training Use Only</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 text-sm text-slate-700">
            <p>This application is a prototype for evaluation and training demonstration. It is not approved for clinical use and must not be used to make real patient care decisions.</p>
            
            <p>AI outputs may be incorrect or incomplete. Users must independently verify all findings, medications, doses, contraindications, and protocol guidance.</p>
            
            <p>This application does not replace clinical judgment, required protocol review, or required preceptor consultation.</p>
            
            <p className="font-semibold text-red-700">Do not enter PII or PHI.</p>
            
            <p>By continuing, you confirm you are an authorized evaluator and will not use this tool for clinical care.</p>
          </div>

          {/* Checkbox */}
          <div className="mt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 w-5 h-5 text-red-700 border-red-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">
                I have read and understand the above warnings
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
            Exit
          </button>
          <button
            onClick={handleAgree}
            disabled={!checked}
            className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
              checked
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            I Agree – Authorized Evaluator
          </button>
        </div>
      </div>
    </div>
  )
}