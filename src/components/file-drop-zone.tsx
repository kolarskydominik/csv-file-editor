import { useState, useCallback } from 'react'

type FileDropZoneProps = {
  onFileLoaded: (content: string, fileName: string) => void
  loading: boolean
}

export function FileDropZone({ onFileLoaded, loading }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const processFile = useCallback(
    (file: File) => {
      setError(null)

      if (!file.name.endsWith('.csv')) {
        setError('Please drop a CSV file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content) {
          onFileLoaded(content, file.name)
        }
      }
      reader.onerror = () => {
        setError('Failed to read file')
      }
      reader.readAsText(file)
    },
    [onFileLoaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">CSV Link Editor</h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <div className="mb-4">
          <svg
            className={`w-16 h-16 mx-auto ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-lg text-gray-600 mb-2">
          {loading ? 'Loading...' : 'Drop your CSV file here'}
        </p>
        <p className="text-sm text-gray-400 mb-4">or</p>

        <label className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          Browse Files
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <p className="mt-6 text-sm text-gray-500 text-center">
        Edit links in your CSV, then download the modified file
      </p>
    </div>
  )
}
