import { useState } from 'react'

type SaveButtonProps = {
  onSave: () => Promise<boolean>
  isDirty: boolean
  dirtyCount: number
}

export function SaveButton({ onSave, isDirty, dirtyCount }: SaveButtonProps) {
  const [saving, setSaving] = useState(false)
  const [lastSaveStatus, setLastSaveStatus] = useState<'success' | 'error' | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setLastSaveStatus(null)
    try {
      const success = await onSave()
      setLastSaveStatus(success ? 'success' : 'error')
      setTimeout(() => setLastSaveStatus(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {lastSaveStatus === 'success' && (
        <span className="text-green-600 text-sm">Saved!</span>
      )}
      {lastSaveStatus === 'error' && (
        <span className="text-red-600 text-sm">Save failed</span>
      )}

      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
          isDirty
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {saving ? (
          'Saving...'
        ) : isDirty ? (
          <>Save ({dirtyCount})</>
        ) : (
          'Saved'
        )}
      </button>
    </div>
  )
}
