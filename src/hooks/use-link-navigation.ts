import { useState, useCallback, useEffect } from 'react'
import * as api from '@/lib/api'

export function useLinkNavigation(currentRow: number | null) {
  const [linkRows, setLinkRows] = useState<number[]>([])
  const [currentLinkIndex, setCurrentLinkIndex] = useState<number>(-1)

  // Load all link row indices on mount
  useEffect(() => {
    api.getAllLinkRows().then(setLinkRows).catch(console.error)
  }, [])

  // Update current link index when row changes
  useEffect(() => {
    if (currentRow === null) {
      setCurrentLinkIndex(-1)
      return
    }
    const idx = linkRows.indexOf(currentRow)
    setCurrentLinkIndex(idx)
  }, [currentRow, linkRows])

  const goToNextLink = useCallback(async (): Promise<number | null> => {
    const from = currentRow ?? -1
    const next = await api.getNextLinkRow(from)
    return next
  }, [currentRow])

  const goToPrevLink = useCallback(async (): Promise<number | null> => {
    const from = currentRow ?? linkRows.length
    const prev = await api.getPrevLinkRow(from)
    return prev
  }, [currentRow, linkRows.length])

  const refreshLinkRows = useCallback(async () => {
    const rows = await api.getAllLinkRows()
    setLinkRows(rows)
  }, [])

  return {
    linkRows,
    currentLinkIndex,
    totalLinkRows: linkRows.length,
    goToNextLink,
    goToPrevLink,
    refreshLinkRows,
    hasNext: currentLinkIndex < linkRows.length - 1,
    hasPrev: currentLinkIndex > 0,
  }
}
