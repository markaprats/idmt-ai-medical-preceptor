import { useEffect, useState } from "react";

export default function ResultsPanel({ caseData }) {
  const [protocolResults, setProtocolResults] = useState([]);
  const [openSourceIndex, setOpenSourceIndex] = useState(null);

  useEffect(() => {
    if (!caseData?.chiefComplaint) return;

    fetch("http://127.0.0.1:8000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: caseData.chiefComplaint }),
    })
      .then((res) => res.json())
      .then((data) => setProtocolResults(data.results || []))
      .catch(() => setProtocolResults([]));
  }, [caseData]);

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
  const hasRedFlags = selectedRedFlags.length > 0;

  const vitalsComplete =
    caseData.hr &&
    caseData.bp &&
    caseData.rr &&
    caseData.spo2 &&
    caseData.temp &&
    !caseData.incompleteVitals;

  const hpiFields = [
    caseData.onset,
    caseData.provocation,
    caseData.quality,
    caseData.radiation,
    caseData.timeCourse,
  ];

  const completedHpi = hpiFields.filter(Boolean).length;

  const completenessPercent = Math.min(
    Math.round(
      (((vitalsComplete ? 35 : 15) +
        completedHpi * 8 +
        (caseData.focusedExam ? 15 : 0)) /
        90) *
        100
    ),
    100
  );

  const dataCompleteness =
    completenessPercent >= 75
      ? "High"
      : completenessPercent >= 45
      ? "Moderate"
      : "Low";

  const hasProtocolMatches = protocolResults.length > 0;
  const hasFocusedExam = Boolean(caseData.focusedExam);

  const protocolSupport =
    protocolResults.length >= 3
      ? "Partial to Strong"
      : protocolResults.length > 0
      ? "Partial"
      : "None";

  let overallConfidence = "Low";

  if (vitalsComplete && hasFocusedExam && hasProtocolMatches && !hasRedFlags) {
    overallConfidence = "High";
  } else if ((vitalsComplete || hasFocusedExam) && hasProtocolMatches) {
    overallConfidence = "Moderate";
  }

  const sourceLabel =
    protocolResults.length > 0
      ? `${protocolResults[0].document_name}, p. ${protocolResults[0].page_number}`
      : "No source match";

  const sourceSteps = protocolResults.slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Preceptor Guidance
              </h2>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                Analysis Complete
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Guidance below is based on the case information entered and retrieved protocol source matches.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_260px] md:items-center">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-900">
                This guidance is protocol-supported but requires independent clinical judgment.
              </p>
              <p className="text-sm text-yellow-900">
                Escalate if patient condition worsens or you are uncertain. Verify all recommendations against source material.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Data Completeness</span>
              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                {dataCompleteness}
              </span>
            </div>
            <div className="h-2 rounded-full bg-yellow-100">
              <div
                className="h-2 rounded-full bg-yellow-500"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-600">
              {completenessPercent}% complete
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-red-800">1. Immediate Red Flags</h3>
          {selectedRedFlags.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-red-900">
              {selectedRedFlags.map((flag) => (
                <li key={flag} className="flex gap-2">
                  <span>⚠️</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-red-900">
              No red flags selected. Continue reassessment and verify against protocol.
            </p>
          )}

          {!vitalsComplete && (
            <p className="mt-3 rounded-lg bg-white/70 p-2 text-sm text-red-900">
              Vital signs are incomplete, which limits risk assessment.
            </p>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-blue-800">
            2. Most Likely Differentials
          </h3>
          <p className="mt-3 text-sm text-slate-600">
            Pending AI synthesis. This section will use the retrieved protocol source matches below.
          </p>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-blue-800">
            3. What You Need to Ask / Check Next
          </h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {!vitalsComplete && <li>Obtain or repeat complete vital signs if possible.</li>}
            {!caseData.onset && <li>Clarify onset.</li>}
            {!caseData.provocation && <li>Clarify provoking and relieving factors.</li>}
            {!caseData.quality && <li>Clarify symptom quality.</li>}
            {!caseData.radiation && <li>Clarify location and radiation.</li>}
            {!caseData.focusedExam && <li>Document a focused exam relevant to the chief complaint.</li>}
            <li>Reassess for progression or new red flags.</li>
          </ul>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Case Summary</h3>
          <div className="mt-3 grid gap-2 text-sm">
            <p><strong>Chief complaint:</strong> {caseData.chiefComplaint || "Not entered"}</p>
            <p><strong>Environment:</strong> {caseData.environment || "Not entered"}</p>
            <p><strong>Resources:</strong> {caseData.resources || "Not entered"}</p>
            <p><strong>Evacuation:</strong> {caseData.evacuationAvailable || "Unknown"}</p>
            <p><strong>Communication:</strong> {caseData.communicationAvailable || "Unknown"}</p>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-green-800">
          4. Protocol-Based Source Matches
        </h3>

        {sourceSteps.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="space-y-3">
              {sourceSteps.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 rounded-xl border bg-white p-3 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Match {idx + 1}</p>
                    <p className="text-xs text-slate-600">
                      {item.document_name} · Page {item.page_number} · Score {item.score}
                    </p>
                    <p className="mt-1 line-clamp-2 text-slate-700">
                      {item.snippet}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenSourceIndex(openSourceIndex === idx ? null : idx)
                    }
                    className="rounded-lg border px-3 py-2 text-sm font-semibold text-blue-700"
                  >
                    {openSourceIndex === idx ? "Hide Source" : "View Source"}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-white p-4 text-sm">
              {openSourceIndex !== null ? (
                <>
                  <p className="font-semibold">Source Detail</p>
                  <p className="text-xs text-slate-600">
                    {protocolResults[openSourceIndex]?.document_name} · Page{" "}
                    {protocolResults[openSourceIndex]?.page_number}
                  </p>
                  <div className="mt-3 max-h-72 overflow-y-auto rounded-lg bg-yellow-50 p-3 text-slate-800">
                    {protocolResults[openSourceIndex]?.snippet}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold">Source Preview</p>
                  <p className="mt-2 text-slate-600">
                    Select “View Source” to inspect the retrieved text and page number.
                  </p>
                  <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    Top source: {sourceLabel}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border bg-white p-4 text-sm">
            <p className="font-semibold text-slate-900">
              No direct protocol match found in the uploaded documents.
            </p>
            <p className="mt-1 text-slate-700">
              Default to stabilization, reassessment, preceptor consultation, and evacuation/escalation as clinically appropriate.
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-blue-800">
            5. Assessment & Plan Review
          </h3>
          {caseData.assessment || caseData.plan ? (
            <div className="mt-3 space-y-3 text-sm">
              <p><strong>Entered Assessment:</strong> {caseData.assessment || "Not entered"}</p>
              <p><strong>Entered Plan:</strong> {caseData.plan || "Not entered"}</p>
              <p className="rounded-lg bg-blue-50 p-2 text-blue-900">
                AI critique pending. This will identify agreement, gaps, risks, and protocol alignment.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No IDMT assessment and plan entered for review.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-red-800">
            6. When to Call Preceptor / Evacuate
          </h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">
            <li>Any selected red flag is present and unexplained.</li>
            <li>Vitals are unstable or worsening.</li>
            <li>Diagnosis is unclear.</li>
            <li>Required protocol guidance cannot be confirmed.</li>
            <li>Resources are insufficient for safe evaluation or treatment.</li>
          </ul>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-blue-800">
            7. Confidence & Data Integrity
          </h3>
          <div className="mt-3 space-y-3 text-sm">
            <p>
              <strong>Overall confidence:</strong>{" "}
              <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                {overallConfidence}
              </span>
            </p>
            <p><strong>Data completeness:</strong> {dataCompleteness}</p>
            <p><strong>Protocol support:</strong> {protocolSupport}</p>

            <div>
              <p className="font-semibold text-green-700">Drivers of Confidence</p>
              <ul className="mt-1 list-disc pl-5">
                {caseData.chiefComplaint && <li>Chief complaint provided</li>}
                {vitalsComplete && <li>Complete vitals provided</li>}
                {caseData.focusedExam && <li>Focused exam documented</li>}
                {protocolResults.length > 0 && <li>Protocol source matches retrieved</li>}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-orange-700">Limitations / Weak Data</p>
              <ul className="mt-1 list-disc pl-5">
                {!vitalsComplete && <li>Vitals incomplete or unavailable</li>}
                {!caseData.focusedExam && <li>Focused exam missing</li>}
                {protocolResults.length === 0 && <li>No direct protocol source match</li>}
                <li>Confidence is rule-based until AI synthesis is connected</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-slate-50 p-5 text-sm shadow-sm">
        <strong>Safety Disclaimer:</strong> This output is not a diagnosis. Verify all information,
        medication guidance, and protocol authority. Use clinical judgment and escalate when needed.
      </section>
    </div>
  );
}