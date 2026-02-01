import { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

type RecordListProps = {
  totalRows: number
  selectedIndex: number | null
  onSelect: (index: number) => void
  loadRows: (start: number, count: number) => Promise<void>
  rows: Map<number, Record<string, string>>
  titleColumn?: string
}

export function RecordList({
  totalRows,
  selectedIndex,
  onSelect,
  loadRows,
  rows,
  titleColumn = 'Title',
}: RecordListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 56,
    overscan: 10,
  })

  const items = virtualizer.getVirtualItems()

  // Load rows as user scrolls
  const loadVisibleRows = useCallback(() => {
    if (items.length === 0) return
    const firstIndex = items[0].index
    const lastIndex = items[items.length - 1].index
    loadRows(Math.max(0, firstIndex - 10), lastIndex - firstIndex + 30)
  }, [items, loadRows])

  useEffect(() => {
    loadVisibleRows()
  }, [loadVisibleRows])

  // Scroll to selected row
  useEffect(() => {
    if (selectedIndex !== null) {
      virtualizer.scrollToIndex(selectedIndex, { align: 'center' })
    }
  }, [selectedIndex, virtualizer])

  if (totalRows === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data loaded
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const row = rows.get(virtualItem.index)
          const title = row?.[titleColumn] || row?.['Slug'] || `Row ${virtualItem.index + 1}`

          return (
            <div
              key={virtualItem.index}
              onClick={() => onSelect(virtualItem.index)}
              className={`absolute w-full px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedIndex === virtualItem.index
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="text-xs text-gray-400 mb-0.5">#{virtualItem.index + 1}</div>
              <div className="text-sm font-medium truncate" title={title}>
                {title}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
