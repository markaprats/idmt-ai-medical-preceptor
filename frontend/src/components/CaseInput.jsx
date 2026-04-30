import { useMemo, useState } from "react";
import { matchChiefComplaint } from "../utils/redFlagMatcher";

const DEMO_CASES = {
  chest_pain: {
    chiefComplaint: "Chest pain",
    onset: "1 hour ago at rest",
    provocation: "Worse with exertion, not reproducible",
    quality: "Pressure",
    radiation: "Left arm and jaw",
    timeCourse: "Persistent",
    severity: 8,
    clinicalNotes: "Diaphoresis, nausea, shortness of breath",
    hr: "110",
    bp: "92/60",
    rr: "24",
    spo2: "92",
    temp: "98.6"
  },
  sob: {
    chiefComplaint: "Shortness of breath",
    onset: "24 hours",
    provocation: "Worse with exertion",
    quality: "Can't catch breath",
    radiation: "",
    timeCourse: "Worsening",
    severity: 7,
    clinicalNotes: "Fever, cough, fatigue",
    hr: "118",
    bp: "104/68",
    rr: "30",
    spo2: "89",
    temp: "101.3"
  },
  abdominal: {
    chiefComplaint: "Right lower quadrant abdominal pain",
    onset: "12 hours ago",
    provocation: "Worse with movement",
    quality: "Sharp",
    radiation: "",
    timeCourse: "Worsening",
    severity: 7,
    clinicalNotes: "Nausea, decreased appetite",
    hr: "105",
    bp: "110/70",
    rr: "20",
    spo2: "98",
    temp: "100.8"
  }
};

