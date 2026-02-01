import { useState } from 'react'

type FileLoaderProps = {
  onLoad: (filePath: string, columns?: string[]) => Promise<void>
  loading: boolean
}

export function FileLoader({ onLoad, loading }: FileLoaderProps) {
  const [filePath, setFilePath] = useState('')
  const [columns, setColumns] = useState('Content,Content 2')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filePath.trim()) return

    const cols = columns
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    await onLoad(filePath.trim(), cols.length > 0 ? cols : undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Load CSV File</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Path
          </label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="/path/to/your/file.csv"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Columns with HTML links (comma-separated)
          </label>
          <input
            type="text"
            value={columns}
            onChange={(e) => setColumns(e.target.value)}
            placeholder="Content, Content 2"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Specify which columns contain HTML with links to edit
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !filePath.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Load CSV'}
        </button>
      </div>
    </form>
  )
}
