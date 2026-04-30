import { useEffect, useRef, useState } from "react";
import differentialCatalog from "../differential_catalog.json";
import gapCatalog from "../assessment_gap_catalog.json";

const API_BASE_URL = "https://idmt-ai-medical-preceptor.onrender.com";

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [String(value)];
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreDifferentialCategory(chiefComplaint, category) {
  const complaint = normalizeText(chiefComplaint);
  let score = 0;

  for (const keyword of category.keywords || []) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) continue;

    if (complaint.includes(normalizedKeyword)) {
      score = Math.max(score, 1);
      continue;
    }

    const parts = normalizedKeyword
      .split(" ")
      .filter((part) => part.length > 3 && part !== "pain");

    if (parts.length > 0) {
      const matchedParts = parts.filter((part) => complaint.includes(part)).length;
      if (matchedParts > 0) {
        score = Math.max(score, matchedParts / parts.length);
      }
    }
  }

  return score;
}

function getFallbackDifferential(chiefComplaint) {
  let bestCategory = null;
  let bestScore = 0;

  for (const category of Object.values(differentialCatalog)) {
    const score = scoreDifferentialCategory(chiefComplaint, category);

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (!bestCategory || bestScore < 0.5) {
    return {
      cannot_miss: [
        "Condition outside current fallback catalog",
        "Unstable patient or occult serious condition",
        "Protocol-limited condition requiring preceptor input"
      ],
      more_common: [
        "Benign/self-limited condition",
        "Musculoskeletal or functional process",
        "Viral or inflammatory process"
      ],
      other: [
        "Medication or exposure-related symptoms",
        "Atypical presentation requiring reassessment"
      ]
    };
  }

  return {
    cannot_miss: bestCategory.cannot_miss || [],
    more_common: bestCategory.more_common || [],
    other: bestCategory.other || []
  };
}

function getAssessmentGaps(chiefComplaint) {
  if (!chiefComplaint) return [];

  const text = normalizeText(chiefComplaint);

  let bestMatch = null;
  let bestScore = 0;

  for (const category of Object.values(gapCatalog)) {
    let score = 0;

    for (const keyword of category.keywords || []) {
      const normalizedKeyword = normalizeText(keyword);

      if (text.includes(normalizedKeyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch?.gaps || [];
}

function mergeGuidanceWithFallback(aiItems, fallbackItems, minimumCount = 3) {
  const aiList = normalizeList(aiItems);
  const fallbackList = normalizeList(fallbackItems);

  if (aiList.length >= minimumCount) {
    return aiList;
  }

  const combined = [...aiList];

  for (const item of fallbackList) {
    if (!combined.includes(item)) {
      combined.push(item);
    }

    if (combined.length >= minimumCount) break;
  }

  return combined;
}

function GuidanceList({ items, loadingAI, fallback = [] }) {
  const list = normalizeList(items);
  const fallbackList = normalizeList(fallback);

  if (list.length > 0) {
    return (
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {list.map((item, index) => (
          <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  }

  if (fallbackList.length > 0) {
    return (
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {fallbackList.map((item, index) => (
          <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  }

  if (loadingAI) {
    return <p className="text-sm text-blue-700">Generating additional guidance...</p>;
  }

  return <p className="text-sm text-slate-600">No additional guidance generated.</p>;
}

function SourceCheckList({ protocolResults }) {
  if (!protocolResults || protocolResults.length === 0) {
    return (
      <p className="mt-2 text-sm text-slate-700">
        No protocol source match found. Use clinical judgment, stabilize as needed, and contact a preceptor or evacuate when appropriate.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border bg-white p-4">
        <h4 className="font-semibold text-green-900">Sources to Verify</h4>
        <p className="mt-1 text-sm text-slate-600">
          These are retrieval matches for verification. Source excerpts are hidden by default because extracted text may lack surrounding document context.
        </p>

        <ul className="mt-3 space-y-2 text-sm">
          {protocolResults.slice(0, 5).map((item, index) => (
            <li key={index} className="rounded-lg bg-green-50 p-2">
              <span className="font-semibold">Source {index + 1}:</span>{" "}
              {item.document_name} · Page {item.page_number}
            </li>
          ))}
        </ul>
      </div>

      <details className="rounded-xl border bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-800">
          View retrieved source excerpts
        </summary>
        <div className="mt-3 space-y-3">
          {protocolResults.slice(0, 5).map((item, index) => (
            <div key={index} className="rounded-lg border bg-slate-50 p-3">
              <p className="font-semibold">
                Source {index + 1}: {item.document_name} · Page {item.page_number}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">
                {item.snippet}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default function ResultsPanel({ caseData }) {
  const [protocolResults, setProtocolResults] = useState([]);
  const [aiGuidance, setAiGuidance] = useState(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [aiError, setAiError] = useState("");
  const hasAutoGenerated = useRef(false);

  useEffect(() => {
    if (!caseData?.chiefComplaint) return;

    async function fetchSources() {
      setLoadingSources(true);
      setSourceError("");
      setProtocolResults([]);
      setAiGuidance(null);
      hasAutoGenerated.current = false;

      try {
        const searchRes = await fetch(`${API_BASE_URL}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: caseData.chiefComplaint }),
        });

        if (!searchRes.ok) {
          const errorText = await searchRes.text();
          throw new Error(`Protocol search failed: ${searchRes.status} ${errorText}`);
        }

        const searchData = await searchRes.json();
        setProtocolResults(searchData.results || []);
      } catch (error) {
        setSourceError(error.message || "Unable to retrieve protocol sources.");
      } finally {
        setLoadingSources(false);
      }
    }

    fetchSources();
  }, [caseData]);

  async function generateAIGuidance() {
    if (!caseData || loadingAI) return;

    setLoadingAI(true);
    setAiError("");

    try {
      const aiRes = await fetch(`${API_BASE_URL}/api/generate-guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_data: caseData,
          protocol_results: protocolResults,
        }),
      });

      if (!aiRes.ok) {
        const errorText = await aiRes.text();
        throw new Error(`AI guidance request failed: ${aiRes.status} ${errorText}`);
      }

      const aiData = await aiRes.json();
      let parsed = aiData.guidance;

      if (typeof parsed === "string") {
        parsed = parsed
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        parsed = JSON.parse(parsed);
      }

      setAiGuidance(parsed);
    } catch (error) {
      setAiError(error.message || "Unable to generate AI guidance.");
    } finally {
      setLoadingAI(false);
    }
  }

  useEffect(() => {
    if (!caseData?.chiefComplaint) return;
    if (loadingSources) return;
    if (loadingAI) return;
    if (aiGuidance) return;
    if (hasAutoGenerated.current) return;

    hasAutoGenerated.current = true;
    generateAIGuidance();
  }, [caseData, loadingSources, protocolResults, aiGuidance, loadingAI]);

  if (!caseData) {
    return (
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Preceptor Guidance</h2>
        <p className="mt-2 text-gray-600">
          No case submitted yet. Go to the Case page and enter a patient case first.
        </p>
      </section>
    );
  }

  const selectedRedFlags = caseData.selectedRedFlags || [];

  const vitalsComplete =
    caseData.hr &&
    caseData.bp &&
    caseData.rr &&
    caseData.spo2 &&
    caseData.temp &&
    !caseData.incompleteVitals;

  const fallbackDifferential = getFallbackDifferential(caseData.chiefComplaint);

  const cannotMissDifferential = mergeGuidanceWithFallback(
    aiGuidance?.differential_cannot_miss,
    fallbackDifferential.cannot_miss,
    3
  );

  const moreCommonDifferential = mergeGuidanceWithFallback(
    aiGuidance?.differential_more_common,
    fallbackDifferential.more_common,
    3
  );

  const otherDifferential = mergeGuidanceWithFallback(
    aiGuidance?.differential_other,
    fallbackDifferential.other,
    2
  );

  const redFlagFallback =
    selectedRedFlags.length > 0
      ? selectedRedFlags
      : [
          "No red flags selected from intake.",
          "Continue reassessment for airway compromise, respiratory distress, altered mental status, hemodynamic instability, uncontrolled bleeding, or rapid clinical deterioration."
        ];

  const gapChecklist = getAssessmentGaps(caseData.chiefComplaint);

  const askCheckFallback = [
    ...gapChecklist,
    !vitalsComplete && "Obtain or repeat complete vital signs if possible.",
    !caseData.onset && "Clarify onset and timing of symptoms.",
    !caseData.provocation && "Clarify provoking and relieving factors.",
    !caseData.quality && "Clarify symptom quality.",
    !caseData.radiation && "Clarify location and radiation.",
    !caseData.timeCourse && "Clarify progression or change over time.",
    !caseData.focusedExam && "Document a focused exam relevant to the chief complaint.",
    "Ask about associated symptoms and pertinent negatives.",
    "Reassess for new or worsening red flags.",
    "Verify recommendations against protocol source material and escalate when uncertain."
  ].filter(Boolean);  

  const protocolRecommendationFallback = protocolResults.length > 0
    ? [
        "Review the listed protocol source pages for verification.",
        "Use the source references to confirm scope of care, escalation triggers, and any medication guidance.",
        "If the source does not directly support an action, consult a preceptor or escalate care as appropriate."
      ]
    : [
        "No direct protocol source match found.",
        "Default to stabilization, reassessment, preceptor consultation, and evacuation or escalation as clinically appropriate."
      ];

  const medicationFallback = [
    "Medication guidance should only be used when supported by protocol or CPG source text.",
    "Verify dose, contraindications, allergies, weight-based requirements, and protocol authority before administration."
  ];

  const callPreceptorFallback = [
    "Call a preceptor if red flags are present, diagnosis is unclear, patient worsens, or protocol authority cannot be confirmed.",
    "Strongly consider evacuation or higher level evaluation for unstable vitals, altered mental status, severe respiratory distress, uncontrolled bleeding, severe pain out of proportion, or rapid deterioration."
  ];

  const hasProtocolMatches = protocolResults.length > 0;
  const dataCompleteness = vitalsComplete ? "Moderate to High" : "Low to Moderate";
  const protocolSupport = hasProtocolMatches ? "Partial source match found" : "No source match found";

  const confidenceText =
    typeof aiGuidance?.confidence_data_integrity === "number"
      ? `Rule-based confidence score returned by model: ${aiGuidance.confidence_data_integrity}. Interpret cautiously and verify source support.`
      : aiGuidance?.confidence_data_integrity ||
        `Data completeness is ${dataCompleteness}. Protocol support is ${protocolSupport}. Confidence remains limited until the entered data and retrieved sources are verified.`;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Preceptor Guidance</h2>
        <p className="mt-1 text-sm text-slate-600">
          Protocol source matches are retrieved first, then AI-assisted preceptor guidance is generated.
        </p>

        <button
          type="button"
          onClick={generateAIGuidance}
          disabled={loadingAI || loadingSources}
          className="mt-4 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60 md:w-auto"
        >
          {loadingAI ? "Generating Guidance..." : aiGuidance ? "Regenerate Guidance" : "Generate Preceptor Guidance"}
        </button>

        {loadingSources && (
          <p className="mt-3 text-sm text-blue-700">Retrieving protocol source matches...</p>
        )}

        {!loadingSources && loadingAI && (
          <p className="mt-3 text-sm text-blue-700">Generating AI-assisted guidance. This may take several seconds on mobile.</p>
        )}
      </section>

      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
        <p className="font-semibold text-yellow-900">
          ⚠️ Prototype only. Verify all recommendations against source material and use clinical judgment.
        </p>
        <p className="mt-1 text-sm text-yellow-900">
          This is not approved for clinical use and does not replace protocol review or preceptor consultation.
        </p>
      </section>

      {sourceError && (
        <section className="rounded-2xl border bg-red-50 p-4 text-sm text-red-900">
          Protocol retrieval unavailable: {sourceError}
        </section>
      )}

      {aiError && (
        <section className="rounded-2xl border bg-red-50 p-4 text-sm text-red-900">
          <p>AI guidance unavailable: {aiError}</p>
          <p className="mt-2">
            Showing rule-based fallback guidance from the entered case and retrieved protocol matches.
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white"
            onClick={generateAIGuidance}
          >
            Retry Guidance
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-red-800">1. Immediate Red Flags</h3>
        <GuidanceList
          items={aiGuidance?.immediate_red_flags}
          loadingAI={false}
          fallback={redFlagFallback}
        />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">2. Differential Diagnosis</h3>
        <p className="mt-1 text-sm text-slate-600">
          AI-generated differentials are supplemented with a fallback teaching catalog when output is limited.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="font-semibold">Cannot Miss</h4>
            <GuidanceList items={cannotMissDifferential} loadingAI={loadingAI} />
          </div>
          <div>
            <h4 className="font-semibold">More Common</h4>
            <GuidanceList items={moreCommonDifferential} loadingAI={loadingAI} />
          </div>
          <div>
            <h4 className="font-semibold">Other</h4>
            <GuidanceList items={otherDifferential} loadingAI={loadingAI} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">
          3. Critical Assessment Gaps & Next Steps
        </h3>
        <GuidanceList
          items={aiGuidance?.ask_check_next}
          loadingAI={false}
          fallback={askCheckFallback}
        />
      </section>

      <section className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-green-800">4. Protocol Alignment / Source Check</h3>

        <GuidanceList
          items={aiGuidance?.protocol_supported_recommendations}
          loadingAI={loadingAI}
          fallback={protocolRecommendationFallback}
        />

        <SourceCheckList protocolResults={protocolResults} />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">5. Medication Guidance</h3>
        <GuidanceList
          items={aiGuidance?.medication_guidance}
          loadingAI={loadingAI}
          fallback={medicationFallback}
        />
      </section>

      <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
         <h3 className="text-lg font-bold text-purple-900">
           6. Assessment & Plan Critique
         </h3>

         <p className="mt-1 text-sm text-purple-800">
           This section evaluates the entered assessment and plan for safety, accuracy, and protocol alignment.
         </p>

         <div className="mt-4 rounded-xl border bg-white p-4">
           <GuidanceList
             items={aiGuidance?.assessment_plan_review}
             loadingAI={loadingAI}
             fallback={
               caseData.assessment || caseData.plan
                 ? [
                     `Entered assessment: ${caseData.assessment || "Not entered"}`,
                     `Entered plan: ${caseData.plan || "Not entered"}`,
                     "AI critique will appear when generation completes."
                   ]
                 : ["No IDMT assessment or plan entered for review."]
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-red-800">7. Call Preceptor / Evacuate</h3>
        <GuidanceList
          items={aiGuidance?.call_preceptor_evacuate}
          loadingAI={loadingAI}
          fallback={callPreceptorFallback}
        />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">8. Confidence & Data Integrity</h3>
        <div className="mt-2 space-y-2 text-sm">
          <p><strong>Data completeness:</strong> {dataCompleteness}</p>
          <p><strong>Protocol support:</strong> {protocolSupport}</p>
        </div>
        <p className="mt-3 text-sm text-slate-700">{confidenceText}</p>
      </section>

      <section className="rounded-2xl border bg-slate-50 p-5 text-sm shadow-sm">
        <strong>Safety Disclaimer:</strong>{" "}
        {aiGuidance?.safety_disclaimer ||
          "This tool may produce incorrect or incomplete information. Verify all outputs and use sound clinical judgment."}
      </section>
    </div>
  );
}