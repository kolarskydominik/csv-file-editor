type NavigationProps = {
  currentRow: number | null
  currentLinkIndex: number
  totalLinkRows: number
  hasNext: boolean
  hasPrev: boolean
  onPrev: () => void
  onNext: () => void
}

export function Navigation({
  currentRow,
  currentLinkIndex,
  totalLinkRows,
  hasNext,
  hasPrev,
  onPrev,
  onNext,
}: NavigationProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        title="Previous row with links"
      >
        &larr; Prev
      </button>

      <span className="text-sm text-gray-600 min-w-[120px] text-center">
        {currentRow !== null ? (
          <>
            {currentLinkIndex >= 0 ? currentLinkIndex + 1 : '?'} / {totalLinkRows} with links
          </>
        ) : (
          <span className="text-gray-400">No row selected</span>
        )}
      </span>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        title="Next row with links"
      >
        Next &rarr;
      </button>
    </div>
  )
}
