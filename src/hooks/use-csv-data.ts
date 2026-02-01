import { useState, useCallback } from 'react'
import * as api from '@/lib/api'
import type { Metadata, UploadResult } from '@/lib/api'

export function useCSVData() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [rows, setRows] = useState<Map<number, Record<string, string>>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Upload file content
  const uploadFile = useCallback(async (content: string, fileName: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.uploadCSV(content, fileName)
      setUploadResult(result)
      setMetadata(null) // Reset metadata until columns are selected
      setRows(new Map())
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Step 2: Set which columns contain links
  const selectColumns = useCallback(async (columns: string[]) => {
    setLoading(true)
    setError(null)
    try {
      await api.setLinkColumns(columns)
      const meta = await api.getMetadata()
      setMetadata(meta)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set columns')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset to start over
  const reset = useCallback(() => {
    setUploadResult(null)
    setMetadata(null)
    setRows(new Map())
    setError(null)
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

  const refreshMetadata = useCallback(async () => {
    try {
      const meta = await api.getMetadata()
      setMetadata(meta)
    } catch (err) {
      console.error('Failed to refresh metadata:', err)
    }
  }, [])

  return {
    uploadResult,
    metadata,
    rows,
    loading,
    error,
    uploadFile,
    selectColumns,
    reset,
    loadRows,
    updateCell,
    refreshMetadata,
    clearError: () => setError(null),
  }
}
