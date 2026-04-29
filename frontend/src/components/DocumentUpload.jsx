import { useState } from "react";

export default function DocumentUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Make sure the backend is running.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Document Upload / Knowledge Base</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload the IDMT Protocol Book or approved CPG PDFs. This prototype extracts page-level text for later source citation.
        </p>
      </section>

      <form onSubmit={handleUpload} className="rounded-xl border bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium">Upload PDF</label>
        <input
          type="file"
          accept="application/pdf"
          className="mt-2 block w-full rounded-lg border p-2"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload and Extract"}
        </button>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </form>

      {result && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Upload Result</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p><strong>Filename:</strong> {result.filename}</p>
            <p><strong>Pages extracted:</strong> {result.pages_extracted}</p>
          </div>

          {result.sample_pages && (
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold">Sample Pages</h4>
              {result.sample_pages.map((page) => (
                <div key={page.page_number} className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-sm font-semibold">Page {page.page_number}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700">
                    {page.text_preview || page.text || "No preview available."}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}