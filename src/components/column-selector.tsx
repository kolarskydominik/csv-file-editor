import { useState } from 'react'

type ColumnSelectorProps = {
  columns: string[]
  fileName: string
  totalRows: number
  onConfirm: (selectedColumns: string[]) => void
  onCancel: () => void
  loading: boolean
}

export function ColumnSelector({
  columns,
  fileName,
  totalRows,
  onConfirm,
  onCancel,
  loading,
}: ColumnSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleColumn = (col: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(col)) {
        next.delete(col)
      } else {
        next.add(col)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size > 0) {
      onConfirm(Array.from(selected))
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Columns with Links</h2>
      <p className="text-gray-500 mb-6">
        <span className="font-medium">{fileName}</span> &middot; {totalRows.toLocaleString()} rows
      </p>

      <p className="text-sm text-gray-600 mb-4">
        Choose which columns contain HTML with links you want to edit:
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6 max-h-80 overflow-auto">
        {columns.map((col) => (
          <label
            key={col}
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${selected.has(col) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <input
              type="checkbox"
              checked={selected.has(col)}
              onChange={() => toggleColumn(col)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm truncate" title={col}>
              {col}
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          disabled={loading}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0 || loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Loading...' : `Continue with ${selected.size} column${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