export default function CaseInput({ onSubmit }) {
  const [caseData, setCaseData] = useState({
    chiefComplaint: "",
    environment: "",
    resources: "",
    onset: "",
    provocation: "",
    quality: "",
    radiation: "",
    severity: "5",
    timeCourse: "",
    clinicalNotes: "",
    hr: "",
    bp: "",
    rr: "",
    spo2: "",
    temp: "",
    incompleteVitals: false,
    focusedExam: "",
    meds: "",
    allergies: "",
    history: "",
    evacuationAvailable: "unknown",
    communicationAvailable: "unknown",
    timeSinceOnset: "",
    careTeam: "",
    assessment: "",
    plan: "",
    otherRedFlag: ""
  });

  function loadDemoCase(key) {
    const demo = DEMO_CASES[key];
    if (!demo) return;

    setCaseData((prev) => ({
      ...prev,
      ...demo
    }));
  }
  
  const [selectedRedFlags, setSelectedRedFlags] = useState([]);

  const redFlagMatch = useMemo(() => {
    return matchChiefComplaint(caseData.chiefComplaint);
  }, [caseData.chiefComplaint]);

  const redFlagsToDisplay =
    redFlagMatch?.redFlagsToDisplay ||
    [...(redFlagMatch?.universal || []), ...(redFlagMatch?.categorySpecific || [])];

  function updateField(field, value) {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRedFlag(flag) {
    setSelectedRedFlags((prev) =>
      prev.includes(flag)
        ? prev.filter((item) => item !== flag)
        : [...prev, flag]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    const finalRedFlags = [...selectedRedFlags];

    if (caseData.otherRedFlag.trim()) {
      finalRedFlags.push(caseData.otherRedFlag.trim());
    }

    onSubmit({
      ...caseData,
      selectedRedFlags: finalRedFlags,
      redFlagMatch
    });
  }

  const universalFlags = redFlagsToDisplay.filter((flag) =>
    redFlagMatch?.universal?.includes(flag)
  );

  const categoryFlags = redFlagsToDisplay.filter(
    (flag) => !redFlagMatch?.universal?.includes(flag)
  );

 return (
   <form onSubmit={handleSubmit} className="space-y-5">

     <section className="rounded-2xl border bg-blue-50 p-4 shadow-sm">
       <h3 className="text-lg font-bold text-blue-900">Demo Cases</h3>
       <p className="text-sm text-blue-700 mb-2">
         Load a simulated case for demonstration purposes.
       </p>

       <div className="flex flex-wrap gap-2">
         <button
           type="button"
           onClick={() => loadDemoCase("chest_pain")}
           className="px-3 py-2 bg-blue-700 text-white rounded-lg"
         >
           Chest Pain
         </button>
         <button
           type="button"
           onClick={() => loadDemoCase("sob")}
           className="px-3 py-2 bg-blue-700 text-white rounded-lg"
         >
           Shortness of Breath
         </button>
         <button
           type="button"
           onClick={() => loadDemoCase("abdominal")}
           className="px-3 py-2 bg-blue-700 text-white rounded-lg"
         >
           Abdominal Pain
         </button>
       </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">New Patient Case</h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter patient information below. All fields help generate safer, more accurate guidance.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              alert("Voice input planned for future version. Enter case manually for this prototype.")
            }
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
          >
            🎙 Dictate Case
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            1. Chief Complaint & Context
          </h3>

          <label className="text-sm font-semibold">Chief Complaint</label>
          <input
            className="mt-1 w-full rounded-lg border p-2"
            value={caseData.chiefComplaint}
            onChange={(e) => updateField("chiefComplaint", e.target.value)}
            placeholder="e.g., chest pain x 2 hours"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Environment / Setting</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData.environment}
                onChange={(e) => updateField("environment", e.target.value)}
              >
                <option value="">Select Environment</option>
                <option value="field">Field</option>
                <option value="garrison">Garrison</option>
                <option value="deployed">Deployed</option>
                <option value="training">Training Environment</option>
                <option value="clinic">Clinic</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Resources Available</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData.resources}
                onChange={(e) => updateField("resources", e.target.value)}
              >
                <option value="">Select Resources</option>
                <option value="limited">Limited</option>
                <option value="vitals_only">Vitals Only</option>
                <option value="oxygen_aed">Oxygen / AED</option>
                <option value="basic_clinic">Basic Clinic Resources</option>
                <option value="full_mtf">MTF Available</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">2. HPI (OPQRST)</h3>

          {[
            ["onset", "O", "Onset", "When did it start?"],
            ["provocation", "P", "Provocation / Palliation", "What makes it better or worse?"],
            ["quality", "Q", "Quality", "What does it feel like?"],
            ["radiation", "R", "Region / Radiation", "Where is it? Does it radiate?"],
            ["timeCourse", "T", "Time Course", "How has it changed over time?"]
          ].map(([field, letter, label, placeholder]) => (
            <div key={field} className="mb-3 grid gap-2 md:grid-cols-[40px_180px_1fr] md:items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-100 text-sm font-bold text-blue-700">
                {letter}
              </span>
              <label className="text-sm font-semibold">{label}</label>
              <input
                className="rounded-lg border p-2"
                value={caseData[field]}
                onChange={(e) => updateField(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          <div className="grid gap-2 md:grid-cols-[40px_180px_1fr_60px] md:items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-100 text-sm font-bold text-blue-700">
              S
            </span>
            <label className="text-sm font-semibold">Severity 1–10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={caseData.severity}
              onChange={(e) => updateField("severity", e.target.value)}
            />
            <input
              className="rounded-lg border p-2 text-center"
              value={caseData.severity}
              onChange={(e) => updateField("severity", e.target.value)}
            />
          </div>
          <div className="mt-5">
            <label className="text-sm font-semibold">
              Clinical Notes / Associated Symptoms
            </label>
            <p className="text-xs text-slate-500">
              Include associated symptoms, secondary complaints, pertinent negatives, and timeline details not captured in OPQRST.
            </p>
            <textarea
              className="mt-1 h-28 w-full rounded-lg border p-3"
              value={caseData.clinicalNotes}
              onChange={(e) => updateField("clinicalNotes", e.target.value)}
              placeholder="Example: nausea without vomiting, worse lying flat, recent viral illness, second complaint of dizziness..."
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">3. Red Flags</h3>
            <p className="text-sm text-slate-600">
              Universal red flags always show. Additional red flags adapt to chief complaint.
            </p>
          </div>

          {redFlagMatch?.matchedCategory && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              Based on: {redFlagMatch.matchedCategory.replaceAll("_", " ")}
            </span>
          )}
        </div>

        {redFlagMatch?.message && (
          <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">
            {redFlagMatch.message}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h4 className="mb-3 font-bold">Universal Red Flags</h4>
            <div className="space-y-2">
              {universalFlags.map((flag) => (
                <label key={flag} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRedFlags.includes(flag)}
                    onChange={() => toggleRedFlag(flag)}
                    className="mt-1"
                  />
                  <span>{flag}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h4 className="mb-3 font-bold">Chief Complaint Specific Red Flags</h4>
            <div className="space-y-2">
              {categoryFlags.length > 0 ? (
                categoryFlags.map((flag) => (
                  <label key={flag} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRedFlags.includes(flag)}
                      onChange={() => toggleRedFlag(flag)}
                      className="mt-1"
                    />
                    <span>{flag}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  Enter a chief complaint to show specific red flags.
                </p>
              )}
            </div>

            <input
              className="mt-4 w-full rounded-lg border p-2"
              placeholder="Add other red flag"
              value={caseData.otherRedFlag}
              onChange={(e) => updateField("otherRedFlag", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">4. Vitals</h3>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              ["hr", "HR", "e.g., 72"],
              ["bp", "BP", "e.g., 120/80"],
              ["rr", "RR", "e.g., 16"],
              ["spo2", "SpO2", "e.g., 98"],
              ["temp", "Temp", "e.g., 98.6"]
            ].map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="text-sm font-semibold">{label}</label>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={caseData[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={caseData.incompleteVitals}
              onChange={(e) => updateField("incompleteVitals", e.target.checked)}
            />
            Mark vitals as not available / incomplete
          </label>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">5. Focused Exam Findings</h3>
          <textarea
            className="h-32 w-full rounded-lg border p-3"
            value={caseData.focusedExam}
            onChange={(e) => updateField("focusedExam", e.target.value)}
            placeholder="e.g., Lungs clear bilaterally. No wheezes. Heart regular. No JVD. Chest wall non-tender."
          />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">6. Medications / Allergies / History</h3>

          {[
            ["meds", "Medications", "List relevant medications"],
            ["allergies", "Allergies", "List known allergies"],
            ["history", "Relevant History", "e.g., HTN, DM, prior MI, asthma"]
          ].map(([field, label, placeholder]) => (
            <div key={field} className="mb-3">
              <label className="text-sm font-semibold">{label}</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData[field]}
                onChange={(e) => updateField(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">7. Additional Context</h3>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Evacuation Capability</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData.evacuationAvailable}
                onChange={(e) => updateField("evacuationAvailable", e.target.value)}
              >
                <option value="unknown">Select Capability</option>
                <option value="yes">Available</option>
                <option value="delayed">Delayed</option>
                <option value="no">Not Available</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Communication Availability</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData.communicationAvailable}
                onChange={(e) => updateField("communicationAvailable", e.target.value)}
              >
                <option value="unknown">Select Availability</option>
                <option value="yes">Available</option>
                <option value="intermittent">Intermittent</option>
                <option value="no">Not Available</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Time Since Symptom Onset</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData.timeSinceOnset}
                onChange={(e) => updateField("timeSinceOnset", e.target.value)}
                placeholder="e.g., 2 hours"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Care Team / Personnel Available</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={caseData.careTeam}
                onChange={(e) => updateField("careTeam", e.target.value)}
                placeholder="e.g., ALS, medic, en route"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">8. Your Assessment & Plan</h3>
        <p className="mb-3 text-sm text-slate-600">
          Optional in Preceptor Mode. Required later in Training Mode.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <textarea
            className="h-28 w-full rounded-lg border p-3"
            value={caseData.assessment}
            onChange={(e) => updateField("assessment", e.target.value)}
            placeholder="Your assessment"
          />
          <textarea
            className="h-28 w-full rounded-lg border p-3"
            value={caseData.plan}
            onChange={(e) => updateField("plan", e.target.value)}
            placeholder="Your plan"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-blue-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-700">
            <p className="font-semibold">Before You Submit</p>
            <ul className="ml-5 list-disc">
              <li>Review for accuracy</li>
              <li>Add missing critical information</li>
              <li>Ensure vitals and red flags are addressed</li>
            </ul>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-700 px-8 py-3 font-semibold text-white"
          >
            Generate Preceptor Guidance
          </button>
        </div>
      </section>
    </form>
  );
}