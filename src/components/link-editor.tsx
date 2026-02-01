import { useState, useEffect, useRef } from 'react'

type LinkEditorProps = {
  href: string
  onSave: (newHref: string) => void
  onCancel: () => void
}

export function LinkEditor({ href, onSave, onCancel }: LinkEditorProps) {
  const [value, setValue] = useState(href)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(href)
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [href])

  const handleSave = () => {
    if (value !== href) {
      onSave(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const isModified = value !== href

  return (
    <div className="flex gap-2 items-center">
      <label className="font-medium text-sm text-gray-600 shrink-0">Link URL:</label>
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border border-gray-300 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="https://..."
      />
      <button
        onClick={handleSave}
        disabled={!isModified}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        Apply
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
      >
        Cancel
      </button>
    </div>
  )
}
