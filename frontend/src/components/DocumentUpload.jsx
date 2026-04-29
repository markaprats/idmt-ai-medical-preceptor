import { useState, useRef } from 'react'
import { Upload, File, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const API_URL = 'http://127.0.0.1:8000'

export default function DocumentUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      await uploadFile(selectedFile)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile?.type === 'application/pdf') {
      await uploadFile(droppedFile)
    } else if (droppedFile) {
      setError('Only PDF files are supported')
    }
  }

  const uploadFile = async (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported')
      return
    }

    setFile(selectedFile)
    setResult(null)
    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Document Upload</h1>
        <p className="text-slate-600 mt-1">Upload IDMT Protocol Book and Joint Trauma System CPGs</p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors ${
          dragOver ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600 mb-2">Drag and drop PDF file here</p>
        <p className="text-sm text-slate-500 mb-4">or</p>
        <label className="inline-block">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <span className="px-4 py-2 bg-red-700 text-white rounded-md cursor-pointer hover:bg-red-800 transition-colors inline-block">
            {uploading ? 'Uploading...' : 'Browse Files'}
          </span>
        </label>
        <p className="text-xs text-slate-500 mt-4">Supported: PDF files only</p>
      </div>

      {/* Loading State */}
      {uploading && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-700">Uploading and extracting text...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Upload Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Result State */}
      {result && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Result Header */}
          <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Upload Successful</span>
          </div>

          {/* File Info */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-red-600" />
              <div>
                <p className="font-medium text-slate-800">{result.filename}</p>
                <p className="text-sm text-slate-500">{result.pages_extracted} pages extracted</p>
              </div>
              <button
                onClick={handleClear}
                className="ml-auto p-2 text-slate-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sample Pages */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Sample Pages (first 3)</h3>
            <div className="space-y-3">
              {result.sample_pages?.slice(0, 3).map((page, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-500">Page {page.page_number}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono whitespace-pre-wrap line-clamp-3">
                    {page.content || '(No text extracted)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current File (during upload) */}
      {file && !result && !error && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <File className="w-6 h-6 text-slate-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button onClick={handleClear} className="p-1 text-slate-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Recommended Documents</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• IDMT Protocol Book (current edition)</li>
          <li>• Joint Trauma System Clinical Practice Guidelines (JTS CPGs)</li>
          <li>• Tactical Combat Casualty Care (TCCC) Guidelines</li>
        </ul>
      </div>
    </div>
  )
}