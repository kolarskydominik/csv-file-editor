import { useState, useCallback } from 'react'
import * as api from '@/lib/api'
import type { Metadata } from '@/lib/api'

export function useCSVData() {
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [rows, setRows] = useState<Map<number, Record<string, string>>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (filePath: string, columns?: string[]) => {
    setLoading(true)
    setError(null)
    try {
      await api.loadCSV(filePath, columns)
      const meta = await api.getMetadata()
      setMetadata(meta)
      setRows(new Map())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRows = useCallback(async (start: number, count: number) => {
    try {
      const data = await api.getRows(start, count)
      setRows((prev) => {
        const next = new Map(prev)
        for (const row of data) {
          next.set(row.index, row.data)
        }
        return next
      })
    } catch (err) {
      console.error('Failed to load rows:', err)
    }
  }, [])

  const updateCell = useCallback(
    async (rowIndex: number, column: string, value: string) => {
      try {
        const result = await api.updateRow(rowIndex, column, value)

        // Update local cache
        setRows((prev) => {
          const next = new Map(prev)
          const row = next.get(rowIndex)
          if (row) {
            next.set(rowIndex, { ...row, [column]: value })
          }
          return next
        })

        // Update metadata dirty state
        setMetadata((prev) =>
          prev ? { ...prev, isDirty: result.isDirty, dirtyCount: result.dirtyCount } : null
        )

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update')
        return false
      }
    },
    []
  )

  const save = useCallback(async () => {
    try {
      await api.saveCSV()
      setMetadata((prev) => (prev ? { ...prev, isDirty: false, dirtyCount: 0 } : null))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      return false
    }
  }, [])

  const refreshMetadata = useCallback(async () => {
    try {
      const meta = await api.getMetadata()
      setMetadata(meta)
    } catch (err) {
      console.error('Failed to refresh metadata:', err)
    }
  }, [])

  return {
    metadata,
    rows,
    loading,
    error,
    loadFile,
    loadRows,
    updateCell,
    save,
    refreshMetadata,
    clearError: () => setError(null),
  }
}
