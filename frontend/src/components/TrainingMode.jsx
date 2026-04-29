import { useState } from 'react'
import { GraduationCap, Play, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react'

const trainingScenarios = [
  {
    id: 1,
    title: 'Chest Pain Evaluation',
    chiefComplaint: 'Chest pain',
    description: 'A 45-year-old male presents with substernal chest pressure for 1 hour, associated with diaphoresis and shortness of breath.',
    correctCategory: 'chest_pain',
    expectedRedFlags: ['Pain radiating to arm/jaw/neck', 'Diaphoresis', 'Shortness of breath'],
    learningPoints: [
      'Always consider cardiac etiology with chest pain',
      'Note associated symptoms like diaphoresis',
      'Obtain 12-lead ECG within 10 minutes',
      'Monitor for hemodynamic instability'
    ]
  },
  {
    id: 2,
    title: 'Respiratory Distress',
    chiefComplaint: 'Shortness of breath',
    description: 'A 28-year-old female with asthma presents with wheezing, use of accessory muscles, and inability to speak full sentences.',
    correctCategory: 'difficulty_breathing',
    expectedRedFlags: ['Use of accessory muscles', 'Inability to speak full sentences', 'SpO2 <90%'],
    learningPoints: [
      'Assess airway and breathing severity',
      'Look for signs of respiratory failure',
      'Peak flow measurement if available',
      'Prepare for airway intervention'
    ]
  },
  {
    id: 3,
    title: 'Trauma Assessment',
    chiefComplaint: 'Leg injury',
    description: 'A 32-year-old male with open femur fracture from motorcycle crash, active bleeding from wound.',
    correctCategory: 'trauma',
    expectedRedFlags: ['Uncontrolled hemorrhage', 'Airway compromise', 'Hemodynamic instability'],
    learningPoints: [
      'CABC: Catastrophic bleeding, Airway, Breathing, Circulation',
      'Control hemorrhage first',
      'Assess for shock',
      'Consider evacuation criteria'
    ]
  },
  {
    id: 4,
    title: 'Altered Mental Status',
    chiefComplaint: 'Confusion',
    description: 'A 68-year-old male found confused, unable to follow commands, history of diabetes.',
    correctCategory: 'altered_mental_status',
    expectedRedFlags: ['Glasgow <13', 'Hypoglycemia', 'New focal deficits'],
    learningPoints: [
      'Check glucose immediately',
      'Assess for airway compromise',
      'Consider toxic/metabolic causes',
      'Full neurological exam'
    ]
  }
]

export default function TrainingMode() {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completed, setCompleted] = useState([])

  const scenario = trainingScenarios[currentScenario]

  const handleNext = () => {
    if (!completed.includes(currentScenario)) {
      setCompleted([...completed, currentScenario])
    }
    
    if (currentScenario < trainingScenarios.length - 1) {
      setCurrentScenario(currentScenario + 1)
      setShowAnswer(false)
    }
  }

  const handlePrev = () => {
    if (currentScenario > 0) {
      setCurrentScenario(currentScenario - 1)
      setShowAnswer(false)
    }
  }

  const handleRestart = () => {
    setCurrentScenario(0)
    setShowAnswer(false)
    setCompleted([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Training Mode</h1>
        <p className="text-slate-600 mt-1">Practice clinical decision-making with case scenarios</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {trainingScenarios.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < currentScenario ? 'bg-red-600' :
              i === currentScenario ? 'bg-red-400' :
              'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Scenario {currentScenario + 1} of {trainingScenarios.length}
      </p>

      {/* Scenario Card */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">{scenario.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Case Description */}
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-2">CASE PRESENTATION</h3>
            <p className="text-slate-800">{scenario.description}</p>
          </div>

          {/* Chief Complaint */}
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-2">CHIEF COMPLAINT</h3>
            <p className="text-lg font-semibold text-slate-800">{scenario.chiefComplaint}</p>
          </div>

          {/* Reveal Answer */}
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
            >
              <Play className="w-4 h-4" />
              Reveal Analysis
            </button>
          ) : (
            <div className="space-y-4">
              {/* Expected Red Flags */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">EXPECTED RED FLAGS</h3>
                <ul className="space-y-1">
                  {scenario.expectedRedFlags.map((flag, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Learning Points */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">LEARNING POINTS</h3>
                <ul className="space-y-2">
                  {scenario.learningPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <span className="text-blue-500 font-bold">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentScenario === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentScenario === 0
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Previous
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleRestart}
              className="p-2 text-slate-600 hover:text-slate-800"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={!showAnswer}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                showAnswer
                  ? 'bg-red-700 text-white hover:bg-red-800'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {currentScenario === trainingScenarios.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Completion Message */}
      {completed.length === trainingScenarios.length && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-green-800">Training Complete!</h3>
          <p className="text-sm text-green-700 mt-2">
            You have completed all {trainingScenarios.length} scenarios.
          </p>
          <button
            onClick={handleRestart}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Restart Training
          </button>
        </div>
      )}
    </div>
  )
}