import { useEffect, useState } from "react";

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [String(value)];
}

function GuidanceList({ items }) {
  const list = normalizeList(items);
  if (list.length === 0) return <p className="text-sm text-slate-600">No output generated.</p>;

  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
      {list.map((item, index) => (
        <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}

export default function ResultsPanel({ caseData }) {
  const [protocolResults, setProtocolResults] = useState([]);
  const [aiGuidance, setAiGuidance] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (!caseData?.chiefComplaint) return;

    async function runGuidance() {
      setLoadingAI(true);
      setAiError("");

      try {
        const searchRes = await fetch("http://127.0.0.1:8000/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: caseData.chiefComplaint }),
        });

        const searchData = await searchRes.json();
        const results = searchData.results || [];
        setProtocolResults(results);

        const aiRes = await fetch("http://127.0.0.1:8000/api/generate-guidance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_data: caseData,
            protocol_results: results,
          }),
        });

        if (!aiRes.ok) {
          throw new Error("AI guidance request failed.");
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

    runGuidance();
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

  const vitalsComplete =
    caseData.hr &&
    caseData.bp &&
    caseData.rr &&
    caseData.spo2 &&
    caseData.temp &&
    !caseData.incompleteVitals;

  const hasProtocolMatches = protocolResults.length > 0;
  const dataCompleteness = vitalsComplete ? "Moderate to High" : "Low to Moderate";
  const protocolSupport = hasProtocolMatches ? "Partial source match found" : "No source match found";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Preceptor Guidance</h2>
        <p className="mt-1 text-sm text-slate-600">
          AI-generated guidance using case data and retrieved protocol source matches.
        </p>
      </section>

      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
        <p className="font-semibold text-yellow-900">
          ⚠️ Prototype only. Verify all recommendations against source material and use clinical judgment.
        </p>
        <p className="mt-1 text-sm text-yellow-900">
          This is not approved for clinical use and does not replace protocol review or preceptor consultation.
        </p>
      </section>

      {loadingAI && (
        <section className="rounded-2xl border bg-blue-50 p-4 text-sm text-blue-900">
          Generating AI preceptor guidance...
        </section>
      )}

      {aiError && (
        <section className="rounded-2xl border bg-red-50 p-4 text-sm text-red-900">
          AI guidance unavailable: {aiError}
        </section>
      )}

      <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-red-800">1. Immediate Red Flags</h3>
        {aiGuidance ? (
          <GuidanceList items={aiGuidance.immediate_red_flags} />
        ) : selectedRedFlags.length > 0 ? (
          <GuidanceList items={selectedRedFlags} />
        ) : (
          <p className="mt-2 text-sm text-red-900">No red flags selected.</p>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">2. Differential Diagnosis</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="font-semibold">Cannot Miss</h4>
            <GuidanceList items={aiGuidance?.differential_cannot_miss} />
          </div>
          <div>
            <h4 className="font-semibold">More Common</h4>
            <GuidanceList items={aiGuidance?.differential_more_common} />
          </div>
          <div>
            <h4 className="font-semibold">Other</h4>
            <GuidanceList items={aiGuidance?.differential_other} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">3. What to Ask / Check Next</h3>
        <GuidanceList items={aiGuidance?.ask_check_next} />
      </section>

      <section className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-green-800">4. Protocol-Supported Recommendations</h3>
        <GuidanceList items={aiGuidance?.protocol_supported_recommendations} />

        <div className="mt-4 space-y-3">
          {protocolResults.slice(0, 5).map((item, index) => (
            <details key={index} className="rounded-xl border bg-white p-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Source {index + 1}: {item.document_name} · Page {item.page_number}
              </summary>
              <p className="mt-2 text-slate-700">{item.snippet}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">5. Medication Guidance</h3>
        <GuidanceList items={aiGuidance?.medication_guidance} />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">6. IDMT Assessment & Plan Review</h3>
        <GuidanceList items={aiGuidance?.assessment_plan_review} />
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-red-800">7. Call Preceptor / Evacuate</h3>
        <GuidanceList items={aiGuidance?.call_preceptor_evacuate} />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-800">8. Confidence & Data Integrity</h3>
        <div className="mt-2 space-y-2 text-sm">
          <p><strong>Data completeness:</strong> {dataCompleteness}</p>
          <p><strong>Protocol support:</strong> {protocolSupport}</p>
        </div>
        <GuidanceList items={aiGuidance?.confidence_data_integrity} />
      </section>

      <section className="rounded-2xl border bg-slate-50 p-5 text-sm shadow-sm">
        <strong>Safety Disclaimer:</strong>{" "}
        {aiGuidance?.safety_disclaimer ||
          "This tool may produce incorrect or incomplete information. Verify all outputs and use sound clinical judgment."}
      </section>
    </div>
  );
}