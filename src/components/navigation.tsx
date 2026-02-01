import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrev}
        title="Previous row with links"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </Button>

      <span className="text-sm text-muted-foreground min-w-[120px] text-center">
        {currentRow !== null ? (
          <>
            {currentLinkIndex >= 0 ? currentLinkIndex + 1 : '?'} / {totalLinkRows} with links
          </>
        ) : (
          <span className="text-muted-foreground/50">No row selected</span>
        )}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
        title="Next row with links"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
